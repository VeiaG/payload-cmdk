'use client'

/**
 * Handler type for command menu function actions.
 */
export type CommandMenuActionHandler = () => Promise<void> | void

/**
 * Client-side registry for function-based command menu actions.
 *
 * Because the plugin config is serialized across the Next.js server→client
 * boundary, JavaScript functions cannot be embedded directly in the config.
 * Instead, register handlers here by a string key and reference that key in
 * `action: { type: 'function', key: '...' }`.
 *
 * @example
 * // payload.config.ts
 * customItems: [{
 *   type: 'item',
 *   slug: 'save-doc',
 *   label: 'Save Document',
 *   icon: 'Save',
 *   collectionSlugs: ['posts'],
 *   action: { type: 'function', key: 'save-current-doc' },
 * }]
 *
 * // Your client-side component / layout
 * import { registerCommandMenuAction } from '@veiag/payload-cmdk/client'
 * registerCommandMenuAction('save-current-doc', () => {
 *   document.querySelector('form')?.requestSubmit()
 * })
 */
const registry = new Map<string, CommandMenuActionHandler>()

/**
 * Register a handler function under the given key.
 * Calling this with the same key again will overwrite the previous handler.
 */
export const registerCommandMenuAction = (key: string, handler: CommandMenuActionHandler): void => {
  registry.set(key, handler)
}

/**
 * Remove a previously registered handler.
 */
export const unregisterCommandMenuAction = (key: string): void => {
  registry.delete(key)
}

/**
 * Look up a registered handler by key. Returns `undefined` if not found.
 * Used internally by the command menu to execute function actions.
 */
export const getCommandMenuAction = (key: string): CommandMenuActionHandler | undefined => {
  return registry.get(key)
}

/**
 * A cmdk filter for menu entries: `(value, search, keywords) => score`.
 *
 * - `value` is the entry's slug.
 * - `keywords` is `[group title, label]` for an entry in a group, `[label]` otherwise.
 * - Return 0 to hide the entry; a higher score sorts it (and its group) first.
 */
export type CommandMenuFilter = (value: string, search: string, keywords?: string[]) => number

let menuFilter: CommandMenuFilter | undefined

/**
 * Replace cmdk's default fuzzy filter for menu entries, e.g. to match without diacritics
 * or to drop fuzzy noise. Pass `undefined` to restore the default.
 *
 * @example
 * import { registerCommandMenuFilter } from '@veiag/payload-cmdk/client'
 * registerCommandMenuFilter((value, search, keywords = []) =>
 *   [value, ...keywords].some((k) => k.toLowerCase().startsWith(search.toLowerCase())) ? 1 : 0,
 * )
 */
export const registerCommandMenuFilter = (filter: CommandMenuFilter | undefined): void => {
  menuFilter = filter
}

/**
 * The registered menu filter, or `undefined` for cmdk's default.
 * Used internally by the command menu.
 */
export const getCommandMenuFilter = (): CommandMenuFilter | undefined => menuFilter
