"use client";

import { useState } from "react";
import type { ProfileData } from "@/lib/scraper";
import type { Network } from "@/lib/networkConstraints";

interface Props {
  network: Network;
  onProfileLoaded: (profile: ProfileData) => void;
}

const PLACEHOLDERS: Record<string, string> = {
  linkedin: "https://www.linkedin.com/in/ton-profil",
  instagram: "https://www.instagram.com/ton_compte",
  x: "https://x.com/ton_compte",
  reddit: "https://www.reddit.com/user/ton_profil",
};

export default function ProfileAnalyzer({ network, onProfileLoaded }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tone: string; keywords: string[] } | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/scrape-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: url, network }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const profile: ProfileData = {
        bio: data.bio || "",
        recentPosts: data.recentPosts || [],
        tone: data.tone,
        keywords: data.keywords,
        manual: false,
      };
      setResult({ tone: data.tone, keywords: data.keywords });
      onProfileLoaded(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* URL input */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "Satoshi, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--color-muted)",
            marginBottom: 10,
          }}
        >
          URL de ton profil
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder={PLACEHOLDERS[network] || "https://..."}
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: 14, height: 14,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
                Analyse…
              </>
            ) : "Analyser →"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 6 }}>
          Mistral analyse ton style même si le profil est protégé — colle simplement l'URL publique.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px",
          background: "#fdf2ee",
          borderLeft: "3px solid var(--color-sunset)",
          color: "var(--color-body)",
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="reveal"
          style={{
            padding: 20,
            background: "var(--color-surface-sand)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 9, height: 9,
              borderRadius: "50%",
              background: "var(--color-sunset)",
              flexShrink: 0,
            }} />
            <p style={{
              fontFamily: "Clash Display, sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--color-ink)",
            }}>
              Style analysé : {result.tone}
            </p>
            <button
              onClick={() => { setResult(null); setUrl(""); }}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "Satoshi, sans-serif",
                fontSize: 12,
                color: "var(--color-muted)",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Changer
            </button>
          </div>
          {result.keywords.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.keywords.map((k) => (
                <span key={k} className="tag" style={{ background: "var(--color-ocean)", color: "#fff" }}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
