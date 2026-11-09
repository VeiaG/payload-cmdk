import type { Endpoint } from 'payload'

import type { DocumentSearchResponse, DocumentSearchResultGroup } from '../src/types'

const SEARCHABLE = [
  { slug: 'posts', icon: 'Newspaper', title: 'Posts' },
  { slug: 'pages', icon: 'FileText', title: 'Pages' },
] as const

/**
 * Demo endpoint for `documentSearch`: posts and pages whose title contains the query,
 * read with the user's own access.
 */
export const documentSearchEndpoint: Endpoint = {
  handler: async (req) => {
    const query = typeof req.query?.q === 'string' ? req.query.q.trim() : ''
    // An empty `q` is the warm-up call made when the menu opens.
    if (!req.user || query.length < 2) {
      return Response.json({ groups: [], query } satisfies DocumentSearchResponse)
    }
    const groups: DocumentSearchResultGroup[] = await Promise.all(
      SEARCHABLE.map(async ({ slug, icon, title }) => {
        const { docs } = await req.payload.find({
          collection: slug,
          depth: 0,
          limit: 5,
          overrideAccess: false,
          req,
          where: { title: { like: query } },
        })
        return {
          slug,
          icon,
          items: docs.map((doc) => ({
            id: `${slug}:${doc.id}`,
            badge: 'status' in doc && doc.status === 'draft' ? 'Draft' : undefined,
            description: `/${doc.slug}`,
            href: `/admin/collections/${slug}/${doc.id}`,
            label: doc.title,
          })),
          title,
        }
      }),
    )
    return Response.json({
      groups: groups.filter((group) => group.items.length > 0),
      query,
    } satisfies DocumentSearchResponse)
  },
  method: 'get',
  path: '/cmdk-search',
}
