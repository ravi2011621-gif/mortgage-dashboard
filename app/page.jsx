"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

const RANGE_OPTIONS = [
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" },
  { key: "5y", label: "5Y" },
  { key: "10y", label: "10Y" },
  { key: "15y", label: "15Y" },
];

function formatPct(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}%`;
}

function cardStyle(bg = "#fff") {
  return {
    background: bg,
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  };
}

export default function Page() {
  const [range, setRange] = React.useState("5y");
  const [rows, setRows] = React.useState([]);
  const [status, setStatus] = React.useState({
    loading: true,
    error: null,
    fetchedAt: null,
    helocSource: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setStatus((s) => ({ ...s, loading: true, error: null }));

        const res = await fetch(`/api/fred-data?range=${encodeURIComponent(range)}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "fred-data route failed");
        }

        const cleaned = (json.data || []).filter(
          (r) =>
            r &&
            r.date &&
            (
              r.conforming30 != null ||
              r.conforming15 != null ||
              r.fha30 != null ||
              r.va30 != null ||
              r.jumbo30 != null ||
              r.heloc != null ||
              r.treasury10 != null ||
              r.treasury2 != null ||
              r.fedFunds != null ||
              r.unemployment != null ||
              r.inflationYoY != null ||
              r.mortgageSpread != null ||
              r.curveSpread != null
            )
        );

        if (!cancelled) {
          setRows(cleaned);
          setStatus({
            loading: false,
            error: null,
            fetchedAt: json.fetchedAt || null,
            helocSource: json.helocSource || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setRows([]);
          setStatus({
            loading: false,
            error: error.message || "Unknown error",
            fetchedAt: null,
            helocSource: null,
          });
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const latest = rows.at(-1) || {};
  const prev = rows.at(-5) || latest;

  const canRenderRates =
    rows.filter(
      (r) =>
        r.conforming30 != null ||
        r.conforming15 != null ||
        r.fha30 != null ||
        r.va30 != null ||
        r.jumbo30 != null ||
        r.heloc != null
    ).length >= 2;

  const canRenderMacro =
    rows.filter(
      (r) =>
        r.fedFunds != null ||
        r.inflationYoY != null ||
        r.unemployment != null
    ).length >= 2;

  const canRenderYields =
    rows.filter((r) => r.treasury10 != null || r.treasury2 != null || r.curveSpread != null).length >= 2;

  const canRenderSpread =
    rows.filter((r) => r.mortgageSpread != null || r.curveSpread != null).length >= 2;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  display: "inline-block",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Mortgage Dashboard
              </div>
              <h1 style={{ margin: "14px 0 0 0", fontSize: 38 }}>Charts Stabilized View</h1>
              <p style={{ margin: "10px 0 0 0", color: "#64748b" }}>
                This version is focused on making the charts render reliably first.
              </p>
            </div>

            <div style={{ minWidth: 280, ...cardStyle("#f8fafc"), padding: 16 }}>
              <div style={{ fontWeight: 700 }}>
                {status.loading ? "Loading..." : status.error ? "Error" : "Live data loaded"}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
                Rows: {rows.length}
              </div>
              <div style={{ marginTop: 4, fontSize: 14, color: "#475569" }}>
                HELOC source: {status.helocSource || "—"}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", wordBreak: "break-word" }}>
                {status.error || (status.fetchedAt ? `Fetched: ${status.fetchedAt}` : "Waiting for data")}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: "9px 14px",
                fontSize: 14,
                fontWeight: 700,
                background: range === option.key ? "#0f172a" : "#f1f5f9",
                color: range === option.key ? "#fff" : "#334155",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            ["30Y Fixed", latest.conforming30, prev.conforming30],
            ["15Y Fixed", latest.conforming15, prev.conforming15],
            ["FHA 30Y", latest.fha30, prev.fha30],
            ["VA 30Y", latest.va30, prev.va30],
            ["Jumbo 30Y", latest.jumbo30, prev.jumbo30],
            ["HELOC", latest.heloc, prev.heloc],
          ].map(([label, value, prevValue]) => {
            const delta =
              value != null && prevValue != null ? +(Number(value) - Number(prevValue)).toFixed(2) : null;

            return (
              <div key={label} style={{ ...cardStyle(), padding: 18 }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{label}</div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>{formatPct(value)}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: delta == null ? "#64748b" : delta > 0 ? "#be123c" : delta < 0 ? "#047857" : "#64748b",
                  }}
                >
                  {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}% vs prior`}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Mortgage Rates</h2>
          <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
            Products returned by the server route
          </p>

          {canRenderRates ? (
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPct(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="conforming30" name="30Y Conforming" stroke="#0f172a" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="conforming15" name="15Y Conforming" stroke="#475569" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="fha30" name="FHA 30Y" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="va30" name="VA 30Y" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="jumbo30" name="Jumbo 30Y" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="heloc" name="HELOC" stroke="#d97706" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 24, color: "#64748b" }}>Not enough rate data to render chart.</div>
          )}
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Treasury Yields</h2>
          <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
            10Y, 2Y, and curve spread
          </p>

          {canRenderYields ? (
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPct(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="treasury10" name="10Y Treasury" stroke="#166534" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="treasury2" name="2Y Treasury" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="curveSpread" name="10Y-2Y Spread" stroke="#a16207" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 24, color: "#64748b" }}>Not enough yield data to render chart.</div>
          )}
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Macro</h2>
          <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
            Fed funds, inflation, unemployment
          </p>

          {canRenderMacro ? (
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPct(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="fedFunds" name="Fed Funds" stroke="#7c3aed" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="inflationYoY" name="Inflation YoY" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="unemployment" name="Unemployment" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 24, color: "#64748b" }}>Not enough macro data to render chart.</div>
          )}
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Mortgage Spread</h2>
          <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
            Conforming 30Y minus 10Y Treasury
          </p>

          {canRenderSpread ? (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPct(value)} />
                  <ReferenceLine y={0} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="mortgageSpread"
                    name="Mortgage Spread"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.25}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 24, color: "#64748b" }}>Not enough spread data to render chart.</div>
          )}
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Debug snapshot</h2>
          <div style={{ marginTop: 12, fontSize: 13, color: "#475569", overflowX: "auto" }}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify(
  {
    rows: rows.length,
    firstRow: rows[0] || null,
    lastRow: rows.at(-1) || null,
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
