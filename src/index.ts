import type { Config } from 'payload'

import type { PluginCommandMenuConfig } from './types.js'

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

    //Store our config in payload config for later use
    // config.custom accessible only server-side
    // if (!config.custom) {
    //   config.custom = {}
    // }
    // if (!config.custom.pluginCommandMenu) {
    //   config.custom.pluginCommandMenu = {}
    // }
    // config.custom.pluginCommandMenu = pluginOptions

    //@ts-expect-error - we forced to use config.pluginCommandMenu because config.custom is not available client-side
    config.pluginCommandMenu = pluginOptions

    config.admin.components.providers.push('plugin-command-menu/client#CommandMenuProvider')

    return config
  }
