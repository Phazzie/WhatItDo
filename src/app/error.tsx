'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled WhatItDo UI error', error.digest ?? error.name)
  }, [error.digest, error.name])

  return (
    <main className="site-shell center-stage">
      <section className="paper-card state-card">
        <p className="card-label hot">Point of order</p>
        <h1>The chamber lost its footing.</h1>
        <p role="alert">
          Something unexpected interrupted the proceedings. Your browser still has anything you typed.
        </p>
        <button className="primary-button" type="button" onClick={reset}>
          Return to regular order
        </button>
        <Link className="text-button" href="/">← Back to the floor</Link>
      </section>
    </main>
  )
}
