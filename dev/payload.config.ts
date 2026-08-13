import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { payloadCmdk } from '@veiag/payload-cmdk'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      components: {
        providers: ['./app/(payload)/admin/components/CommandMenuHandlers#default'],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'title',
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            label: {
              en: 'Title',
              uk: 'Заголовок',
            },
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            label: 'Slug',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
              {
                label: 'Draft',
                value: 'draft',
              },
              {
                label: 'Published',
                value: 'published',
              },
            ],
          },
          {
            name: 'category',
            type: 'relationship',
            relationTo: 'categories',
          },
        ],
        labels: {
          plural: {
            en: 'Posts',
            uk: 'Публікації',
          },
          singular: {
            en: 'Post',
            uk: 'Публікація',
          },
        },
      },
      {
        slug: 'pages',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'title',
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            required: true,
          },
        ],
        labels: {
          plural: {
            en: 'Pages',
            uk: 'Сторінки',
          },
          singular: {
            en: 'Page',
            uk: 'Сторінка',
          },
        },
      },
      {
        slug: 'categories',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            required: true,
          },
        ],
        labels: {
          plural: {
            en: 'Categories',
            uk: 'Категорії',
          },
          singular: {
            en: 'Category',
            uk: 'Категорія',
          },
        },
      },
      {
        slug: 'products',
        admin: {
          group: 'E-commerce',
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'price',
            type: 'number',
            required: true,
          },
          {
            name: 'sku',
            type: 'text',
            required: true,
          },
        ],
      },
      {
        slug: 'users',
        admin: {
          useAsTitle: 'email',
        },
        auth: true,
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: 'media',
        admin: {
          group: 'Media',
        },
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
      // Two collections the admin is not supposed to offer, for checking that the command
      // menu leaves them out the way Payload's own nav does.
      {
        slug: 'secrets',
        // Read is denied outright, so the nav drops it and every route 403s.
        access: {
          read: () => false,
        },
        admin: {
          group: 'Restricted',
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
        labels: {
          plural: {
            en: 'Secrets',
            uk: 'Секрети',
          },
          singular: {
            en: 'Secret',
            uk: 'Секрет',
          },
        },
      },
      {
        slug: 'internal-notes',
        // Readable through the API, kept out of the admin. A different rule from access,
        // and one a menu built from the config alone will miss.
        admin: {
          group: 'Restricted',
          hidden: true,
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
        labels: {
          plural: {
            en: 'Internal notes',
            uk: 'Внутрішні нотатки',
          },
          singular: {
            en: 'Internal note',
            uk: 'Внутрішня нотатка',
          },
        },
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URI || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    globals: [
      {
        slug: 'site-settings',
        fields: [],
      },
      {
        slug: 'footer-settings',
        admin: {
          group: 'Settings',
        },
        fields: [],
      },
    ],
    i18n: {
      fallbackLanguage: 'en',
      supportedLanguages: {
        en,
        uk,
      },
    },
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      payloadCmdk({
        customItems: [
          // ── Existing items ────────────────────────────────────────────────
          {
            slug: 'view-site',
            type: 'item',
            action: {
              type: 'link',
              href: 'https://payload.veiag.dev',
            },
            icon: 'ExternalLink',
            label: {
              en: 'View Site',
              uk: 'Переглянути сайт',
            },
          },
          {
            type: 'group',
            items: [
              {
                slug: 'clear-cache',
                type: 'item',
                action: {
                  type: 'api',
                  href: '/api/cache/clear',
                },
                icon: 'Trash2',
                label: {
                  en: 'Clear Cache',
                  uk: 'Очистити кеш',
                },
              },
              {
                slug: 'docs',
                type: 'item',
                action: {
                  type: 'link',
                  href: 'https://payloadcms.com/docs',
                },
                icon: 'BookOpen',
                label: {
                  en: 'Documentation',
                  uk: 'Документація',
                },
              },
            ],
            title: {
              en: 'Quick Actions',
              uk: 'Швидкі дії',
            },
          },

          // ── NEW: collectionContext — document pages only (all collections) ─
          {
            type: 'group',
            collectionContext: ['document'],
            items: [
              {
                slug: 'save-document',
                type: 'item',
                action: { type: 'function', key: 'save-current-doc' },
                collectionContext: ['document'],
                icon: 'Save',
                label: {
                  en: 'Save Document',
                  uk: 'Зберегти документ',
                },
              },
              {
                slug: 'copy-doc-link',
                type: 'item',
                action: { type: 'function', key: 'copy-doc-link' },
                collectionContext: ['document'],
                icon: 'Link',
                label: {
                  en: 'Copy Document Link',
                  uk: 'Скопіювати посилання',
                },
              },
              {
                slug: 'print-page',
                type: 'item',
                action: { type: 'function', key: 'print-page' },
                collectionContext: ['document'],
                icon: 'Printer',
                label: {
                  en: 'Print Page',
                  uk: 'Друк сторінки',
                },
              },
            ],
            title: {
              en: 'Document Actions (doc only)',
              uk: 'Дії з документом (тільки документ)',
            },
          },

          // ── NEW: collectionContext list + collectionSlugs — posts list only ─
          {
            slug: 'import-posts',
            type: 'item',
            action: { type: 'function', key: 'import-posts' },
            collectionContext: ['list'],
            collectionSlugs: ['posts'],
            icon: 'Upload',
            label: {
              en: 'Import Posts (list only)',
              uk: 'Імпорт постів (тільки список)',
            },
          },

          // ── NEW: collectionContext list only — all collections ─────────────
          {
            slug: 'create-new-link',
            type: 'item',
            action: { type: 'link', href: '#' },
            collectionContext: ['list'],
            icon: 'CirclePlus',
            label: {
              en: 'List-only link item',
              uk: 'Тільки у списку (посилання)',
            },
          },

          // ── NEW: collectionSlugs without collectionContext — posts & pages ──
          {
            slug: 'posts-and-pages-only',
            type: 'item',
            action: {
              type: 'link',
              href: 'https://payloadcms.com/docs',
            },
            collectionSlugs: ['posts', 'pages'],
            icon: 'FileSearch',
            label: {
              en: 'Visible on Posts & Pages only',
              uk: 'Тільки для Posts & Pages',
            },
          },

          // ── NEW: function action with unregistered key (should warn in console) ─
          {
            slug: 'unregistered-fn',
            type: 'item',
            action: { type: 'function', key: 'this-key-is-not-registered' },
            icon: 'TriangleAlert',
            label: {
              en: 'Unregistered function (console warn)',
              uk: 'Незареєстрована функція (попередження)',
            },
          },

          // ── NEW: access — evaluated on the server, denied items never ship ──
          {
            slug: 'access-granted',
            type: 'item',
            // Granted to anyone logged in, so this one is visible.
            access: ({ req }) => Boolean(req.user),
            action: { type: 'link', href: 'https://payloadcms.com/docs' },
            icon: 'LockOpen',
            label: {
              en: 'Access: granted (visible)',
              uk: 'Доступ: надано (видно)',
            },
          },
          {
            slug: 'access-denied',
            type: 'item',
            // Denied outright: never present in the menu, and never sent to the browser.
            access: () => false,
            action: { type: 'link', href: 'https://payloadcms.com/docs' },
            icon: 'Lock',
            label: {
              en: 'Access: denied (never visible)',
              uk: 'Доступ: заборонено (ніколи не видно)',
            },
          },
          {
            slug: 'access-throws',
            type: 'item',
            // Throwing denies: an error must not turn into a visible item.
            access: () => {
              throw new Error('boom')
            },
            action: { type: 'link', href: 'https://payloadcms.com/docs' },
            icon: 'TriangleAlert',
            label: {
              en: 'Access: throws (never visible)',
              uk: 'Доступ: помилка (ніколи не видно)',
            },
          },
          {
            slug: 'access-async',
            type: 'item',
            // Async is fine: the check may hit the Local API through `req`.
            access: async ({ req }) => {
              const { totalDocs } = await req.payload.count({ collection: 'users' })
              return totalDocs > 0
            },
            action: { type: 'link', href: 'https://payloadcms.com/docs' },
            icon: 'DatabaseZap',
            label: {
              en: 'Access: async DB check (visible)',
              uk: 'Доступ: асинхронна перевірка (видно)',
            },
          },
          {
            type: 'group',
            // A denied group takes its items with it, whatever their own access says.
            access: () => false,
            items: [
              {
                slug: 'hidden-group-item',
                type: 'item',
                access: () => true,
                action: { type: 'link', href: 'https://payloadcms.com/docs' },
                icon: 'EyeOff',
                label: {
                  en: 'Inside a denied group',
                  uk: 'Усередині забороненої групи',
                },
              },
            ],
            title: {
              en: 'Access: denied group (never visible)',
              uk: 'Доступ: заборонена група (ніколи не видно)',
            },
          },
          {
            type: 'group',
            items: [
              {
                slug: 'mixed-visible',
                type: 'item',
                access: ({ req }) => Boolean(req.user),
                action: { type: 'link', href: 'https://payloadcms.com/docs' },
                icon: 'Eye',
                label: {
                  en: 'Group item: visible',
                  uk: 'Пункт групи: видно',
                },
              },
              {
                slug: 'mixed-hidden',
                type: 'item',
                access: () => false,
                action: { type: 'link', href: 'https://payloadcms.com/docs' },
                icon: 'EyeOff',
                label: {
                  en: 'Group item: hidden',
                  uk: 'Пункт групи: приховано',
                },
              },
            ],
            title: {
              en: 'Access: mixed group',
              uk: 'Доступ: змішана група',
            },
          },
        ],
        icons: {
          collections: {
            categories: 'Folder',
            media: 'Image',
            pages: 'FileText',
            posts: 'Newspaper',
            products: 'ShoppingCart',
            users: 'Users',
          },
          globals: {
            'footer-settings': 'ArrowDown',
            'site-settings': 'Settings',
          },
        },
        submenu: {
          icons: {
            pages: 'File',
            posts: 'FileText',
            products: 'Package',
          },
        },
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
