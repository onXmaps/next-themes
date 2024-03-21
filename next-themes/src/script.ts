export const script = (
  attribute,
  storageKey,
  defaultMode,
  forcedMode,
  modes,
  value,
  enableSystem,
  enableColorScheme
) => {
  const el = document.documentElement
  const systemModes = ['light', 'dark']
  const isClass = attribute === 'class'
  const classes = isClass && value ? modes.map(t => value[t] || t) : modes

  function updateDOM(mode: string) {
    if (isClass) {
      el.classList.remove(...classes)
      el.classList.add(mode)
    } else {
      el.setAttribute(attribute, mode)
    }

    setColorScheme(mode)
  }

  function setColorScheme(mode: string) {
    if (enableColorScheme && systemModes.includes(mode)) {
      el.style.colorScheme = mode
    }
  }

  function getSystemMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  if (forcedMode) {
    updateDOM(forcedMode)
  } else {
    try {
      const modeName = localStorage.getItem(storageKey) || defaultMode
      const isSystem = enableSystem && modeName === 'system'
      const mode = isSystem ? getSystemMode() : modeName
      updateDOM(mode)
    } catch (e) {
      //
    }
  }
}
