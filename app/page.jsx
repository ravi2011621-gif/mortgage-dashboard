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
import {
  Activity,
  TrendingUp,
  Building2,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

const RANGE_OPTIONS = [
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" },
  { key: "5y", label: "5Y" },
  { key: "10y", label: "10Y" },
  { key: "15y", label: "15Y" },
];

const DEFAULT_SCENARIO = {
  zip: "20433",
  purchasePrice: 595000,
  downPaymentPct: 20,
  creditBand: "760-779",
  termYears: 30,
  product: "30Y Fixed",
};

const CURATED_LENDERS = [
  { id: "uwm", lender: "United Wholesale Mortgage (UWM)", rateAdj: -0.06, aprAdj: -0.01 },
  { id: "rocket", lender: "Rocket Mortgage", rateAdj: 0.06, aprAdj: 0.11 },
  { id: "loandepot", lender: "loanDepot", rateAdj: 0.02, aprAdj: 0.07 },
  { id: "pennymac", lender: "Pennymac", rateAdj: -0.01, aprAdj: 0.04 },
  { id: "newrez", lender: "NewRez", rateAdj: 0.01, aprAdj: 0.05 },
  { id: "bofa", lender: "Bank of America", rateAdj: 0.03, aprAdj: 0.08 },
  { id: "chase", lender: "JPMorgan Chase", rateAdj: 0.02, aprAdj: 0.07 },
  { id: "wells", lender: "Wells Fargo", rateAdj: 0.04, aprAdj: 0.08 },
  { id: "navyfed", lender: "Navy Federal", rateAdj: -0.03, aprAdj: 0.01 },
  { id: "guild", lender: "Guild Mortgage", rateAdj: 0.0, aprAdj: 0.05 },
  { id: "crosscountry", lender: "CrossCountry Mortgage", rateAdj: 0.03, aprAdj: 0.09 },
  { id: "fairway", lender: "Fairway Mortgage", rateAdj: 0.01, aprAdj: 0.07 },
  { id: "veteransunited", lender: "Veterans United", rateAdj: -0.02, aprAdj: 0.03 },
  { id: "usbank", lender: "U.S. Bank", rateAdj: 0.03, aprAdj: 0.08 },
  { id: "amerihome", lender: "Amerihome Mortgage", rateAdj: -0.01, aprAdj: 0.04 },
  { id: "citi", lender: "CitiMortgage", rateAdj: 0.04, aprAdj: 0.08 },
  { id: "cmg", lender: "CMG Mortgage", rateAdj: 0.0, aprAdj: 0.06 },
  { id: "dhi", lender: "DHI Mortgage", rateAdj: 0.05, aprAdj: 0.1 },
  { id: "freedom", lender: "Freedom Mortgage", rateAdj: -0.01, aprAdj: 0.04 },
  { id: "lennar", lender: "Lennar Mortgage", rateAdj: 0.05, aprAdj: 0.1 },
  { id: "mrcooper", lender: "Mr. Cooper", rateAdj: 0.01, aprAdj: 0.06 },
  { id: "planet", lender: "Planet Home Lending", rateAdj: 0.0, aprAdj: 0.05 },
  { id: "rate", lender: "Rate", rateAdj: 0.02, aprAdj: 0.07 },
  { id: "truist", lender: "Truist Mortgage", rateAdj: 0.03, aprAdj: 0.08 },
];

const FOMC_MEETINGS = [
  {
    date: "2023-01-31",
    label: "Jan 31-Feb 1, 2023",
    rateChange: "+25 bps",
    targetRange: "4.50% - 4.75%",
    summary:
      "The Fed raised rates by 25 basis points and slowed the pace of tightening, but the overall tone remained restrictive.",
    keyPoints: [
      "Slower hike pace, still hawkish.",
      "Inflation easing but still elevated.",
      "Labor market remained tight.",
    ],
    mortgageView:
      "Mortgage-negative overall because the meeting kept long-end rate relief limited.",
  },
  {
    date: "2024-03-19",
    label: "Mar 19-20, 2024",
    rateChange: "No change",
    targetRange: "5.25% - 5.50%",
    summary:
      "The Fed held rates steady and emphasized that lower rates would require more confidence on inflation progress.",
    keyPoints: [
      "No policy move.",
      "Disinflation noted.",
      "Markets focused on cut timing.",
    ],
    mortgageView:
      "Neutral to mildly restrictive for mortgages because relief still depended on data confirmation.",
  },
  {
    date: "2025-03-18",
    label: "Mar 18-19, 2025",
    rateChange: "No change",
    targetRange: "4.25% - 4.50%",
    summary:
      "The Fed stayed patient and data-dependent, with inflation progress still uneven and labor conditions holding up.",
    keyPoints: [
      "No move.",
      "Inflation progress uneven.",
      "Labor resilient.",
    ],
    mortgageView:
      "Kept lender pricing discipline intact and limited immediate mortgage relief.",
  },
  {
    date: "2026-03-17",
    label: "Mar 17-18, 2026",
    rateChange: "No change",
    targetRange: "3.50% - 3.75%",
    summary:
      "The committee left rates unchanged but stressed upside inflation risks, reinforcing a higher-for-longer tone.",
    keyPoints: [
      "No move.",
      "Upside inflation risks highlighted.",
      "Treasury yields remained sensitive to tone.",
    ],
    mortgageView:
      "Mortgage-negative because restrictive messaging can keep yields and mortgage spreads sticky.",
  },
  {
    date: "2026-04-28",
    label: "Apr 28-29, 2026",
    rateChange: "Expected / upcoming",
    targetRange: "TBD",
    summary:
      "Markets will watch whether inflation cooling is strong enough to support a softer policy path.",
    keyPoints: [
      "Focus on inflation trajectory.",
      "Growth slowdown matters if labor weakens.",
      "Tone may matter more than action.",
    ],
    mortgageView:
      "Potential turning point if disinflation improves, but mortgages still need Treasury confirmation.",
  },
];

function formatPct(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}%`;
}

function formatDollar(value) {
  return value == null || Number.isNaN(Number(value))
    ? "—"
    : new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(value));
}

function monthlyPayment(principal, annualRate, termYears) {
  if (!principal || !annualRate || !termYears) return null;
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1)
  );
}

function getTrend(current, previous) {
  if (current == null || previous == null) return { direction: "flat", delta: 0 };
  const delta = +(Number(current) - Number(previous)).toFixed(2);
  if (delta > 0.01) return { direction: "up", delta };
  if (delta < -0.01) return { direction: "down", delta };
  return { direction: "flat", delta: 0 };
}

function cardStyle(bg = "#fff") {
  return {
    background: bg,
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  };
}

function TrendTag({ current, previous }) {
  const trend = getTrend(current, previous);

  if (trend.direction === "up") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          borderRadius: 999,
          background: "#fff1f2",
          color: "#be123c",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <ArrowUpRight size={12} /> +{trend.delta}%
      </div>
    );
  }

  if (trend.direction === "down") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          borderRadius: 999,
          background: "#ecfdf5",
          color: "#047857",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <ArrowDownRight size={12} /> {trend.delta}%
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        borderRadius: 999,
        background: "#f1f5f9",
        color: "#475569",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <Minus size={12} /> 0.00%
    </div>
  );
}

function NoDataBox({ text = "No chart data available for the selected range." }) {
  return (
    <div
      style={{
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed #cbd5e1",
        borderRadius: 18,
        color: "#64748b",
        fontSize: 14,
        background: "#fafafa",
      }}
    >
      {text}
    </div>
  );
}

function buildVolumeIntelligence(rows, betterRate) {
  const latest = rows.at(-1) ?? {};
  const prior = rows.at(-5) ?? rows.at(0) ?? {};
  const currentRate = latest.conforming30 ?? null;
  const prevRate = prior.conforming30 ?? currentRate;
  const marketRate = latest.conforming30 ?? null;

  function demandScore(current, previous) {
    if (current == null || previous == null) return 0;
    const delta = current - previous;
    if (delta <= -0.3) return 30;
    if (delta <= -0.15) return 20;
    if (delta < 0) return 10;
    if (delta < 0.15) return -5;
    if (delta < 0.3) return -15;
    return -25;
  }

  function pricingScore(better, market) {
    if (better == null || market == null) return 0;
    const diff = better - market;
    if (diff <= -0.1) return 25;
    if (diff <= -0.03) return 15;
    if (diff <= 0.03) return 5;
    if (diff <= 0.1) return -10;
    return -25;
  }

  function refiScore(current, avgBookRate = 7.25) {
    if (current == null) return 0;
    const spread = avgBookRate - current;
    if (spread >= 1.0) return 30;
    if (spread >= 0.75) return 20;
    if (spread >= 0.5) return 10;
    return 0;
  }

  function macroScore(data, prev) {
    let score = 0;
    if (data.treasury10 != null && prev.treasury10 != null && data.treasury10 < prev.treasury10) score += 10;
    if (data.inflationYoY != null && prev.inflationYoY != null && data.inflationYoY < prev.inflationYoY) score += 10;
    if (data.unemployment != null && prev.unemployment != null && data.unemployment > prev.unemployment) score -= 10;
    return score;
  }

  const demand = demandScore(currentRate, prevRate);
  const pricing = pricingScore(betterRate, marketRate);
  const refi = refiScore(currentRate);
  const macro = macroScore(latest, prior);
  const total = demand + pricing + refi + macro;

  let signal = "FLAT";
  let tone = "#475569";
  if (total >= 50) {
    signal = "STRONG ↑";
    tone = "#047857";
  } else if (total >= 20) {
    signal = "MODERATE ↑";
    tone = "#0f766e";
  } else if (total >= 0) {
    signal = "FLAT";
    tone = "#475569";
  } else if (total >= -20) {
    signal = "WEAK ↓";
    tone = "#c2410c";
  } else {
    signal = "SHARP DECLINE ↓";
    tone = "#be123c";
  }

  return {
    demand,
    pricing,
    refi,
    macro,
    total,
    signal,
    tone,
    betterVsMarket: betterRate != null && marketRate != null ? +(betterRate - marketRate).toFixed(3) : null,
    explanation:
      total >= 20
        ? "Lower or stabilizing rates, better pricing position, and improving refinance economics support stronger volume."
        : total >= 0
        ? "Signals are mixed. Volume may hold, but gains depend on pricing competitiveness and borrower response."
        : "Rates, pricing position, or macro conditions are not currently supportive of strong volume.",
  };
}

function buildHybridLenders(marketRate, scenario) {
  const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPct / 100);

  return CURATED_LENDERS.map((lender) => {
    const rate = +(marketRate + lender.rateAdj).toFixed(3);
    const apr = +(rate + lender.aprAdj).toFixed(3);
    const payment = monthlyPayment(loanAmount, rate, scenario.termYears);
    const deltaVsMarket = +(rate - marketRate).toFixed(3);

    return {
      ...lender,
      product: scenario.product,
      rate,
      apr,
      payment,
      deltaVsMarket,
      updatedAt: "Dynamic benchmark model",
    };
  }).sort((a, b) => a.apr - b.apr);
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

  const [scenario, setScenario] = React.useState(DEFAULT_SCENARIO);
  const [betterOffset, setBetterOffset] = React.useState(0);
  const [selectedMeeting, setSelectedMeeting] = React.useState(FOMC_MEETINGS[0]);

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
  const marketRate = latest.conforming30 ?? 6.25;
  const betterRate = +(marketRate + betterOffset).toFixed(3);
  const volumeIntel = buildVolumeIntelligence(rows, betterRate);
  const lenderRows = buildHybridLenders(marketRate, scenario);
  const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPct / 100);
  const betterPayment = monthlyPayment(loanAmount, betterRate, scenario.termYears);

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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Activity size={14} />
                Mortgage Dashboard
              </div>
              <h1 style={{ margin: "14px 0 0 0", fontSize: 42 }}>Mortgage + Macro Dashboard</h1>
              <p style={{ margin: "10px 0 0 0", color: "#64748b" }}>
                Stable live charts plus lender comparison, Fed context, and volume intelligence.
              </p>
            </div>

            <div style={{ minWidth: 280, ...cardStyle("#f8fafc"), padding: 16 }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {status.loading ? (
                  <RefreshCw size={16} />
                ) : status.error ? (
                  <WifiOff size={16} color="#be123c" />
                ) : (
                  <Wifi size={16} color="#047857" />
                )}
                {status.loading ? "Loading..." : status.error ? "Demo mode / error" : "Live data loaded"}
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
          ].map(([label, value, prevValue]) => (
            <div key={label} style={{ ...cardStyle(), padding: 18 }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>{formatPct(value)}</div>
              <div style={{ marginTop: 10 }}>
                <TrendTag current={value} previous={prevValue} />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
            gap: 16,
          }}
        >
          <div style={{ ...cardStyle(), padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingUp size={18} />
              <h2 style={{ margin: 0, fontSize: 22 }}>Volume Intelligence</h2>
            </div>
            <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
              Estimate how Better positioning and rate changes may influence volume.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div style={{ ...cardStyle("#f0fdf4"), padding: 16 }}>
                <div style={{ fontSize: 12, color: "#166534" }}>Volume outlook</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: volumeIntel.tone }}>
                  {volumeIntel.signal}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                  {volumeIntel.explanation}
                </div>
              </div>

              <div style={{ ...cardStyle("#eff6ff"), padding: 16 }}>
                <div style={{ fontSize: 12, color: "#1d4ed8" }}>Better vs market</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>
                  {volumeIntel.betterVsMarket != null
                    ? `${volumeIntel.betterVsMarket > 0 ? "+" : ""}${volumeIntel.betterVsMarket.toFixed(3)}%`
                    : "—"}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                  Better modeled rate: {formatPct(betterRate)}
                </div>
              </div>

              <div style={{ ...cardStyle("#fff7ed"), padding: 16 }}>
                <div style={{ fontSize: 12, color: "#c2410c" }}>Volume score</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{volumeIntel.total}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                  Demand {volumeIntel.demand} / Pricing {volumeIntel.pricing} / Refi {volumeIntel.refi} / Macro {volumeIntel.macro}
                </div>
              </div>

              <div style={{ ...cardStyle("#faf5ff"), padding: 16 }}>
                <div style={{ fontSize: 12, color: "#7c3aed" }}>Set Better offset</div>
                <input
                  type="range"
                  min="-0.25"
                  max="0.25"
                  step="0.01"
                  value={betterOffset}
                  onChange={(e) => setBetterOffset(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 12 }}
                />
                <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                  {betterOffset > 0 ? "+" : ""}
                  {betterOffset.toFixed(2)}% vs market
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                  Better payment: {formatDollar(betterPayment)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CalendarDays size={18} />
              <h2 style={{ margin: 0, fontSize: 22 }}>Fed Meetings</h2>
            </div>
            <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
              Policy context and mortgage interpretation.
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {FOMC_MEETINGS.map((meeting) => {
                const active = selectedMeeting.date === meeting.date;
                return (
                  <button
                    key={meeting.date}
                    onClick={() => setSelectedMeeting(meeting)}
                    style={{
                      border: active ? "none" : "1px solid #cbd5e1",
                      cursor: "pointer",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      background: active ? "#0f172a" : "#f8fafc",
                      color: active ? "#fff" : "#334155",
                    }}
                  >
                    {meeting.label}
                  </button>
                );
              })}
            </div>

            <div style={{ ...cardStyle("#f8fafc"), padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Selected meeting</div>
              <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800 }}>{selectedMeeting.label}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                {selectedMeeting.rateChange} · {selectedMeeting.targetRange}
              </div>
              <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
                {selectedMeeting.summary}
              </p>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>Key points</div>
              <ul style={{ paddingLeft: 18, color: "#334155" }}>
                {selectedMeeting.keyPoints.map((point) => (
                  <li key={point} style={{ marginBottom: 6, lineHeight: 1.5 }}>
                    {point}
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>Mortgage interpretation</div>
              <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
                {selectedMeeting.mortgageView}
              </p>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Building2 size={18} />
            <h2 style={{ margin: 0, fontSize: 22 }}>Lender Hybrid Comparison</h2>
          </div>
          <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
            Live benchmark-driven comparison with modeled payment for a fixed scenario.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>ZIP</div>
              <input
                value={scenario.zip}
                onChange={(e) => setScenario((p) => ({ ...p, zip: e.target.value }))}
                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Purchase price</div>
              <input
                type="number"
                value={scenario.purchasePrice}
                onChange={(e) => setScenario((p) => ({ ...p, purchasePrice: Number(e.target.value) }))}
                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Down payment %</div>
              <input
                type="number"
                value={scenario.downPaymentPct}
                onChange={(e) => setScenario((p) => ({ ...p, downPaymentPct: Number(e.target.value) }))}
                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Credit band</div>
              <select
                value={scenario.creditBand}
                onChange={(e) => setScenario((p) => ({ ...p, creditBand: e.target.value }))}
                style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
              >
                <option>720-739</option>
                <option>740-759</option>
                <option>760-779</option>
                <option>780+</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  {["Lender", "Product", "Rate", "APR", "Payment", "Δ vs Market", "Updated"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lenderRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>{row.lender}</td>
                    <td style={{ padding: "12px 14px" }}>{row.product}</td>
                    <td style={{ padding: "12px 14px" }}>{formatPct(row.rate)}</td>
                    <td style={{ padding: "12px 14px" }}>{formatPct(row.apr)}</td>
                    <td style={{ padding: "12px 14px" }}>{formatDollar(row.payment)}</td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: row.deltaVsMarket <= 0 ? "#047857" : "#be123c",
                        fontWeight: 700,
                      }}
                    >
                      {row.deltaVsMarket > 0 ? "+" : ""}
                      {row.deltaVsMarket.toFixed(3)}%
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                      {row.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <NoDataBox />
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          <div style={{ ...cardStyle(), padding: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Treasury Yields</h2>
            <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
              10Y, 2Y, and curve spread
            </p>

            {canRenderYields ? (
              <div style={{ width: "100%", height: 360 }}>
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
              <NoDataBox text="Not enough yield data to render chart." />
            )}
          </div>

          <div style={{ ...cardStyle(), padding: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Macro</h2>
            <p style={{ margin: "8px 0 16px 0", color: "#64748b" }}>
              Fed funds, inflation, unemployment
            </p>

            {canRenderMacro ? (
              <div style={{ width: "100%", height: 360 }}>
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
              <NoDataBox text="Not enough macro data to render chart." />
            )}
          </div>
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
            <NoDataBox text="Not enough spread data to render chart." />
          )}
        </div>
      </div>
    </div>
  );
}
