import * as React from 'react'

interface ValueObject {
  [themeName: string]: string
}

export interface UseThemeProps {
  /** List of all available mode names */
  modes: string[]
  /** Forced mode name for the current page */
  forcedMode?: string | undefined
  /** Update the theme */
  setMode: React.Dispatch<React.SetStateAction<string>>
  /** Active mode name */
  mode?: string | undefined
  /** If `enableSystem` is true and the active mode is "system", this returns whether the system preference resolved to "dark" or "light". Otherwise, identical to `mode` */
  resolvedMode?: string | undefined
  /** If enableSystem is true, returns the System mode preference ("dark" or "light"), regardless what the active mode is */
  systemMode?: 'dark' | 'light' | undefined
}

export type Attribute = `data-${string}` | 'class'

export interface ThemeProviderProps extends React.PropsWithChildren {
  /** List of all available mode names */
  modes?: string[] | undefined
  /** Forced mode name for the current page */
  forcedMode?: string | undefined
  /** Whether to switch between dark and light modes based on prefers-color-scheme */
  enableSystem?: boolean | undefined
  /** Disable all CSS transitions when switching modes */
  disableTransitionOnChange?: boolean | undefined
  /** Whether to indicate to browsers which color scheme is used (dark or light) for built-in UI like inputs and buttons */
  enableColorScheme?: boolean | undefined
  /** Key used to store mode setting in localStorage */
  storageKey?: string | undefined
  /** Default mode name (for v0.0.12 and lower the default was light). If `enableSystem` is false, the default mode is light */
  defaultMode?: string | undefined
  /** HTML attribute modified based on the active mode. Accepts `class`, `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.), or an array which could include both */
  attribute?: Attribute | Attribute[] | undefined
  /** Mapping of mode name to HTML attribute value. Object where key is the mode name and value is the attribute value */
  value?: ValueObject | undefined
  /** Nonce string to pass to the inline script for CSP headers */
  nonce?: string | undefined
}
