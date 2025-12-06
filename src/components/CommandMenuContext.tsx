'use client'
import type { LucideIcon } from 'lucide-react'
import type { IconName } from 'lucide-react/dynamic'
import type {
  AvaibleTranslation,
  CustomTranslationsKeys,
  CustomTranslationsObject,
} from 'src/translations/index'

import './modal.scss'

import type {
  CommandMenuContextProps,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuPage,
  GenericCollectionDocument,
  PluginCommandMenuConfig,
} from 'src/types'

import { Modal, useConfig, useModal, useTranslation } from '@payloadcms/ui'
import { ArrowBigUp, ChevronLeft, Command as CommandIcon, Option } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useRouter } from 'next/navigation'
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { createDefaultGroups } from '../utils/index'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './cmdk/index'

const MODAL_SLUG = 'command-menu'

interface CommandMenuContextType {
  closeMenu: () => void
  currentPage: CommandMenuPage
  groups: CommandMenuGroup[]
  isOpen: boolean
  items: CommandMenuItem[]
  openMenu: () => void
  setPage: (page: CommandMenuPage) => void
  toggleMenu: () => void
}

const CommandMenuContext = createContext<CommandMenuContextType>({
  closeMenu: () => {},
  currentPage: 'main',
  groups: [],
  isOpen: false,
  items: [],
  openMenu: () => {},
  setPage: () => {},
  toggleMenu: () => {},
})

export const useCommandMenu = () => {
  const context = useContext(CommandMenuContext)
  return context
}

const ITEM_SELECTOR = `[cmdk-item=""]`

function getSelectedElement(containerRef: React.RefObject<HTMLElement | null>) {
  return containerRef.current?.querySelector(`${ITEM_SELECTOR}[aria-selected="true"]`)
}

