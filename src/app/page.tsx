'use client'

import { useState, useEffect } from 'react'
import SuggestionCard from '@/components/SuggestionCard'
import { Suggestion, defaultSuggestions } from '@/lib/suggestions'

export default function Home() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('whatitdo-suggestions')
    if (saved) {
      setSuggestions(JSON.parse(saved))
    } else {
      setSuggestions(defaultSuggestions)
      localStorage.setItem('whatitdo-suggestions', JSON.stringify(defaultSuggestions))
    }
    setLoading(false)
  }, [])

  const saveSuggestions = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions)
    localStorage.setItem('whatitdo-suggestions', JSON.stringify(newSuggestions))
  }

  const handleVote = (id: string, vote: 'yes' | 'no' | 'maybe') => {
    const updated = suggestions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          votes: {
            ...s.votes,
            [vote]: s.votes[vote] + 1
          }
        }
      }
      return s
    })
    saveSuggestions(updated)
  }

  const handleComment = (id: string, text: string, author: string) => {
    const updated = suggestions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          comments: [
            ...s.comments,
            {
              id: Date.now().toString(),
              text,
              author,
              timestamp: Date.now()
            }
          ]
        }
      }
      return s
    })
    saveSuggestions(updated)
  }

  const categories = ['all', ...new Set(suggestions.map(s => s.category))]
  const filteredSuggestions = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading dubious suggestions...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 floating">
            What It Do?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Vote on dubious suggestions. Question your life choices. Have fun.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/60 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl font-bold text-green-400">
              {suggestions.reduce((sum, s) => sum + s.votes.yes, 0)}
            </div>
            <div className="text-gray-500 text-sm">Total Yes Votes</div>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400">
              {suggestions.reduce((sum, s) => sum + s.votes.maybe, 0)}
            </div>
            <div className="text-gray-500 text-sm">Total Maybe Votes</div>
          </div>
          <div className="bg-gray-900/60 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl font-bold text-red-400">
              {suggestions.reduce((sum, s) => sum + s.votes.no, 0)}
            </div>
            <div className="text-gray-500 text-sm">Total No Votes</div>
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onVote={handleVote}
              onComment={handleComment}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Disclaimer: Following these suggestions may result in questionable life outcomes.</p>
          <p className="mt-2">Made with chaos and caffeine.</p>
        </footer>
      </div>
    </main>
  )
}
