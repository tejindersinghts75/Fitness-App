import Link from "next/link";

const programs = [
  ["Muscle Building", "Progressive workouts for size, strength and confidence."],
  ["Fat Loss", "Guided training, habits and nutrition support for sustainable progress."],
  ["Strength Training", "Structured movement, compound lifts and technique-focused sessions."],
  ["Body Fitness", "Full-body plans for everyday fitness, mobility and consistency."],
];

const plans = [
  ["Monthly", "₹2,500", "Flexible start", "Best when you want to try Fitora first."],
  ["3-Month", "₹3,997", "Most popular", "A focused transformation period with stronger value."],
  ["Annual", "₹15,000", "Best value", "For long-term coaching, consistency and complete access."],
];

const faqs = [
  ["Is the app on Play Store or App Store yet?", "Not yet. For now, clients can preview Fitora using the demo access link/QR. Store links will replace this section after launch."],
  ["What does membership unlock?", "One active membership unlocks all included programs, video libraries, progress tracking and premium guidance."],
  ["Can users book trainer calls?", "Yes. Trainer profiles can connect to Calendly bookings, and scheduled calls appear inside the app."],
  ["Can admins upload programs and videos?", "Yes. The admin portal manages memberships, programs, videos, trainers and scheduled calls."],
];

export default function HomePage() {
  return (
    <main className="site-home">
      <nav className="site-nav">
        <Link className="site-brand" href="/">
          <span>F</span>
          <div>FITORA<small>FITNESS APP</small></div>
        </Link>
        <div className="site-nav-links">
          <a href="#programs">Programs</a>
          <a href="#pricing">Memberships</a>
          <a href="#app">Get app</a>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="site-eyebrow">ONLINE FITNESS COACHING APP</p>
          <h1>Train smarter with Fitora, wherever you are.</h1>
          <p>
            Fitora brings structured workout programs, premium video guidance,
            progress tracking and trainer call booking into one simple mobile app.
          </p>
          <div className="hero-actions">
            <a className="site-button primary-site-button" href="#app">Preview the app</a>
            <a className="site-button ghost-site-button" href="#programs">Explore programs</a>
          </div>
          <div className="hero-stats">
            <span><strong>4</strong> programs</span>
            <span><strong>3</strong> memberships</span>
            <span><strong>1</strong> app experience</span>
          </div>
        </div>

        <div className="phone-stage" aria-label="Fitora app preview">
          <div className="phone-shell">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-top">
                <span>Welcome back</span>
                <strong>Fitora</strong>
              </div>
              <div className="mini-card accent-card">
                <small>ACTIVE GOAL</small>
                <h3>Build strength</h3>
                <p>Today • 35 min</p>
              </div>
              <div className="mini-grid">
                <div><b>12</b><span>Videos</span></div>
                <div><b>3</b><span>Calls</span></div>
              </div>
              <div className="program-preview">
                <span>Programs</span>
                <div>Muscle Building</div>
                <div>Fat Loss</div>
                <div>Strength</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block about-block" id="about">
        <p className="site-eyebrow">WHY FITORA</p>
        <div className="split-heading">
          <h2>A premium mobile fitness experience for programs, memberships and coach support.</h2>
          <p>
            Fitora separates what users buy from what users follow. Memberships
            unlock access, while programs organize the workout content clearly.
          </p>
        </div>
        <div className="feature-grid">
          <article><span>01</span><h3>Video-first programs</h3><p>Users can preview program libraries and unlock playback after membership.</p></article>
          <article><span>02</span><h3>Membership access</h3><p>Monthly, 3-month and annual plans unlock premium training content.</p></article>
          <article><span>03</span><h3>Coach calls</h3><p>Trainer profiles connect to booking links and scheduled calls appear in the app.</p></article>
        </div>
      </section>

      <section className="section-block dark-section" id="programs">
        <div className="section-head">
          <p className="site-eyebrow">EXPLORE PROGRAMS</p>
          <h2>Fitness categories built for real client goals.</h2>
        </div>
        <div className="program-grid">
          {programs.map(([title, copy]) => (
            <article key={title}>
              <div className="program-icon">✦</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block" id="pricing">
        <div className="section-head">
          <p className="site-eyebrow">MEMBERSHIPS</p>
          <h2>One membership unlocks every included program.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map(([name, price, badge, copy]) => (
            <article key={name} className={name === "3-Month" ? "featured-plan" : ""}>
              <small>{badge}</small>
              <h3>{name}</h3>
              <strong>{price}</strong>
              <p>{copy}</p>
              <a href="#app">Get access</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block app-access" id="app">
        <div>
          <p className="site-eyebrow">APP ACCESS</p>
          <h2>Scan to open the Fitora demo.</h2>
          <p>
            The Play Store and App Store links will be added after launch. For
            now, use this demo section for client previews and app access.
          </p>
          <div className="store-placeholders">
            <span>Google Play coming soon</span>
            <span>App Store coming soon</span>
          </div>
        </div>
        <div className="qr-card">
          <div className="qr-dummy" aria-label="Demo QR placeholder">
            {Array.from({ length: 49 }).map((_, index) => <i key={index} />)}
          </div>
          <strong>Demo QR placeholder</strong>
          <p>Replace this with the live app, APK, TestFlight or store URL when ready.</p>
        </div>
      </section>

      <section className="section-block steps-section">
        <div className="section-head">
          <p className="site-eyebrow">HOW IT WORKS</p>
          <h2>Simple for clients. Powerful for the admin.</h2>
        </div>
        <div className="steps-grid">
          <article><b>1</b><h3>Choose membership</h3><p>User selects the access duration that fits their goal.</p></article>
          <article><b>2</b><h3>Explore programs</h3><p>They browse muscle building, fat loss, strength and body fitness.</p></article>
          <article><b>3</b><h3>Train and track</h3><p>Videos, progress and reminders keep the journey organized.</p></article>
          <article><b>4</b><h3>Book coach calls</h3><p>Calendly-powered trainer calls can sync into the schedule.</p></article>
        </div>
      </section>

      <section className="section-block faq-section">
        <div className="section-head">
          <p className="site-eyebrow">FAQ</p>
          <h2>Questions clients may ask.</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <article key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-brand"><span>F</span><div>FITORA<small>FITNESS APP</small></div></div>
        <p>Premium fitness programs, memberships and coach booking in one app.</p>
        <Link href="/admin">Admin portal</Link>
      </footer>
    </main>
  );
}
