'use client'

import { useState } from 'react'

export default function Home() {
  const [suggestions, setSuggestions] = useState(['', '', ''])
  const [title, setTitle] = useState('')
  const [pollLink, setPollLink] = useState('')
  const [copied, setCopied] = useState(false)

  const updateSuggestion = (index: number, value: string) => {
    const updated = [...suggestions]
    updated[index] = value
    setSuggestions(updated)
  }

  const createPoll = () => {
    const filledSuggestions = suggestions.filter(s => s.trim())
    if (filledSuggestions.length === 0) {
      alert('Add at least one suggestion!')
      return
    }

    const params = new URLSearchParams()
    if (title.trim()) params.set('t', title.trim())
    filledSuggestions.forEach((s, i) => params.set(`s${i}`, s.trim()))

    const link = `${window.location.origin}/vote?${params.toString()}`
    setPollLink(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(pollLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetPoll = () => {
    setPollLink('')
    setSuggestions(['', '', ''])
    setTitle('')
  }

  if (pollLink) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4">
              Poll Created!
            </h1>
            <p className="text-xl text-gray-400">
              Share this link with your friend
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
            <div className="bg-gray-800 rounded-xl p-4 mb-6 break-all">
              <p className="text-indigo-300 text-sm font-mono">{pollLink}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <a
                href={pollLink}
                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all text-center"
              >
                Preview Poll
              </a>

              <button
                onClick={resetPoll}
                className="w-full text-gray-400 hover:text-white py-2 transition-all"
              >
                Create Another Poll
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
            What It Do?
          </h1>
          <p className="text-xl text-gray-400">
            Create 3 dubious suggestions for your friend to vote on
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-indigo-500/30">
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Poll Title (optional)</label>
            <input
              type="text"
              placeholder="e.g., Weekend Plans for Dave"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-4 mb-8">
            {suggestions.map((suggestion, index) => (
              <div key={index}>
                <label className="block text-gray-400 text-sm mb-2">
                  Suggestion #{index + 1}
                </label>
                <input
                  type="text"
                  placeholder={
                    index === 0 ? "e.g., Eat an entire pizza alone" :
                    index === 1 ? "e.g., Text your ex 'I miss you'" :
                    "e.g., Call in sick and go to the beach"
                  }
                  value={suggestion}
                  onChange={(e) => updateSuggestion(index, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={createPoll}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02]"
          >
            Create Poll & Get Link
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Your friend will vote Yes, No, or Maybe on each suggestion
        </p>
      </div>
    </main>
  )
}
