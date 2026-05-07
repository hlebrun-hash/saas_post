"use client";

import { useState } from "react";

export default function NewsletterCTA() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Satoshi, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(247,244,235,0.6)",
    marginBottom: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(247,244,235,0.1)",
    border: "1.5px solid rgba(247,244,235,0.2)",
    borderRadius: 8,
    fontFamily: "Satoshi, sans-serif",
    fontSize: 15,
    color: "#F7F4EB",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
  };

  return (
    <section
      style={{
        background: "var(--color-ink)",
        padding: "80px 24px",
        marginTop: 0,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {success ? (
          <div className="reveal" style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                background: "var(--color-sunset)",
                borderRadius: "50%",
                fontSize: 24,
                marginBottom: 24,
              }}
            >
              ✓
            </div>
            <h3
              style={{
                fontFamily: "Clash Display, sans-serif",
                fontWeight: 600,
                fontSize: 28,
                color: "#F7F4EB",
                marginBottom: 12,
              }}
            >
              Tu es dans la liste.
            </h3>
            <p
              style={{
                fontFamily: "Satoshi, sans-serif",
                fontSize: 16,
                color: "rgba(247,244,235,0.6)",
                lineHeight: 1.6,
              }}
            >
              Prochaine newsletter dans ta boite mail. Reste connecté.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 60,
              alignItems: "center",
            }}
          >
            {/* Left — copy */}
            <div>
              <p
                style={{
                  fontFamily: "Satoshi, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-sunset)",
                  marginBottom: 16,
                }}
              >
                Newsletter
              </p>
              <h2
                style={{
                  fontFamily: "Clash Display, sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(28px, 4vw, 40px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.3px",
                  color: "#F7F4EB",
                  marginBottom: 20,
                }}
              >
                Les meilleurs posts,
                <br />
                <span style={{ color: "var(--color-sunset)" }}>directement</span> chez toi.
              </h2>
              <p
                style={{
                  fontFamily: "Satoshi, sans-serif",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "rgba(247,244,235,0.6)",
                }}
              >
                Conseils content marketing, templates, et nouveautés de l'outil — une fois par semaine, sans spam.
              </p>
            </div>

            {/* Right — form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Marie"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-sunset)";
                      e.currentTarget.style.background = "rgba(247,244,235,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(247,244,235,0.2)";
                      e.currentTarget.style.background = "rgba(247,244,235,0.1)";
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Dupont"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-sunset)";
                      e.currentTarget.style.background = "rgba(247,244,235,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(247,244,235,0.2)";
                      e.currentTarget.style.background = "rgba(247,244,235,0.1)";
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  placeholder="marie@exemple.com"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-sunset)";
                    e.currentTarget.style.background = "rgba(247,244,235,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(247,244,235,0.2)";
                    e.currentTarget.style.background = "rgba(247,244,235,0.1)";
                  }}
                />
              </div>

              {error && (
                <p
                  style={{
                    fontFamily: "Satoshi, sans-serif",
                    fontSize: 13,
                    color: "var(--color-sunset)",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              >
                {loading ? "Inscription…" : "Rejoindre la newsletter →"}
              </button>

              <p
                style={{
                  fontFamily: "Satoshi, sans-serif",
                  fontSize: 12,
                  color: "rgba(247,244,235,0.35)",
                  textAlign: "center",
                }}
              >
                Pas de spam. Désabonnement en un clic.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
