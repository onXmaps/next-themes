// @vitest-environment jsdom

import * as React from 'react'
import { act, render, screen } from '@testing-library/react'
import { vi, beforeAll, beforeEach, afterEach, afterAll, describe, test, it, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

import { ThemeProvider, useTheme } from '../src/index'

let originalLocalStorage: Storage
const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string): string => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
    key: vi.fn((index: number): string | null => ''),
    length: Object.keys(store).length
  }
})()

// @TODO Add tests for theme.

// HelperComponent to render the theme inside a paragraph-tag and setting a theme via the forceSetTheme prop
const HelperComponent = ({ forceSetMode }: { forceSetMode?: string }) => {
  const { setMode, mode, forcedMode, resolvedMode, systemMode } = useTheme()

  React.useEffect(() => {
    if (forceSetMode) {
      setMode(forceSetMode)
    }
  }, [forceSetMode])

  return (
    <>
      <p data-testid="mode">{mode}</p>
      <p data-testid="forcedMode">{forcedMode}</p>
      <p data-testid="resolvedMode">{resolvedMode}</p>
      <p data-testid="systemMode">{systemMode}</p>
    </>
  )
}

function setDeviceMode(mode: 'light' | 'dark') {
  // Create a mock of the window.matchMedia function
  // Based on: https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: mode === 'dark' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
}

beforeAll(() => {
  // Create mocks of localStorage getItem and setItem functions
  originalLocalStorage = window.localStorage
  window.localStorage = localStorageMock
})

beforeEach(() => {
  // Reset window side-effects
  setDeviceMode('light')
  document.documentElement.style.colorScheme = ''
  document.documentElement.removeAttribute('data-mode')
  document.documentElement.removeAttribute('class')

  // Clear the localStorage-mock
  localStorageMock.clear()
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  window.localStorage = originalLocalStorage
})

describe('defaultMode', () => {
  test('should return system when no default-mode is set', () => {
    render(
      <ThemeProvider>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('system')
  })

  test('should return light when no default-mode is set and enableSystem=false', () => {
    render(
      <ThemeProvider enableSystem={false}>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('light')
  })

  test('should return light when light is set as default-mode', () => {
    render(
      <ThemeProvider defaultMode="light">
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('light')
  })

  test('should return dark when dark is set as default-mode', () => {
    render(
      <ThemeProvider defaultMode="dark">
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('dark')
  })
})

describe('provider', () => {
  it('ignores nested ThemeProviders', () => {
    act(() => {
      render(
        <ThemeProvider defaultMode="dark">
          <ThemeProvider defaultMode="light">
            <HelperComponent />
          </ThemeProvider>
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('mode').textContent).toBe('dark')
  })
})

describe('storage', () => {
  test('should not set localStorage with default value', () => {
    act(() => {
      render(
        <ThemeProvider defaultMode="dark">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.setItem).toBeCalledTimes(0)
    expect(window.localStorage.getItem('mode')).toBeNull()
  })

  test('should set localStorage when switching modes', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetMode="dark" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.setItem).toBeCalledTimes(1)
    expect(window.localStorage.getItem('mode')).toBe('dark')
  })
})

describe('custom storageKey', () => {
  test("should save to localStorage with 'mode' key when using default settings", () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('mode')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'light')
  })

  test("should save to localStorage with 'custom' when setting prop 'storageKey' to 'customKey'", () => {
    act(() => {
      render(
        <ThemeProvider modeStorageKey="customKey">
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('customKey')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('customKey', 'light')
  })
})

describe('custom attribute', () => {
  test('should use data-mode attribute when using default', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-mode')).toBe('light')
  })

  // @TODO Fix this test
  test('should use class attribute (CSS-class) when attribute="class"', () => {
    act(() => {
      render(
        <ThemeProvider attribute="class">
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeTruthy()
  })

  test('should use "data-example"-attribute when attribute="data-example"', () => {
    act(() => {
      render(
        <ThemeProvider attribute="data-example">
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('light')
  })
})

describe('custom value-mapping', () => {
  test('should use custom value mapping when using value={{pink:"my-pink-mode"}}', () => {
    localStorageMock.setItem('mode', 'pink')

    act(() => {
      render(
        <ThemeProvider
          modes={['pink', 'light', 'dark', 'system']}
          modeValue={{ pink: 'my-pink-mode' }}
        >
          <HelperComponent forceSetMode="pink" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-mode')).toBe('my-pink-mode')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'pink')
  })

  test('should allow missing values (attribute)', () => {
    act(() => {
      render(
        <ThemeProvider modeValue={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.hasAttribute('data-mode')).toBeFalsy()
  })

  test('should allow missing values (class)', () => {
    act(() => {
      render(
        <ThemeProvider attribute="class" modeValue={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetMode="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeFalsy()
  })
})

describe('forcedMode', () => {
  test('should render saved mode when no forcedMode is set', () => {
    localStorageMock.setItem('mode', 'dark')

    render(
      <ThemeProvider>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(screen.getByTestId('forcedMode').textContent).toBe('')
  })

  test('should render light mode when forcedMode is set to light', () => {
    localStorageMock.setItem('mode', 'dark')

    act(() => {
      render(
        <ThemeProvider forcedMode="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(screen.getByTestId('forcedMode').textContent).toBe('light')
  })
})

describe('system', () => {
  test('resolved mode should be set', () => {
    setDeviceMode('dark')

    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('mode').textContent).toBe('system')
    expect(screen.getByTestId('forcedMode').textContent).toBe('')
    expect(screen.getByTestId('resolvedMode').textContent).toBe('dark')
  })

  test('system mode should be set, even if mode is not system', () => {
    setDeviceMode('dark')

    act(() => {
      render(
        <ThemeProvider defaultMode="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(screen.getByTestId('forcedMode').textContent).toBe('')
    expect(screen.getByTestId('resolvedMode').textContent).toBe('light')
    expect(screen.getByTestId('systemMode').textContent).toBe('dark')
  })

  test('system mode should not be set if enableSystem is false', () => {
    setDeviceMode('dark')

    act(() => {
      render(
        <ThemeProvider defaultMode="light" enableSystem={false}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(screen.getByTestId('forcedMode').textContent).toBe('')
    expect(screen.getByTestId('resolvedMode').textContent).toBe('light')
    expect(screen.getByTestId('systemMode').textContent).toBe('')
  })
})

describe('color-scheme', () => {
  test('does not set color-scheme when disabled', () => {
    act(() => {
      render(
        <ThemeProvider enableColorScheme={false}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.style.colorScheme).toBe('')
  })

  test('should set color-scheme light when light mode is active', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-mode')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  test('should set color-scheme dark when dark theme is active', () => {
    act(() => {
      render(
        <ThemeProvider defaultMode="dark">
          <HelperComponent forceSetMode="dark" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
