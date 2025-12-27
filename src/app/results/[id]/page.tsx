'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Poll, VoteOption } from '@/lib/types'

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
    const interval = setInterval(loadPoll, 30000)
    return () => clearInterval(interval)
  }, [loadPoll])

  const isDubious = poll?.mode === 'dubious'

  const getVoteEmoji = (vote: string) => {
    if (vote === 'yes') return '✅'
    if (vote === 'no') return '❌'
    if (vote === 'maybe') return '🤔'
    if (vote === 'yolo') return '🎲'
    return ''
  }

  const getVoteColor = (vote: string) => {
    if (vote === 'yes') return 'text-green-400'
    if (vote === 'no') return 'text-red-400'
    if (vote === 'maybe') return 'text-yellow-400'
    if (vote === 'yolo') return 'text-violet-400'
    return ''
  }

  const getVoteBgColor = (vote: string) => {
    if (vote === 'yes') return 'bg-green-500'
    if (vote === 'no') return 'bg-red-500'
    if (vote === 'maybe') return 'bg-yellow-500'
    if (vote === 'yolo') return 'bg-gradient-to-r from-violet-500 to-rose-500'
    return 'bg-gray-500'
  }

  const getVoteCounts = (suggestionIndex: number) => {
    const counts: Record<VoteOption, number> = { yes: 0, no: 0, maybe: 0, yolo: 0 }
    poll?.responses.forEach(r => {
      const vote = r.votes[suggestionIndex]?.vote as VoteOption
      if (vote && counts[vote] !== undefined) counts[vote]++
    })
    return counts
  }

  const getWinningVote = (counts: Record<VoteOption, number>) => {
    const entries = Object.entries(counts) as [VoteOption, number][]
    const sorted = entries.sort((a, b) => b[1] - a[1])
    if (sorted[0][1] === 0) return null
    return sorted[0][0]
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
    <main className={`min-h-screen py-12 px-4 scanlines ${isDubious ? 'dubious-mode' : ''}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="rainbow-bar w-32 mx-auto mb-6" />
          <h1 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text mb-4 ${
            isDubious
              ? 'bg-gradient-to-r from-rose-400 via-purple-400 to-violet-400'
              : 'bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400'
          }`}>
            {poll.title}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-xl text-purple-200/80">
              {poll.responses.length} {poll.responses.length === 1 ? 'response' : 'responses'}
            </p>
            {isDubious && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-violet-500 text-white">
                DUBIOUS MODE
              </span>
            )}
          </div>
        </div>

        {/* Vote Summary - Card Style */}
        <div className="card-gradient rounded-2xl p-6 neon-border mb-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📊</span> Vote Summary
          </h2>
          <div className="space-y-6">
            {poll.suggestions.map((suggestion, index) => {
              const counts = getVoteCounts(index)
              const total = counts.yes + counts.no + counts.maybe + counts.yolo
              const winner = getWinningVote(counts)

              return (
                <div key={index} className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-white font-medium flex-1">
                      <span className={`mr-2 ${isDubious ? 'text-rose-400' : 'text-violet-400'}`}>
                        #{index + 1}
                      </span>
                      &ldquo;{suggestion}&rdquo;
                    </p>
                    {winner && (
                      <span className={`text-2xl ml-2 ${winner === 'yolo' ? 'animate-bounce' : ''}`}>
                        {getVoteEmoji(winner)}
                      </span>
                    )}
                  </div>

                  {/* Vote bars */}
                  {total > 0 ? (
                    <div className="space-y-2">
                      {(['yes', 'maybe', 'no', ...(isDubious ? ['yolo'] : [])] as VoteOption[]).map(voteType => {
                        const count = counts[voteType]
                        const percentage = total > 0 ? (count / total) * 100 : 0
                        if (count === 0) return null

                        return (
                          <div key={voteType} className="flex items-center gap-2">
                            <span className="w-12 text-xs font-bold uppercase" style={{ color: voteType === 'yes' ? '#4ade80' : voteType === 'no' ? '#f87171' : voteType === 'maybe' ? '#facc15' : '#a78bfa' }}>
                              {voteType}
                            </span>
                            <div className="flex-1 h-6 bg-black/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getVoteBgColor(voteType)} transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${Math.max(percentage, 15)}%` }}
                              >
                                <span className="text-xs font-bold text-white drop-shadow">{count}</span>
                              </div>
                            </div>
                            <span className="text-purple-400/60 text-xs w-10 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-purple-400/50 text-sm italic">No votes yet</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Counter Proposals Section */}
        {poll.responses.some(r => r.counterProposal) && (
          <div className="card-gradient rounded-2xl p-6 neon-border mb-8 border-2 border-violet-500/30">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              {isDubious ? 'Alternative Suggestions' : 'Counter Proposals'}
            </h2>
            <div className="space-y-4">
              {poll.responses.filter(r => r.counterProposal).map((response) => (
                <div key={response.id} className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/30">
                  <p className="text-violet-400 text-sm font-medium mb-2">
                    {response.voterName} {isDubious ? 'suggests:' : 'suggests:'}
                  </p>
                  <p className="text-white italic text-lg">
                    &ldquo;{response.counterProposal}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Responses */}
        {poll.responses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-2xl">👥</span> All Responses
            </h2>
            {poll.responses.map((response, respIndex) => (
              <div
                key={response.id}
                className={`card-gradient rounded-2xl p-6 neon-border overflow-hidden relative ${
                  response.votes.some(v => v.vote === 'yolo') ? 'ring-2 ring-violet-500/50' : ''
                }`}
              >
                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-16 h-16 ${
                  isDubious
                    ? 'bg-gradient-to-bl from-rose-500/20 to-transparent'
                    : 'bg-gradient-to-bl from-violet-500/20 to-transparent'
                }`} />

                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-bold ${isDubious ? 'text-rose-400' : 'text-violet-400'}`}>
                    <span className="text-2xl mr-2">
                      {respIndex === 0 ? '🥇' : respIndex === 1 ? '🥈' : respIndex === 2 ? '🥉' : '👤'}
                    </span>
                    {response.voterName}
                  </h3>
                  <span className="text-purple-400/60 text-sm">
                    {new Date(response.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid gap-3">
                  {response.votes.map((vote, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-3 transition-all ${
                        vote.vote === 'yolo'
                          ? 'bg-gradient-to-r from-violet-500/20 to-rose-500/20 border border-violet-500/30'
                          : 'bg-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white/80 text-sm flex-1">&ldquo;{vote.text}&rdquo;</p>
                        <span className={`font-bold text-lg ml-3 ${getVoteColor(vote.vote)} ${vote.vote === 'yolo' ? 'animate-pulse' : ''}`}>
                          {getVoteEmoji(vote.vote)} {vote.vote.toUpperCase()}
                        </span>
                      </div>
                      {vote.comment && (
                        <p className="text-purple-300/70 text-sm mt-2 italic border-l-2 border-purple-500/30 pl-3">
                          &ldquo;{vote.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {response.counterProposal && (
                  <div className="mt-4 pt-4 border-t border-purple-500/30">
                    <p className="text-violet-400 text-sm font-bold mb-2">
                      {isDubious ? '💡 Alternative Suggestion:' : '💡 Counter Proposal:'}
                    </p>
                    <p className="text-white italic bg-violet-500/10 rounded-lg p-3 border border-violet-500/30">
                      &ldquo;{response.counterProposal}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card-gradient rounded-2xl p-8 neon-border text-center">
            <p className="text-6xl mb-4">🦗</p>
            <p className="text-purple-300 text-lg">No responses yet!</p>
            <p className="text-purple-400/60 text-sm mt-2">Share your poll link to get votes</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-purple-400/60 text-sm mb-4 flex items-center justify-center gap-2">
            <span className="animate-pulse">🔄</span> Auto-refreshes every 30 seconds
          </p>
          <a
            href="/"
            className={`font-medium ${isDubious ? 'text-rose-400 hover:text-rose-300' : 'text-violet-400 hover:text-violet-300'}`}
          >
            Create a new poll
          </a>
        </div>
      </div>
    </main>
  )
}
