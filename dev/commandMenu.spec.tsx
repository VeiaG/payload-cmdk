/* eslint-disable @eslint-react/hooks-extra/no-redundant-custom-hook -- mocked Payload/Next hooks */
/**
 * @vitest-environment happy-dom
 *
 * The real command menu, rendered with mocked Payload UI hooks.
 */
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { DocumentSearchResponse, PluginCommandMenuConfig } from '../src/types'
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const menuConfig = vi.hoisted(() => ({
  collections: [
    // Group "Content" comes first in the config and only half-matches "media".
    {
      slug: 'newsletters',
      admin: { group: 'Content' },
      fields: [],
      labels: { plural: 'Newsletter Media Kits' },
    },
    { slug: 'media', admin: { group: 'Assets' }, fields: [], labels: { plural: 'Media' } },
  ],
  globals: [],
  routes: { admin: '/admin' },
}))

/** Translations the mocked `t` knows; any other key comes back as is. */
const translations = vi.hoisted(() => ({}) as Record<string, string>)

/** The logged-in user; `null` on the login page. */
const auth = vi.hoisted(() => ({ user: { id: 'u1' } as { id: string } | null }))

/** The stored Payload preferences of the current user. */
const prefs = vi.hoisted(() => {
  const state = {
    // Stable like Payload's, which only changes with the language.
    get: (): Promise<unknown> =>
      state.reject
        ? Promise.reject(new Error('offline'))
        : // Like Payload: without a user the preference request is refused and reads as null.
          Promise.resolve(auth.user ? state.stored : null),
    reject: false,
    set: (() => Promise.resolve()) as (key: string, value: unknown) => Promise<void>,
    stored: undefined as unknown,
  }
  return state
})

vi.mock('@payloadcms/ui', () => ({
  Modal: ({ children }: { children?: React.ReactNode }) => <div data-modal>{children}</div>,
  useAuth: () => ({
    permissions: {
      collections: { media: { read: true }, newsletters: { read: true }, posts: { read: true } },
      globals: {},
    },
    user: auth.user,
  }),
  useConfig: () => ({ config: menuConfig }),
  useModal: () => ({
    closeModal: vi.fn(),
    isModalOpen: () => true,
    openModal: vi.fn(),
    toggleModal: vi.fn(),
  }),
  usePreferences: () => ({
    getPreference: prefs.get,
    setPreference: (key: string, value: unknown) => prefs.set(key, value),
  }),
  useRouteTransition: () => ({ startRouteTransition: (fn: () => void) => fn() }),
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => translations[key] ?? key }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ adminRoute, path }: { adminRoute: string; path: string }) =>
    `${adminRoute}${path}`,
}))

import { CommandMenuProvider, registerCommandMenuFilter } from '../src/exports/client'

/** What the stubbed document search endpoint answers for a non-empty `q`. */
let searchBody: DocumentSearchResponse = { groups: [], query: '' }
const fetchMock = vi.fn((url: string) => {
  const q = new URL(url, 'http://localhost').searchParams.get('q') ?? ''
  const body: DocumentSearchResponse = q ? searchBody : { groups: [], query: '' }
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
})
/** Calls to the document search endpoint with a non-empty query (the warm-up sends `q=`). */
const searchCalls = () =>
  fetchMock.mock.calls.filter(([url]) => new URL(url, 'http://localhost').searchParams.get('q'))
    .length

let container: HTMLDivElement
let root: null | Root = null

/**
 * Render the menu; `keepMounted` re-renders the mounted one (as a context change would),
 * otherwise it starts fresh.
 */
async function renderMenu(
  pluginConfig: PluginCommandMenuConfig = {},
  { keepMounted = false }: { keepMounted?: boolean } = {},
) {
  if (root && !keepMounted) {
    act(() => root?.unmount())
    root = null
  }
  root ??= createRoot(container)
  // A new object each time, so the memoized menu re-renders and re-reads the mocked hooks.
  pluginConfig = { ...pluginConfig }
  act(() => {
    root?.render(
      <CommandMenuProvider pluginConfig={pluginConfig}>
        <span />
      </CommandMenuProvider>,
    )
  })
  await flush()
}

