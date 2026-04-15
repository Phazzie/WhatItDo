'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen py-12 px-4 flex items-center justify-center scanlines">
      <div className="text-center card-gradient p-8 rounded-2xl neon-border max-w-md mx-auto">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-purple-300/70 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
          >
            Try Again
          </button>
          <a
            href="/"
            className="text-purple-300 hover:text-white transition-all text-sm"
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  )
}
