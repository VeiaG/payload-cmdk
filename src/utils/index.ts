import type { ClientConfig, LabelFunction, TextFieldClient } from 'payload'
import type {
  CommandMenuGroup,
  CommandMenuItem,
  CustomMenuGroup,
  CustomMenuItem,
  LocalizedString,
  PluginCommandMenuConfig,
} from 'src/types.js'

export const convertSlugToTitle = (slug: string): string => {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export const extractLocalizedValue = (
  value: LocalizedString,
  locale: string,
  slug?: string,
): string => {
  if (typeof value === 'string') {
    return value
  }
  return value[locale] || convertSlugToTitle(slug || '')
}

export const extractLocalizedCollectionName = (
  collection: {
    labels?: { plural?: LocalizedString; singular?: LocalizedString }
    slug: string
  },
  locale: string,
): string => {
  //Get plural name if exists, otherwise singular, otherwise slug
  if (collection.labels?.plural) {
    return extractLocalizedValue(collection.labels.plural, locale, collection.slug)
  }
  if (collection.labels?.singular) {
    return extractLocalizedValue(collection.labels.singular, locale, collection.slug)
  }
  return '' //Generally should not happen
}

export const extractLocalizedGlobalName = (
  global: {
    label?: LabelFunction | LocalizedString
    slug: string
  },
  locale: string,
): string => {
  if (global.label) {
    return extractLocalizedValue(
      //Ignore label functions, they are not serializable
      typeof global.label === 'function' ? {} : global.label,
      locale,
      global.slug,
    )
  }
  return '' //Generally should not happen
}

export const extractLocalizedGroupName = (
  object: {
    admin?: { group?: false | LocalizedString }
  },
  locale: string,
): null | string => {
  if (object.admin?.group) {
    //Try to extract group name, with fallback to null (no group)
    return extractLocalizedValue(object.admin.group, locale)?.trim() || null
  }
  return null
}

export const convertConfigItem = (item: CustomMenuItem, currentLang: string): CommandMenuItem => {
  return {
    slug: item.slug,
    type: 'custom',
    action: item.action,
    label: extractLocalizedValue(item.label, currentLang, item.slug),
  }
}

export const convertConfigGroup = (
  group: CustomMenuGroup,
  currentLang: string,
): CommandMenuGroup => {
  return {
    items: group.items.map((item) => convertConfigItem(item, currentLang)), // Will be merged with existing items if group exists
    title: extractLocalizedValue(group.title, currentLang),
  }
}
/**
 * Set of collection/globals slugs to ignore in the command menu.
 * This is useful to avoid showing certain collections/globals in the command menu.
 */
const DEFAULT_SLUGS_TO_IGNORE: string[] = [
  'payload-migrations',
  'payload-preferences',
  'payload-locked-documents',
]
export const createDefaultGroups = (
  config: ClientConfig,
  currentLang: string,
  pluginConfig: PluginCommandMenuConfig,
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
        const useAsTitleField = collection.admin?.useAsTitle || 'id'
        let useAsTitleFieldLabel: TextFieldClient['label'] | undefined = undefined
        let useAsTitleLabel: string | undefined = undefined
        //Only extract useAsTitle label if submenu is enabled
        if (pluginConfig?.submenu?.enabled !== false) {
          useAsTitleFieldLabel = (
            collection?.fields?.find((field) => {
              if ('name' in field === false) {
                return null
              }
              return field.name === useAsTitleField
            }) as null | TextFieldClient
          )?.label
          //Extract label for useAsTitle field
          useAsTitleLabel = extractLocalizedValue(
            typeof useAsTitleFieldLabel === 'function' ? {} : useAsTitleFieldLabel || {},
            currentLang,
            useAsTitleField,
          )
        }
        group.items.push({
          slug: collection.slug,
          type: 'collection',
          action: {
            type: 'link',
            href: `/admin/collections/${collection.slug}`,
          },
          label: extractLocalizedCollectionName(collection, currentLang),
          useAsTitle: useAsTitleField,
          useAsTitleLabel: useAsTitleLabel || useAsTitleField,
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
