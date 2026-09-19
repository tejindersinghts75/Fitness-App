"use client";

import { useEffect, useState } from "react";

const appReturnUrl = "fitora://booking-complete";

function safeCalendlyUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isCalendly = url.hostname === "calendly.com" || url.hostname.endsWith(".calendly.com");
    if (url.protocol !== "https:" || !isCalendly) return null;
    url.searchParams.set("embed_domain", window.location.hostname);
    url.searchParams.set("embed_type", "Inline");
    return url.toString();
  } catch {
    return null;
  }
}

export default function BookPage() {
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const url = safeCalendlyUrl(new URLSearchParams(window.location.search).get("url"));
    setBookingUrl(url);
    setInvalid(!url);
  }, []);

  useEffect(() => {
    const receiveCalendlyEvent = (event: MessageEvent) => {
      try {
        const origin = new URL(event.origin);
        const fromCalendly = origin.hostname === "calendly.com" || origin.hostname.endsWith(".calendly.com");
        if (fromCalendly && event.data?.event === "calendly.event_scheduled") {
          window.location.replace(appReturnUrl);
        }
      } catch {
        // Ignore messages that do not come from a normal web origin.
      }
    };
    window.addEventListener("message", receiveCalendlyEvent);
    return () => window.removeEventListener("message", receiveCalendlyEvent);
  }, []);

  if (invalid) {
    return (
      <main style={styles.messagePage}>
        <h1 style={styles.title}>Booking link unavailable</h1>
        <p style={styles.copy}>Please return to Fitora and choose your trainer again.</p>
        <a href={appReturnUrl} style={styles.button}>Return to Fitora</a>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.mark}>F</div>
        <div>
          <strong style={styles.brand}>FITORA</strong>
          <div style={styles.subtitle}>Book your trainer call</div>
        </div>
      </header>
      {bookingUrl ? (
        <iframe
          title="Schedule a Fitora trainer call"
          src={bookingUrl}
          style={styles.frame}
          allow="camera; microphone; fullscreen"
        />
      ) : (
        <div style={styles.loading}>Loading available times…</div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", fontFamily: "Arial, sans-serif" },
  header: { height: 68, display: "flex", alignItems: "center", gap: 11, padding: "0 18px", borderBottom: "1px solid #eeeae6", background: "#fff" },
  mark: { width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 13, color: "#fff", background: "#F36B21", fontSize: 21, fontWeight: 900 },
  brand: { color: "#1d1d1b", fontSize: 15, letterSpacing: .8 },
  subtitle: { marginTop: 2, color: "#88827e", fontSize: 11 },
  frame: { display: "block", width: "100%", height: "calc(100vh - 69px)", border: 0 },
  loading: { padding: 40, color: "#777", textAlign: "center" },
  messagePage: { minHeight: "100vh", display: "grid", alignContent: "center", gap: 14, padding: 28, textAlign: "center", fontFamily: "Arial, sans-serif", background: "#fff8f3" },
  title: { margin: 0, color: "#1d1d1b", fontSize: 28 },
  copy: { margin: 0, color: "#77736f", lineHeight: 1.5 },
  button: { display: "block", marginTop: 8, padding: "16px 20px", borderRadius: 16, color: "#fff", background: "#F36B21", textDecoration: "none", fontWeight: 800 },
};
