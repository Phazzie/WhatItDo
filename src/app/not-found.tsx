import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="site-shell center-stage">
      <section className="paper-card state-card">
        <p className="card-label hot">404 · Died in committee</p>
        <h1>There is no such bill.</h1>
        <p>
          This page was never introduced, or it was tabled so long ago that even the Clerk forgot it.
        </p>
        <Link className="primary-button red" href="/">Introduce a real bill &rarr;</Link>
      </section>
    </main>
  )
}
