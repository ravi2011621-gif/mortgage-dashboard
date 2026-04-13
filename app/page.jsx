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
} from "recharts";

const RANGE_OPTIONS = [
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" },
  { key: "5y", label: "5Y" },
  { key: "10y", label: "10Y" },
  { key: "custom", label: "Custom" },
];

function formatPct(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return `${Number(v).toFixed(2)}%`;
}

function formatDelta(v) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function cardStyle() {
  return {
    background: "#fff",
    padding: 16,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 18px rgba(15,23,42,0.04)",
  };
}

function summaryCard(title, value, change) {
  const positive = Number.isFinite(change) ? change >= 0 : null;
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800, marginTop: 10 }}>{formatPct(value)}</div>
      <div
        style={{
          marginTop: 10,
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          background:
            positive == null ? "#f3f4f6" : positive ? "#fff1f2" : "#ecfdf5",
          color: positive == null ? "#6b7280" : positive ? "#be123c" : "#047857",
        }}
      >
        {formatDelta(change)}
      </div>
    </div>
  );
}

function getStartDate(range) {
  const now = new Date();
  const d = new Date(now);
  if (range === "6m") d.setMonth(now.getMonth() - 6);
  if (range === "1y") d.setFullYear(now.getFullYear() - 1);
  if (range === "3y") d.setFullYear(now.getFullYear() - 3);
  if (range === "5y") d.setFullYear(now.getFullYear() - 5);
  if (range === "10y") d.setFullYear(now.getFullYear() - 10);
  return d;
}

function filterRows(rows, range, custom) {
  if (!Array.isArray(rows)) return [];
  if (range !== "custom") {
    const start = getStartDate(range);
    return rows.filter((r) => new Date(r.date) >= start);
  }

  return rows.filter((r) => {
    const d = new Date(r.date);
    if (custom.start && d < new Date(custom.start)) return false;
    if (custom.end && d > new Date(custom.end)) return false;
    return true;
  });
}

function buildStats(rows, key) {
  const values = rows
    .map((r) => r[key])
    .filter((v) => v != null && Number.isFinite(Number(v)))
    .map(Number);

  if (!values.length) {
    return {
      latest: null,
      change: null,
      low: null,
      high: null,
    };
  }

  const latest = values[values.length - 1];
  const prior = values.length > 1 ? values[0] : latest;

  return {
    latest,
    change: +(latest - prior).toFixed(2),
    low: Math.min(...values),
    high: Math.max(...values),
  };
}

function buildLenders(marketRate) {
  const lenders = [
    ["Better", 0.0],
    ["UWM", -0.06],
    ["Rocket", 0.06],
    ["Chase", 0.02],
    ["Wells Fargo", 0.04],
    ["BofA", 0.03],
    ["Pennymac", -0.01],
    ["LoanDepot", 0.02],
    ["Navy Fed", -0.03],
    ["Veterans United", -0.02],
  ];

  return lenders.map(([name, adj]) => {
    const rate = +(marketRate + adj).toFixed(2);
    return {
      lender: name,
      rate,
      delta: +(rate - marketRate).toFixed(2),
    };
  });
}