/** Let pending timers, promises and effects settle. */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(async () => {
  searchBody = { groups: [], query: '' }
  fetchMock.mockReset()
  auth.user = { id: 'u1' }
  prefs.reject = false
  prefs.stored = undefined
  prefs.set = vi.fn(() => Promise.resolve())
  vi.stubGlobal('fetch', fetchMock)
  container = document.createElement('div')
  document.body.appendChild(container)
  await renderMenu()
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  container.remove()
  registerCommandMenuFilter(undefined)
  for (const key of Object.keys(translations)) {
    delete translations[key]
  }
  vi.unstubAllGlobals()
})

async function typeSearch(text: string) {
  const input = container.querySelector('input[cmdk-input]') as HTMLInputElement
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await flush()
}

/** The options in the order the menu shows them, without the submenu arrow. */
const shownOptions = () =>
  Array.from(
    container.querySelectorAll(
      '[cmdk-group]:not([hidden]) [cmdk-item], [cmdk-list-sizer] > [cmdk-item]',
    ),
  ).map((option) => (option.textContent ?? '').replace('›', '').trim())

const selectedOption = () =>
  (container.querySelector('[cmdk-item][aria-selected="true"]')?.textContent ?? '')
    .replace('›', '')
    .trim()

describe('menu ranking', () => {
  test('orders groups by their best match, not by config order', async () => {
    await typeSearch('media')
    expect(shownOptions()).toEqual(['Media', 'Newsletter Media Kits'])
    expect(selectedOption()).toBe('Media')
  })

  test('uses the registered filter for menu entries', async () => {
    registerCommandMenuFilter((value) => (value === 'newsletters' ? 1 : 0))
    await typeSearch('zzz')
    expect(shownOptions()).toEqual(['Newsletter Media Kits'])
  })

  test('ranks the default groups by their translated title, like the rendered items', async () => {
    // A collection without `admin.group` lands in the default "Collections" group.
    const extra = { slug: 'posts', fields: [], labels: { plural: 'Posts' } }
    menuConfig.collections.push(extra as (typeof menuConfig.collections)[number])
    translations['general:collections'] = 'Колекції'
    try {
      // Group title match beats the weak match of "newsletters" in the earlier group.
      registerCommandMenuFilter((value, search, keywords = []) =>
        keywords[0]?.toLowerCase().includes(search.toLowerCase())
          ? 1
          : value === 'newsletters'
            ? 0.5
            : 0,
      )
      await renderMenu()
      await typeSearch('колекції')
      expect(shownOptions()).toEqual(['Posts', 'Newsletter Media Kits'])
    } finally {
      menuConfig.collections.pop()
    }
  })
})

const doc = (id: string, label: string) => ({
  id: `posts:${id}`,
  href: `/admin/collections/posts/${id}`,
  label,
})

const results = (query: string, ...items: ReturnType<typeof doc>[]): DocumentSearchResponse => ({
  groups: [{ slug: 'posts', icon: 'FileText', items, title: 'Posts' }],
  query,
})

const documentSearch = { debounceMs: 0, endpoint: '/api/search', minLength: 2 }

