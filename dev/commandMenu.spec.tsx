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

vi.mock('@payloadcms/ui', () => ({
  Modal: ({ children }: { children?: React.ReactNode }) => <div data-modal>{children}</div>,
  useAuth: () => ({
    permissions: {
      collections: { media: { read: true }, newsletters: { read: true } },
      globals: {},
    },
  }),
  useConfig: () => ({ config: menuConfig }),
  useModal: () => ({
    closeModal: vi.fn(),
    isModalOpen: () => true,
    openModal: vi.fn(),
    toggleModal: vi.fn(),
  }),
  useRouteTransition: () => ({ startRouteTransition: (fn: () => void) => fn() }),
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
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

async function renderMenu(pluginConfig: PluginCommandMenuConfig = {}) {
  if (root) {
    act(() => root?.unmount())
  }
  root = createRoot(container)
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
  fetchMock.mockClear()
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

  test('links to all results when the endpoint sends moreHref', async () => {
    await renderMenu({ documentSearch })
    searchBody = { ...results('kowalski', doc('5', 'Jan Kowalski')), moreHref: '/admin/search' }
    await typeSearch('kowalski')
    await vi.waitFor(() =>
      expect(shownOptions()).toEqual(['Jan Kowalski', 'cmdkPlugin:showAllResults']),
    )
  })

  test('does not search below minLength', async () => {
    await renderMenu({ documentSearch })
    await typeSearch('k')
    await flush()
    expect(searchCalls()).toBe(0)
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
