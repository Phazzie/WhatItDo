'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Poll } from '@/lib/types'

export default function ResultsPage() {
  const params = useParams()
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/poll?id=${pollId}`)
      if (!res.ok) throw new Error('Poll not found')
      const data = await res.json()
      setPoll(data.poll)
    } catch {
      setError('Poll not found')
    } finally {
      setLoading(false)
    }
  }, [pollId])

  useEffect(() => {
    loadPoll()
    // Refresh every 30 seconds
    const interval = setInterval(loadPoll, 30000)
    return () => clearInterval(interval)
  }, [loadPoll])

  const getVoteEmoji = (vote: string) => {
    if (vote === 'yes') return '✅'
    if (vote === 'no') return '❌'
    if (vote === 'maybe') return '🤔'
    return ''
  }

  const getVoteColor = (vote: string) => {
    if (vote === 'yes') return 'text-green-400'
    if (vote === 'no') return 'text-red-400'
    if (vote === 'maybe') return 'text-yellow-400'
    return ''
  }

  const getVoteCounts = (suggestionIndex: number) => {
    const counts = { yes: 0, no: 0, maybe: 0 }
    poll?.responses.forEach(r => {
      const vote = r.votes[suggestionIndex]?.vote
      if (vote) counts[vote]++
    })
    return counts
  }

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-purple-300 text-xl animate-pulse">Loading results...</div>
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

  return (
    <main className="min-h-screen py-12 px-4 scanlines">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="rainbow-bar w-32 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 mb-4">
            {poll.title}
          </h1>
          <p className="text-xl text-purple-200/80">
            {poll.responses.length} {poll.responses.length === 1 ? 'response' : 'responses'}
          </p>
        </div>

        {/* Vote Summary */}
        <div className="card-gradient rounded-2xl p-6 neon-border mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Vote Summary</h2>
          <div className="space-y-4">
            {poll.suggestions.map((suggestion, index) => {
              const counts = getVoteCounts(index)
              const total = counts.yes + counts.no + counts.maybe
              return (
                <div key={index} className="border-b border-purple-500/30 pb-4 last:border-0 last:pb-0">
                  <p className="text-white mb-2">&ldquo;{suggestion}&rdquo;</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-400">✅ {counts.yes}</span>
                    <span className="text-yellow-400">🤔 {counts.maybe}</span>
                    <span className="text-red-400">❌ {counts.no}</span>
                    <span className="text-purple-400/60 ml-auto">{total} votes</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Individual Responses */}
        {poll.responses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">All Responses</h2>
            {poll.responses.map((response) => (
              <div key={response.id} className="card-gradient rounded-2xl p-6 neon-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-fuchsia-400">{response.voterName}</h3>
                  <span className="text-purple-400/60 text-sm">
                    {new Date(response.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {response.votes.map((vote, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3">
                      <p className="text-white text-sm mb-1">&ldquo;{vote.text}&rdquo;</p>
                      <p className={`font-bold ${getVoteColor(vote.vote)}`}>
                        {getVoteEmoji(vote.vote)} {vote.vote.toUpperCase()}
                      </p>
                      {vote.comment && (
                        <p className="text-purple-300/70 text-sm mt-1 italic">&ldquo;{vote.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-gradient rounded-2xl p-8 neon-border text-center">
            <p className="text-purple-300 text-lg">No responses yet!</p>
            <p className="text-purple-400/60 text-sm mt-2">Share your poll link to get votes</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-purple-400/60 text-sm mb-4">Auto-refreshes every 30 seconds</p>
          <a
            href="/"
            className="text-fuchsia-400 hover:text-fuchsia-300 font-medium"
          >
            Create a new poll
          </a>
        </div>
      </div>
    </main>
  )
}
