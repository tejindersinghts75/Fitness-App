"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase-browser";

type PackageItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_inr: number;
  duration_days: number;
  is_active: boolean;
  cover_url: string | null;
};
type VideoItem = {
  id: string;
  package_id: string;
  title: string;
  description: string;
  trainer: string;
  status: string;
  mux_playback_id: string | null;
  duration_seconds: number;
  is_published: boolean;
  error_message: string | null;
};
type AdminSection = "packages" | "videos" | "subscriptions" | "users";
type SubscriptionItem = {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  payment_provider: string;
  user_id: string;
  packages: { name: string } | null;
};
type ProfileItem = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Login({ onReady }: { onReady: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const normalizedEmail = email.trim().toLowerCase();
  async function sendCode() {
    const { error: e } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    if (e) throw e;
    setSent(true);
    setOtp("");
    setNotice("A new code was sent. Only use the newest email code.");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!sent) {
        await sendCode();
      } else {
        const { data, error: e } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: otp.trim(),
          type: "email",
        });
        if (e) throw e;
        if (!data.session)
          throw new Error("Supabase did not create a login session.");
        onReady(data.session);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to sign in";
      setError(
        message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid")
          ? "That code is no longer valid. Request a new code below, then use only the newest email."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendCode();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resend the code");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span>F</span>
          <div>
            FITORA<small>ADMIN PORTAL</small>
          </div>
        </div>
        <p className="eyebrow">SECURE ACCESS</p>
        <h1>{sent ? "Enter your code" : "Welcome back"}</h1>
        <p>
          {sent
            ? `We sent a login code to ${normalizedEmail}.`
            : "Use your approved administrator email to continue."}
        </p>
        <form onSubmit={submit}>
          {!sent ? (
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@fitora.com"
              />
            </label>
          ) : (
            <label>
              One-time code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                required
                placeholder="000000"
              />
            </label>
          )}
          {notice && <div className="notice otp-notice">✓ {notice}</div>}
          {error && <div className="form-error">{error}</div>}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : sent
                ? "Verify and continue"
                : "Send login code"}
          </button>
        </form>
        {sent && (
          <div className="login-actions">
            <button className="text-button" disabled={busy} onClick={resend}>
              Resend a new code
            </button>
            <button
              className="text-button"
              onClick={() => {
                setSent(false);
                setOtp("");
                setError("");
                setNotice("");
              }}
            >
              Use another email
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PackageItem | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeSection, setActiveSection] =
    useState<AdminSection>("packages");
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [users, setUsers] = useState<ProfileItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(
    () =>
      packages.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [packages, query],
  );
  const counts = useMemo(
    () =>
      new Map(
        packages.map((p) => [
          p.id,
          videos.filter((v) => v.package_id === p.id).length,
        ]),
      ),
    [packages, videos],
  );
  const packageVideos = selected
    ? videos.filter((v) => v.package_id === selected.id)
    : [];

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setAuthorized(Boolean(data)));
  }, [session]);
  useEffect(() => {
    if (authorized) void refresh();
  }, [authorized]);
  async function refresh() {
    const [{ data: p, error: pe }, { data: v, error: ve }] = await Promise.all([
      supabase.from("packages").select("*").order("sort_order"),
      supabase.from("videos").select("*").order("sort_order"),
    ]);
    if (pe || ve) {
      setError(pe?.message || ve?.message || "Unable to load content");
      return;
    }
    setPackages((p || []) as PackageItem[]);
    setVideos((v || []) as VideoItem[]);
  }
  async function loadAdminOverview(section: AdminSection) {
    setActiveSection(section);
    setError("");
    if ((section !== "subscriptions" && section !== "users") || !session)
      return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to load admin data");
      setSubscriptions(result.subscriptions || []);
      setUsers(result.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load admin data");
    } finally {
      setBusy(false);
    }
  }
  async function createPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const { error: e } = await supabase.from("packages").insert({
      name,
      slug: `${slugify(name)}-${Date.now().toString().slice(-5)}`,
      description: String(data.get("description") || ""),
      price_inr: Number(data.get("price") || 0),
      duration_days: Number(data.get("duration") || 30),
      benefits: [],
      is_active: data.get("active") === "on",
      sort_order: packages.length + 1,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setShowForm(false);
    setNotice(`${name} is now available in the shared catalog.`);
    await refresh();
  }
  async function uploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !session || !fileRef.current?.files?.[0]) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setUploadProgress(0);
    const data = new FormData(event.currentTarget);
    const file = fileRef.current.files[0];
    const { data: record, error: insertError } = await supabase
      .from("videos")
      .insert({
        package_id: selected.id,
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        trainer: String(data.get("trainer") || "Coach Kal"),
        duration_seconds: 0,
        mux_playback_id: null,
        is_published: false,
        status: "draft",
        sort_order: packageVideos.length + 1,
      })
      .select()
      .single();
    if (insertError || !record) {
      setError(insertError?.message || "Unable to create video");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/mux/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ videoId: record.id }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to start Mux upload");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", result.uploadUrl);
        xhr.upload.onprogress = (e) =>
          e.lengthComputable &&
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error("Video upload failed"));
        xhr.onerror = () => reject(new Error("Video upload failed"));
        xhr.send(file);
      });
      await supabase
        .from("videos")
        .update({ status: "processing" })
        .eq("id", record.id);
      form.reset();
      await refresh();
      setSelected(null);
      setNotice(
        `${record.title} was uploaded successfully. Mux is processing it now.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      await supabase
        .from("videos")
        .update({
          status: "errored",
          error_message: e instanceof Error ? e.message : "Upload failed",
        })
        .eq("id", record.id);
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(null);
  }

  if (!authReady)
    return (
      <main className="login-page">
        <div className="loading">Loading Fitora Admin…</div>
      </main>
    );
  if (!isSupabaseConfigured)
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <span>F</span>
            <div>
              FITORA<small>SETUP REQUIRED</small>
            </div>
          </div>
          <h1>Connect the backend</h1>
          <p>
            Add the Supabase and Mux values listed in <code>.env.example</code>,
            then restart this portal.
          </p>
        </section>
      </main>
    );
  if (!session) return <Login onReady={setSession} />;
  if (authorized === null)
    return (
      <main className="login-page">
        <div className="loading">Checking administrator access…</div>
      </main>
    );
  if (!authorized)
    return (
      <main className="login-page">
        <section className="login-card">
          <p className="eyebrow">ACCESS DENIED</p>
          <h1>Not an administrator</h1>
          <p>
            {session.user.email} is signed in, but it has not been added to the
            Fitora admin list.
          </p>
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </section>
      </main>
    );

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span>F</span>
          <div>
            FITORA<small>ADMIN</small>
          </div>
        </Link>
        <nav aria-label="Admin navigation">
          <button
            className={`nav-item ${activeSection === "packages" ? "active" : ""}`}
            onClick={() => void loadAdminOverview("packages")}
          >
            <span>▦</span>Packages
          </button>
          <button
            className={`nav-item ${activeSection === "videos" ? "active" : ""}`}
            onClick={() => void loadAdminOverview("videos")}
          >
            <span>▷</span>Videos
          </button>
          <button
            className={`nav-item ${activeSection === "subscriptions" ? "active" : ""}`}
            onClick={() => void loadAdminOverview("subscriptions")}
          >
            <span>◎</span>Subscriptions
          </button>
          <button
            className={`nav-item ${activeSection === "users" ? "active" : ""}`}
            onClick={() => void loadAdminOverview("users")}
          >
            <span>♙</span>Users
          </button>
        </nav>
        <div className="admin-user">
          <span>{session.user.email?.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>Administrator</strong>
            <small>{session.user.email}</small>
          </div>
          <button onClick={logout} aria-label="Sign out">
            ↪
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p>ADMIN PORTAL</p>
            <h1>{activeSection[0].toUpperCase() + activeSection.slice(1)}</h1>
          </div>
          {activeSection === "packages" && (
            <button className="primary" onClick={() => setShowForm(true)}>
              ＋ Create package
            </button>
          )}
        </header>
        <section className="summary">
          <article>
            <span>LIVE PACKAGES</span>
            <strong>{packages.filter((p) => p.is_active).length}</strong>
            <small>Visible in the mobile app</small>
          </article>
          <article>
            <span>TOTAL VIDEOS</span>
            <strong>{videos.length}</strong>
            <small>Connected to Mux</small>
          </article>
          <article>
            <span>READY TO WATCH</span>
            <strong>{videos.filter((v) => v.status === "ready").length}</strong>
            <small>Processed and published</small>
          </article>
        </section>
        <div className="page-messages">
          {notice && (
            <div className="notice">
              ✓ {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}
          {error && (
            <div className="form-error page-error">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
        </div>
        {activeSection === "packages" && <section className="library">
          <div className="library-head">
            <div>
              <h2>All packages</h2>
              <p>Create unlimited programs and manage their video libraries.</p>
            </div>
            <label className="search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search packages"
              />
            </label>
          </div>
          <div className="package-grid">
            {filtered.map((item, index) => (
              <article className="package-card" key={item.id}>
                <div
                  className={`cover cover-${index % 3}`}
                  style={
                    item.cover_url
                      ? {
                          backgroundImage: `linear-gradient(135deg,#1118,#1112),url(${item.cover_url})`,
                        }
                      : undefined
                  }
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <em>{item.is_active ? "LIVE" : "DRAFT"}</em>
                </div>
                <div className="package-copy">
                  <div className="title-row">
                    <div>
                      <small>{item.duration_days} DAY ACCESS</small>
                      <h3>{item.name}</h3>
                    </div>
                  </div>
                  <p>{item.description}</p>
                  <div className="meta">
                    <strong>
                      {money.format(item.price_inr)}
                      <small> / package</small>
                    </strong>
                    <span>{counts.get(item.id) || 0} videos</span>
                  </div>
                  <button className="manage" onClick={() => setSelected(item)}>
                    Manage package <span>→</span>
                  </button>
                </div>
              </article>
            ))}
            <button className="new-card" onClick={() => setShowForm(true)}>
              <span>＋</span>
              <strong>Create another package</strong>
              <small>Add pricing, details and Mux videos</small>
            </button>
          </div>
        </section>}
        {activeSection === "videos" && (
          <section className="library admin-table-page">
            <div className="library-head"><div><h2>All videos</h2><p>Every video uploaded across your packages.</p></div></div>
            <div className="admin-table">
              {videos.map((video) => (
                <article key={video.id}>
                  <div><strong>{video.title}</strong><small>{packages.find((item) => item.id === video.package_id)?.name || "Unknown package"}</small></div>
                  <span className={`status-pill ${video.status}`}>{video.status}</span>
                  <small>{video.trainer}</small>
                </article>
              ))}
              {!videos.length && <p className="empty-state">No videos uploaded yet.</p>}
            </div>
          </section>
        )}
        {activeSection === "subscriptions" && (
          <section className="library admin-table-page">
            <div className="library-head"><div><h2>Subscriptions</h2><p>Users and their current package access.</p></div></div>
            <div className="admin-table">
              {subscriptions.map((item) => (
                <article key={item.id}>
                  <div><strong>{users.find((user) => user.id === item.user_id)?.email || item.user_id}</strong><small>{item.packages?.name || "Unknown package"}</small></div>
                  <span className={`status-pill ${item.status}`}>{item.status}</span>
                  <small>Expires {new Date(item.expires_at).toLocaleDateString("en-IN")}</small>
                </article>
              ))}
              {!busy && !subscriptions.length && <p className="empty-state">No subscriptions found.</p>}
            </div>
          </section>
        )}
        {activeSection === "users" && (
          <section className="library admin-table-page">
            <div className="library-head"><div><h2>Users</h2><p>Verified Fitora member profiles.</p></div></div>
            <div className="admin-table">
              {users.map((user) => (
                <article key={user.id}>
                  <div><strong>{user.full_name || "Fitora member"}</strong><small>{user.email}</small></div>
                  <span>{user.phone || "No phone"}</span>
                  <small>Joined {new Date(user.created_at).toLocaleDateString("en-IN")}</small>
                </article>
              ))}
              {!busy && !users.length && <p className="empty-state">No verified users found.</p>}
            </div>
          </section>
        )}
      </section>
      {showForm && (
        <div className="modal-backdrop">
          <section className="modal" role="dialog" aria-modal="true">
            <header>
              <div>
                <small>NEW PROGRAM</small>
                <h2>Create package</h2>
              </div>
              <button onClick={() => setShowForm(false)}>×</button>
            </header>
            <form onSubmit={createPackage}>
              <label>
                Package name
                <input
                  name="name"
                  required
                  placeholder="e.g. Muscle Strength"
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  required
                  placeholder="What will members achieve?"
                />
              </label>
              <div className="form-row">
                <label>
                  Price (₹)
                  <input name="price" type="number" min="0" required />
                </label>
                <label>
                  Access duration (days)
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    defaultValue="30"
                    required
                  />
                </label>
              </div>
              <label className="toggle">
                <input name="active" type="checkbox" defaultChecked />
                <span />
                Publish in the mobile app
              </label>
              <footer>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? "Creating…" : "Create package"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {selected && (
        <div className="drawer-backdrop">
          <aside className="drawer">
            <header>
              <div>
                <small>PACKAGE LIBRARY</small>
                <h2>{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="video-list">
              {packageVideos.map((video) => (
                <article key={video.id}>
                  <div className={`video-state ${video.status}`}>
                    {video.status === "ready" ? "▶" : "↑"}
                  </div>
                  <div>
                    <strong>{video.title}</strong>
                    <small>
                      {video.trainer} · {video.status}
                    </small>
                    {video.error_message && <em>{video.error_message}</em>}
                  </div>
                  <span>
                    {video.is_published ? "Published" : "Not published"}
                  </span>
                </article>
              ))}
            </div>
            <form className="upload-form" onSubmit={uploadVideo}>
              <h3>Upload a new video</h3>
              <label>
                Video title
                <input
                  name="title"
                  required
                  placeholder="e.g. Barbell fundamentals"
                />
              </label>
              <label>
                Trainer
                <input name="trainer" defaultValue="Coach Kal" required />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  placeholder="What does this session cover?"
                />
              </label>
              <label>
                Video file
                <input
                  ref={fileRef}
                  name="file"
                  type="file"
                  accept="video/*"
                  required
                />
              </label>
              {uploadProgress !== null && (
                <div className="progress">
                  <span style={{ width: `${uploadProgress}%` }} />
                  <small>{uploadProgress}% uploaded</small>
                </div>
              )}
              <button className="primary" disabled={busy}>
                {busy ? "Uploading…" : "Upload directly to Mux"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
