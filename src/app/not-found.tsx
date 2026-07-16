import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="site-shell center-stage">
      <section className="paper-card state-card tape-top">
        <p className="card-label hot">404 · WRONG TURN</p>
        <h1>This scheme does not exist.</h1>
        <p>
          The link may be mistyped, expired, or from a parallel universe with worse plans.
        </p>
        <Link className="primary-button pink" href="/">Make a real poll ↗</Link>
      </section>
    </main>
  )
}
