import type { PayloadRequest, SanitizedConfig, TypedUser } from 'payload'

import { describe, expect, test } from 'vitest'

import type { CustomMenuGroup, CustomMenuItem } from '../src/types'

import { computeVisibleEntities, filterCustomItems } from '../src/utils/access'

const req = { user: { email: 'dev@payloadcms.com' } } as unknown as PayloadRequest

const item = (slug: string, access?: CustomMenuItem['access']): CustomMenuItem => ({
  slug,
  type: 'item',
  access,
  action: { type: 'link', href: '#' },
  label: slug,
})

const group = (
  title: string,
  items: CustomMenuItem[],
  access?: CustomMenuGroup['access'],
): CustomMenuGroup => ({ type: 'group', access, items, title })

describe('computeVisibleEntities', () => {
  const config = (
    collections: { admin?: { hidden?: unknown }; slug: string }[],
  ): SanitizedConfig => ({ collections, globals: [] }) as unknown as SanitizedConfig

  test('keeps entities that are not hidden', () => {
    const visible = computeVisibleEntities(config([{ slug: 'posts' }]), null)
    expect(visible.collections).toEqual(['posts'])
  })

  test('drops entities hidden by a boolean', () => {
    const visible = computeVisibleEntities(
      config([{ slug: 'posts' }, { slug: 'notes', admin: { hidden: true } }]),
      null,
    )
    expect(visible.collections).toEqual(['posts'])
  })

  test('asks the hidden function about the current user', () => {
    const hidden = ({ user }: { user: null | TypedUser }) =>
      (user as unknown as { email: string } | null)?.email !== 'dev@payloadcms.com'

    const forDev = computeVisibleEntities(
      config([{ slug: 'notes', admin: { hidden } }]),
      { email: 'dev@payloadcms.com' } as unknown as TypedUser,
    )
    const forOther = computeVisibleEntities(
      config([{ slug: 'notes', admin: { hidden } }]),
      { email: 'someone@else.com' } as unknown as TypedUser,
    )

    expect(forDev.collections).toEqual(['notes'])
    expect(forOther.collections).toEqual([])
  })
})

describe('filterCustomItems', () => {
  test('keeps items with no access function', async () => {
    const result = await filterCustomItems([item('plain')], req)
    expect(result.map((entry) => 'slug' in entry && entry.slug)).toEqual(['plain'])
  })

  test('drops denied items and keeps granted ones', async () => {
    const result = await filterCustomItems(
      [item('yes', () => true), item('no', () => false)],
      req,
    )
    expect(result.map((entry) => 'slug' in entry && entry.slug)).toEqual(['yes'])
  })

  test('treats a thrown error as a denial', async () => {
    const result = await filterCustomItems(
      [
        item('boom', () => {
          throw new Error('boom')
        }),
      ],
      req,
    )
    expect(result).toEqual([])
  })

  test('awaits async access functions', async () => {
    const result = await filterCustomItems(
      [
        item('async-yes', () => Promise.resolve(true)),
        item('async-no', () => Promise.resolve(false)),
      ],
      req,
    )
    expect(result.map((entry) => 'slug' in entry && entry.slug)).toEqual(['async-yes'])
  })

  test('hands the item and the req to the access function', async () => {
    const seen: { itemSlug: string; sameReq: boolean }[] = []
    await filterCustomItems(
      [
        item('probe', (args) => {
          seen.push({ itemSlug: args.item.slug, sameReq: args.req === req })
          return true
        }),
      ],
      req,
    )
    expect(seen).toEqual([{ itemSlug: 'probe', sameReq: true }])
  })

  test('drops a denied group along with its items', async () => {
    const result = await filterCustomItems(
      [group('Denied', [item('inside', () => true)], () => false)],
      req,
    )
    expect(result).toEqual([])
  })

  test('filters items inside an allowed group', async () => {
    const [entry] = await filterCustomItems(
      [group('Mixed', [item('yes', () => true), item('no', () => false)])],
      req,
    )
    expect((entry as CustomMenuGroup).items.map((i) => i.slug)).toEqual(['yes'])
  })

  test('drops a group left with no items', async () => {
    const result = await filterCustomItems([group('Empty', [item('no', () => false)])], req)
    expect(result).toEqual([])
  })

  test('strips access functions so the result can cross to the client', async () => {
    const result = await filterCustomItems(
      [item('stray', () => true), group('Kept', [item('inner', () => true)])],
      req,
    )
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
    expect(result.every((entry) => !('access' in entry))).toBe(true)
    expect((result[1] as CustomMenuGroup).items.every((i) => !('access' in i))).toBe(true)
  })
})
