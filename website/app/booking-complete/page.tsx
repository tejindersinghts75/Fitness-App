"use client";

import { useEffect } from "react";

const appReturnUrl = "fitora://booking-complete";

export default function BookingCompletePage() {
  useEffect(() => {
    window.location.replace(appReturnUrl);
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.icon}>✓</div>
        <p style={styles.eyebrow}>BOOKING CONFIRMED</p>
        <h1 style={styles.title}>Your call is scheduled</h1>
        <p style={styles.copy}>We’re taking you back to Fitora. Your new call will appear automatically.</p>
        <a href={appReturnUrl} style={styles.button}>Return to Fitora</a>
        <p style={styles.hint}>If the app does not open automatically, tap the button above.</p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(145deg, #fff8f3 0%, #ffffff 50%, #fff1e8 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    padding: "42px 28px",
    textAlign: "center",
    border: "1px solid #f0e3db",
    borderRadius: 28,
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 24px 70px rgba(60, 32, 17, .12)",
  },
  icon: {
    width: 68,
    height: 68,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 20px",
    borderRadius: 22,
    color: "#fff",
    background: "#F36B21",
    fontSize: 34,
    fontWeight: 800,
    boxShadow: "0 12px 28px rgba(243,107,33,.3)",
  },
  eyebrow: {
    margin: "0 0 9px",
    color: "#F36B21",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  title: {
    margin: 0,
    color: "#1d1d1b",
    fontSize: 32,
    lineHeight: 1.1,
    letterSpacing: -1,
  },
  copy: {
    margin: "14px auto 25px",
    color: "#77736f",
    fontSize: 15,
    lineHeight: 1.55,
  },
  button: {
    display: "block",
    padding: "16px 20px",
    borderRadius: 16,
    color: "#fff",
    background: "#F36B21",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 800,
  },
  hint: {
    margin: "16px 0 0",
    color: "#99938e",
    fontSize: 12,
  },
};
