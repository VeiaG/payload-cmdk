import { type Config, deepMerge } from 'payload'

import type { PluginCommandMenuConfig } from './types.js'

import { commandPluginTranslations } from './translations/index.js'

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
