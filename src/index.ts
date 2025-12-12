import { type Config, deepMerge } from 'payload'

import type { PluginCommandMenuConfig } from './types'

import { commandPluginTranslations } from './translations'

export const payloadCmdk =
  (pluginOptions: PluginCommandMenuConfig = {}) =>
  (config: Config): Config => {
    /**
     * Initialize plugin options with safe defaults:
     * - `disabled: false` ensures the plugin is enabled by default and prevents
     *   "undefined" errors when checking `pluginOptions.disabled`
     * - Spreading `...pluginOptions` preserves any user-provided overrides
     */
    // This can be useful later, if we introduce some defaults, other than disabled. Right now all defaults are hard-coded (like variable || 'default value' )
    // Either we remove this, or move all our hardcoded defaults to one default config, which will get merged with user config.
    //pluginOptions = {
    //  disabled: false,
    //  ...pluginOptions,
    //}

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
      path: '@veiag/payload-cmdk/client#CommandMenuProvider',
    })

    if (pluginOptions.searchButton !== false) {
      let searchButtonPosition = 'actions'
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
              shortcut: pluginOptions.shortcut || ['meta+k', 'ctrl+k'],
            },
            path: '@veiag/payload-cmdk/client#SearchButton',
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
            shortcut: pluginOptions.shortcut || ['meta+k', 'ctrl+k'],
          },
          path: '@veiag/payload-cmdk/client#SearchButton',
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
