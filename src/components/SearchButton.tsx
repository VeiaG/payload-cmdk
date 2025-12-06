'use client'

import './SearchButton.scss'

import { useTranslation } from '@payloadcms/ui'
import { ArrowBigUp, Command as CommandIcon, Option, SearchIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../translations'

import { useCommandMenu } from './CommandMenuContext'

interface SearchButtonProps {
  position?: 'actions' | 'nav'
  shortcut?: string | string[]
}

const SearchButton: React.FC<SearchButtonProps> = ({
  position = 'actions',
  shortcut = ['meta+k', 'ctrl+k'],
}) => {
  const { openMenu } = useCommandMenu()
  const { t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/i.test(navigator.platform))
  }, [])

  const formatShortcut = (
    shortcutString: string,
  ): Array<{ icon?: React.ReactNode; text?: string }> => {
    const parts = shortcutString.split('+').map((part) => part.trim().toLowerCase())
    return parts.map((part) => {
      if (part === 'ctrl' || part === 'cmd') {
        return isMac ? { icon: <CommandIcon size={12} /> } : { text: 'Ctrl' }
      }
      if (part === 'meta') {
        return isMac ? { icon: <CommandIcon size={12} /> } : { text: 'Ctrl' }
      }
      if (part === 'shift') {
        return isMac ? { icon: <ArrowBigUp size={12} /> } : { text: 'Shift' }
      }
      if (part === 'alt') {
        return isMac ? { icon: <Option size={12} /> } : { text: 'Alt' }
      }
      return { text: part.toUpperCase() }
    })
  }

  // Select the appropriate shortcut to display based on platform
  const getDisplayShortcut = (): string => {
    if (typeof shortcut === 'string') {
      return shortcut
    }
    // If array, prefer meta shortcut for Mac, ctrl shortcut for others
    const metaShortcut = shortcut.find((s) => s.toLowerCase().includes('meta'))
    const ctrlShortcut = shortcut.find((s) => s.toLowerCase().includes('ctrl'))

    if (isMac && metaShortcut) {
      return metaShortcut
    }
    if (!isMac && ctrlShortcut) {
      return ctrlShortcut
    }
    // Fallback to first shortcut
    return shortcut[0] || 'meta+k'
  }

  const shortcutParts = formatShortcut(getDisplayShortcut())

  return (
    <button
      className={`search-button ${position === 'nav' ? 'search-button--nav' : 'search-button--actions'}`}
      onClick={openMenu}
      type="button"
    >
      <div className="search-button__wrapper">
        <SearchIcon className="search-button__icon" />
        {position === 'actions' && (
          <span className="search-button__placeholder">{t('cmdkPlugin:searchShort')}</span>
        )}
        <div className="search-button__shortcuts">
          {shortcutParts.map((part, index) => (
            <kbd key={index}>{part.icon ? part.icon : part.text}</kbd>
          ))}
        </div>
      </div>
    </button>
  )
}

export default SearchButton
