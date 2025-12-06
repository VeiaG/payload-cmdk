'use client'

import './SearchButton.scss'

import { useTranslation } from '@payloadcms/ui'
import { SearchIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import type { CustomTranslationsKeys, CustomTranslationsObject } from '../translations'

import { useCommandMenu } from './CommandMenuContext'

interface SearchButtonProps {
  position?: 'actions' | 'nav'
  shortcut?: string
}

const SearchButton: React.FC<SearchButtonProps> = ({
  position = 'actions',
  shortcut = 'ctrl+shift+k',
}) => {
  const { openMenu } = useCommandMenu()
  const { t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/i.test(navigator.platform))
  }, [])

  const formatShortcut = (shortcutString: string): string[] => {
    const parts = shortcutString.split('+').map((part) => part.trim().toLowerCase())
    return parts.map((part) => {
      if (part === 'ctrl' || part === 'cmd') {
        return isMac ? '⌘' : 'Ctrl'
      }
      if (part === 'shift') {
        return isMac ? '⇧' : 'Shift'
      }
      if (part === 'alt') {
        return isMac ? '⌥' : 'Alt'
      }
      return part.toUpperCase()
    })
  }

  const shortcutParts = formatShortcut(shortcut)

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
            <kbd key={index}>{part}</kbd>
          ))}
        </div>
      </div>
    </button>
  )
}

export default SearchButton
