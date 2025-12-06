import type { CollectionSlug } from 'payload'

export type LocalizedString = { [locale: string]: string } | string

/**
 * Custom menu item, for configuration.
 * Will be mapped to CommandMenuItem internally.
 */
export type CustomMenuItem = {
  action: CommandMenuAction
  label: LocalizedString
  slug: string
  type: 'item'
}

/**
 * Custom menu group, for configuration.
 * Will be mapped to CommandMenuGroup internally.
 *
 * Groups will be merged if they have the same title.
 */
export type CustomMenuGroup = {
  items: CustomMenuItem[]
  title: LocalizedString
  type: 'group'
}
/**
 * Full serializable config for the plugin.
 */
export type PluginCommandMenuConfig = {
  /**
   * Custom items or groups to add to the command menu.
   */
  customItems?: (CustomMenuGroup | CustomMenuItem)[]
  /**
   * Disable the plugin functionality
   * @default false
   */
  disabled?: boolean
  /**
   * Specify which collections slugs remove from the command menu.
   * @default ['payload-migrations','payload-preferences','payload-locked-documents']
   *
   * You can also provide an object with `ignoreList` and `replaceDefaults` properties.
   * `replaceDefaults` allows you to completely replace the default slugs to ignore instead of appending to them.
   */
  slugsToIgnore?:
    | {
        /**
         * List of collection/global slugs to ignore in the command menu.
         */
        ignoreList: CollectionSlug[]
        /**
         * Whether to replace the default slugs to ignore instead of appending to them.
         */
        replaceDefaults?: boolean
      }
    | CollectionSlug[]
}

export interface CommandMenuContextProps {
  children: React.ReactNode
}

export interface CommandMenuActionLink {
  href: string
  type: 'link'
}

export interface CommandMenuActionAPICall {
  body?: {
    [key: string]: unknown
  }
  href: string
  /**
   * HTTP method to use for the API call.
   * @default 'GET'
   */
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT'
  type: 'api'
}

export type CommandMenuAction = CommandMenuActionAPICall | CommandMenuActionLink

export interface CommandMenuItem {
  /**
   * Action to perform when the command menu item is selected.
   */
  action: CommandMenuAction
  label: string
  slug: string
  /**
   * Type of the command menu item. Used for grouping and icons.
   * @default 'custom'
   */
  type: 'collection' | 'custom' | 'global'
}

export interface CommandMenuGroup {
  items: CommandMenuItem[]
  title: string
}
