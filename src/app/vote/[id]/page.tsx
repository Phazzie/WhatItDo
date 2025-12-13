'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Poll } from '@/lib/types'

type Vote = 'yes' | 'no' | 'maybe' | null

interface SuggestionVote {
  text: string
  vote: Vote
  comment: string
}

export default function VotePage() {
  const params = useParams()
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionVote[]>([])
  const [voterName, setVoterName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

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
  }

  const handleComment = (index: number, comment: string) => {
    setSuggestions(prev => prev.map((s, i) =>
      i === index ? { ...s, comment } : s
    ))
  }

  const allVoted = suggestions.length > 0 && suggestions.every(s => s.vote !== null)

  const submitVotes = async () => {
    if (!allVoted) {
      alert('Vote on all suggestions first!')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          voterName: voterName.trim() || 'Anonymous',
          votes: suggestions.map(s => ({
            text: s.text,
            vote: s.vote,
            comment: s.comment.trim()
          }))
        })
      })

      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      alert('Failed to submit votes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getVoteEmoji = (vote: Vote) => {
    if (vote === 'yes') return '✅'
    if (vote === 'no') return '❌'
    if (vote === 'maybe') return '🤔'
    return ''
  }

  const getVoteColor = (vote: Vote) => {
    if (vote === 'yes') return 'text-green-400'
    if (vote === 'no') return 'text-red-400'
    if (vote === 'maybe') return 'text-yellow-400'
    return ''
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
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400 mb-4 floating">
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
    <main className="min-h-screen py-12 px-4 scanlines">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="rainbow-bar w-32 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 mb-4 floating">
            {poll.title}
          </h1>
          <p className="text-xl text-purple-200/80">
            Vote on these suggestions!
          </p>
        </div>

        <div className="card-gradient rounded-2xl p-6 neon-border mb-6">
          <label htmlFor="voter-name" className="block text-purple-300 text-sm mb-2 font-medium">
            Your Name (optional)
          </label>
          <input
            id="voter-name"
            type="text"
            placeholder="Enter your name"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-500 transition-all"
          />
        </div>

        <div className="space-y-6 mb-8">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="card-gradient rounded-2xl p-6 neon-border"
            >
              <p className="text-white text-xl font-medium mb-4">
                &ldquo;{suggestion.text}&rdquo;
              </p>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleVote(index, 'yes')}
                  aria-pressed={suggestion.vote === 'yes'}
                  aria-label={`Vote yes for "${suggestion.text}"`}
                  className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all ${
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
                  className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all ${
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
                  className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                    suggestion.vote === 'no'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
                  }`}
                >
                  NO
                </button>
              </div>

              <label htmlFor={`comment-${index}`} className="sr-only">
                Add a comment for &quot;{suggestion.text}&quot; (optional)
              </label>
              <input
                id={`comment-${index}`}
                type="text"
                placeholder="Add a comment (optional)"
                value={suggestion.comment}
                maxLength={200}
                onChange={(e) => handleComment(index, e.target.value)}
                className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-500 text-sm transition-all"
              />
            </div>
          ))}
        </div>

        <button
          onClick={submitVotes}
          disabled={!allVoted || submitting}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all ${
            allVoted && !submitting
              ? 'btn-neon bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 text-white transform hover:scale-[1.02]'
              : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
          }`}
        >
          {submitting ? 'Submitting...' : allVoted ? 'Submit Votes' : `Vote on all ${suggestions.length} suggestions`}
        </button>
      </div>
    </main>
  )
}
