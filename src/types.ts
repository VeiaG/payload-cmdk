import type { LucideIcon } from 'lucide-react'
import type { IconName } from 'lucide-react/dynamic'
import type { CollectionSlug, GlobalSlug } from 'payload'

export type LocalizedString = { [locale: string]: string } | string

export type InternalIcon = IconName | LucideIcon

/**
 * Custom menu item, for configuration.
 * Will be mapped to CommandMenuItem internally.
 */
export type CustomMenuItem = {
  action: CommandMenuAction
  icon?: IconName
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
   * Custom icons for collections and globals.
   * Key is the collection slug, value is the icon name from lucide-react.
   * Collections default icon - Files,
   * Globals default icon - Globe.
   */
  icons?: {
    /**
     * Custom icons for collections.
     * @default <Files/>
     */
    collections?: {
      [key: CollectionSlug]: IconName
    }
    /**
     * Custom icons for globals.
     * @default <Globe/>
     */
    globals?: {
      [key: GlobalSlug]: IconName
    }
  }
  /**
   * Configuration for the search button in the admin navigation.
   * Set to false to disable the search button.
   * @default { position: 'nav' }
   */
  searchButton?:
    | {
        /**
         * Position of the search button in the admin navigation.
         * @default 'nav'
         */
        position?: 'actions' | 'nav'
      }
    | false
  /**
   * Keyboard shortcut to open the command menu.
   * (sadly, ctrl+k opens browser search in chrome)
   * @default 'ctrl+shift+k'
   */
  shortcut?: string
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
  /**
   * Configure submenu behavior for collections.
   * When enabled, users can search within a collection's documents.
   * @default { enabled: true, shortcut: 'shift+enter' }
   */
  submenu?: {
    /**
     * Enable or disable submenu functionality.
     * @default true
     */
    enabled?: boolean
    /**
     * Custom icons for collection submenus.
     * Key is the collection slug, value is the icon name from lucide-react.
     *
     * @default null
     */
    icons?: {
      [key: CollectionSlug]: IconName
    }
    /**
     * Keyboard shortcut to open collection submenu.
     * - 'shift+enter': Shift+Enter opens submenu, Enter navigates to collection list
     * - 'enter': Enter opens submenu, Shift+Enter navigates to collection list
     * @default 'shift+enter'
     */
    shortcut?: 'enter' | 'shift+enter'
  }
}

export interface CommandMenuContextProps {
  children: React.ReactNode
  pluginConfig: PluginCommandMenuConfig
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
  icon?: InternalIcon
  label: string
  slug: string
  /**
   * Type of the command menu item. Used for grouping and icons.
   * @default 'custom'
   */
  type: 'collection' | 'custom' | 'global'

  /**
   * Field name used as title for collection documents.
   * Only applicable for collection type items.
   * Defaults to 'id' if not specified.
   */
  useAsTitle?: string
  /**
   * Label for the field used as title for collection documents.
   * Only applicable for collection type items.
   *
   * Used in submenu search placeholder.
   */
  useAsTitleLabel?: string
}

export interface CommandMenuGroup {
  items: CommandMenuItem[]
  title: string
}

/**
 * Page state for command menu navigation.
 * - 'main': Default view showing all collections/globals/custom items
 * - CollectionSearchPage: Submenu view for searching within a specific collection
 */
export type CommandMenuPage =
  | 'main'
  | {
      /**
       * Collection label for display
       */
      label: string
      /**
       * Collection slug
       */
      slug: string
      /**
       * Page type identifier
       */
      type: 'collection-search'
      /**
       * Field name to use as document title
       */
      useAsTitle: string
      /**
       * Label for the field used as title
       */
      useAsTitleLabel: string
    }

/**
 * Generic document type for collections, with dynamic keys.
 * We assume values are either string or number for simplicity, useAsTitle is making sure of that.
 */
export type GenericCollectionDocument = {
  [key: string]: number | string
  id: string
}