const CommandMenuComponent: React.FC<{
  pluginConfig: PluginCommandMenuConfig
}> = ({ pluginConfig }) => {
  const [search, setSearch] = useState('')
  const [submenuItems, setSubmenuItems] = useState<CommandMenuItem[]>([])
  const [isLoadingSubmenu, setIsLoadingSubmenu] = useState(false)
  const [isMac, setIsMac] = useState(false)

  const commandListRef = useRef<HTMLDivElement>(null)

  const { closeMenu, currentPage, groups, items, setPage } = useCommandMenu()
  const router = useRouter()
  const { t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/i.test(navigator.platform))
  }, [])

  const submenuEnabled = pluginConfig?.submenu?.enabled !== false
  const submenuShortcut = pluginConfig?.submenu?.shortcut || 'shift+enter'
  const blurBg = pluginConfig?.blurBg !== false

  const formatShortcutKey = (key: string): React.ReactNode => {
    // Handle compound shortcuts like "Shift + Enter"
    const parts = key.split('+').map((part) => part.trim())
    const elements = parts.map((part, index) => {
      const lowerPart = part.toLowerCase()
      let content: React.ReactNode

      if (lowerPart === 'ctrl' || lowerPart === 'cmd') {
        content = isMac ? <CommandIcon size={12} /> : 'Ctrl'
      } else if (lowerPart === 'meta') {
        content = isMac ? <CommandIcon size={12} /> : 'Ctrl'
      } else if (lowerPart === 'shift') {
        content = isMac ? <ArrowBigUp size={12} /> : 'Shift'
      } else if (lowerPart === 'alt') {
        content = isMac ? <Option size={12} /> : 'Alt'
      } else {
        content = part
      }

      return (
        <Fragment key={index}>
          {content}
          {!isMac && index < parts.length - 1 && ' + '}
        </Fragment>
      )
    })

    return <>{elements}</>
  }

  // Debounced search for submenu
  useEffect(() => {
    if (currentPage === 'main') {
      return
    }

    const fetchDocuments = async () => {
      if (currentPage.type !== 'collection-search') {
        return
      }

      setIsLoadingSubmenu(true)
      try {
        const searchParam = search
          ? `&where[${currentPage.useAsTitle}][like]=${encodeURIComponent(search)}`
          : ''
        const response = await fetch(
          `/api/${currentPage.slug}?limit=10${searchParam}&select[${currentPage.useAsTitle}]=true`,
        )
        const data = await response.json()

        if (data.docs && Array.isArray(data.docs)) {
          const docs: CommandMenuItem[] = data.docs.map((doc: GenericCollectionDocument) => ({
            slug: `${currentPage.slug}-${doc.id}`,
            type: 'custom' as const,
            action: {
              type: 'link',
              href: `/admin/collections/${currentPage.slug}/${doc.id}`,
            },
            icon: pluginConfig?.submenu?.icons?.[currentPage.slug] ?? undefined,
            label: doc[currentPage.useAsTitle] || doc.id,
          }))
          setSubmenuItems(docs)
        }
      } catch {
        setSubmenuItems([])
      } finally {
        setIsLoadingSubmenu(false)
      }
    }

    const timeoutId = setTimeout(fetchDocuments, 300)
    return () => clearTimeout(timeoutId)
  }, [search, currentPage, pluginConfig?.submenu?.icons])

  const handleBack = useCallback(() => {
    setPage('main')
    setSearch('')
    setSubmenuItems([])
  }, [setPage])

  const executeItemAction = useCallback(
    async (item: CommandMenuItem) => {
      // Execute the item's action
      switch (item.action.type) {
        case 'api':
          await fetch(item.action.href, {
            body: item.action.body ? JSON.stringify(item.action.body) : undefined,
            headers: {
              'Content-Type': 'application/json',
            },
            method: item.action.method || 'GET',
          })
          break
        case 'link':
          router.push(item.action.href)
          break
        default:
          break
      }
      closeMenu()
      setSearch('')
      setPage('main')
    },
    [router, closeMenu, setPage],
  )

  const openSubmenu = useCallback(
    (item: CommandMenuItem) => {
      setPage({
        slug: item.slug,
        type: 'collection-search',
        label: item.label,
        useAsTitle: item.useAsTitle || 'id',
        useAsTitleLabel: item.useAsTitleLabel || item.useAsTitle || 'id',
      })
      setSearch('')
      //set isLoadingSubmenu to true to show loading state while fetching
      setIsLoadingSubmenu(true)
      setSubmenuItems([])
    },
    [setPage],
  )

  const handleSelect = useCallback(
    async (item: CommandMenuItem) => {
      await executeItemAction(item)
    },
    [executeItemAction],
  )

  // Handle keyboard events for navigation and back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key for back navigation in submenu
      if (e.key === 'Escape' && currentPage !== 'main') {
        e.preventDefault()
        e.stopPropagation()
        handleBack()
        return
      }

      // Enter/Shift+Enter handling for collection submenu
      if (e.key === 'Enter' && currentPage === 'main') {
        const selectedElement = getSelectedElement(commandListRef)
        const itemType = selectedElement?.getAttribute('data-item-type')
        const itemSlug = selectedElement?.getAttribute('data-value')

        if (submenuEnabled && itemType === 'collection' && itemSlug) {
          const isShiftPressed = e.shiftKey
          const shouldOpenSubmenu =
            (submenuShortcut === 'shift+enter' && isShiftPressed) ||
            (submenuShortcut === 'enter' && !isShiftPressed)

          if (shouldOpenSubmenu) {
            e.preventDefault()
            e.stopPropagation()

            // Find the item in groups
            const item = groups.flatMap((g) => g.items).find((i) => i.slug === itemSlug)
            if (item) {
              openSubmenu(item)
            }
            return
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [currentPage, handleBack, submenuEnabled, submenuShortcut, openSubmenu, groups])

  const placeholder =
    currentPage === 'main'
      ? t('cmdkPlugin:search')
      : t('general:searchBy', {
          label: currentPage.useAsTitleLabel,
        })

  const shouldDisableFilter = currentPage !== 'main'

  // Dynamic footer text based on highlighted item from DOM
  const getFooterText = () => {
    const selectedElement = getSelectedElement(commandListRef)
    if (!selectedElement) {
      return null
    }

    const itemType = selectedElement.getAttribute('data-item-type')
    const actionType = selectedElement.getAttribute('data-action-type')

    const shortcuts: {
      action: AvaibleTranslation
      key: string
    }[] = []

    if (currentPage === 'main') {
      // For collections, show both submenu and navigation shortcuts
      if (submenuEnabled && itemType === 'collection') {
        if (submenuShortcut === 'shift+enter') {
          shortcuts.push({ action: 'toNavigate', key: 'Enter' })
          shortcuts.push({ action: 'toSearchIn', key: 'Shift + Enter' })
        } else {
          shortcuts.push({ action: 'toSearchIn', key: 'Enter' })
          shortcuts.push({ action: 'toNavigate', key: 'Shift + Enter' })
        }
      } else {
        // For non-collections, show appropriate action
        let actionText: AvaibleTranslation = 'toSelect'
        if (actionType === 'link') {
          actionText = 'toNavigate'
        } else if (actionType === 'api') {
          actionText = 'toExecute'
        }

        shortcuts.push({ action: actionText, key: 'Enter' })
      }
    } else {
      // In submenu, just show Enter to open/navigate
      const actionText = actionType === 'link' ? 'toOpen' : 'toSelect'
      shortcuts.push({ action: actionText, key: 'Enter' })
    }

    return shortcuts
  }

  // Force re-render when selection might change - we'll use a key to force footer updates
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const footerShortcuts = getFooterText()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal only if clicking the backdrop (not the command itself)
    if (e.target === e.currentTarget) {
      closeMenu()
    }
  }

  return (
    <Modal slug={MODAL_SLUG}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`command-modal ${blurBg ? 'command-modal--blur' : ''}`}
        onClick={handleBackdropClick}
      >
        <Command label="Command Menu" shouldFilter={!shouldDisableFilter}>
          {/* Header for submenu navigation */}
          {currentPage !== 'main' && (
            <div className="command__header">
              <button className="command__back-button" onClick={handleBack} type="button">
                <ChevronLeft size={16} />
              </button>
              <span className="command__header-label">
                {t('cmdkPlugin:searchIn', { label: currentPage.label })}
              </span>
            </div>
          )}

          <CommandInput onValueChange={setSearch} placeholder={placeholder} value={search} />
          <CommandList ref={commandListRef}>
            <CommandEmpty>
              {isLoadingSubmenu ? t('cmdkPlugin:loading') : t('cmdkPlugin:noResults')}
            </CommandEmpty>

            {/* Main page view */}
            {currentPage === 'main' &&
              groups.map((group, index) => {
                if (group.items.length === 0) {
                  return null
                }

                let titleName = group.title
                if (group.title === 'Collections') {
                  titleName = t('general:collections')
                }
                if (group.title === 'Globals') {
                  titleName = t('general:globals')
                }

                const isRenderSeparator = !(index === groups.length - 1 && items.length === 0)
                return (
                  <Fragment key={group.title}>
                    <CommandGroup heading={titleName}>
                      {group.items.map((item) => {
                        const isDynamicIcon = typeof item.icon === 'string'
                        const IconComponent = isDynamicIcon ? null : (item.icon as LucideIcon)
                        return (
                          <CommandItem
                            data-action-type={item.action.type}
                            data-item-type={item.type}
                            key={item.slug}
                            keywords={[group.title]}
                            onSelect={() => handleSelect(item)}
                            value={item.slug}
                          >
                            {isDynamicIcon ? (
                              <DynamicIcon
                                className="command__item-icon"
                                name={item.icon as IconName}
                              />
                            ) : (
                              IconComponent && <IconComponent className="command__item-icon" />
                            )}
                            {item.label}
                            {submenuEnabled && item.type === 'collection' && (
                              <CommandShortcut>›</CommandShortcut>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                    {isRenderSeparator && <CommandSeparator />}
                  </Fragment>
                )
              })}

            {/* Stray items on main page */}
            {currentPage === 'main' &&
              items?.map((item) => (
                <CommandItem
                  data-action-type={item.action.type}
                  data-item-type={item.type}
                  key={item.slug}
                  onSelect={() => handleSelect(item)}
                  value={item.slug}
                >
                  {item.label}
                </CommandItem>
              ))}

            {/* Submenu page view */}
            {currentPage !== 'main' &&
              submenuItems.map((item) => {
                const isDynamicIcon = typeof item.icon === 'string'
                const IconComponent = isDynamicIcon ? null : (item.icon as LucideIcon)
                return (
                  <CommandItem
                    data-action-type={item.action.type}
                    data-item-type={item.type}
                    key={item.slug}
                    onSelect={() => handleSelect(item)}
                    value={item.slug}
                  >
                    {isDynamicIcon ? (
                      <DynamicIcon className="command__item-icon" name={item.icon as IconName} />
                    ) : (
                      IconComponent && <IconComponent className="command__item-icon" />
                    )}
                    {item.label}
                  </CommandItem>
                )
              })}
          </CommandList>

          {/* Footer with dynamic shortcuts */}
          {footerShortcuts && footerShortcuts.length > 0 && (
            <div className="command__footer">
              {footerShortcuts.map((shortcut, index) => (
                <span key={index}>
                  <kbd>{formatShortcutKey(shortcut.key)}</kbd> {t(`cmdkPlugin:${shortcut.action}`)}
                </span>
              ))}
            </div>
          )}
        </Command>
      </div>
    </Modal>
  )
}

export const CommandMenuProvider: React.FC<CommandMenuContextProps> = ({
  children,
  pluginConfig,
}) => {
  const { closeModal, isModalOpen, openModal, toggleModal } = useModal()
  const [currentPage, setCurrentPage] = useState<CommandMenuPage>('main')

  useHotkeys(pluginConfig.shortcut || ['meta+k', 'ctrl+k'], () => {
    toggleModal(MODAL_SLUG)
  })
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const currentLang = i18n.language
  const { groups, items } = useMemo(() => {
    return createDefaultGroups(config, currentLang, pluginConfig)
  }, [config, currentLang, pluginConfig])

  return (
    <CommandMenuContext.Provider
      value={{
        closeMenu: () => closeModal(MODAL_SLUG),
        currentPage,
        groups,
        isOpen: isModalOpen(MODAL_SLUG),
        items,
        openMenu: () => openModal(MODAL_SLUG),
        setPage: setCurrentPage,
        toggleMenu: () => toggleModal(MODAL_SLUG),
      }}
    >
      {children}
      <CommandMenuComponent pluginConfig={pluginConfig} />
    </CommandMenuContext.Provider>
  )
}
