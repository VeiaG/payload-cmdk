import type { NestedKeysStripped } from '@payloadcms/translations'
import type { enTranslations } from '@payloadcms/translations/languages/en'

export const commandPluginTranslations = {
  en: {
    cmdkPlugin: {
      loading: 'Loading...',
      navigate: 'to navigate',
      noResults: 'No results found',
      open: 'to open',
      search: 'Search collections, globals...',
      searchIn: 'Search in {{label}}',
      searchInCollection: 'to search in collection',
      searchShort: 'Search',
    },
  },
  uk: {
    cmdkPlugin: {
      loading: 'Завантаження...',
      navigate: 'щоб перейти',
      noResults: 'Результатів не знайдено',
      open: 'щоб відкрити',
      search: 'Пошук колекцій, глобалів...',
      searchIn: 'Пошук в {{label}}',
      searchInCollection: 'щоб шукати в колекції',
      searchShort: 'Пошук',
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
