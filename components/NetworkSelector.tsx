"use client";

import { NETWORK_CONSTRAINTS, type Network } from "@/lib/networkConstraints";

interface Props {
  selected: Network | null;
  onSelect: (network: Network) => void;
}

export default function NetworkSelector({ selected, onSelect }: Props) {
  return (
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
          marginBottom: 16,
        }}
      >
        Réseau cible
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {(Object.keys(NETWORK_CONSTRAINTS) as Network[]).map((net, i) => {
          const c = NETWORK_CONSTRAINTS[net];
          const active = selected === net;
          return (
            <button
              key={net}
              onClick={() => onSelect(net)}
              className={`network-card reveal reveal-delay-${i + 1}`}
              style={
                active
                  ? {
                      borderColor: "var(--color-sunset)",
                      boxShadow: "var(--shadow-floating)",
                    }
                  : {}
              }
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
              <div
                style={{
                  fontFamily: "Clash Display, sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: active ? "var(--color-sunset)" : "var(--color-ink)",
                  marginBottom: 4,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted)",
                  fontFamily: "Satoshi, sans-serif",
                }}
              >
                ~{c.recommendedChars} car.
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
