export const script = (
  attribute,
  themeStorageKey,
  modeStorageKey,
  defaultTheme,
  defaultMode,
  forcedTheme,
  forcedMode,
  modes,
  value,
  enableSystem,
  enableColorScheme
) => {
  const el = document.documentElement
  const themes = ['offroad', 'hunt', 'backcountry', 'fish']
  const systemModes = ['light', 'dark']
  const isClass = attribute === 'class'
  const classes = isClass && value ? modes.map(t => value[t] || t) : modes

  function updateDOM(values: { theme?: string, mode?: string}) {
    if (values.mode) {
      updateMode(values.mode)
    }

    if (values.theme) {
      updateTheme(values.theme)
    }

    setMode(values.mode)
  }

  function updateMode(mode: string) {
    if (isClass) {
      el.classList.remove(...classes)
      el.classList.add(mode)
    } else {
      el.setAttribute("data-mode", mode)
    }
  }

  function updateTheme(theme: string) {
    el.setAttribute("data-theme", theme)
  }

  function setMode(mode: string) {
    if (enableColorScheme && systemModes.includes(mode)) {
      el.style.colorScheme = mode
    }
  }

  function getSystemMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  if (forcedTheme) {
    updateDOM({theme: forcedTheme})
  } else {
    try {
      const themeName = localStorage.getItem(themeStorageKey) || defaultTheme
      updateDOM({ theme: themeName })
    }
  }

  if (forcedMode) {
    updateDOM({mode: forcedMode})
  } else {
    try {
      const modeName = localStorage.getItem(modeStorageKey) || defaultMode
      const isSystem = enableSystem && modeName === 'system'
      const mode = isSystem ? getSystemMode() : modeName
      updateDOM({ mode })
    } catch (e) {
      //
    }
  }
}
