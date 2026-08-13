import type { PayloadRequest, SanitizedConfig, TypedUser, VisibleEntities } from 'payload'
import type { CustomMenuGroup, CustomMenuItem } from 'src/types'

import { isEntityHidden } from 'payload'

/**
 * Which collections and globals this user is allowed to see listed.
 *
 * Payload builds the same thing in `initPage` and hands it to the admin template, but
 * never down to the custom providers this plugin registers into, so we build our own.
 * `admin.hidden` is stripped from the client config, which makes this a server-only
 * question: the browser has no way to answer it.
 *
 * The answer only depends on the user, and a login or logout reloads the admin, so it is
 * safe to compute once per render.
 */
export const computeVisibleEntities = (
  config: SanitizedConfig,
  user: null | TypedUser,
): VisibleEntities => ({
  collections: config.collections
    .filter(({ admin }) => !isEntityHidden({ hidden: admin?.hidden, user }))
    .map(({ slug }) => slug),
  globals: config.globals
    .filter(({ admin }) => !isEntityHidden({ hidden: admin?.hidden, user }))
    .map(({ slug }) => slug),
})

/**
 * Runs one `access` check. Anything other than a clear `true` denies:
 * a thrown error must not turn into a visible item.
 */
const isAllowed = async <T extends CustomMenuGroup | CustomMenuItem>(
  check: ((args: { item: never; req: PayloadRequest }) => boolean | Promise<boolean>) | undefined,
  item: T,
  req: PayloadRequest,
): Promise<boolean> => {
  if (!check) {
    return true
  }
  try {
    return Boolean(await check({ item: item as never, req }))
  } catch {
    return false
  }
}

/** Drops `access` so the item can cross to the browser, where functions cannot go. */
const withoutAccess = <T extends CustomMenuGroup | CustomMenuItem>({
  access: _access,
  ...rest
}: T): T => rest as T

/**
 * Keeps only the custom items and groups this user may see, and strips every `access`
 * function on the way out.
 *
 * A denied group takes its items with it; an allowed group still filters its own items.
 * A group left with no items is dropped too, since an empty heading is noise.
 */
export const filterCustomItems = async (
  customItems: (CustomMenuGroup | CustomMenuItem)[],
  req: PayloadRequest,
): Promise<(CustomMenuGroup | CustomMenuItem)[]> => {
  const results = await Promise.all(
    customItems.map(async (entry) => {
      if (!(await isAllowed(entry.access, entry, req))) {
        return null
      }

      if (entry.type === 'item') {
        return withoutAccess(entry)
      }

      const allowed = await Promise.all(entry.items.map((item) => isAllowed(item.access, item, req)))
      const items = entry.items.filter((_, index) => allowed[index]).map(withoutAccess)

      return items.length > 0 ? { ...withoutAccess(entry), items } : null
    }),
  )

  return results.filter((entry): entry is CustomMenuGroup | CustomMenuItem => entry !== null)
}
