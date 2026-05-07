"use client";

import { useState } from "react";
import ArticleInput from "@/components/ArticleInput";
import NetworkSelector from "@/components/NetworkSelector";
import ProfileAnalyzer from "@/components/ProfileAnalyzer";
import PostResult from "@/components/PostResult";
import NewsletterCTA from "@/components/NewsletterCTA";
import type { ArticleData, ProfileData } from "@/lib/scraper";
import type { Network } from "@/lib/networkConstraints";
import type { GeneratedPost } from "@/lib/mistral";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { n: 1, label: "Article" },
  { n: 2, label: "Réseau" },
  { n: 3, label: "Profil" },
  { n: 4, label: "Génération" },
  { n: 5, label: "Résultat" },
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  async function handleGenerate() {
    if (!article || !network || !profile) return;
    setGenerating(true);
    setGenError("");
    setStep(4);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article, network, userProfile: profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep(5);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erreur lors de la génération");
      setStep(3);
    } finally {
      setGenerating(false);
    }
  }

  function restart() {
    setStep(1);
    setArticle(null);
    setNetwork(null);
    setProfile(null);
    setResult(null);
    setGenError("");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>

      {/* ── Header ─────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,244,235,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--color-surface-sand)",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "Clash Display, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--color-sunset)",
                letterSpacing: "-0.5px",
              }}
            >
              ✦
            </span>
            <span
              style={{
                fontFamily: "Clash Display, sans-serif",
                fontWeight: 600,
                fontSize: 17,
                color: "var(--color-ink)",
                letterSpacing: "-0.3px",
              }}
            >
              Article → Post
            </span>
          </div>
          {step > 1 && (
            <button
              onClick={restart}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "Satoshi, sans-serif",
                fontSize: 14,
                color: "var(--color-muted)",
                padding: 0,
                transition: "color 0.2s",
              }}
            >
              Recommencer
            </button>
          )}
        </div>
      </header>

      {/* ── Hero (step 1 only) ──────────────────── */}
      {step === 1 && (
        <section
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "80px 24px 40px",
          }}
        >
          <p
            className="reveal"
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
            Content Marketing · IA
          </p>
          <h1
            className="reveal reveal-delay-1"
            style={{
              fontFamily: "Clash Display, sans-serif",
              fontWeight: 600,
              fontSize: "clamp(36px, 6vw, 56px)",
              lineHeight: 1.08,
              letterSpacing: "-0.5px",
              color: "var(--color-ink)",
              marginBottom: 20,
            }}
          >
            Un article.
            <br />
            <span style={{ color: "var(--color-sunset)" }}>Ton</span> post social.
          </h1>
          <p
            className="reveal reveal-delay-2"
            style={{
              fontFamily: "Satoshi, sans-serif",
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--color-body)",
              maxWidth: 520,
              marginBottom: 40,
            }}
          >
            Colle un lien, choisis ton réseau, donne ton profil — et reçois un post qui sonne vraiment comme toi.
          </p>

          {/* ── Description courte ── */}
          <div
            className="reveal reveal-delay-3"
            style={{
              padding: "28px 32px",
              background: "var(--color-surface-sand)",
              marginBottom: 8,
            }}
          >
            <p
              style={{
                fontFamily: "Satoshi, sans-serif",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--color-body)",
                marginBottom: 24,
              }}
            >
              <strong style={{ fontWeight: 600, color: "var(--color-ink)" }}>Article → Post</strong> est un outil IA qui transforme n'importe quel article en post prêt à publier sur LinkedIn, Instagram, X ou Reddit — personnalisé à ton style d'écriture, pas au style générique d'une IA.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
              }}
            >
              {[
                { n: "01", title: "Analyse l'article", desc: "On extrait les idées clés, le titre et le contexte de n'importe quelle URL." },
                { n: "02", title: "Capte ton style", desc: "Mistral analyse ton profil pour écrire avec tes mots, ton ton, ta façon de formuler." },
                { n: "03", title: "Génère et publie", desc: "Post optimisé pour le réseau choisi, avec hook d'accroche et image prête à l'emploi." },
              ].map((item) => (
                <div key={item.n}>
                  <p
                    style={{
                      fontFamily: "Clash Display, sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--color-sunset)",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    {item.n}
                  </p>
                  <p
                    style={{
                      fontFamily: "Satoshi, sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--color-ink)",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "Satoshi, sans-serif",
                      fontSize: 13,
                      color: "var(--color-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Steps progress ─────────────────────── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
        {step > 1 && (
          <div style={{ paddingTop: 40, paddingBottom: 8 }} />
        )}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  className={`step-badge ${step > s.n ? "done" : step === s.n ? "active" : "idle"}`}
                >
                  {step > s.n ? "✓" : s.n}
                </div>
                <span
                  style={{
                    fontFamily: "Satoshi, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 6,
                    color: step >= s.n ? "var(--color-sunset)" : "var(--color-muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`step-connector ${step > s.n ? "done" : "idle"}`}
                  style={{ margin: "0 4px" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Panel ──────────────────────────────── */}
        <div
          className="card reveal"
          style={{ padding: "40px 40px 36px", marginBottom: 80 }}
        >

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <StepHeader n={1} title="Colle l'URL de ton article" sub="On extrait le titre, le contenu et les idées clés." />
              <ArticleInput onArticleLoaded={(a) => setArticle(a)} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button disabled={!article} onClick={() => setStep(2)} className="btn-primary">
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <StepHeader n={2} title="Choisis ton réseau" sub="Format, longueur et style adaptés automatiquement." />
              <NetworkSelector selected={network} onSelect={(n) => setNetwork(n)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setStep(1)} className="btn-secondary">← Retour</button>
                <button disabled={!network} onClick={() => setStep(3)} className="btn-primary">Suivant →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && network && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <StepHeader n={3} title="Ton profil" sub="Le post sonnera comme toi — pas comme une IA." />
              <ProfileAnalyzer network={network} onProfileLoaded={(p) => setProfile(p)} />
              {genError && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#fdf2ee",
                    borderLeft: "3px solid var(--color-sunset)",
                    color: "var(--color-body)",
                    fontSize: 14,
                  }}
                >
                  {genError}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setStep(2)} className="btn-secondary">← Retour</button>
                <button disabled={!profile || generating} onClick={handleGenerate} className="btn-primary">
                  Générer mon post →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — loading */}
          {step === 4 && (
            <div
              style={{
                padding: "60px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: "3px solid var(--color-surface-sand)",
                  borderTopColor: "var(--color-sunset)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p
                style={{
                  fontFamily: "Clash Display, sans-serif",
                  fontWeight: 600,
                  fontSize: 20,
                  color: "var(--color-ink)",
                }}
              >
                Génération en cours…
              </p>
              <p style={{ fontFamily: "Satoshi, sans-serif", fontSize: 15, color: "var(--color-muted)" }}>
                Mistral rédige ton post personnalisé
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* STEP 5 — result */}
          {step === 5 && result && network && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <StepHeader n={5} title="Ton post est prêt !" sub="Modifie, copie, génère l'image." />
              <PostResult
                result={result}
                network={network}
                onEdit={(text) => setResult((r) => (r ? { ...r, post: text } : r))}
              />
              <div style={{ borderTop: "1px solid var(--color-surface-sand)", paddingTop: 20 }}>
                <button
                  onClick={restart}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Satoshi, sans-serif",
                    fontSize: 14,
                    color: "var(--color-muted)",
                    padding: 0,
                  }}
                >
                  ← Nouveau post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewsletterCTA />
    </main>
  );
}

function StepHeader({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div>
      <p
        style={{
          fontFamily: "Satoshi, sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-sunset)",
          marginBottom: 10,
        }}
      >
        Étape {n}
      </p>
      <h2
        style={{
          fontFamily: "Clash Display, sans-serif",
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1.15,
          letterSpacing: "-0.3px",
          color: "var(--color-ink)",
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "Satoshi, sans-serif",
          fontSize: 15,
          color: "var(--color-body)",
          lineHeight: 1.5,
        }}
      >
        {sub}
      </p>
    </div>
  );
}
