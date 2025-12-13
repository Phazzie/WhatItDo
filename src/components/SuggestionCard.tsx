'use client'

import { useState } from 'react'
import { Suggestion, Comment } from '@/lib/suggestions'

interface SuggestionCardProps {
  suggestion: Suggestion
  onVote: (id: string, vote: 'yes' | 'no' | 'maybe') => void
  onComment: (id: string, comment: string, author: string) => void
}

export default function SuggestionCard({ suggestion, onVote, onComment }: SuggestionCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [author, setAuthor] = useState('')
  const [voted, setVoted] = useState<string | null>(null)

  const totalVotes = suggestion.votes.yes + suggestion.votes.no + suggestion.votes.maybe
  const getPercentage = (count: number) => totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0

  const handleVote = (vote: 'yes' | 'no' | 'maybe') => {
    if (voted) return
    setVoted(vote)
    onVote(suggestion.id, vote)
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim() && author.trim()) {
      onComment(suggestion.id, newComment, author)
      setNewComment('')
    }
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 card-glow border border-indigo-500/30 hover:border-indigo-400/50 transition-all">
      <div className="mb-2">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300">
          {suggestion.category}
        </span>
      </div>

      <h3 className="text-xl font-bold text-white mb-4 leading-relaxed">
        &ldquo;{suggestion.text}&rdquo;
      </h3>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleVote('yes')}
          disabled={voted !== null}
          className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg ${
            voted === 'yes'
              ? 'bg-green-500 text-white'
              : voted
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
          }`}
        >
          YES
        </button>
        <button
          onClick={() => handleVote('maybe')}
          disabled={voted !== null}
          className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg ${
            voted === 'maybe'
              ? 'bg-yellow-500 text-white'
              : voted
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white'
          }`}
        >
          MAYBE
        </button>
        <button
          onClick={() => handleVote('no')}
          disabled={voted !== null}
          className={`vote-btn flex-1 py-3 px-4 rounded-xl font-bold text-lg ${
            voted === 'no'
              ? 'bg-red-500 text-white'
              : voted
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
          }`}
        >
          NO
        </button>
      </div>

      {/* Vote Results */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm w-16">Yes</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${getPercentage(suggestion.votes.yes)}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm w-12 text-right">{getPercentage(suggestion.votes.yes)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm w-16">Maybe</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${getPercentage(suggestion.votes.maybe)}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm w-12 text-right">{getPercentage(suggestion.votes.maybe)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-sm w-16">No</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${getPercentage(suggestion.votes.no)}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm w-12 text-right">{getPercentage(suggestion.votes.no)}%</span>
        </div>
        <p className="text-gray-500 text-xs text-center mt-1">{totalVotes} total votes</p>
      </div>

      {/* Comments Section */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
        >
          {showComments ? 'Hide' : 'Show'} Comments ({suggestion.comments.length})
        </button>

        {showComments && (
          <div className="mt-4 space-y-3">
            {suggestion.comments.length > 0 ? (
              suggestion.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">{comment.text}</p>
                  <p className="text-gray-500 text-xs mt-1">- {comment.author}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No comments yet. Be the first!</p>
            )}

            <form onSubmit={handleSubmitComment} className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
