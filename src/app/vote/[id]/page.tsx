'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Poll, VoteOption } from '@/lib/types'
import { getVoteEmoji, getVoteColor } from '@/lib/voteDisplay'
import { VOTER_NAME_MAX, COMMENT_MAX, COUNTER_PROPOSAL_MAX } from '@/lib/validation'

type Vote = VoteOption | null

interface SuggestionVote {
  text: string
  vote: Vote
  comment: string
}

const MYSTERIOUS_NAMES = [
  'A Mysterious Presence',
  'Someone Intriguing',
  'An Enigmatic Soul',
  'Your Secret Admirer',
  'A Whisper in the Dark',
  'The Midnight Wanderer',
  'An Alluring Stranger',
  'A Captivating Mystery'
]

export default function VotePage() {
  const params = useParams()
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionVote[]>([])
  const [voterName, setVoterName] = useState('')
  const [counterProposal, setCounterProposal] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function loadPoll() {
      try {
        const res = await fetch(`/api/poll?id=${pollId}`)
        if (!res.ok) throw new Error('Poll not found')
        const data = await res.json()
        setPoll(data.poll)
        setSuggestions(data.poll.suggestions.map((text: string) => ({
          text,
          vote: null,
          comment: ''
        })))
      } catch {
        setError('Poll not found')
      } finally {
        setLoading(false)
      }
    }
    loadPoll()
  }, [pollId])

  const handleVote = (index: number, vote: Vote) => {
    setSuggestions(prev => prev.map((s, i) =>
      i === index ? { ...s, vote } : s
    ))
    setSubmitError('')
  }

  const handleComment = (index: number, comment: string) => {
    setSuggestions(prev => prev.map((s, i) =>
      i === index ? { ...s, comment } : s
    ))
  }

  const allVoted = suggestions.length > 0 && suggestions.every(s => s.vote !== null)

  const submitVotes = async () => {
    if (!allVoted) {
      setSubmitError('Vote on all suggestions first!')
      return
    }

    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          voterName: getDisplayName(),
          votes: suggestions.map(s => ({
            text: s.text,
            vote: s.vote,
            comment: s.comment.trim()
          })),
          counterProposal: counterProposal.trim() || undefined
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit')
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit votes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isDubious = poll?.mode === 'dubious'

  const getDisplayName = () => {
    if (!voterName.trim()) {
      if (isDubious) {
        return MYSTERIOUS_NAMES[Math.floor(Math.random() * MYSTERIOUS_NAMES.length)]
      }
      return 'Anonymous'
    }
    return voterName.trim()
  }

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-purple-300 text-xl animate-pulse">Loading poll...</div>
      </main>
    )
  }

  if (error || !poll) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center scanlines">
        <div className="text-center card-gradient p-8 rounded-2xl neon-border">
          <h1 className="text-3xl font-bold text-white mb-4">Poll not found</h1>
          <a href="/" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium">Create a new poll</a>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen py-12 px-4 scanlines">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="rainbow-bar w-32 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-violet-400 to-purple-400 mb-4 floating">
              Votes Submitted!
            </h1>
            <p className="text-xl text-purple-200/80">{poll.title}</p>
          </div>

          <div className="card-gradient rounded-2xl p-8 neon-border pulse-glow mb-6">
            <div className="space-y-6">
              {suggestions.map((s, index) => (
                <div key={index} className="border-b border-purple-500/30 pb-4 last:border-0 last:pb-0">
                  <p className="text-white text-lg mb-2">&ldquo;{s.text}&rdquo;</p>
                  <p className={`font-bold text-xl ${getVoteColor(s.vote)}`}>
                    {getVoteEmoji(s.vote)} {s.vote?.toUpperCase()}
                  </p>
                  {s.comment && (
                    <p className="text-purple-300/70 mt-2 italic text-sm">&ldquo;{s.comment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>

            {counterProposal.trim() && (
              <div className="mt-6 pt-6 border-t border-purple-500/30">
                <p className="text-violet-400 text-sm font-medium mb-2">Your Suggestion:</p>
                <p className="text-white italic">&ldquo;{counterProposal.trim()}&rdquo;</p>
              </div>
            )}
          </div>

          <div className="card-gradient rounded-2xl p-6 neon-border text-center">
            <p className="text-green-400 mb-4">The poll creator has been notified of your votes!</p>
            <a
              href="/"
              className="text-purple-300 hover:text-white text-sm transition-all"
            >
              Create your own poll
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen py-12 px-4 scanlines ${isDubious ? 'dubious-mode' : ''}`}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="rainbow-bar w-32 mx-auto mb-6" />
          <h1 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text mb-4 floating ${
            isDubious
              ? 'bg-gradient-to-r from-rose-400 via-purple-400 to-violet-400'
              : 'bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400'
          }`}>
            {poll.title}
          </h1>
          <p className="text-xl text-purple-200/80">
            {isDubious ? 'What calls to you?' : 'Vote on these suggestions!'}
          </p>
          {isDubious && (
            <p className="text-sm text-rose-400/70 mt-2">
              Dubious Mode · YOLO voting available
            </p>
          )}
        </div>

        <div className="card-gradient rounded-2xl p-6 neon-border mb-6">
          <label htmlFor="voter-name" className="block text-purple-300 text-sm mb-2 font-medium">
            {isDubious ? 'Your Name (optional)' : 'Your Name (optional)'}
          </label>
          <input
            id="voter-name"
            type="text"
            placeholder={isDubious ? "Remain anonymous for intrigue..." : "Enter your name"}
            value={voterName}
            maxLength={VOTER_NAME_MAX}
            onChange={(e) => setVoterName(e.target.value)}
            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-violet-500 transition-all"
          />
          {isDubious && !voterName.trim() && (
            <p className="text-rose-400/60 text-xs mt-2">
              You&apos;ll appear as an enigmatic presence...
            </p>
          )}
        </div>

        <div className="space-y-6 mb-8">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`card-gradient rounded-2xl p-6 neon-border ${
                suggestion.vote === 'yolo' ? 'ring-2 ring-violet-500 ring-opacity-50' : ''
              }`}
            >
              <p className="text-white text-xl font-medium mb-4">
                {isDubious && <span className="text-rose-400 mr-2">#{index + 1}</span>}
                &ldquo;{suggestion.text}&rdquo;
              </p>

              <div className={`grid gap-3 mb-4 ${isDubious ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <button
                  onClick={() => handleVote(index, 'yes')}
                  aria-pressed={suggestion.vote === 'yes'}
                  aria-label={`Vote yes for "${suggestion.text}"`}
                  className={`vote-btn py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                    suggestion.vote === 'yes'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30'
                  }`}
                >
                  YES
                </button>
                <button
                  onClick={() => handleVote(index, 'maybe')}
                  aria-pressed={suggestion.vote === 'maybe'}
                  aria-label={`Vote maybe for "${suggestion.text}"`}
                  className={`vote-btn py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                    suggestion.vote === 'maybe'
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50'
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white border border-yellow-500/30'
                  }`}
                >
                  MAYBE
                </button>
                <button
                  onClick={() => handleVote(index, 'no')}
                  aria-pressed={suggestion.vote === 'no'}
                  aria-label={`Vote no for "${suggestion.text}"`}
                  className={`vote-btn py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                    suggestion.vote === 'no'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
                  }`}
                >
                  NO
                </button>
                {isDubious && (
                  <button
                    onClick={() => handleVote(index, 'yolo')}
                    aria-pressed={suggestion.vote === 'yolo'}
                    aria-label={`Vote YOLO for "${suggestion.text}"`}
                    className={`vote-btn py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                      suggestion.vote === 'yolo'
                        ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-rose-500 text-white shadow-lg shadow-violet-500/50 animate-pulse'
                        : 'bg-violet-500/20 text-violet-400 hover:bg-gradient-to-r hover:from-violet-500 hover:via-purple-500 hover:to-rose-500 hover:text-white border border-violet-500/30'
                    }`}
                  >
                    YOLO
                  </button>
                )}
              </div>

              <label htmlFor={`comment-${index}`} className="sr-only">
                Add a comment for &quot;{suggestion.text}&quot; (optional)
              </label>
              <input
                id={`comment-${index}`}
                type="text"
                placeholder={isDubious ? "Add your thoughts..." : "Add a comment (optional)"}
                value={suggestion.comment}
                maxLength={COMMENT_MAX}
                onChange={(e) => handleComment(index, e.target.value)}
                className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 text-sm transition-all"
              />
            </div>
          ))}
        </div>

        <div className="card-gradient rounded-2xl p-6 neon-border mb-6">
          <label htmlFor="counter-proposal" className="block text-purple-300 text-sm mb-2 font-medium">
            {isDubious ? "Your Own Suggestion (optional)" : 'Counter Proposal (optional)'}
          </label>
          <p className="text-purple-400/60 text-xs mb-3">
            {isDubious
              ? 'Have something more enticing in mind?'
              : 'Have a better idea? Suggest an alternative!'}
          </p>
          <textarea
            id="counter-proposal"
            placeholder={isDubious
              ? "e.g., Or perhaps something even more intriguing..."
              : "e.g., Instead of those ideas, how about we..."}
            value={counterProposal}
            maxLength={COUNTER_PROPOSAL_MAX}
            onChange={(e) => setCounterProposal(e.target.value)}
            rows={3}
            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 transition-all resize-none"
          />
        </div>

        {submitError && (
          <div role="alert" aria-live="assertive" className="bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl px-4 py-3 mb-6 text-sm">
            {submitError}
          </div>
        )}

        <button
          onClick={submitVotes}
          disabled={!allVoted || submitting}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all ${
            allVoted && !submitting
              ? isDubious
                ? 'btn-neon bg-gradient-to-r from-rose-600 via-purple-600 to-violet-600 hover:from-rose-500 hover:via-purple-500 hover:to-violet-500 text-white transform hover:scale-[1.02]'
                : 'btn-neon bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white transform hover:scale-[1.02]'
              : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
          }`}
        >
          {submitting ? 'Submitting...' : allVoted ? (isDubious ? 'Submit Votes' : 'Submit Votes') : `Vote on all ${suggestions.length} ${isDubious ? 'options' : 'suggestions'}`}
        </button>
      </div>
    </main>
  )
}
