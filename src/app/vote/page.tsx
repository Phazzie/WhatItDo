'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Vote = 'yes' | 'no' | 'maybe' | null

interface SuggestionVote {
  text: string
  vote: Vote
  comment: string
}

function VoteContent() {
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionVote[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [voterName, setVoterName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = searchParams.get('t')
    if (t) setTitle(t)

    const suggs: SuggestionVote[] = []
    for (let i = 0; i < 3; i++) {
      const s = searchParams.get(`s${i}`)
      if (s) suggs.push({ text: s, vote: null, comment: '' })
    }
    setSuggestions(suggs)
    setLoading(false)
  }, [searchParams])

  const handleVote = (index: number, vote: Vote) => {
    const updated = [...suggestions]
    updated[index].vote = vote
    setSuggestions(updated)
  }

  const handleComment = (index: number, comment: string) => {
    const updated = [...suggestions]
    updated[index].comment = comment
    setSuggestions(updated)
  }

  const allVoted = suggestions.length > 0 && suggestions.every(s => s.vote !== null)

  const submitVotes = () => {
    if (!allVoted) {
      alert('Vote on all suggestions first!')
      return
    }
    setSubmitted(true)
  }

  const shareResults = () => {
    const resultText = suggestions.map((s, i) =>
      `${i + 1}. "${s.text}"\n   Vote: ${s.vote?.toUpperCase()}${s.comment ? `\n   Comment: ${s.comment}` : ''}`
    ).join('\n\n')

    const fullText = `${title ? `${title}\n\n` : ''}${voterName ? `From: ${voterName}\n\n` : ''}${resultText}`

    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="text-white text-xl">Loading...</div>
      </main>
    )
  }

  if (suggestions.length === 0) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">No suggestions found</h1>
          <a href="/" className="text-indigo-400 hover:text-indigo-300">Create a new poll</a>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4">
              Votes Submitted!
            </h1>
            {title && <p className="text-xl text-gray-400">{title}</p>}
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 mb-6">
            <div className="space-y-6">
              {suggestions.map((s, index) => (
                <div key={index} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                  <p className="text-white text-lg mb-2">&ldquo;{s.text}&rdquo;</p>
                  <p className={`font-bold text-xl ${getVoteColor(s.vote)}`}>
                    {getVoteEmoji(s.vote)} {s.vote?.toUpperCase()}
                  </p>
                  {s.comment && (
                    <p className="text-gray-400 mt-2 italic">&ldquo;{s.comment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={shareResults}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all"
            >
              {copied ? 'Copied!' : 'Copy Results to Share'}
            </button>
            <a
              href="/"
              className="block text-center text-indigo-400 hover:text-indigo-300"
            >
              Create your own poll
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
            {title || 'What It Do?'}
          </h1>
          <p className="text-xl text-gray-400">
            Vote on these suggestions!
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30"
            >
              <p className="text-white text-xl font-medium mb-4">
                &ldquo;{suggestion.text}&rdquo;
              </p>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handleVote(index, 'yes')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                    suggestion.vote === 'yes'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                  }`}
                >
                  YES
                </button>
                <button
                  onClick={() => handleVote(index, 'maybe')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                    suggestion.vote === 'maybe'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white'
                  }`}
                >
                  MAYBE
                </button>
                <button
                  onClick={() => handleVote(index, 'no')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                    suggestion.vote === 'no'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  NO
                </button>
              </div>

              <input
                type="text"
                placeholder="Add a comment (optional)"
                value={suggestion.comment}
                onChange={(e) => handleComment(index, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          ))}
        </div>

        <button
          onClick={submitVotes}
          disabled={!allVoted}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all ${
            allVoted
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transform hover:scale-[1.02]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {allVoted ? 'Submit Votes' : `Vote on all ${suggestions.length} suggestions`}
        </button>
      </div>
    </main>
  )
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    }>
      <VoteContent />
    </Suspense>
  )
}
