import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { pluginCommandMenu } from 'plugin-command-menu'
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
        slug: 'media',
        admin: {
          group: 'Media',
        },
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },

      {
        slug: 'media2',
        admin: {
          group: 'Media',
        },
        fields: [],
        labels: {
          plural: 'Media 2',
          singular: 'Media 2',
        },
      },
      //Some extra collections to test command menu grouping
      {
        slug: 'test-collection',
        admin: {
          group: {
            en: 'Content',
            uk: 'Не контент', //Testing different group name resolution
          },
        },
        fields: [],
      },
      {
        slug: 'another-collection',
        admin: {
          group: 'Tests',
        },
        fields: [],
      },
      {
        slug: 'ungrouped-collection',
        fields: [],
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
      pluginCommandMenu({
        customItems: [
          {
            slug: 'custom-item-1',
            type: 'item',
            action: {
              type: 'api',
              href: '/api/test-endpoint',
            },
            icon: 'angry',
            label: {
              en: 'Custom Item 1',
              uk: 'Користувацький пункт 1',
            },
          },
          {
            type: 'group',
            items: [
              {
                slug: 'custom-item-2',
                type: 'item',
                action: {
                  type: 'api',
                  href: '/api/another-endpoint',
                },
                icon: 'archive',
                label: {
                  en: 'Custom Item 2',
                  uk: 'Користувацький пункт 2',
                },
              },
            ],
            title: {
              en: 'Content',
              uk: 'Контент',
            },
          },
        ],
        icons: {
          collections: {
            posts: 'file-text',
          },
        },
        submenu: {
          // enabled: false,
          // shortcut: 'enter',
          icons: {
            posts: 'book-open',
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
