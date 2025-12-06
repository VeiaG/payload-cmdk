//Command menu context
//Contains types and context provider for command menu state management
//Also renders the command menu component, which uses the context
'use client'
import type { ClientConfig } from 'payload'
import type {
  CommandMenuContextProps,
  CommandMenuGroup,
  CommandMenuItem,
  PluginCommandMenuConfig,
} from 'src/types.js'

import { Modal, useConfig, useModal, useTranslation } from '@payloadcms/ui'
import { Files, Globe } from 'lucide-react'

import './modal.scss'

import { useRouter } from 'next/navigation.js'
import { createContext, Fragment, useCallback, useContext, useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import {
  convertConfigGroup,
  convertConfigItem,
  extractLocalizedCollectionName,
  extractLocalizedGlobalName,
  extractLocalizedGroupName,
} from '../utils/index.js'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './cmdk/index.js'

const MODAL_SLUG = 'command-menu'

/**
 * Set of collection/globals slugs to ignore in the command menu.
 * This is useful to avoid showing certain collections/globals in the command menu.
 *
 * TODO: Make this configurable via plugin options.
 */
const DEFAULT_SLUGS_TO_IGNORE: string[] = [
  'payload-migrations',
  'payload-preferences',
  'payload-locked-documents',
]

interface CommandMenuContextType {
  closeMenu: () => void
  groups: CommandMenuGroup[]
  isOpen: boolean
  items: CommandMenuItem[]
  openMenu: () => void
  toggleMenu: () => void
}

const CommandMenuContext = createContext<CommandMenuContextType>({
  closeMenu: () => {},
  groups: [],
  isOpen: false,
  items: [],
  openMenu: () => {},
  toggleMenu: () => {},
})

const useCommandMenu = () => {
  const context = useContext(CommandMenuContext)
  return context
}

const createDefaultGroups = (
  config: ClientConfig,
  currentLang: string,
): {
  groups: CommandMenuGroup[]
  /**
   * Stray items that don't belong to any group.
   * Only with custom items.
   */
  items: CommandMenuItem[]
} => {
  const groups: CommandMenuGroup[] = []
  const items: CommandMenuItem[] = []
  const avaibleGroups = new Set<string>() //To avoid duplicates
  let slugsToIgnore = [...DEFAULT_SLUGS_TO_IGNORE]

  //@ts-expect-error - we forced to use config.pluginCommandMenu because config.custom is not available client-side
  const pluginConfig = config.pluginCommandMenu as unknown as PluginCommandMenuConfig

  //Handle slugs to ignore from plugin config
  if (pluginConfig?.slugsToIgnore) {
    if (Array.isArray(pluginConfig.slugsToIgnore)) {
      slugsToIgnore.push(...pluginConfig.slugsToIgnore)
    } else {
      //Object with ignoreList and replaceDefaults
      if (pluginConfig.slugsToIgnore.replaceDefaults) {
        //Replace defaults
        slugsToIgnore = [] //Reset
      }
      slugsToIgnore.push(...pluginConfig.slugsToIgnore.ignoreList)
    }
  }

  if (config.collections) {
    config.collections.forEach((collection) => {
      if (slugsToIgnore.includes(collection.slug)) {
        return
      }

      const groupName = extractLocalizedGroupName(collection, currentLang) || 'Collections'
      //   console.log(collection.slug, 'groupName:', groupName, 'Object', collection.admin)
      if (!avaibleGroups.has(groupName)) {
        avaibleGroups.add(groupName)
        groups.push({
          items: [],
          title: groupName,
        })
      }
      const group = groups.find((g) => g.title === groupName)
      if (group) {
        group.items.push({
          slug: collection.slug,
          type: 'collection',
          action: {
            type: 'link',
            href: `/admin/collections/${collection.slug}`,
          },
          label: extractLocalizedCollectionName(collection, currentLang),
        })
      }
    })
  }
  //Globals
  if (config.globals) {
    config.globals.forEach((global) => {
      if (slugsToIgnore.includes(global.slug)) {
        return
      }
      //Same logic as collections
      const groupName = extractLocalizedGroupName(global, currentLang) || 'Globals'
      if (!avaibleGroups.has(groupName)) {
        avaibleGroups.add(groupName)
        groups.push({
          items: [],
          title: groupName,
        })
      }
      const group = groups.find((g) => g.title === groupName)
      if (group) {
        group.items.push({
          slug: global.slug,
          type: 'global',
          action: {
            type: 'link',
            href: `/admin/globals/${global.slug}`,
          },
          label: extractLocalizedGlobalName(global, currentLang),
        })
      }
    })
  }
  //Now custom items/groups from plugin config
  if (pluginConfig?.customItems) {
    //We are not using slugsToIgnore for custom items, as they are user-defined
    pluginConfig.customItems.forEach((value) => {
      if (value.type === 'group') {
        const convertedGroup = convertConfigGroup(value, currentLang)
        //Check if group already exists using our set
        if (!avaibleGroups.has(convertedGroup.title)) {
          avaibleGroups.add(convertedGroup.title)
          groups.push({
            items: [], //Don't add items yet, will do below
            title: convertedGroup.title,
          })
        }
        const group = groups.find((g) => g.title === convertedGroup.title)
        if (group) {
          //Append items to existing group, or if it was empty - add items
          group.items.push(...convertedGroup.items)
        }
      }
      if (value.type === 'item') {
        //Stray item, add to items array
        const convertedItem = convertConfigItem(value, currentLang)
        items.push(convertedItem)
      }
    })
  }
  return { groups, items }
}

const CommandMenuComponent: React.FC = () => {
  const [search, setSearch] = useState('')

  const { closeMenu, groups, items } = useCommandMenu()
  const router = useRouter()
  const { t } = useTranslation()

  const handleSelect = useCallback(
    async (item: CommandMenuItem) => {
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
      //Reset search
      setSearch('')
    },
    [router, closeMenu],
  )

  return (
    <Modal slug={MODAL_SLUG}>
      <div className="command-modal">
        <Command label="Command Menu">
          <CommandInput
            onValueChange={setSearch}
            // placeholder={t('general:searchBy')} -- will be used later for searching inside collections
            placeholder="TODO: Add search placeholder i18n"
            value={search}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {groups.map((group, index) => {
              //Skip empty groups
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
                    {group.items.map((item) => (
                      <CommandItem key={item.slug} onSelect={() => handleSelect(item)}>
                        {item.type === 'collection' ? (
                          <Files className="command__item-icon" />
                        ) : item.type === 'global' ? (
                          <Globe className="command__item-icon" />
                        ) : null}
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {isRenderSeparator && ( //No stray items, so no need for extra separator
                    <CommandSeparator />
                  )}
                </Fragment>
              )
            })}
            {items?.map((item) => (
              <CommandItem key={item.slug} onSelect={() => handleSelect(item)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </div>
    </Modal>
  )
}

export const CommandMenuProvider: React.FC<CommandMenuContextProps> = ({ children }) => {
  const { closeModal, isModalOpen, openModal, toggleModal } = useModal()

  useHotkeys('ctrl+shift+k', () => {
    toggleModal(MODAL_SLUG)
  })
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const currentLang = i18n.language
  const { groups, items } = useMemo(() => {
    return createDefaultGroups(config, currentLang)
  }, [config, currentLang])

  return (
    <CommandMenuContext.Provider
      value={{
        closeMenu: () => closeModal(MODAL_SLUG),
        groups,
        isOpen: isModalOpen(MODAL_SLUG),
        items,
        openMenu: () => openModal(MODAL_SLUG),
        toggleMenu: () => toggleModal(MODAL_SLUG),
      }}
    >
      {children}
      <CommandMenuComponent />
    </CommandMenuContext.Provider>
  )
}
