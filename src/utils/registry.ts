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
