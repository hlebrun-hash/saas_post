"use client";

import { useRef, useState } from "react";

interface Props {
  generatedImageUrl: string | null;
  imagePrompt: string;
  onImageChange: (url: string) => void;
}

export default function ImagePicker({ generatedImageUrl, imagePrompt, onImageChange }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImageChange(data.imageUrl);
      setLocalPreview(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Génération impossible. Utilise le prompt ci-dessous dans Midjourney."
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageChange(URL.createObjectURL(file));
    setLocalPreview(URL.createObjectURL(file));
  }

  const displayImage = localPreview || generatedImageUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: "Clash Display, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--color-ink)",
          }}
        >
          Image
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            {generating ? "Génération..." : "Générer →"}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>
            Uploader
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>
      </div>

      {displayImage ? (
        <div
          style={{ position: "relative", overflow: "hidden" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={displayImage}
            alt="Image générée"
            style={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              display: "block",
              transition: "transform 0.6s var(--ease-fluid)",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
          />
          <a
            href={displayImage}
            download="post-image.webp"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(44,34,27,0.75)",
              color: "#fff",
              fontFamily: "Satoshi, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: 8,
              textDecoration: "none",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          >
            Télécharger
          </a>
        </div>
      ) : (
        <div
          style={{
            height: 120,
            border: "2px dashed var(--color-surface-sand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-muted)",
            fontFamily: "Satoshi, sans-serif",
            fontSize: 14,
          }}
        >
          Aucune image — génère ou uploade la tienne
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "16px 20px",
            background: "#fdf8ee",
            borderLeft: "3px solid var(--color-sunset)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 14, color: "var(--color-body)" }}>{error}</p>
          {imagePrompt && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Prompt Midjourney / DALL-E
              </p>
              <code
                style={{
                  display: "block",
                  fontSize: 12,
                  background: "var(--color-surface-sand)",
                  padding: "10px 14px",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  color: "var(--color-body)",
                }}
              >
                {imagePrompt}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
