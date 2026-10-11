import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section className="panel article">
        <h1>That lesson doesn’t exist.</h1>
        <p>Choose one of the algorithms in the playground.</p>
        <Link className="button primary" href="/">
          Back to Algorithm Studio
        </Link>
      </section>
    </main>
  );
}
