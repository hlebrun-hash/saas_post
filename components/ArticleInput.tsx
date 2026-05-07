"use client";

import { useState } from "react";
import type { ArticleData } from "@/lib/scraper";

interface Props {
  onArticleLoaded: (article: ArticleData) => void;
}

export default function ArticleInput({ onArticleLoaded }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ArticleData | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scrape-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      onArticleLoaded(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de lire l'article");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "Satoshi, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            marginBottom: 10,
          }}
        >
          URL de l'article
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://example.com/mon-article"
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
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Analyse...
              </>
            ) : (
              "Analyser →"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fdf2ee",
            borderLeft: "3px solid var(--color-sunset)",
            color: "var(--color-body)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {preview && (
        <div
          className="reveal"
          style={{
            display: "flex",
            gap: 16,
            padding: 20,
            background: "var(--color-surface-sand)",
          }}
        >
          {preview.image && (
            <div
              style={{
                width: 72,
                height: 72,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={preview.image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s var(--ease-fluid)",
                }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.transform =
                    "scale(1.05)")
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.transform =
                    "scale(1)")
                }
              />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: "Clash Display, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--color-ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {preview.title}
            </p>
            {preview.description && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-body)",
                  marginTop: 4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {preview.description}
              </p>
            )}
            <span
              className="tag"
              style={{
                marginTop: 10,
                background: "var(--color-sunset)",
                color: "#fff",
                fontSize: 12,
              }}
            >
              Article chargé
            </span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
