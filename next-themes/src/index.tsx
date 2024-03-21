'use client'

import * as React from 'react'
import { script } from './script'
import type { Attribute, ThemeProviderProps, UseThemeProps } from './types'

const colorSchemes = ['light', 'dark']
const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultContext: UseThemeProps = { setMode: _ => {}, modes: [] }

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext

export const ThemeProvider = (props: ThemeProviderProps): React.ReactNode => {
  const context = React.useContext(ThemeContext)

  // Ignore nested context providers, just passthrough children
  if (context) return props.children
  return <Theme {...props} />
}

const defaultModes = ['light', 'dark']

const Theme = ({
  forcedMode,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  themeStorageKey = 'key',
  modeStorageKey = 'mode',
  modes = defaultModes,
  defaultMode = enableSystem ? 'system' : 'light',
  attribute = [
    'data-theme',
    'data-mode',
  ],
  value,
  children,
  nonce
}: ThemeProviderProps) => {
  const [mode, setModeState] = React.useState(() => getMode(modeStorageKey, defaultMode))
  const [resolvedMode, setResolvedMode] = React.useState(() => getMode(modeStorageKey))
  const attrs = !value ? modes : Object.values(value)

  const applyMode = React.useCallback(mode => {
    let resolved = mode
    if (!resolved) return

    // If mode is system, resolve it before setting mode
    if (mode === 'system' && enableSystem) {
      resolved = getSystemMode()
    }

    const name = value ? value[resolved] : resolved
    const enable = disableTransitionOnChange ? disableAnimation() : null
    const d = document.documentElement

    const handleAttribute = (attr: Attribute) => {
      if (attr === 'class') {
        d.classList.remove(...attrs)
        if (name) d.classList.add(name)
      } else if (attr.startsWith('data-')) {
        if (name) {
          d.setAttribute(attr, name)
        } else {
          d.removeAttribute(attr)
        }
      }
    }

    if (Array.isArray(attribute)) attribute.forEach(handleAttribute)
    else handleAttribute(attribute)

    if (enableColorScheme) {
      const fallback = colorSchemes.includes(defaultMode) ? defaultMode : null
      const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback
      // @ts-ignore
      d.style.colorScheme = colorScheme
    }

    enable?.()
  }, [])

  const setMode = React.useCallback(
    mode => {
      const newMode = typeof mode === 'function' ? mode(mode) : mode
      setModeState(newMode)

      // Save to storage
      try {
        localStorage.setItem(modeStorageKey, newMode)
      } catch (e) {
        // Unsupported
      }
    },
    [forcedMode]
  )

  const handleMediaQuery = React.useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemMode(e)
      setResolvedMode(resolved)

      if (mode === 'system' && enableSystem && !forcedMode) {
        applyMode('system')
      }
    },
    [mode, forcedMode]
  )

  // Always listen to System preference
  React.useEffect(() => {
    const media = window.matchMedia(MEDIA)

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleMediaQuery)
    handleMediaQuery(media)

    return () => media.removeListener(handleMediaQuery)
  }, [handleMediaQuery])

  // localStorage event handling
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== modeStorageKey) {
        return
      }

      // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
      const theme = e.newValue || defaultMode
      setMode(mode)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setMode])

  // Whenever theme or forcedTheme changes, apply it
  React.useEffect(() => {
    applyMode(forcedMode ?? mode)
  }, [forcedMode, mode])

  const providerValue = React.useMemo(
    () => ({
      mode,
      modes,
      setMode,
      forcedMode,
      resolvedMode: mode === 'system' ? resolvedMode : mode,
      themes: enableSystem ? [...modes, 'system'] : modes,
      systemTheme: (enableSystem ? resolvedMode : undefined) as 'light' | 'dark' | undefined
    }),
    [mode, setMode, forcedMode, resolvedMode, enableSystem, modes]
  )

  return (
    <ThemeContext.Provider value={providerValue}>
      <ThemeScript
        {...{
          forcedMode,
          modeStorageKey,
          attribute,
          enableSystem,
          enableColorScheme,
          defaultMode,
          value,
          modes,
          nonce
        }}
      />

      {children}
    </ThemeContext.Provider>
  )
}

const ThemeScript = React.memo(
  ({
    forcedMode,
    themeStorageKey,
    modeStorageKey,
    attribute,
    enableSystem,
    enableColorScheme,
    defaultMode,
    value,
    modes,
    nonce
  }: Omit<ThemeProviderProps, 'children'> & { defaultMode: string }) => {
    const scriptArgs = JSON.stringify([
      attribute,
      themeStorageKey,
      modeStorageKey,
      defaultMode,
      forcedMode,
      modes,
      value,
      enableSystem,
      enableColorScheme
    ]).slice(1, -1)

    return (
      <script
        suppressHydrationWarning
        nonce={typeof window === 'undefined' ? nonce : ''}
        dangerouslySetInnerHTML={{ __html: `(${script.toString()})(${scriptArgs})` }}
      />
    )
  }
)

// Helpers
const getMode = (key: string, fallback?: string) => {
  if (isServer) return undefined
  let mode
  try {
    mode = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
  }
  return mode || fallback
}

const disableAnimation = () => {
  const css = document.createElement('style')
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  )
  document.head.appendChild(css)

  return () => {
    // Force restyle
    ;(() => window.getComputedStyle(document.body))()

    // Wait for next tick before removing
    setTimeout(() => {
      document.head.removeChild(css)
    }, 1)
  }
}

const getSystemMode = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA)
  const isDark = e.matches
  const systemMode = isDark ? 'dark' : 'light'
  return systemMode
}