// The plugin caches answers per query for the page's lifetime, so every test uses its own query.
describe('documentSearch', () => {
  test('shows results above the menu by default, keeping the highlighted entry when they land', async () => {
    await renderMenu({ documentSearch })
    searchBody = results('media', doc('1', 'Media Weber'))
    await typeSearch('media')
    await vi.waitFor(() => expect(shownOptions()).toContain('Media Weber'))
    expect(shownOptions()).toEqual(['Media Weber', 'Media', 'Newsletter Media Kits'])
    // Results arrive after the menu was filtered; Enter must not jump to them mid-keypress.
    expect(selectedOption()).toBe('Media')
  })

  test("lists menu entries first with position 'after' and pre-selects the menu entry", async () => {
    await renderMenu({ documentSearch: { ...documentSearch, position: 'after' } })
    searchBody = results('medi', doc('2', 'Medina Schulz'))
    await typeSearch('medi')
    await vi.waitFor(() => expect(shownOptions()).toContain('Medina Schulz'))
    expect(shownOptions()).toEqual(['Media', 'Newsletter Media Kits', 'Medina Schulz'])
    expect(selectedOption()).toBe('Media')
  })

  test("pre-selects the first result with position 'after' when no menu entry matches", async () => {
    await renderMenu({ documentSearch: { ...documentSearch, position: 'after' } })
    searchBody = results('mueller', doc('3', 'Max Müller'), doc('4', 'Eva Müller'))
    await typeSearch('mueller')
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Max Müller', 'Eva Müller']))
    await vi.waitFor(() => expect(selectedOption()).toBe('Max Müller'))
  })

  test('does not say "no results" while it shows results', async () => {
    await renderMenu({ documentSearch })
    searchBody = results('nguyen', doc('12', 'Linh Nguyen'))
    await typeSearch('nguyen')
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Linh Nguyen']))
    expect(container.querySelector('[cmdk-empty]')).toBeNull()
  })

  test('links to all results when the endpoint sends moreHref', async () => {
    await renderMenu({ documentSearch })
    searchBody = { ...results('kowalski', doc('5', 'Jan Kowalski')), moreHref: '/admin/search' }
    await typeSearch('kowalski')
    await vi.waitFor(() =>
      expect(shownOptions()).toEqual(['Jan Kowalski', 'cmdkPlugin:showAllResults']),
    )
  })

  test('keeps the list height of the plain menu unless documentSearch is configured', async () => {
    expect(container.querySelector('.command__list--documents')).toBeNull()
    await renderMenu({ documentSearch })
    expect(container.querySelector('.command__list--documents')).not.toBeNull()
  })

  test("keeps ungrouped custom items above the results with position 'after'", async () => {
    await renderMenu({
      customItems: [
        {
          slug: 'view-site',
          type: 'item',
          action: { type: 'link', href: 'https://example.com' },
          label: 'View Site',
        },
      ],
      documentSearch: { ...documentSearch, position: 'after' },
    })
    searchBody = results('view', doc('13', 'Viewpoint Post'))
    await typeSearch('view')
    await vi.waitFor(() => expect(shownOptions()).toContain('Viewpoint Post'))
    expect(shownOptions()).toEqual(['View Site', 'Viewpoint Post'])
    expect(selectedOption()).toBe('View Site')
  })

  test('survives an endpoint that answers something else than DocumentSearchResponse', async () => {
    await renderMenu({ documentSearch })
    searchBody = { error: 'boom' } as unknown as DocumentSearchResponse
    await typeSearch('broken')
    await flush()
    // The next keystroke narrows what "broken" cached; that must not throw either.
    await typeSearch('brokenx')
    await flush()
    expect(shownOptions()).toEqual([])
    expect(container.querySelector('input[cmdk-input]')).not.toBeNull()
  })

  test('does not show results cached for another user', async () => {
    await renderMenu({ documentSearch })
    searchBody = results('quinn', doc('14', 'Quinn Private'))
    await typeSearch('quinn')
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Quinn Private']))

    // Log out and in as someone else in the same tab: the module-level cache outlives it.
    auth.user = { id: 'u2' }
    searchBody = results('quinn')
    await renderMenu({ documentSearch })
    await typeSearch('quinn')
    await flush()
    expect(shownOptions()).toEqual([])
  })

  test('does not search below minLength', async () => {
    await renderMenu({ documentSearch })
    await typeSearch('k')
    await flush()
    expect(searchCalls()).toBe(0)
  })

  test('never shows the late answer of a query the user has already typed past', async () => {
    const pending = new Map<string, (body: DocumentSearchResponse) => void>()
    fetchMock.mockImplementation((url: string) => {
      const q = new URL(url, 'http://localhost').searchParams.get('q')
      if (!q) {
        return Promise.resolve(new Response(JSON.stringify({ groups: [], query: '' })))
      }
      // Ignores the abort signal on purpose: the menu must not rely on fetch rejecting.
      return new Promise<Response>((resolve) => {
        pending.set(q, (body) => resolve(new Response(JSON.stringify(body))))
      })
    })
    await renderMenu({ documentSearch })
    await typeSearch('lange')
    await vi.waitFor(() => expect(pending.has('lange')).toBe(true))
    await typeSearch('langer')
    await vi.waitFor(() => expect(pending.has('langer')).toBe(true))

    pending.get('lange')!(results('lange', doc('10', 'Lange Stale')))
    await flush()
    expect(shownOptions()).not.toContain('Lange Stale')

    pending.get('langer')!(results('langer', doc('11', 'Langer Fresh')))
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Langer Fresh']))
  })

  test('opens the selected result in a new tab on Ctrl+Enter', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    await renderMenu({ documentSearch })
    searchBody = results('zofia', doc('6', 'Zofia Nowak'))
    await typeSearch('zofia')
    await vi.waitFor(() => expect(selectedOption()).toBe('Zofia Nowak'))
    act(() => {
      container
        .querySelector('input[cmdk-input]')!
        .dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ctrlKey: true, key: 'Enter' }))
    })
    expect(open).toHaveBeenCalledWith('/admin/collections/posts/6', '_blank', 'noopener')
    open.mockRestore()
  })
})

