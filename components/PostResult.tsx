"use client";

import { useState } from "react";
import type { GeneratedPost } from "@/lib/mistral";
import ImagePicker from "./ImagePicker";

interface Props {
  result: GeneratedPost;
  network: string;
  onEdit: (post: string) => void;
}

export default function PostResult({ result, network, onEdit }: Props) {
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(result.post);

  function handleCopy() {
    const content =
      network === "reddit" && result.title
        ? `${result.title}\n\n${text}`
        : text;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Reddit title */}
      {network === "reddit" && result.title && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--color-surface-sand)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              marginBottom: 8,
              fontFamily: "Satoshi, sans-serif",
            }}
          >
            Titre Reddit
          </p>
          <p
            style={{
              fontFamily: "Clash Display, sans-serif",
              fontWeight: 600,
              fontSize: 16,
              color: "var(--color-ink)",
            }}
          >
            {result.title}
          </p>
        </div>
      )}

      {/* Post body */}
      <div style={{ background: "var(--color-surface-light)", boxShadow: "var(--shadow-soft)" }}>
        {editing ? (
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onEdit(e.target.value);
            }}
            rows={10}
            style={{
              width: "100%",
              padding: "20px 24px",
              fontFamily: "Satoshi, sans-serif",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--color-ink)",
              border: "none",
              outline: "none",
              resize: "vertical",
              background: "transparent",
            }}
          />
        ) : (
          <div
            style={{
              padding: "20px 24px",
              fontFamily: "Satoshi, sans-serif",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--color-ink)",
              whiteSpace: "pre-wrap",
              minHeight: 120,
            }}
          >
            {text}
          </div>
        )}

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            background: "var(--color-surface-sand)",
            borderTop: "1px solid rgba(44,34,27,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: "Satoshi, sans-serif",
              fontSize: 12,
              color: "var(--color-muted)",
            }}
          >
            {text.length} caractères
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setEditing((v) => !v)}
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              {editing ? "Terminer" : "Modifier"}
            </button>
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{
                padding: "8px 20px",
                fontSize: 13,
                background: copied ? "var(--color-ocean)" : "var(--color-sunset)",
              }}
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
        </div>
      </div>

      {/* Image */}
      <ImagePicker
        generatedImageUrl={imageUrl}
        imagePrompt={result.imagePrompt}
        onImageChange={setImageUrl}
      />
    </div>
  );
}
