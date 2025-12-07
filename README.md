# Payload CMDK

A powerful command menu plugin for [Payload CMS](https://payloadcms.com) that enhances navigation and accessibility within the admin panel. Quickly search and navigate through collections, globals, and custom actions using keyboard shortcuts.

![Demo of opening command menu, searching for a collection, and navigating](docs/usage.gif)

## Features

✨ **Quick Search** - Instantly search across all collections and globals
⌨️ **Keyboard Shortcuts** - Fully customizable keyboard shortcuts powered by [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/docs/intro)
🔍 **Collection Submenu** - Search within collection documents by their title field
🎨 **Custom Icons** - Use any [Lucide icon](https://lucide.dev/icons) for collections and globals
🎯 **Custom Items** - Add custom actions and menu groups
🌍 **i18n Support** - Built-in English and Ukrainian translations, easily add your own
🖥️ **Cross-platform** - Optimized shortcuts for both macOS and Windows/Linux


## Installation

```bash
npm install @veiag/payload-cmdk
# or
yarn add @veiag/payload-cmdk
# or
pnpm add @veiag/payload-cmdk
```

## Quick Start

The plugin works out of the box with minimal configuration:

```typescript
import { payloadCmdk } from '@veiag/payload-cmdk'
import { buildConfig } from 'payload'

export default buildConfig({
  // ... your config
  plugins: [
    payloadCmdk({
      // Plugin works without any options!
    }),
  ],
})
```

This will:
- Add a search button to the admin panel
- Enable `⌘K` (Mac) / `Ctrl+K` (Windows/Linux) keyboard shortcut
- List all collections and globals in the command menu
- Enable collection submenu search

## Configuration

### Full Configuration Example

```typescript
import { payloadCmdk } from '@veiag/payload-cmdk'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [
    payloadCmdk({
      // Keyboard shortcut to open the menu
      shortcut: ['meta+k', 'ctrl+k'], // Default

      // Search button configuration
      searchButton: {
        position: 'actions', // 'actions' | 'nav'
      },

      // Backdrop blur effect
      blurBg: true, // Default

      // Collection submenu configuration
      submenu: {
        enabled: true, // Default
        shortcut: 'shift+enter', // 'shift+enter' | 'enter'
        icons: {
          posts: 'FileText',
          users: 'User',
        },
      },

      // Custom icons for collections and globals
      icons: {
        collections: {
          posts: 'FileText',
          pages: 'File',
          media: 'Image',
          users: 'Users',
        },
        globals: {
          settings: 'Settings',
          navigation: 'Menu',
        },
      },

      // Collections/globals to ignore
      slugsToIgnore: ['payload-migrations', 'payload-preferences'],

      // Custom menu items
      customItems: [
        {
          type: 'group',
          title: 'Quick Actions',
          items: [
            {
              type: 'item',
              slug: 'view-site',
              label: 'View Site',
              icon: 'ExternalLink',
              action: {
                type: 'link',
                href: 'https://your-site.com',
              },
            },
            {
              type: 'item',
              slug: 'clear-cache',
              label: 'Clear Cache',
              icon: 'Trash2',
              action: {
                type: 'api',
                method: 'POST',
                href: '/api/cache/clear',
              },
            },
          ],
        },
      ],

      // Disable the plugin
      disabled: false, // Default
    }),
  ],
})
```

## Configuration Options

### `shortcut`

Keyboard shortcut to open the command menu. Powered by [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/docs/intro).

- **Type:** `string | string[]`
- **Default:** `['meta+k', 'ctrl+k']`

The default provides cross-platform support:
- `meta+k` - Works on macOS (⌘K)
- `ctrl+k` - Works on Windows/Linux (Ctrl+K)

**Examples:**

```typescript
// Single shortcut
shortcut: 'ctrl+shift+k'

// Multiple shortcuts for cross-platform support
shortcut: ['meta+k', 'ctrl+k']

// Custom combinations
shortcut: ['meta+/', 'ctrl+/']
```


### `searchButton`

Configuration for the search button displayed in the admin panel.

- **Type:** `{ position?: 'actions' | 'nav' } | false`
- **Default:** `{ position: 'actions' }`

**Options:**
- `position: 'actions'` - Display in the action buttons area (default)
- `position: 'nav'` - Display in the navigation sidebar
- `false` - Hide the search button completely (keyboard shortcut still works)

**Examples:**

```typescript
// Display in navigation
searchButton: {
  position: 'nav'
}

// Hide search button
searchButton: false
```
Actions button position:

![Actions button](/docs/position_actions.png)


Navigation button position:

![Navigation button](/docs/position_nav.png)


### `blurBg`

Enable backdrop blur effect when the command menu is open.

- **Type:** `boolean`
- **Default:** `true`

```typescript
blurBg: false // Disable blur effect
```

### `submenu`

Configure submenu behavior for searching within collection documents.

- **Type:** `object`
- **Default:** `{ enabled: true, shortcut: 'shift+enter' }`

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable submenu functionality |
| `shortcut` | `'shift+enter'` \| `'enter'` | `'shift+enter'` | Keyboard shortcut to open submenu |
| `icons` | `object` | `undefined` | Custom icons for collection submenus |

**Shortcut behavior:**
- `shift+enter`: Shift+Enter opens submenu, Enter navigates to collection list
- `enter`: Enter opens submenu, Shift+Enter navigates to collection list

![Searching within a collection submenu](docs/searching_in_collection.png)

**Example:**

```typescript
submenu: {
  enabled: true,
  shortcut: 'enter',
  icons: {
    posts: 'FileText',
    products: 'ShoppingCart',
  }
}
```

The submenu searches documents by their `useAsTitle` field (or `id` if not specified). You can configure this in your collection:

```typescript
{
  slug: 'posts',
  admin: {
    useAsTitle: 'title' // Submenu will search by this field
  }
}
```

### `icons`

Customize icons for collections and globals using [Lucide icon names](https://lucide.dev/icons).

- **Type:** `object`
- **Default:** `{ collections: {}, globals: {} }`

**Default icons:**
- Collections: `Files` icon
- Globals: `Globe` icon

**Example:**

```typescript
icons: {
  collections: {
    posts: 'FileText',
    pages: 'File',
    media: 'Image',
    users: 'Users',
    categories: 'Folder',
  },
  globals: {
    settings: 'Settings',
    navigation: 'Menu',
    footer: 'Layout',
  }
}
```

Browse all available icons at [lucide.dev/icons](https://lucide.dev/icons).

![Icons preview](/docs/icons.png)

### `customItems`

Add custom menu items and groups to the command menu.

- **Type:** `Array<CustomMenuItem | CustomMenuGroup>`
- **Default:** `[]`

#### Custom Menu Item

```typescript
{
  type: 'item',
  slug: 'unique-slug',
  label: 'Item Label', // Can be localized
  icon: 'LucideIconName', // Optional, from lucide.dev/icons
  action: {
    type: 'link' | 'api',
    href: '/path/or/url',
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE', // For API actions
    body?: { key: 'value' } // For API actions
  }
}
```

#### Custom Menu Group

```typescript
{
  type: 'group',
  title: 'Group Title', // Can be localized
  items: [
    // Array of CustomMenuItem
  ]
}
```

**Example with localization:**

```typescript
customItems: [
  {
    type: 'group',
    title: {
      en: 'Quick Actions',
      uk: 'Швидкі дії',
    },
    items: [
      {
        type: 'item',
        slug: 'view-site',
        label: {
          en: 'View Site',
          uk: 'Переглянути сайт',
        },
        icon: 'ExternalLink',
        action: {
          type: 'link',
          href: 'https://your-site.com',
        },
      },
      {
        type: 'item',
        slug: 'regenerate',
        label: 'Regenerate Cache',
        icon: 'RefreshCw',
        action: {
          type: 'api',
          method: 'POST',
          href: '/api/cache/regenerate',
        },
      },
    ],
  },
]
```

### `slugsToIgnore`

Specify which collection/global slugs to exclude from the command menu.

- **Type:** `CollectionSlug[] | { ignoreList: CollectionSlug[], replaceDefaults?: boolean }`
- **Default:** `['payload-migrations', 'payload-preferences', 'payload-locked-documents']`

**Examples:**

```typescript
// Add to default ignore list
slugsToIgnore: ['internal-collection', 'test-data']

// Replace default ignore list completely
slugsToIgnore: {
  ignoreList: ['my-hidden-collection'],
  replaceDefaults: true
}
```

### `disabled`

Completely disable the plugin.

- **Type:** `boolean`
- **Default:** `false`

```typescript
disabled: process.env.DISABLE_COMMAND_MENU === 'true'
```

## Custom Translations

The plugin includes built-in translations for:
- 🇬🇧 English (`en`)
- 🇺🇦 Ukrainian (`uk`)

You can add translations for other languages using Payload's i18n configuration:

```typescript
import { buildConfig } from 'payload'

export default buildConfig({
  i18n: {
    supportedLanguages: {
      //You can learn more about adding languages in the Payload docs
      en,
      uk,
      de,
      fr,
    },
    translations: {
      de: {
        cmdkPlugin: {
          loading: 'Lädt...',
          navigate: 'zum Navigieren',
          noResults: 'Keine Ergebnisse gefunden',
          open: 'zum Öffnen',
          search: 'Sammlungen, Globals durchsuchen...',
          searchIn: 'Suchen in {{label}}',
          searchInCollection: 'in Sammlung suchen',
          searchShort: 'Suchen',
        },
      },
      fr: {
        cmdkPlugin: {
          loading: 'Chargement...',
          navigate: 'pour naviguer',
          noResults: 'Aucun résultat trouvé',
          open: 'pour ouvrir',
          search: 'Rechercher collections, globals...',
          searchIn: 'Rechercher dans {{label}}',
          searchInCollection: 'pour rechercher dans la collection',
          searchShort: 'Rechercher',
        },
      },
    },
  },
  plugins: [
    payloadCmdk({
      // Your config
    }),
  ],
})
```

### Available Translation Keys

All translation keys are under the `cmdkPlugin` namespace:

| Key | Description | Example (EN) |
|-----|-------------|--------------|
| `search` | Main search placeholder | "Search collections, globals..." |
| `searchShort` | Short search label | "Search" |
| `searchIn` | Submenu search placeholder | "Search in {{label}}" |
| `loading` | Loading state | "Loading..." |
| `noResults` | No results state | "No results found" |
| `navigate` | Footer hint for navigation | "to navigate" |
| `searchInCollection` | Footer hint for collection search | "to search in collection" |
| `open` | Footer hint for opening documents | "to open" |


## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open/close command menu |
| `Esc` | Close menu or go back in submenu |
| `↑` `↓` | Navigate items |
| `Enter` | Select item or navigate to collection |
| `Shift+Enter` | Search within collection (default) |

### In Submenu

| Shortcut | Action |
|----------|--------|
| `Esc` | Go back to main menu |
| `Enter` | Open selected document |

## Examples

### Minimal Setup

```typescript
export default buildConfig({
  plugins: [payloadCmdk()],
})
```

### Custom Shortcuts Only

```typescript
export default buildConfig({
  plugins: [
    payloadCmdk({
      shortcut: ['meta+/', 'ctrl+/'],
      searchButton: false, // Hide button, only use keyboard
    }),
  ],
})
```

### With Custom Actions

```typescript
export default buildConfig({
  plugins: [
    payloadCmdk({
      customItems: [
        {
          type: 'item',
          slug: 'documentation',
          label: 'View Documentation',
          icon: 'BookOpen',
          action: {
            type: 'link',
            href: 'https://docs.your-site.com',
          },
        },
      ],
    }),
  ],
})
```

### Full Custom Theme

```typescript
export default buildConfig({
  plugins: [
    payloadCmdk({
      icons: {
        collections: {
          posts: 'Newspaper',
          pages: 'FileText',
          media: 'Image',
          categories: 'FolderTree',
          tags: 'Tag',
          users: 'UserCircle',
          comments: 'MessageCircle',
        },
        globals: {
          header: 'LayoutTemplate',
          footer: 'Layout',
          settings: 'Settings',
          navigation: 'Menu',
          seo: 'Search',
        },
      },
      submenu: {
        enabled: true,
        icons: {
          posts: 'FileText',
          pages: 'File',
          media: 'Image',
        },
      },
    }),
  ],
})
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/VeiaG/payload-cmdk/issues).

## License

MIT © [VeiaG](https://github.com/VeiaG)

## Links

- [GitHub Repository](https://github.com/VeiaG/payload-cmdk/tree/main)
- [Payload CMS](https://payloadcms.com)
- [Lucide Icons](https://lucide.dev/icons)
- [react-hotkeys-hook Documentation](https://react-hotkeys-hook.vercel.app/docs/intro)

# More plugins and payload resources at [PayloadCMS Extensions](https://payload.veiag.dev/)