function ChartControls({ title, range, setRange, custom, setCustom }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {RANGE_OPTIONS.map((r) => (
          <button
            key={`${title}-${r.key}`}
            onClick={() => setRange(r.key)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              background: range === r.key ? "#0f172a" : "#eef2f7",
              color: range === r.key ? "#fff" : "#334155",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <input
            type="date"
            value={custom.start}
            onChange={(e) => setCustom((prev) => ({ ...prev, start: e.target.value }))}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          />
          <input
            type="date"
            value={custom.end}
            onChange={(e) => setCustom((prev) => ({ ...prev, end: e.target.value }))}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          />
        </div>
      )}
    </div>
  );
}

function StatsPanel({ items }) {
  return (
    <div style={{ ...cardStyle(), height: "100%" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            padding: "12px 0",
            borderBottom: "1px solid #edf2f7",
          }}
        >
          <span style={{ color: "#64748b", fontSize: 14 }}>{item.label}</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [rows, setRows] = React.useState([]);
  const [status, setStatus] = React.useState("loading");

  const [ranges, setRanges] = React.useState({
    treasury: "1y",
    spread: "5y",
    mortgage: "10y",
  });

  const [customRanges, setCustomRanges] = React.useState({
    treasury: { start: "", end: "" },
    spread: { start: "", end: "" },
    mortgage: { start: "", end: "" },
  });

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fred-data?range=15y", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error("Bad response");
        setRows(Array.isArray(json.data) ? json.data : []);
        setStatus("live");
      } catch {
        setStatus("error");
      }
    }

    load();
  }, []);

  const latest = rows.at(-1) || {};
  const prev = rows.at(-5) || latest;

  const inflationValue =
    latest.inflationYoY != null && Number.isFinite(Number(latest.inflationYoY))
      ? latest.inflationYoY
      : null;
  const inflationPrev =
    prev.inflationYoY != null && Number.isFinite(Number(prev.inflationYoY))
      ? prev.inflationYoY
      : null;

  const treasuryRows = filterRows(rows, ranges.treasury, customRanges.treasury);
  const spreadRows = filterRows(rows, ranges.spread, customRanges.spread);
  const mortgageRows = filterRows(rows, ranges.mortgage, customRanges.mortgage);

  const treasuryStats10 = buildStats(treasuryRows, "treasury10");
  const treasuryStats2 = buildStats(treasuryRows, "treasury2");
  const spreadStats = buildStats(spreadRows, "mortgageSpread");
  const mbsCondition =
  spreadStats.change == null
    ? "Neutral"
    : spreadStats.change < 0
    ? "Positive"
    : "Negative";
  const mortgageStats30 = buildStats(mortgageRows, "conforming30");
  const helocStats = buildStats(mortgageRows, "heloc");

  const marketRate = latest.conforming30 || 6;
  const lenders = buildLenders(marketRate);

  const chartWrapStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.7fr)",
    gap: 20,
    alignItems: "stretch",
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle(),
            padding: 24,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                background: "#dbeafe",
                color: "#1d4ed8",
                padding: "8px 14px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Mortgage Dashboard
            </div>
            <h1 style={{ fontSize: 56, margin: "18px 0 8px", lineHeight: 1.05 }}>
              Mortgage + Macro Dashboard
            </h1>
            <div style={{ color: "#64748b", fontSize: 16 }}>
              Separate chart filters, stable live charts, and lender positioning.
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 18, minWidth: 280 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {status === "live" ? "Live data loaded" : "Error / Demo"}
            </div>
            <div style={{ marginTop: 10, color: "#475569" }}>Rows: {rows.length}</div>
            <div style={{ marginTop: 6, color: "#475569" }}>
              HELOC source: {latest.heloc != null ? "fred" : "—"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {summaryCard(
            "30Y",
            latest.conforming30,
            latest.conforming30 != null && prev.conforming30 != null
              ? latest.conforming30 - prev.conforming30
              : null
          )}
          {summaryCard(
            "15Y",
            latest.conforming15,
            latest.conforming15 != null && prev.conforming15 != null
              ? latest.conforming15 - prev.conforming15
              : null
          )}
          {summaryCard(
            "FHA",
            latest.fha30,
            latest.fha30 != null && prev.fha30 != null ? latest.fha30 - prev.fha30 : null
          )}
          {summaryCard(
            "VA",
            latest.va30,
            latest.va30 != null && prev.va30 != null ? latest.va30 - prev.va30 : null
          )}
          {summaryCard(
            "HELOC",
            latest.heloc,
            latest.heloc != null && prev.heloc != null ? latest.heloc - prev.heloc : null
          )}
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 14px" }}>Forward Signals</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {summaryCard(
            "Inflation YoY",
            inflationValue,
            inflationValue != null && inflationPrev != null ? inflationValue - inflationPrev : null
          )}
          {summaryCard(
            "Fed Funds",
            latest.fedFunds,
            latest.fedFunds != null && prev.fedFunds != null ? latest.fedFunds - prev.fedFunds : null
          )}
          {summaryCard(
            "Unemployment",
            latest.unemployment,
            latest.unemployment != null && prev.unemployment != null
              ? latest.unemployment - prev.unemployment
              : null
          )}
          {summaryCard(
            "10Y Treasury",
            latest.treasury10,
            latest.treasury10 != null && prev.treasury10 != null
              ? latest.treasury10 - prev.treasury10
              : null
          )}
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 10px" }}>Treasury</h2>
        <ChartControls
          title="treasury"
          range={ranges.treasury}
          setRange={(v) => setRanges((p) => ({ ...p, treasury: v }))}
          custom={customRanges.treasury}
          setCustom={(updater) =>
            setCustomRanges((p) => ({
              ...p,
              treasury: typeof updater === "function" ? updater(p.treasury) : updater,
            }))
          }
        />
        <div style={{ ...chartWrapStyle, marginBottom: 28 }}>
          <div style={{ ...cardStyle(), padding: 14, height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={treasuryRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis />
                <Tooltip formatter={(value) => formatPct(value)} />
                <Legend />
                <Line type="monotone" dataKey="treasury10" name="10Y Treasury" stroke="#166534" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="treasury2" name="2Y Treasury" stroke="#0f766e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <StatsPanel
            items={[
              { label: "10Y latest", value: formatPct(treasuryStats10.latest) },
              { label: "10Y change", value: formatPct(treasuryStats10.change) },
              { label: "10Y low", value: formatPct(treasuryStats10.low) },
              { label: "10Y high", value: formatPct(treasuryStats10.high) },
              { label: "2Y latest", value: formatPct(treasuryStats2.latest) },
              { label: "2Y change", value: formatPct(treasuryStats2.change) },
              { label: "2Y low", value: formatPct(treasuryStats2.low) },
              { label: "2Y high", value: formatPct(treasuryStats2.high) },
            ]}
          />
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 10px" }}>Mortgage Spread</h2>
        <ChartControls
          title="spread"
          range={ranges.spread}
          setRange={(v) => setRanges((p) => ({ ...p, spread: v }))}
          custom={customRanges.spread}
          setCustom={(updater) =>
            setCustomRanges((p) => ({
              ...p,
              spread: typeof updater === "function" ? updater(p.spread) : updater,
            }))
          }
        />
        <div style={{ ...chartWrapStyle, marginBottom: 28 }}>
          <div style={{ ...cardStyle(), padding: 14, height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spreadRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis />
                <Tooltip formatter={(value) => formatPct(value)} />
                <Area
                  type="monotone"
                  dataKey="mortgageSpread"
                  name="Mortgage Spread"
                  stroke="#f97316"
                  fill="#fed7aa"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <StatsPanel
            items={[
              { label: "Spread latest", value: formatPct(spreadStats.latest) },
              { label: "Spread change", value: formatPct(spreadStats.change) },
              { label: "Spread low", value: formatPct(spreadStats.low) },
              { label: "Spread high", value: formatPct(spreadStats.high) },
              {
                label: "Trend",
                value:
                  spreadStats.change == null
                    ? "—"
                    : spreadStats.change <= 0
                    ? "Improving"
                    : "Worsening",
              },
              {
  label: "MBS condition",
  value: mbsCondition,
},
            ]}
          />
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 10px" }}>Mortgage Rates</h2>
        <ChartControls
          title="mortgage"
          range={ranges.mortgage}
          setRange={(v) => setRanges((p) => ({ ...p, mortgage: v }))}
          custom={customRanges.mortgage}
          setCustom={(updater) =>
            setCustomRanges((p) => ({
              ...p,
              mortgage: typeof updater === "function" ? updater(p.mortgage) : updater,
            }))
          }
        />
        <div style={{ ...chartWrapStyle, marginBottom: 28 }}>
          <div style={{ ...cardStyle(), padding: 14, height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mortgageRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis />
                <Tooltip formatter={(value) => formatPct(value)} />
                <Legend />
                <Line type="monotone" dataKey="conforming15" name="15Y Conforming" stroke="#475569" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="conforming30" name="30Y Conforming" stroke="#0f172a" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="fha30" name="FHA 30Y" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="heloc" name="HELOC" stroke="#ea580c" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="jumbo30" name="Jumbo 30Y" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="va30" name="VA 30Y" stroke="#0f766e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <StatsPanel
            items={[
              { label: "30Y latest", value: formatPct(mortgageStats30.latest) },
              { label: "30Y change", value: formatPct(mortgageStats30.change) },
              { label: "30Y low", value: formatPct(mortgageStats30.low) },
              { label: "30Y high", value: formatPct(mortgageStats30.high) },
              { label: "HELOC latest", value: formatPct(helocStats.latest) },
              { label: "HELOC change", value: formatPct(helocStats.change) },
              { label: "HELOC low", value: formatPct(helocStats.low) },
              { label: "HELOC high", value: formatPct(helocStats.high) },
            ]}
          />
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 12px" }}>Lender Comparison</h2>
        <div style={{ ...cardStyle(), padding: 16, overflowX: "auto", marginBottom: 28 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                <th style={{ padding: "10px 8px" }}>Lender</th>
                <th style={{ padding: "10px 8px" }}>Rate</th>
                <th style={{ padding: "10px 8px" }}>Δ vs Market</th>
              </tr>
            </thead>
            <tbody>
              {lenders.map((l) => (
                <tr key={l.lender} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 700 }}>{l.lender}</td>
                  <td style={{ padding: "12px 8px" }}>{formatPct(l.rate)}</td>
                  <td
                    style={{
                      padding: "12px 8px",
                      color: l.delta <= 0 ? "#047857" : "#be123c",
                      fontWeight: 700,
                    }}
                  >
                    {formatDelta(l.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 34, margin: "28px 0 12px" }}>Volume Intelligence</h2>
        <div style={{ ...cardStyle(), padding: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            Market Trend:{" "}
            {latest.conforming30 != null &&
            prev.conforming30 != null &&
            latest.conforming30 < prev.conforming30
              ? "Rates Falling → Volume ↑"
              : "Rates Rising / Flat → Volume ↓ or Neutral"}
          </div>
        </div>
      </div>
    </div>
  );
}
