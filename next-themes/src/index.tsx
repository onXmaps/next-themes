'use client'

import * as React from 'react'
import { script } from './script'
import type { Attribute, ThemeProviderProps, UseThemeProps } from './types'

const colorSchemes = ['light', 'dark']
const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultContext: UseThemeProps = { setTheme: _ => {}, setMode: _ => {}, modes: [], themes: [] }

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext

export const ThemeProvider = (props: ThemeProviderProps): React.ReactNode => {
  const context = React.useContext(ThemeContext)

  // Ignore nested context providers, just passthrough children
  if (context) return props.children
  return <Theme {...props} />
}

const defaultThemes = ['offroad', 'hunt', 'backcountry', 'fish']
const defaultModes = ['light', 'dark']

const Theme = ({
  forcedTheme,
  forcedMode,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  themeStorageKey = 'theme',
  modeStorageKey = 'mode',
  themes = defaultThemes,
  modes = defaultModes,
  defaultTheme = 'offroad',
  defaultMode = enableSystem ? 'system' : 'light',
  attribute = [
    'data-theme',
    'data-mode',
  ],
  themeValue,
  modeValue,
  children,
  nonce
}: ThemeProviderProps) => {
  const [theme, setThemeState] = React.useState(() => getThemeItem(themeStorageKey, defaultTheme))
  const [mode, setModeState] = React.useState(() => getThemeItem(modeStorageKey, defaultMode))
  const [resolvedTheme, setResolvedTheme] = React.useState(() => getThemeItem(themeStorageKey))
  const [resolvedMode, setResolvedMode] = React.useState(() => getThemeItem(modeStorageKey))
  // const themattrs = !value ? modes : Object.values(value)
  const attrs = !modeValue ? modes : Object.values(modeValue)
  
  const applyTheme = React.useCallback(theme => {
    let resolved = theme
    if (!resolved) return

    const name = themeValue ? themeValue[resolved] : resolved
    const enable = disableTransitionOnChange ? disableAnimation() : null
    const d = document.documentElement
    const attr = "data-theme"
    
    if (name) {
      d.setAttribute(attr, name)
    } else {
      d.removeAttribute(attr)
    }

    enable?.()
  }, [])

  const applyMode = React.useCallback(mode => {
    let resolved = mode
    if (!resolved) return

    // If mode is system, resolve it before setting mode
    if (mode === 'system' && enableSystem) {
      resolved = getSystemMode()
    }

    const name = modeValue ? modeValue[resolved] : resolved
    const enable = disableTransitionOnChange ? disableAnimation() : null
    const d = document.documentElement
    const attr = "data-mode"

    if (name) {
      d.setAttribute(attr, name)
    } else {
      d.removeAttribute(attr)
    }

    if (enableColorScheme) {
      const fallback = colorSchemes.includes(defaultMode) ? defaultMode : null
      const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback
      // @ts-ignore
      d.style.colorScheme = colorScheme
    }

    enable?.()
  }, [])

  const setTheme = React.useCallback(
    theme => {
      const newTheme = typeof theme === 'function' ? theme(theme) : theme
      setThemeState(newTheme)

      // Save to storage
      try {
        localStorage.setItem(themeStorageKey, newTheme)
      } catch (e) {
        // Unsupported
      }
    },
    [forcedTheme]
  )

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
      if (e.key !== themeStorageKey || e.key !== modeStorageKey) {
        return
      }

      // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
      const theme = e.newValue || defaultTheme
      setTheme(theme)
      
      const mode = e.newValue || defaultMode
      setMode(mode)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setTheme, setMode])

  // Whenever theme or forcedTheme changes, apply it
  React.useEffect(() => {
    applyTheme(forcedTheme ?? theme)
  }, [theme, forcedTheme])
  
  React.useEffect(() => {
    applyMode(forcedMode ?? mode)
  }, [mode, forcedMode])

  const providerValue = React.useMemo(
    () => ({
      theme,
      mode,
      setTheme,
      setMode,
      forcedTheme,
      forcedMode,
      resolvedTheme,
      resolvedMode: mode === 'system' ? resolvedMode : mode,
      themes,
      modes: enableSystem ? [...modes, 'system'] : modes,
      systemTheme: (enableSystem ? resolvedMode : undefined) as 'light' | 'dark' | undefined
    }),
    [theme, mode, setTheme, setMode, forcedTheme, forcedMode, resolvedTheme, resolvedMode, enableSystem, modes, themes]
  )

  return (
    <ThemeContext.Provider value={providerValue}>
      <ThemeScript
        {...{
          forcedTheme,
          forcedMode,
          themeStorageKey,
          modeStorageKey,
          attribute,
          enableSystem,
          enableColorScheme,
          defaultTheme,
          defaultMode,
          themeValue,
          modeValue,
          modes,
          themes,
          nonce
        }}
      />

      {children}
    </ThemeContext.Provider>
  )
}

const ThemeScript = React.memo(
  ({
    forcedTheme,
    forcedMode,
    themeStorageKey,
    modeStorageKey,
    attribute,
    enableSystem,
    enableColorScheme,
    defaultTheme,
    defaultMode,
    themeValue,
    modeValue,
    themes,
    modes,
    nonce
  }: Omit<ThemeProviderProps, 'children'> & { defaultTheme: string, defaultMode: string }) => {
    const scriptArgs = JSON.stringify([
      attribute,
      themeStorageKey,
      modeStorageKey,
      defaultTheme,
      defaultMode,
      forcedTheme,
      forcedMode,
      themes,
      modes,
      themeValue,
      modeValue,
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
const getThemeItem = (key: string, fallback?: string) => {
  if (isServer) return undefined
  let themeItem
  try {
    themeItem = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
  }
  return themeItem || fallback
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
