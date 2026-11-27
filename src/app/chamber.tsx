'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// The whole app is staged as a televised floor vote in "The House of What It Do".
// These pieces are shared set dressing; none of them carry poll data beyond the
// public title, so they are safe on public and private pages alike.

/** A stable, purely cosmetic bill number derived from the public poll id. */
export function billNumber(pollId: string): string {
  let hash = 2166136261
  for (const character of pollId) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `H.R. ${((hash >>> 0) % 8900) + 100}`
}

export function useCalendarDate(): string {
  const [date, setDate] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])
  return date
}

export function Seal({ size = 64 }: { size?: number }) {
  return (
    <svg className="seal" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <path id="seal-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="var(--gold)" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="var(--navy)" strokeWidth="2" />
      <circle cx="60" cy="60" r="35" fill="var(--navy)" />
      <text fill="var(--navy)" fontSize="10.5" fontWeight="700" letterSpacing="1.5" fontFamily="Oswald, sans-serif">
        <textPath href="#seal-ring" startOffset="2%">E PLURIBUS WHATEVER · HOUSE OF WHAT IT DO ·</textPath>
      </text>
      <text x="60" y="76" textAnchor="middle" fill="var(--gold)" fontSize="46" fontFamily="'Libre Caslon Text', serif" fontWeight="700">?</text>
      {[0, 1, 2, 3, 4].map((star) => (
        <circle key={star} cx={38 + star * 11} cy="40" r="1.8" fill="var(--gold)" />
      ))}
    </svg>
  )
}

const CRAWL = [
  'MEMBER FROM THE GROUP CHAT LEFT ON READ FOR THIRD CONSECUTIVE SESSION',
  'SPEAKER CALLS FOR ORDER AFTER "IDK WHATEVER Y\'ALL WANT" ENTERED INTO THE RECORD',
  'NO LOGINS · NO LOBBYISTS · NO ONE SEES THE TALLY BUT THE SPONSOR',
  'MOTION TO "JUST SEE HOW WE FEEL" RULED OUT OF ORDER',
  'BILLS DIE IN COMMITTEE AFTER 30 QUIET DAYS',
]

export function Chyron({ live, headline }: { live: string; headline: string }) {
  return (
    <div className="chyron">
      <div className="chyron-top">
        <span className="chyron-live">{live}</span>
        <span className="chyron-headline">{headline}</span>
        <span className="chyron-net" aria-hidden="true">CHAT-SPAN</span>
      </div>
      <div className="chyron-crawl" aria-hidden="true">
        <div className="chyron-track">
          {[...CRAWL, ...CRAWL].map((line, index) => <span key={index}>{line}</span>)}
        </div>
      </div>
    </div>
  )
}

export function ChamberHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="chamber-header">
      <Link href="/" className="chamber-brand" aria-label="What It Do home">
        <Seal size={54} />
        <span>
          <span className="chamber-kicker">The House of</span>
          <span className="chamber-wordmark">What It Do?</span>
        </span>
      </Link>
      {right}
    </header>
  )
}
