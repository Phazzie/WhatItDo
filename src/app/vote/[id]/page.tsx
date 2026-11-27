'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import type { NotificationStatus, PublicPoll, VoteOption } from '@/lib/types'
import { COMMENT_MAX, COUNTER_PROPOSAL_MAX, VOTER_NAME_MAX } from '@/lib/validation'
import { VOTE_LABEL } from '@/lib/results'
import { billNumber, ChamberHeader, Chyron } from '../../chamber'

interface SuggestionVote {
  text: string
  vote: VoteOption | null
  comment: string
}

interface SubmissionPayload {
  pollId: string
  submissionId: string
  voterName: string
  votes: { text: string; vote: VoteOption; comment: string }[]
  counterProposal?: string
}

const VOTES: { value: VoteOption; label: string }[] = [
  { value: 'yes', label: 'Yea' },
  { value: 'maybe', label: 'Present' },
  { value: 'no', label: 'Nay' },
  { value: 'yolo', label: 'Hell Yea' },
]

const MYSTERY_NAMES = [
  'The Gentleperson from the Group Chat',
  'The Honorable Lurker',
  'A Member Who Left It on Read',
  'The Representative from Read Receipts',
]

function statusCopy(status: NotificationStatus) {
  switch (status) {
    case 'sent': return 'So recorded. The email alert was accepted for delivery to the sponsor.'
    case 'not_configured': return 'So recorded. Email alerts are not set up in this chamber, but your response is safe.'
    case 'failed': return 'So recorded. The email alert fizzled, but your response is safe.'
    case 'duplicate': return 'The Clerk already has this exact vote. Nothing was counted twice.'
  }
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>()
  const [poll, setPoll] = useState<PublicPoll | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionVote[]>([])
  const [voterName, setVoterName] = useState('')
  const [counterProposal, setCounterProposal] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadState, setLoadState] = useState<
    'not-found' | 'unavailable' | 'full' | 'retired' | 'error' | ''
  >('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [notification, setNotification] = useState<NotificationStatus | null>(null)
  const [receipt, setReceipt] = useState<SubmissionPayload | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const pendingSubmission = useRef<SubmissionPayload | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch(`/api/poll?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const body = (await response.json().catch(() => ({}))) as { poll?: PublicPoll }
        if (!active) return
        if (!response.ok || !body.poll) {
          setLoadState(response.status === 410 ? 'retired' : response.status === 404 ? 'not-found' : 'error')
          return
        }
        setPoll(body.poll)
        setSuggestions(body.poll.suggestions.map((text) => ({ text, vote: null, comment: '' })))
      } catch {
        if (active) setLoadState('error')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id, loadAttempt])

  function retryLoad() {
    setLoadState('')
    setLoading(true)
    setLoadAttempt((attempt) => attempt + 1)
  }

  function choose(index: number, vote: VoteOption) {
    setSuggestions((current) => current.map((item, i) => i === index ? { ...item, vote } : item))
    setSubmitError('')
  }

  function comment(index: number, value: string) {
    setSuggestions((current) => current.map((item, i) => i === index ? { ...item, comment: value } : item))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let payload = pendingSubmission.current
    if (!payload) {
      if (!suggestions.length || suggestions.some((item) => !item.vote)) {
        setSubmitError('Every section needs a yea, nay, or present. The Clerk insists.')
        return
      }
      const resolvedName = voterName.trim() || (poll?.mode === 'dubious'
        ? MYSTERY_NAMES[Math.floor(Math.random() * MYSTERY_NAMES.length)]
        : 'An Unnamed Member')
      payload = {
        pollId: id,
        submissionId: crypto.randomUUID(),
        voterName: resolvedName,
        votes: suggestions.map((item) => ({ text: item.text, vote: item.vote as VoteOption, comment: item.comment.trim() })),
        ...(counterProposal.trim() ? { counterProposal: counterProposal.trim() } : {}),
      }
      pendingSubmission.current = payload
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await response.json().catch(() => ({}))) as {
        code?: string
        error?: string
        notification?: NotificationStatus
      }
      if (!response.ok) {
        if (body.code === 'POLL_FULL') {
          pendingSubmission.current = null
          setLoadState('full')
          return
        }
        if (body.code === 'POLL_UNAVAILABLE') {
          pendingSubmission.current = null
          setLoadState('unavailable')
          return
        }
        if (response.status === 410) {
          pendingSubmission.current = null
          setLoadState('retired')
          return
        }
        // A non-5xx response confirms that this request was not ambiguously
        // accepted, so the voter may correct it and create a fresh receipt.
        if (response.status < 500) pendingSubmission.current = null
        const fallback = response.status === 429
          ? 'The Chair does not recognize you right now. Too many votes at once. Wait a moment, then retry. Your choices are still here.'
          : response.status === 410 ? 'This older bill was expunged from the record.' : 'The Clerk did not catch that. Cast your vote again.'
        if (response.status >= 500) {
          throw new Error('The Clerk\u2019s office is not answering. Your choices are still here. Cast your vote again in a moment.')
        }
        throw new Error(body.error || fallback)
      }
      setReceipt(payload)
      setNotification(body.notification || 'failed')
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'The Clerk did not catch that. Cast your vote again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="site-shell center-stage"><div className="loading-card" role="status"><span className="spinner" aria-hidden="true" />The Clerk will call the roll&hellip;</div></main>
  }

  if (loadState || !poll) {
    const copy = {
      retired: ['EXPUNGED', 'This bill was expunged from the record.', 'Older bills were retired to protect the members\u2019 votes. Ask the sponsor to introduce a fresh one.'],
      full: ['CHAMBER FULL', 'The chamber is full.', 'This bill reached 250 votes, the most one chamber can seat. The roll is closed.'],
      unavailable: ['ADJOURNED', 'This bill died in committee.', 'It expired or was withdrawn before your vote could be recorded.'],
      error: ['FEED LOST', 'We lost the feed from the chamber.', 'The ballot could not load. Give it a moment and reconnect.'],
      'not-found': ['NOT ON THE CALENDAR', 'No such bill on the calendar.', 'The floor pass may be mistyped, expired, or from a parallel session.'],
    }[loadState || 'not-found']
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card">
          <p className="card-label hot">{copy[0]}</p>
          <h1>{copy[1]}</h1>
          <p>{copy[2]}</p>
          {loadState === 'error' && <button className="primary-button" type="button" onClick={retryLoad}>Reconnect to the chamber</button>}
          <Link className="primary-button red" href="/">Introduce your own bill</Link>
        </section>
      </main>
    )
  }

  if (notification) {
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card success-card">
          <div className="giant-stamp" aria-hidden="true">RECORDED</div>
          <p className="eyebrow">{billNumber(id)} · Without objection</p>
          <h1>Your vote is recorded.</h1>
          <p className="status-message" role="status">{statusCopy(notification)}</p>
          <div className="receipt">
            <p className="receipt-head">Roll call slip</p>
            <p>{poll.title}</p>
            {(receipt?.votes ?? []).map((item, index) => <span key={item.text}><b>SEC. {index + 1}</b> {VOTE_LABEL[item.vote]} — {item.text}</span>)}
          </div>
          <p className="fine-print">Only the bill&rsquo;s sponsor can see the board. You&rsquo;ll have to ask them how it went.</p>
          <Link className="primary-button" href="/">Introduce your own bill &rarr;</Link>
        </section>
      </main>
    )
  }

  const dubious = poll.mode === 'dubious'
  const remaining = suggestions.filter((item) => !item.vote).length
  const complete = suggestions.length > 0 && remaining === 0

  return (
    <main className="site-shell ballot-shell">
      <Chyron live="LIVE" headline={`ROLL CALL VOTE · ${billNumber(id)} · ${poll.title}`} />
      <ChamberHeader right={<span className="session-tag">{dubious ? <>Roll call<br />Rules suspended</> : <>Roll call<br />Regular order</>}</span>} />
      <section className="ballot-intro">
        <p className="eyebrow">{billNumber(id)} · The Clerk will call the roll</p>
        <h1>{poll.title}</h1>
        <p>{dubious ? 'The rules are suspended. HELL YEA is in order. Every section still needs an answer.' : 'Every section needs an answer. That is the whole point.'}</p>
      </section>

      <form className="ballot-form" onSubmit={submit}>
        <section className="paper-card identity-card">
          <label className="field-label" htmlFor="voter-name">Your name, for the record <span>optional</span></label>
          <input id="voter-name" value={voterName} maxLength={VOTER_NAME_MAX} onChange={(event) => setVoterName(event.target.value)} placeholder={dubious ? 'Blank = a mystery member' : 'Blank = An Unnamed Member'} />
          <p className="fine-print">Your name and remarks go into the record. Only the bill&rsquo;s sponsor can read it.</p>
        </section>

        <ol className="ballot-list">
          {suggestions.map((item, index) => (
            <li className="paper-card ballot-card" key={item.text}>
              <div className="ballot-number" aria-hidden="true">SEC. {index + 1}</div>
              <fieldset>
                <legend>{item.text}</legend>
                <div className={`vote-grid ${dubious ? 'four' : ''}`}>
                  {VOTES.filter((choice) => choice.value !== 'yolo' || dubious).map((choice) => (
                    <button
                      type="button"
                      key={choice.value}
                      aria-pressed={item.vote === choice.value}
                      className={`vote-choice ${choice.value} ${item.vote === choice.value ? 'selected' : ''}`}
                      onClick={() => choose(index, choice.value)}
                    >
                      <span className="lamp" aria-hidden="true" />{choice.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="note-input" htmlFor={`comment-${index}`}>
                <span>Remarks for the record <small>optional</small></span>
                <input aria-label={`Remarks on ${item.text} (optional)`} id={`comment-${index}`} value={item.comment} maxLength={COMMENT_MAX} onChange={(event) => comment(index, event.target.value)} placeholder="Only if we leave by nine." />
              </label>
            </li>
          ))}
        </ol>

        <section className="paper-card counter-card">
          <label className="field-label" htmlFor="counter-proposal">Offer an amendment <span>optional</span></label>
          <p>Hate every section? Propose your own plan from the floor.</p>
          <textarea id="counter-proposal" value={counterProposal} maxLength={COUNTER_PROPOSAL_MAX} onChange={(event) => setCounterProposal(event.target.value)} rows={3} placeholder="Strike all sections and insert the following:" />
        </section>

        {submitError && <p className="notice notice-error" role="alert" aria-live="assertive">{submitError}</p>}
        <button className={`primary-button jumbo seal-button ${complete ? 'ready' : ''}`} type="submit" disabled={submitting}>
          {submitting ? 'The Clerk is recording…' : complete ? 'Cast my vote →' : `Answer ${remaining} more ${remaining === 1 ? 'section' : 'sections'}`}
        </button>
      </form>
      <footer className="site-footer"><span>CHAT-SPAN · Gavel to gavel</span><span>Only the sponsor sees the tally.</span></footer>
    </main>
  )
}
