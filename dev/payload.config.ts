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
