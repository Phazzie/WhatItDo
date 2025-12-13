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

  const submitVotes = () => {
    if (!allVoted) {
      alert('Vote on all suggestions first!')
      return
    }
    setSubmitted(true)
  }

  const getResultsText = () => {
    const resultText = suggestions.map((s, i) =>
      `${i + 1}. "${s.text}"\n   Vote: ${s.vote?.toUpperCase()}${s.comment ? `\n   Comment: ${s.comment}` : ''}`
    ).join('\n\n')
    return `${title ? `${title}\n\n` : ''}${voterName ? `From: ${voterName}\n\n` : ''}${resultText}`
  }

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(getResultsText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = getResultsText()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareViaText = () => {
    window.open(`sms:?body=${encodeURIComponent(getResultsText())}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = `Poll Results: ${title || 'What It Do?'}`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(getResultsText())}`, '_blank')
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
        <div className="text-purple-300 text-xl animate-pulse">Loading...</div>
      </main>
    )
  }

  if (suggestions.length === 0) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center scanlines">
        <div className="text-center card-gradient p-8 rounded-2xl neon-border">
          <h1 className="text-3xl font-bold text-white mb-4">No suggestions found</h1>
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
            {title && <p className="text-xl text-purple-200/80">{title}</p>}
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

          <div className="card-gradient rounded-2xl p-6 neon-border">
            <p className="text-purple-300 text-sm mb-3 font-medium">Send your results back:</p>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-500 transition-all mb-4"
            />

            <div className="grid grid-cols-3 gap-3 mb-3">
              <button
                onClick={copyResults}
                className="btn-neon bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm"
              >
                {copied ? '✓' : 'Copy'}
              </button>
              <button
                onClick={shareViaText}
                className="btn-neon bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1 text-sm"
              >
                <span>📱</span> Text
              </button>
              <button
                onClick={shareViaEmail}
                className="btn-neon bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1 text-sm"
              >
                <span>📧</span> Email
              </button>
            </div>

            <a
              href="/"
              className="block text-center text-purple-300 hover:text-white text-sm transition-all"
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
            {title || 'What It Do?'}
          </h1>
          <p className="text-xl text-purple-200/80">
            Vote on these suggestions!
          </p>
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
                  className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                    suggestion.vote === 'no'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
                  }`}
                >
                  NO
                </button>
              </div>

              <input
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
          disabled={!allVoted}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all ${
            allVoted
              ? 'btn-neon bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 text-white transform hover:scale-[1.02]'
              : 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30'
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
        <div className="text-purple-300 text-xl animate-pulse">Loading...</div>
      </main>
    }>
      <VoteContent />
    </Suspense>
  )
}
