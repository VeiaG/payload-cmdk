import type { Payload } from 'payload'

import { devUser } from './helpers/credentials'

export const seed = async (payload: Payload) => {
  // Check if data already exists
  const { totalDocs: existingUsers } = await payload.count({
    collection: 'users',
  })

  if (existingUsers > 0) {
    payload.logger.info('Database already seeded, skipping...')
    return
  }

  payload.logger.info('Seeding database...')

  // Create admin user
  await payload.create({
    collection: 'users',
    data: devUser,
  })

  // Seed Categories
  const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Design', slug: 'design' },
    { name: 'Business', slug: 'business' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Travel', slug: 'travel' },
    { name: 'Food', slug: 'food' },
  ]

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      payload.create({
        collection: 'categories',
        data: cat,
      }),
    ),
  )

  payload.logger.info(`Created ${createdCategories.length} categories`)

  // Seed Posts
  const posts = [
    {
      slug: 'introduction-to-react',
      category: createdCategories[0].id,
      status: 'published',
      title: 'Introduction to React',
    },
    {
      slug: 'typescript-best-practices',
      category: createdCategories[0].id,
      status: 'published',
      title: 'TypeScript Best Practices',
    },
    {
      slug: 'building-scalable-apis',
      category: createdCategories[0].id,
      status: 'published',
      title: 'Building Scalable APIs',
    },
    {
      slug: 'ui-ux-principles',
      category: createdCategories[1].id,
      status: 'published',
      title: 'Modern UI/UX Design Principles',
    },
    {
      slug: 'color-theory-guide',
      category: createdCategories[1].id,
      status: 'published',
      title: 'Complete Guide to Color Theory',
    },
    {
      slug: 'responsive-design-2024',
      category: createdCategories[1].id,
      status: 'draft',
      title: 'Responsive Design in 2024',
    },
    {
      slug: 'startup-funding-guide',
      category: createdCategories[2].id,
      status: 'published',
      title: 'Ultimate Startup Funding Guide',
    },
    {
      slug: 'remote-team-management',
      category: createdCategories[2].id,
      status: 'published',
      title: 'Managing Remote Teams Effectively',
    },
    {
      slug: 'marketing-strategies',
      category: createdCategories[2].id,
      status: 'draft',
      title: 'Digital Marketing Strategies',
    },
    {
      slug: 'minimalist-living',
      category: createdCategories[3].id,
      status: 'published',
      title: 'The Art of Minimalist Living',
    },
    {
      slug: 'productivity-hacks',
      category: createdCategories[3].id,
      status: 'published',
      title: '10 Productivity Hacks for Developers',
    },
    {
      slug: 'travel-europe-guide',
      category: createdCategories[4].id,
      status: 'published',
      title: 'Traveling Through Europe: A Complete Guide',
    },
    {
      slug: 'budget-travel-tips',
      category: createdCategories[4].id,
      status: 'published',
      title: 'Budget Travel Tips and Tricks',
    },
    {
      slug: 'digital-nomad-life',
      category: createdCategories[4].id,
      status: 'draft',
      title: 'Life as a Digital Nomad',
    },
    {
      slug: 'italian-cooking',
      category: createdCategories[5].id,
      status: 'published',
      title: 'Authentic Italian Cooking Techniques',
    },
    {
      slug: 'healthy-meal-prep',
      category: createdCategories[5].id,
      status: 'published',
      title: 'Healthy Meal Prep for Busy Professionals',
    },
    {
      slug: 'coffee-brewing-methods',
      category: createdCategories[5].id,
      status: 'draft',
      title: 'Coffee Brewing Methods Explained',
    },
  ]

  const createdPosts = await Promise.all(
    posts.map((post) =>
      payload.create({
        collection: 'posts',
        data: post,
      }),
    ),
  )

  payload.logger.info(`Created ${createdPosts.length} posts`)

  // Seed Pages
  const pages = [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About Us' },
    { slug: 'services', title: 'Our Services' },
    { slug: 'contact', title: 'Contact' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-of-service', title: 'Terms of Service' },
    { slug: 'blog', title: 'Blog' },
  ]

  const createdPages = await Promise.all(
    pages.map((page) =>
      payload.create({
        collection: 'pages',
        data: page,
      }),
    ),
  )

  payload.logger.info(`Created ${createdPages.length} pages`)

  // Seed Products
  const products = [
    { name: 'Wireless Headphones', price: 199.99, sku: 'WH-001' },
    { name: 'Mechanical Keyboard', price: 149.99, sku: 'KB-002' },
    { name: 'USB-C Hub', price: 49.99, sku: 'HUB-003' },
    { name: 'Laptop Stand', price: 79.99, sku: 'LS-004' },
    { name: 'Webcam HD', price: 89.99, sku: 'WC-005' },
    { name: 'Monitor 27"', price: 399.99, sku: 'MON-006' },
    { name: 'Ergonomic Mouse', price: 69.99, sku: 'MS-007' },
    { name: 'Desk Lamp LED', price: 39.99, sku: 'DL-008' },
    { name: 'Cable Organizer', price: 19.99, sku: 'CO-009' },
    { name: 'Portable SSD 1TB', price: 129.99, sku: 'SSD-010' },
    { name: 'Bluetooth Speaker', price: 59.99, sku: 'SPK-011' },
    { name: 'Phone Stand', price: 24.99, sku: 'PS-012' },
    { name: 'Laptop Bag', price: 79.99, sku: 'LB-013' },
    { name: 'Microphone USB', price: 99.99, sku: 'MIC-014' },
    { name: 'Monitor Arm', price: 119.99, sku: 'MA-015' },
  ]

  const createdProducts = await Promise.all(
    products.map((product) =>
      payload.create({
        collection: 'products',
        data: product,
      }),
    ),
  )

  payload.logger.info(`Created ${createdProducts.length} products`)

  // Seed Globals
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      // Add any default data for site-settings if needed
    },
  })

  await payload.updateGlobal({
    slug: 'footer-settings',
    data: {
      // Add any default data for footer-settings if needed
    },
  })

  payload.logger.info('Globals updated')

  payload.logger.info('✅ Database seeded successfully!')
}
