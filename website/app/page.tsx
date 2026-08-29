import Link from "next/link";

export default function HomePage() {
  return (
    <main className="coming-soon">
      <section>
        <div className="coming-brand"><span>F</span> FITORA</div>
        <p className="eyebrow">CUSTOMER WEBSITE</p>
        <h1>Stronger starts here.</h1>
        <p>The Fitora customer website is coming soon.</p>
        <Link href="/admin">Open admin portal</Link>
      </section>
    </main>
  );
}
