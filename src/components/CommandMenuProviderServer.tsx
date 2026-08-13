import type { ServerProps } from 'payload'
import type { PluginCommandMenuConfig } from 'src/types'

import { createLocalReq } from 'payload'
import React from 'react'

import { computeVisibleEntities, filterCustomItems } from '../utils/access'
import { CommandMenuProvider } from './CommandMenuContext'

export type CommandMenuProviderServerProps = {
  children?: React.ReactNode
  pluginConfig: PluginCommandMenuConfig
} & Partial<ServerProps>

/**
 * Server half of the command menu.
 *
 * The menu itself is a client component, but two of its questions can only be answered on
 * the server: whether a custom item's `access` lets this user see it, and whether a
 * collection is hidden by `admin.hidden`. Both depend on things the browser never
 * receives, so we settle them here and pass the client plain data.
 *
 * Payload renders this because it is a Server Component, which is also why the plugin can
 * hand it `pluginConfig` through `serverProps`: those props are never serialized, so the
 * `access` functions survive the trip. Anything we pass on to the client below has to be
 * serializable, which is why the functions are stripped on the way out.
 */
 
export const CommandMenuProviderServer = async ({
  children,
  payload,
  pluginConfig,
  user,
}: CommandMenuProviderServerProps) => {
  // Payload builds no `req` for providers, so we make one. It carries the user, which is
  // all an access function needs to reach the Local API on their behalf.
  const req = payload ? await createLocalReq({ user: user ?? undefined }, payload) : undefined

  const customItems =
    pluginConfig.customItems && req
      ? await filterCustomItems(pluginConfig.customItems, req)
      : // Without a `req` we cannot judge anyone, so we show nothing custom rather than
        // everything custom.
        []

  return (
    <CommandMenuProvider
      pluginConfig={{ ...pluginConfig, customItems }}
      visibleEntities={payload ? computeVisibleEntities(payload.config, user ?? null) : undefined}
    >
      {children}
    </CommandMenuProvider>
  )
}
