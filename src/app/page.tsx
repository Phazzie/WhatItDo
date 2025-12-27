'use client'

import { useState, useRef, useEffect } from 'react'
import { PollMode } from '@/lib/types'

const PLACEHOLDERS = {
  normal: [
    "e.g., Try that new restaurant downtown",
    "e.g., Go hiking this weekend",
    "e.g., Host a game night"
  ],
  dubious: [
    "e.g., Send a mysterious message to someone intriguing...",
    "e.g., Take an impromptu midnight drive somewhere scenic",
    "e.g., Book that spontaneous weekend getaway"
  ]
}

export default function Home() {
  const [suggestions, setSuggestions] = useState(['', '', ''])
  const [title, setTitle] = useState('')
  const [pollLink, setPollLink] = useState('')
  const [resultsLink, setResultsLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [mode, setMode] = useState<PollMode>('dubious')
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const updateSuggestion = (index: number, value: string) => {
    setSuggestions(prev => prev.map((s, i) => i === index ? value : s))
  }

  const createPoll = async () => {
    const filledSuggestions = suggestions.filter(s => s.trim())
    if (filledSuggestions.length === 0) {
      alert('Add at least one suggestion!')
      return
    }

    setCreating(true)
    try {
      const defaultTitle = mode === 'dubious' ? 'Intriguing Possibilities...' : 'What It Do?'
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || defaultTitle,
          suggestions: filledSuggestions.map(s => s.trim()),
          mode
        })
      })

      if (!res.ok) throw new Error('Failed to create poll')

      const data = await res.json()
      setPollLink(`${window.location.origin}/vote/${data.id}`)
      setResultsLink(`${window.location.origin}/results/${data.id}`)
    } catch (error) {
      console.error(error)
      alert('Failed to create poll. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollLink)
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = pollLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareViaText = () => {
    const message = `Vote on my poll: ${title || 'What It Do?'}\n${pollLink}`
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = title || 'Vote on my poll!'
    const body = `Hey! I need your input on some suggestions.\n\nClick here to vote: ${pollLink}\n\nThanks!`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const resetPoll = () => {
    setPollLink('')
    setResultsLink('')
    setSuggestions(['', '', ''])
    setTitle('')
    setMode('dubious')
  }

  if (pollLink) {
    return (
      <main className="min-h-screen py-12 px-4 scanlines">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="rainbow-bar w-32 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-violet-400 to-purple-400 mb-4 floating neon-text">
              Poll Created!
            </h1>
            <p className="text-xl text-purple-200/80">
              Share this link with your friend
            </p>
          </div>

          <div className="card-gradient rounded-2xl p-8 neon-border pulse-glow mb-6">
            <p className="text-purple-300 text-sm mb-2 font-medium">Send this to your friend:</p>
            <div className="bg-black/40 rounded-xl p-4 mb-6 break-all border border-purple-500/30">
              <p className="text-cyan-300 text-sm font-mono">{pollLink}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="btn-neon w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareViaText}
                  className="btn-neon bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>📱</span> Text
                </button>
                <button
                  onClick={shareViaEmail}
                  className="btn-neon bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>📧</span> Email
                </button>
              </div>
            </div>
          </div>

          <div className="card-gradient rounded-2xl p-6 neon-border">
            <p className="text-purple-300 text-sm mb-2 font-medium">View results anytime:</p>
            <a
              href={resultsLink}
              className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all text-center border border-white/20"
            >
              View Results Page
            </a>
            <p className="text-purple-400/60 text-xs mt-3 text-center">
              You&apos;ll also get an email when someone votes!
            </p>
          </div>

          <button
            onClick={resetPoll}
            className="w-full text-purple-300 hover:text-white py-4 transition-all"
          >
            Create Another Poll
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen py-12 px-4 scanlines ${mode === 'dubious' ? 'dubious-mode' : ''}`}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="rainbow-bar w-32 mx-auto mb-6" />
          <h1 className={`text-5xl md:text-6xl font-black text-transparent bg-clip-text mb-4 floating ${
            mode === 'dubious'
              ? 'bg-gradient-to-r from-rose-400 via-purple-400 to-violet-400'
              : 'bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400'
          }`}>
            {mode === 'dubious' ? 'Intriguing Possibilities...' : 'What It Do?'}
          </h1>
          <p className="text-xl text-purple-200/80">
            {mode === 'dubious'
              ? 'Craft enticing propositions for someone special'
              : 'Create suggestions for your friend to vote on'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="card-gradient rounded-2xl p-4 neon-border mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setMode('normal')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                mode === 'normal'
                  ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10 border border-purple-500/20'
              }`}
            >
              <span className="text-lg">✨</span>
              <span className="block text-sm mt-1">Classic Mode</span>
            </button>
            <button
              onClick={() => setMode('dubious')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                mode === 'dubious'
                  ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-violet-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10 border border-purple-500/20'
              }`}
            >
              <span className="text-lg">🌙</span>
              <span className="block text-sm mt-1">Adventurous</span>
            </button>
          </div>
          <p className="text-center text-purple-400/60 text-xs mt-3">
            {mode === 'dubious'
              ? 'Bold choices available · Mystery names for the daring'
              : 'Standard voting with Yes, No, or Maybe'}
          </p>
        </div>

        <div className="card-gradient rounded-2xl p-8 neon-border">
          <div className="mb-6">
            <label htmlFor="poll-title" className="block text-purple-300 text-sm mb-2 font-medium">Poll Title (optional)</label>
            <input
              type="text"
              id="poll-title"
              placeholder={mode === 'dubious' ? "e.g., Tempting Suggestions..." : "e.g., Weekend Plans for Dave"}
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-500 transition-all"
            />
          </div>

          <div className="space-y-4 mb-8">
            {suggestions.map((suggestion, index) => (
              <div key={index}>
                <label htmlFor={`suggestion-${index}`} className="block text-purple-300 text-sm mb-2 font-medium">
                  {mode === 'dubious' ? `Option ${index + 1}` : `Suggestion #${index + 1}`} {index === 0 && <span className="text-rose-400">*</span>}
                </label>
                <input
                  type="text"
                  id={`suggestion-${index}`}
                  placeholder={PLACEHOLDERS[mode][index]}
                  value={suggestion}
                  maxLength={200}
                  onChange={(e) => updateSuggestion(index, e.target.value)}
                  className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-500 transition-all"
                />
              </div>
            ))}
          </div>

          <button
            onClick={createPoll}
            disabled={creating}
            className={`btn-neon w-full text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              mode === 'dubious'
                ? 'bg-gradient-to-r from-rose-600 via-purple-600 to-violet-600 hover:from-rose-500 hover:via-purple-500 hover:to-violet-500'
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500'
            }`}
          >
            {creating ? 'Creating...' : mode === 'dubious' ? 'Send the Invitation' : 'Create Poll & Get Link'}
          </button>
        </div>

        <p className="text-center text-purple-400/60 text-sm mt-8">
          {mode === 'dubious'
            ? 'They can choose: Yes, No, Maybe, or make it Bold'
            : 'Your friend will vote Yes, No, or Maybe on each suggestion'}
        </p>
      </div>
    </main>
  )
}
