'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, mode, setMode, setTheme } = useTheme()

  return (
    <>
      <label className="mt-16" htmlFor="theme-select">Theme:</label>
      <select 
        id="theme-select"
        value={theme}
        name="themes"
        onChange={e => {
          setTheme(e.target.value)
        }}
      >
        <option value="offroad">Offroad</option>
        <option value="hunt">Hunt</option>
        <option value="backcountry">Backcountry</option>
        <option value="fish">Fish</option>
      </select>

      <button
        className="mt-16 px-4 py-2 text-white dark:text-black bg-black dark:bg-white font-semibold rounded-md"
        onClick={() => {
          setMode(mode === 'light' ? 'dark' : 'light')
        }}
      >
        Change Mode
      </button>
    </>
  )
}
