'use client'

import { registerCommandMenuAction, unregisterCommandMenuAction } from '@veiag/payload-cmdk/client'
import React, { useEffect } from 'react'

/**
 * Dev-only component that registers function-based command menu handlers.
 * Mounted as a provider so it's always active in the admin UI.
 */
export default function CommandMenuHandlers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Available on document edit/create pages — clicks the Payload save button
    registerCommandMenuAction('save-current-doc', () => {
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]')
      if (btn) {
        btn.click()
      } else {
        // eslint-disable-next-line no-console
        console.warn('[cmdk] No submit button found on this page')
      }
    })

    // Available on any page — copies current URL to clipboard
    registerCommandMenuAction('copy-doc-link', () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          // eslint-disable-next-line no-console
          console.info('[cmdk] URL copied:', window.location.href)
        })
        .catch(console.error)
    })

    // Posts list page only — dev demo (alerts instead of real import)
    registerCommandMenuAction('import-posts', async () => {
      // In a real app this would be: await fetch('/api/posts/import', { method: 'POST' })
      window.alert('Import Posts triggered!\n(dev demo — no real import happens)')
    })

    // Available everywhere — triggers browser print dialog
    registerCommandMenuAction('print-page', () => {
      window.print()
    })

    return () => {
      unregisterCommandMenuAction('save-current-doc')
      unregisterCommandMenuAction('copy-doc-link')
      unregisterCommandMenuAction('import-posts')
      unregisterCommandMenuAction('print-page')
    }
  }, [])

  return <>{children}</>
}
