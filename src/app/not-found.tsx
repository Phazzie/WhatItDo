import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen py-12 px-4 flex items-center justify-center scanlines">
      <div className="text-center card-gradient p-8 rounded-2xl neon-border max-w-md mx-auto">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold text-white mb-2">404 – Not Found</h1>
        <p className="text-purple-300/70 mb-6">
          This page doesn&apos;t exist or has expired.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          Create a New Poll
        </Link>
      </div>
    </main>
  )
}
