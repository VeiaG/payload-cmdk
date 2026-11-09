/* eslint-disable @eslint-react/hooks-extra/no-redundant-custom-hook -- mocked Payload/Next hooks */
/**
 * @vitest-environment happy-dom
 *
 * The real command menu, rendered with mocked Payload UI hooks.
 */
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { PluginCommandMenuConfig } from '../src/types'
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
  container = document.createElement('div')
  document.body.appendChild(container)
  await renderMenu()
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  container.remove()
  registerCommandMenuFilter(undefined)
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
