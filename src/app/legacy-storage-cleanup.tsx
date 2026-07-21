'use client'

import { useEffect } from 'react'

const LEGACY_PRIVATE_RESULTS_KEY = 'whatitdo:private-results:v1'

export default function LegacyStorageCleanup() {
  useEffect(() => {
    try {
      // Earlier versions persisted raw owner credentials inside resultsUrl.
      // Purge the record on the next visit to any application route.
      localStorage.removeItem(LEGACY_PRIVATE_RESULTS_KEY)
    } catch {
      // Storage may be unavailable in private or hardened browsing modes.
    }
  }, [])

  return null
}