describe('documentSearch.toggle', () => {
  const withToggle = { documentSearch: { ...documentSearch, toggle: true } }
  const checkbox = () => container.querySelector<HTMLInputElement>('.command__toggle input')
  const click = (element: HTMLElement) => act(() => element.click())

  test('is ticked by default and hides results when unticked, saving the choice', async () => {
    await renderMenu(withToggle)
    expect(checkbox()?.checked).toBe(true)
    expect(container.querySelector('.command__toggle')?.textContent).toContain(
      'cmdkPlugin:showDocuments',
    )
    searchBody = results('schmidt', doc('7', 'Ina Schmidt'))
    await typeSearch('schmidt')
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Ina Schmidt']))

    click(checkbox()!)
    expect(shownOptions()).toEqual([])
    expect(checkbox()?.checked).toBe(false)
    // An object, not a bare boolean: Payload's preference endpoint stores `data.value || data`,
    // so a bare `false` would be saved as `{ value: false }`.
    expect(prefs.set).toHaveBeenCalledWith('payload-cmdk-document-search', { enabled: false })
  })

  test('fetches nothing while unticked from the saved preference', async () => {
    prefs.stored = { enabled: false }
    await renderMenu(withToggle)
    expect(checkbox()?.checked).toBe(false)
    await typeSearch('schulz')
    await flush()
    expect(searchCalls()).toBe(0)
  })

  test('drops a late answer that arrives after unticking', async () => {
    let release = () => {}
    fetchMock.mockImplementation((url: string) => {
      const q = new URL(url, 'http://localhost').searchParams.get('q')
      if (!q) {
        return Promise.resolve(new Response(JSON.stringify({ groups: [], query: '' })))
      }
      // Ignores the abort signal on purpose: the menu must not rely on fetch rejecting.
      return new Promise<Response>((resolve) => {
        release = () => resolve(new Response(JSON.stringify(searchBody)))
      })
    })
    await renderMenu(withToggle)
    searchBody = results('weber', doc('8', 'Kai Weber'))
    await typeSearch('weber')
    await vi.waitFor(() => expect(searchCalls()).toBe(1))

    click(checkbox()!)
    release()
    await flush()
    expect(shownOptions()).toEqual([])
  })

  test('keeps focus in the search input when the checkbox is clicked', async () => {
    await renderMenu(withToggle)
    const input = container.querySelector<HTMLInputElement>('input[cmdk-input]')!
    input.focus()
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    container.querySelector('.command__toggle')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)

    // A real click still focuses the checkbox; typing must go on in the search input.
    checkbox()!.focus()
    click(checkbox()!)
    expect(document.activeElement).toBe(input)
  })

  test('reads the saved choice once a user has logged in', async () => {
    auth.user = null
    prefs.stored = { enabled: false }
    await renderMenu(withToggle)
    expect(checkbox()?.checked).toBe(true)

    auth.user = { id: 'u1' }
    await renderMenu(withToggle, { keepMounted: true })
    await vi.waitFor(() => expect(checkbox()?.checked).toBe(false))
  })

  test('ignores a stored preference of another shape', async () => {
    prefs.stored = { value: false }
    await renderMenu(withToggle)
    expect(checkbox()?.checked).toBe(true)
  })

  test('still shows results when loading the preference fails', async () => {
    prefs.reject = true
    await renderMenu(withToggle)
    expect(checkbox()?.checked).toBe(true)
    searchBody = results('koch', doc('9', 'Udo Koch'))
    await typeSearch('koch')
    await vi.waitFor(() => expect(shownOptions()).toEqual(['Udo Koch']))
  })

  test('has no checkbox without toggle', async () => {
    await renderMenu({ documentSearch })
    expect(container.querySelector('.command__toggle')).toBeNull()
  })
})
