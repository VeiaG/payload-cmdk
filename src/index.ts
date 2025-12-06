import { type Config, deepMerge } from 'payload'

import type { PluginCommandMenuConfig } from './types'

import { commandPluginTranslations } from './translations'

export const pluginCommandMenu =
  (pluginOptions: PluginCommandMenuConfig) =>
  (config: Config): Config => {
    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.providers) {
      config.admin.components.providers = []
    }

    config.admin.components.providers.push({
      clientProps: {
        pluginConfig: pluginOptions,
      },
      path: 'plugin-command-menu/client#CommandMenuProvider',
    })

    if (pluginOptions.searchButton !== false) {
      let searchButtonPosition = 'nav'
      if (pluginOptions.searchButton && pluginOptions.searchButton.position) {
        searchButtonPosition = pluginOptions.searchButton.position
      }
      if (searchButtonPosition === 'nav') {
        if (!config.admin.components.beforeNavLinks) {
          config.admin.components.beforeNavLinks = []
        }
        config.admin.components.beforeNavLinks = [
          {
            clientProps: {
              position: pluginOptions.searchButton?.position || 'nav',
              shortcut: pluginOptions.shortcut || 'ctrl+shift+k',
            },
            path: 'plugin-command-menu/client#SearchButton',
          },
          ...config.admin.components.beforeNavLinks,
        ]
      } else {
        if (!config.admin.components.actions) {
          config.admin.components.actions = []
        }
        config.admin.components.actions.push({
          clientProps: {
            position: pluginOptions.searchButton?.position || 'actions',
            shortcut: pluginOptions.shortcut || 'ctrl+shift+k',
          },
          path: 'plugin-command-menu/client#SearchButton',
        })
      }
    }

    //Adding translations
    if (!config.i18n) {
      config.i18n = {}
    }
    if (!config.i18n.translations) {
      config.i18n.translations = {}
    }

    config.i18n.translations = deepMerge(config.i18n.translations, commandPluginTranslations)

    return config
  }
