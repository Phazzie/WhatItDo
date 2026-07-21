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
      <section className="paper-card state-card tape-top">
        <p className="card-label hot">PLOT TWIST</p>
        <h1>The plan went sideways.</h1>
        <p role="alert">
          Something unexpected interrupted the ritual. Your browser still has anything you typed.
        </p>
        <button className="primary-button cyan" type="button" onClick={reset}>
          Try that again
        </button>
        <Link className="text-button" href="/">← Return to headquarters</Link>
      </section>
    </main>
  )
}
