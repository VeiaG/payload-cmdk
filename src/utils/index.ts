import type { LabelFunction } from 'payload'
import type {
  CommandMenuGroup,
  CommandMenuItem,
  CustomMenuGroup,
  CustomMenuItem,
  LocalizedString,
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
