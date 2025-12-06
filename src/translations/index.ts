import type { NestedKeysStripped } from '@payloadcms/translations'
import type { enTranslations } from '@payloadcms/translations/languages/en'

export const commandPluginTranslations = {
  en: {
    cmdkPlugin: {
      search: 'Search collections, globals...',
      searchIn: 'Search in {{label}}',
      toExecute: 'to execute',
      toNavigate: 'to navigate',
      toOpen: 'to open',
      toSearchIn: 'to search in collection',
      toSelect: 'to select',
    },
  },
  uk: {
    cmdkPlugin: {
      search: 'Пошук колекцій, глобалів...',
      searchIn: 'Пошук в {{label}}',
      toExecute: 'щоб виконати',
      toNavigate: 'щоб перейти',
      toOpen: 'щоб відкрити',
      toSearchIn: 'щоб шукати в колекції',
      toSelect: 'щоб вибрати',
    },
  },
}

export type AvaibleTranslation = keyof typeof commandPluginTranslations.en.cmdkPlugin

export type CustomTranslationsObject = typeof commandPluginTranslations.en & typeof enTranslations

export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>

export const mergeTranslations = (
  existingTranslations: Record<string, unknown>,
  newTranslations: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    ...existingTranslations,
    ...newTranslations,
    cmdkPlugin: {
      ...(existingTranslations.cmdkPlugin || {}),
      ...(newTranslations.cmdkPlugin || {}),
    },
  }
}
