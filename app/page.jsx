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
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Info,
  Minus,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  CircleDollarSign,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const AUTO_REFRESH_MS = 15 * 60 * 1000;

const RANGE_OPTIONS = [
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" },
  { key: "5y", label: "5Y" },
  { key: "10y", label: "10Y" },
  { key: "15y", label: "15Y" },
  { key: "custom", label: "Custom" },
];

const DEFAULT_CHART_RANGES = {
  rates: "5y",
  macro: "5y",
  spread: "5y",
  yields: "5y",
};

const DEFAULT_SCENARIO = {
  zip: "20433",
  purchasePrice: 595000,
  downPaymentPct: 20,
  creditBand: "760-779",
  termYears: 30,
  product: "30Y Fixed",
};

const CURATED_LENDERS = [
  { id: "penfed", lender: "PenFed", product: "30Y Fixed", rateAdj: -0.08, aprAdj: -0.03, fees: 2800, points: 0.35, updatedAt: "Live scenario model", style: "Low upfront" },
  { id: "mutual_omaha", lender: "Mutual of Omaha Mortgage", product: "30Y Fixed", rateAdj: -0.04, aprAdj: 0.02, fees: 3600, points: 0.79, updatedAt: "Live scenario model", style: "Balanced" },
  { id: "reliant", lender: "Reliant Home Funding", product: "30Y Fixed", rateAdj: -0.02, aprAdj: 0.05, fees: 4200, points: 0.64, updatedAt: "Live scenario model", style: "Low payment" },
  { id: "first_residential", lender: "First Residential", product: "30Y Fixed", rateAdj: -0.01, aprAdj: 0.08, fees: 5400, points: 0.94, updatedAt: "Live scenario model", style: "Rate-focused" },
  { id: "navy_federal", lender: "Navy Federal", product: "30Y Fixed", rateAdj: -0.03, aprAdj: 0.01, fees: 3100, points: 0.42, updatedAt: "Live scenario model", style: "Balanced" },
  { id: "rocket", lender: "Rocket Mortgage", product: "30Y Fixed", rateAdj: 0.06, aprAdj: 0.11, fees: 2500, points: 0.12, updatedAt: "Live scenario model", style: "Convenience" },
  { id: "better", lender: "Better", product: "30Y Fixed", rateAdj: -0.05, aprAdj: 0.00, fees: 2900, points: 0.48, updatedAt: "Live scenario model", style: "Digital" },
  { id: "chase", lender: "Chase", product: "30Y Fixed", rateAdj: 0.02, aprAdj: 0.07, fees: 3300, points: 0.36, updatedAt: "Live scenario model", style: "Bank relationship" },
];

const FOMC_MEETINGS = [
  { date: "2023-01-31", label: "Jan 31-Feb 1, 2023", rateChange: "+25 bps", targetRange: "4.50% - 4.75%", keyPoints: ["Fed slowed the pace of hikes but kept tightening bias.", "Inflation acknowledged as easing, but still too high.", "Labor market remained very tight."], summary: "The Fed raised rates by 25 basis points and signaled that additional increases were still likely. Markets initially focused on the slower pace, but the underlying message remained restrictive.", mortgageView: "Mortgage-negative overall. Even with a smaller hike, the Fed kept the ceiling elevated for long-end rates and delayed hopes for broad mortgage relief." },
  { date: "2023-03-21", label: "Mar 21-22, 2023", rateChange: "+25 bps", targetRange: "4.75% - 5.00%", keyPoints: ["Decision came during regional bank stress.", "Fed balanced inflation risk against financial stability concerns.", "Forward guidance softened slightly."], summary: "The Fed raised rates while acknowledging tighter credit conditions from banking stress. Markets interpreted the meeting as less hawkish than prior ones, but uncertainty rose sharply.", mortgageView: "Volatility-positive but directionally mixed. Mortgage rates became more sensitive to risk sentiment and spread behavior rather than just Fed policy levels." },
  { date: "2023-07-25", label: "Jul 25-26, 2023", rateChange: "+25 bps", targetRange: "5.25% - 5.50%", keyPoints: ["Fed lifted rates to cycle highs.", "Inflation still above target despite progress.", "Policy described as data dependent."], summary: "The Fed delivered another quarter-point increase and preserved a restrictive stance. Markets understood that rates would stay high until inflation clearly normalized.", mortgageView: "Kept mortgage affordability under pressure by supporting elevated Treasury yields and limiting expectations for near-term easing." },
  { date: "2024-03-19", label: "Mar 19-20, 2024", rateChange: "No change", targetRange: "5.25% - 5.50%", keyPoints: ["Fed held rates steady.", "Disinflation progress noted but not declared complete.", "Markets looked for signals on future cuts."], summary: "The committee kept rates unchanged and maintained a cautious tone. The message was that lower rates would require sustained proof from inflation data, not just optimism.", mortgageView: "Mortgage markets treated this as a reminder that rate relief needed real data confirmation, keeping borrowers in a waiting pattern." },
  { date: "2024-09-17", label: "Sep 17-18, 2024", rateChange: "No change", targetRange: "5.00% - 5.25%", keyPoints: ["Focus shifted toward growth slowdown risk.", "Guidance mattered more than the hold itself.", "Treasury reaction drove mortgage repricing."], summary: "Markets focused on whether slowing growth would justify a softer future path. The Fed remained careful, but long-end yields moved mostly on interpretation rather than the actual policy move.", mortgageView: "Mortgage pricing became more expectation-driven, with Treasury yields doing most of the directional work." },
  { date: "2025-03-18", label: "Mar 18-19, 2025", rateChange: "No change", targetRange: "4.25% - 4.50%", keyPoints: ["Inflation progress remained uneven.", "Fed did not want to over-commit to cuts.", "Labor conditions still resilient."], summary: "The Fed held steady and emphasized that inflation progress remained uneven. Markets stayed cautious because the policy path still depended heavily on incoming inflation and labor data.", mortgageView: "Preserved lender pricing discipline while limiting immediate mortgage relief for borrowers." },
  { date: "2025-12-09", label: "Dec 9-10, 2025", rateChange: "No change", targetRange: "3.75% - 4.00%", keyPoints: ["Year-end guidance shaped next-year expectations.", "Markets focused on the pace of future easing.", "Inflation durability remained a question."], summary: "Year-end guidance mattered more than the hold itself. Mortgage markets watched closely for clues on the coming year's easing path and the stability of inflation improvement.", mortgageView: "Important for lock behavior and forward pricing expectations into the new year." },
  { date: "2026-01-27", label: "Jan 27-28, 2026", rateChange: "No change", targetRange: "3.50% - 3.75%", keyPoints: ["Inflation still not fully back to target.", "Fed stayed cautious despite better disinflation.", "Markets pushed back expectations for rapid easing."], summary: "The Fed held rates steady and emphasized that inflation was still not fully back to target. Markets read the tone as cautious and restrictive.", mortgageView: "Mortgage-negative tone because it preserved higher-for-longer expectations and kept long-end yields sticky." },
  { date: "2026-03-17", label: "Mar 17-18, 2026", rateChange: "No change", targetRange: "3.50% - 3.75%", keyPoints: ["Upside inflation risks highlighted.", "Fed maintained restrictive messaging.", "Treasury yields moved up after the meeting."], summary: "The committee left rates unchanged but stressed upside inflation risks. That reinforced a higher-for-longer tone and contributed to upward pressure on mortgage coupons.", mortgageView: "Raised the risk of higher mortgage coupons through both benchmark yields and market sentiment." },
  { date: "2026-04-28", label: "Apr 28-29, 2026", rateChange: "Expected / upcoming", targetRange: "TBD", keyPoints: ["Focus likely on inflation trajectory.", "Growth slowdown will matter more if labor weakens.", "Markets will listen for tone more than action."], summary: "This meeting is expected to focus on whether inflation is cooling enough to justify a softer policy path. Markets will watch the statement and press conference carefully.", mortgageView: "Potential turning-point meeting if disinflation improves, but mortgage markets will still need Treasury confirmation." },
  { date: "2026-06-16", label: "Jun 16-17, 2026", rateChange: "Expected / upcoming", targetRange: "TBD", keyPoints: ["Could become an inflection window.", "Labor and inflation data will decide tone.", "Refi psychology would respond quickly to dovish language."], summary: "This is viewed as a possible inflection window if inflation and labor data continue to soften. Any change in the projected path of rates could ripple quickly through mortgage pricing.", mortgageView: "A softer tone here would likely matter more for refinance psychology than immediate purchase affordability." },
];

const fallbackSeries = Array.from({ length: 260 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (259 - i) * 7);
  const conforming30 = +(6.05 + i * 0.002 + Math.sin(i / 9) * 0.12).toFixed(2);
  const treasury10 = +(4.02 + i * 0.0011 + Math.sin(i / 10) * 0.08).toFixed(2);
  const treasury2 = +(3.77 + i * 0.0009 + Math.cos(i / 11) * 0.06).toFixed(2);
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    conforming30,
    conforming15: +(5.42 + i * 0.0017 + Math.sin(i / 10) * 0.09).toFixed(2),
    fha30: +(5.96 + i * 0.0018 + Math.sin(i / 8.5) * 0.1).toFixed(2),
    va30: +(5.86 + i * 0.0016 + Math.sin(i / 9.5) * 0.08).toFixed(2),
    jumbo30: +(6.24 + i * 0.0021 + Math.sin(i / 8.8) * 0.12).toFixed(2),
    heloc: +(7.45 + i * 0.001 + Math.sin(i / 11) * 0.06).toFixed(2),
    treasury10,
    treasury2,
    fedFunds: +(4.33 - Math.max(0, i - 180) * 0.0008).toFixed(2),
    unemployment: +(4.02 + Math.sin(i / 18) * 0.18).toFixed(2),
    inflationYoY: +(2.45 + Math.cos(i / 16) * 0.3).toFixed(2),
    mortgageSpread: +(conforming30 - treasury10).toFixed(2),
    curveSpread: +(treasury10 - treasury2).toFixed(2),
  };
});

function formatPct(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}%`;
}

function formatDollar(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function getSeriesColor(key) {
  const palette = {
    conforming30: "#0f172a",
    conforming15: "#475569",
    fha30: "#0ea5e9",
    va30: "#14b8a6",
    jumbo30: "#8b5cf6",
    heloc: "#f59e0b",
    treasury10: "#166534",
    treasury2: "#0f766e",
    fedFunds: "#7c3aed",
    inflationYoY: "#dc2626",
    unemployment: "#2563eb",
    mortgageSpread: "#f97316",
    curveSpread: "#a16207",
  };
  return palette[key] ?? "#334155";
}

function getTrend(current, previous) {
  if (current == null || previous == null) return { direction: "flat", delta: 0 };
  const delta = +(current - previous).toFixed(2);
  if (delta > 0.01) return { direction: "up", delta };
  if (delta < -0.01) return { direction: "down", delta };
  return { direction: "flat", delta: 0 };
}

function monthlyPayment(principal, annualRate, termYears) {
  if (!principal || !annualRate || !termYears) return null;
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function effective5YearCost(loanAmount, rate, fees) {
  const payment = monthlyPayment(loanAmount, rate, 30);
  if (!payment) return null;
  const monthlyRate = rate / 100 / 12;
  let balance = loanAmount;
  let interestPaid = 0;
  for (let i = 0; i < 60; i += 1) {
    const interest = balance * monthlyRate;
    const principal = payment - interest;
    interestPaid += interest;
    balance -= principal;
  }
  return +(interestPaid + (fees || 0)).toFixed(0);
}

function SimpleCard({ children, className = "", style = {} }) {
  return <div className={className} style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", ...style }}>{children}</div>;
}

function SectionHeader({ title, description, icon }) {
  return (
    <div style={{ padding: 20, paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon ? <span style={{ color: "#0f172a" }}>{icon}</span> : null}
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</div>
      </div>
      {description ? <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>{description}</div> : null}
    </div>
  );
}

function TrendPill({ current, previous }) {
  const trend = getTrend(current, previous);
  if (trend.direction === "up") return <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, background: "#fff1f2", color: "#be123c", padding: "6px 10px", fontSize: 12, fontWeight: 600 }}><ArrowUpRight size={12} />+{trend.delta}%</div>;
  if (trend.direction === "down") return <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, background: "#ecfdf5", color: "#047857", padding: "6px 10px", fontSize: 12, fontWeight: 600 }}><ArrowDownRight size={12} />{trend.delta}%</div>;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, background: "#f1f5f9", color: "#475569", padding: "6px 10px", fontSize: 12, fontWeight: 600 }}><Minus size={12} />0.00%</div>;
}

function Sparkline({ data, dataKey }) {
  if (!data?.length) return <div style={{ height: 56 }} />;
  return (
    <div style={{ height: 56, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKey} stroke={getSeriesColor(dataKey)} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function computeStartDate(rangeKey, customRange) {
  const now = new Date();
  if (rangeKey === "custom") return customRange.start ? new Date(customRange.start) : new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const selected = RANGE_OPTIONS.find((item) => item.key === rangeKey);
  const start = new Date(now);
  if (selected?.months) start.setMonth(start.getMonth() - selected.months);
  if (selected?.years) start.setFullYear(start.getFullYear() - selected.years);
  return start;
}

function filterSeriesByRange(series, rangeKey, customRange) {
  const start = computeStartDate(rangeKey, customRange);
  const end = rangeKey === "custom" && customRange.end ? new Date(customRange.end) : new Date();
  return series.filter((row) => {
    const d = new Date(row.date);
    return d >= start && d <= end;
  });
}

function densifySeries(series, keys) {
  return series.filter((row) => keys.some((key) => row[key] != null));
}

function buildAnalysis(series) {
  const latest = series.at(-1) ?? {};
  const prior = series.at(-5) ?? series.at(0) ?? {};
  const mortgageSpread = latest.mortgageSpread ?? (latest.conforming30 != null && latest.treasury10 != null ? +(latest.conforming30 - latest.treasury10).toFixed(2) : null);
  const previousSpread = prior.mortgageSpread ?? (prior.conforming30 != null && prior.treasury10 != null ? +(prior.conforming30 - prior.treasury10).toFixed(2) : null);
  const rateBias = latest.treasury10 > prior.treasury10 || latest.inflationYoY > prior.inflationYoY ? "Slight upward bias" : latest.unemployment > prior.unemployment ? "Slight downward bias" : "Range-bound bias";
  const factors = [
    { name: "Fed stance", score: latest.fedFunds >= 4 ? 74 : 55, level: latest.fedFunds, detail: "A restrictive Fed keeps financing conditions tight and prevents mortgage rates from easing quickly." },
    { name: "10Y yield", score: latest.treasury10 >= 4 ? 72 : 54, level: latest.treasury10, detail: "The 10-year Treasury is the closest daily benchmark for mortgage pricing, so a higher yield usually pushes mortgage rates upward." },
    { name: "Inflation", score: latest.inflationYoY >= 2.75 ? 65 : 52, level: latest.inflationYoY, detail: "Sticky inflation delays any softening in the policy path and keeps long-end rates under pressure." },
    { name: "Labor market", score: latest.unemployment <= 4.3 ? 58 : 49, level: latest.unemployment, detail: "A still-solid labor market supports credit quality, but any clear weakening can shift rate expectations lower." },
    { name: "Mortgage spread", score: mortgageSpread != null ? Math.max(38, Math.min(84, Math.round(mortgageSpread * 18))) : 56, level: mortgageSpread, detail: "The spread between mortgage rates and the 10-year Treasury measures extra market stress, margin, and risk premium in mortgage pricing." },
    { name: "Exogenous risk", score: 46, level: null, detail: "Geopolitics, energy shocks, Treasury issuance, MBS volatility, fiscal headlines, and global risk sentiment can all keep mortgage spreads wide." },
  ];
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  const tone = score >= 70 ? "Lender-friendly" : score >= 50 ? "Balanced" : "Borrower-friendly";
  const shortCall = rateBias === "Slight upward bias" ? "Tomorrow's rate bias leans slightly upward because Treasury yields and inflation pressure are not cooling decisively." : rateBias === "Slight downward bias" ? "Tomorrow's rate bias leans slightly downward because softer growth signals are beginning to offset rate pressure." : "Tomorrow's rate bias is range-bound because the main drivers are mixed and no single factor is dominating.";
  const narrative = "The mortgage market is being driven by the combination of Treasury yields, inflation persistence, labor-market resilience, and the gap between mortgage rates and benchmark yields. If long-end yields stay elevated, mortgage pricing usually stays firm as well. If inflation continues easing and labor softens, markets begin pulling forward easier policy expectations, which can lower mortgage rates. However, the mortgage spread itself also matters. When that spread stays wide, borrowers still feel pressure even if Treasury yields stabilize. That is why rate direction is never explained by the Fed alone. You also have to watch financing conditions, volatility, issuance, and broader risk sentiment. Right now the picture is balanced: lenders still retain some pricing power, but borrowers remain highly rate-sensitive and the environment can shift quickly on new macro data.";
  return { score, tone, narrative, shortCall, rateBias, mortgageSpread, previousSpread, factors };
}

function buildMortgageCards(series) {
  const latest = series.at(-1) ?? {};
  const previous = series.at(-5) ?? {};
  return [
    { label: "30Y Fixed", key: "conforming30", value: latest.conforming30, previous: previous.conforming30, helper: "Conforming purchase baseline" },
    { label: "FHA 30Y", key: "fha30", value: latest.fha30, previous: previous.fha30, helper: "Government-backed purchase" },
    { label: "VA 30Y", key: "va30", value: latest.va30, previous: previous.va30, helper: "Eligible veteran product" },
    { label: "HELOC", key: "heloc", value: latest.heloc, previous: previous.heloc, helper: "Home equity benchmark" },
  ];
}

function buildLenderIntelligence(series, scenario, sortBy) {
  const latest = series.at(-1) ?? {};
  const marketRate = latest.conforming30 ?? 6.25;
  const loanAmount = scenario.purchasePrice * (1 - scenario.downPaymentPct / 100);
  const rows = CURATED_LENDERS.map((item) => {
    const rate = +(marketRate + item.rateAdj).toFixed(3);
    const apr = +(rate + item.aprAdj).toFixed(3);
    const payment = monthlyPayment(loanAmount, rate, scenario.termYears);
    const effectiveCost = effective5YearCost(loanAmount, rate, item.fees);
    const deltaVsMarket = +(rate - marketRate).toFixed(3);
    return {
      ...item,
      rate,
      apr,
      payment,
      effectiveCost,
      deltaVsMarket,
    };
  });

  const byCost = [...rows].sort((a, b) => (a.effectiveCost ?? 0) - (b.effectiveCost ?? 0));
  const ranked = rows.map((row) => ({
    ...row,
    costRank: byCost.findIndex((x) => x.id === row.id) + 1,
    bestFor: row.fees < 3000 ? "Low upfront cost" : row.deltaVsMarket <= -0.04 ? "Low note rate" : row.payment != null && row.payment < (rows[0].payment ?? Infinity) + 25 ? "Low payment" : "Balanced option",
  }));

  const sorted = [...ranked].sort((a, b) => {
    if (sortBy === "apr") return a.apr - b.apr;
    if (sortBy === "payment") return (a.payment ?? 0) - (b.payment ?? 0);
    if (sortBy === "fees") return a.fees - b.fees;
    if (sortBy === "cost") return (a.effectiveCost ?? 0) - (b.effectiveCost ?? 0);
    return a.rate - b.rate;
  });

  return { marketRate, loanAmount, rows: sorted, topCost: byCost[0], topRate: [...ranked].sort((a, b) => a.rate - b.rate)[0], topFees: [...ranked].sort((a, b) => a.fees - b.fees)[0] };
}

function ChartRangeControls({ range, setRange, customRange, setCustomRange }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {RANGE_OPTIONS.map((option) => (
          <button key={option.key} onClick={() => setRange(option.key)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", fontSize: 14, fontWeight: 600, background: range === option.key ? "#0f172a" : "#f1f5f9", color: range === option.key ? "#ffffff" : "#334155", transition: "all 180ms ease" }}>{option.label}</button>
        ))}
      </div>
      {range === "custom" ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={customRange.start} onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))} style={{ borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 14 }} />
          <span style={{ color: "#64748b", fontSize: 14 }}>to</span>
          <input type="date" value={customRange.end} onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))} style={{ borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 14 }} />
        </div>
      ) : null}
    </div>
  );
}

function HeatBar({ value }) {
  return <div style={{ height: 8, width: "100%", overflow: "hidden", borderRadius: 999, background: "#e2e8f0" }}><div style={{ height: "100%", width: `${value}%`, borderRadius: 999, background: "#0f172a" }} /></div>;
}

function NoDataBox({ text = "No chart data available for the selected range." }) {
  return <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #cbd5e1", borderRadius: 18, color: "#64748b", fontSize: 14, background: "#fafafa" }}>{text}</div>;
}

export default function Page() {
  const [selectedMeeting, setSelectedMeeting] = React.useState(FOMC_MEETINGS.at(-1));
  const [series, setSeries] = React.useState(fallbackSeries);
  const [status, setStatus] = React.useState({ loading: false, live: false, lastUpdated: new Date().toLocaleString(), error: "Demo mode active. Add FRED_API_KEY in Vercel project settings for official live data." });
  const [chartRanges, setChartRanges] = React.useState(DEFAULT_CHART_RANGES);
  const [customRanges, setCustomRanges] = React.useState({ rates: { start: "", end: "" }, macro: { start: "", end: "" }, spread: { start: "", end: "" }, yields: { start: "", end: "" } });
  const [scenario, setScenario] = React.useState(DEFAULT_SCENARIO);
  const [lenderSort, setLenderSort] = React.useState("apr");

  React.useEffect(() => {
    let cancelled = false;
    async function loadLive() {
      try {
        setStatus((prev) => ({ ...prev, loading: true }));
        const longestRange = ["15y", "10y", "5y", "3y", "1y", "6m"].find((key) => [chartRanges.rates, chartRanges.macro, chartRanges.spread, chartRanges.yields].includes(key)) || "5y";
        const response = await fetch(`/api/fred-data?range=${encodeURIComponent(longestRange)}`, { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.ok) throw new Error(json.error || "Server fetch failed");
        if (!cancelled && Array.isArray(json.data) && json.data.length) {
          const normalized = json.data.map((row) => ({
            ...row,
            mortgageSpread: row.mortgageSpread ?? (row.conforming30 != null && row.treasury10 != null ? +(row.conforming30 - row.treasury10).toFixed(2) : null),
            curveSpread: row.curveSpread ?? (row.treasury10 != null && row.treasury2 != null ? +(row.treasury10 - row.treasury2).toFixed(2) : null),
          }));
          setSeries(normalized);
          setStatus({ loading: false, live: true, lastUpdated: new Date().toLocaleString(), error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setSeries(fallbackSeries);
          setStatus({ loading: false, live: false, lastUpdated: new Date().toLocaleString(), error: `Live fetch failed. ${error?.message || "Showing demo-mode data."}` });
        }
      }
    }
    loadLive();
    const interval = setInterval(loadLive, AUTO_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [chartRanges]);

  const cards = React.useMemo(() => buildMortgageCards(series), [series]);
  const analysis = React.useMemo(() => buildAnalysis(series), [series]);
  const lenderIntel = React.useMemo(() => buildLenderIntelligence(series, scenario, lenderSort), [series, scenario, lenderSort]);
  const ratesSeries = React.useMemo(() => densifySeries(filterSeriesByRange(series, chartRanges.rates, customRanges.rates), ["conforming30", "conforming15", "fha30", "va30", "jumbo30", "heloc"]), [series, chartRanges.rates, customRanges.rates]);
  const macroSeries = React.useMemo(() => densifySeries(filterSeriesByRange(series, chartRanges.macro, customRanges.macro), ["fedFunds", "inflationYoY", "unemployment"]), [series, chartRanges.macro, customRanges.macro]);
  const spreadSeries = React.useMemo(() => densifySeries(filterSeriesByRange(series, chartRanges.spread, customRanges.spread), ["mortgageSpread", "curveSpread"]), [series, chartRanges.spread, customRanges.spread]);
  const yieldsSeries = React.useMemo(() => densifySeries(filterSeriesByRange(series, chartRanges.yields, customRanges.yields), ["treasury10", "treasury2"]), [series, chartRanges.yields, customRanges.yields]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", padding: 24, color: "#0f172a" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <SimpleCard style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, background: "#f1f5f9", padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#334155" }}><Activity size={14} /> Mortgage command center</div>
                <h1 style={{ marginTop: 14, marginBottom: 0, fontSize: 44, lineHeight: 1.05 }}>Mortgage + Macro Dashboard</h1>
                <p style={{ marginTop: 10, marginBottom: 0, fontSize: 15, color: "#64748b" }}>Live benchmark rates and macro series, plus dynamic lender intelligence modeled against the current market scenario.</p>
              </div>
              <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: "14px 16px", minWidth: 300, fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#0f172a" }}>{status.loading ? <RefreshCw size={16} className="animate-spin" /> : status.live ? <Wifi size={16} /> : <WifiOff size={16} />}{status.loading ? "Refreshing" : status.live ? "Live official mode" : "Demo mode"}</div>
                <div style={{ marginTop: 4, color: "#475569" }}>Last update: {status.lastUpdated}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{status.error ?? "Connected to FRED through server route."}</div>
              </div>
            </div>
          </SimpleCard>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {cards.map((card, index) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.04 }}>
              <SimpleCard style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>{card.label}</div>
                    <div style={{ marginTop: 8, fontSize: 36, fontWeight: 800 }}>{formatPct(card.value)}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{card.helper}</div>
                  </div>
                  <TrendPill current={card.value} previous={card.previous} />
                </div>
                <div style={{ marginTop: 16 }}><Sparkline data={series.slice(-18)} dataKey={card.key} /></div>
              </SimpleCard>
            </motion.div>
          ))}
        </div>

        <SimpleCard>
          <SectionHeader title="Lender Intelligence" description="Dynamic comparison layer built on the live market benchmark and your selected quote scenario" icon={<Building2 size={18} />} />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>ZIP</div><input value={scenario.zip} onChange={(e) => setScenario((p) => ({ ...p, zip: e.target.value }))} style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }} /></div>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Purchase price</div><input type="number" value={scenario.purchasePrice} onChange={(e) => setScenario((p) => ({ ...p, purchasePrice: Number(e.target.value) }))} style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }} /></div>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Down payment %</div><input type="number" value={scenario.downPaymentPct} onChange={(e) => setScenario((p) => ({ ...p, downPaymentPct: Number(e.target.value) }))} style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }} /></div>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Credit band</div><select value={scenario.creditBand} onChange={(e) => setScenario((p) => ({ ...p, creditBand: e.target.value }))} style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}><option>720-739</option><option>740-759</option><option>760-779</option><option>780+</option></select></div>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Sort by</div><select value={lenderSort} onChange={(e) => setLenderSort(e.target.value)} style={{ width: "100%", borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}><option value="apr">APR</option><option value="rate">Rate</option><option value="payment">Monthly payment</option><option value="fees">Fees</option><option value="cost">5Y effective cost</option></select></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 16 }}><div style={{ fontSize: 12, color: "#64748b" }}>Scenario loan amount</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{formatDollar(lenderIntel.loanAmount)}</div></motion.div>
              <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 16 }}><div style={{ fontSize: 12, color: "#64748b" }}>Market benchmark</div><div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{formatPct(lenderIntel.marketRate)}</div></motion.div>
              <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 16 }}><div style={{ fontSize: 12, color: "#64748b" }}>Best overall cost</div><div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>{lenderIntel.topCost?.lender ?? "—"}</div><div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{formatDollar(lenderIntel.topCost?.effectiveCost)} over 5Y</div></motion.div>
              <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 16 }}><div style={{ fontSize: 12, color: "#64748b" }}>Lowest note rate</div><div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>{lenderIntel.topRate?.lender ?? "—"}</div><div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{formatPct(lenderIntel.topRate?.rate)}</div></motion.div>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {['Lender','Product','Rate','APR','Payment','Fees','Δ vs Market','Cost Rank','Best For','Updated'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {lenderIntel.rows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700 }}>{row.lender}</td>
                      <td style={{ padding: "12px 14px" }}>{row.product}</td>
                      <td style={{ padding: "12px 14px" }}>{formatPct(row.rate)}</td>
                      <td style={{ padding: "12px 14px" }}>{formatPct(row.apr)}</td>
                      <td style={{ padding: "12px 14px" }}>{formatDollar(row.payment)}</td>
                      <td style={{ padding: "12px 14px" }}>{formatDollar(row.fees)}</td>
                      <td style={{ padding: "12px 14px", color: row.deltaVsMarket <= 0 ? '#047857' : '#be123c', fontWeight: 600 }}>{row.deltaVsMarket > 0 ? '+' : ''}{row.deltaVsMarket.toFixed(3)}%</td>
                      <td style={{ padding: "12px 14px" }}>#{row.costRank}</td>
                      <td style={{ padding: "12px 14px" }}>{row.bestFor}</td>
                      <td style={{ padding: "12px 14px", color: '#64748b', fontSize: 12 }}>{row.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {lenderIntel.rows.slice(0, 4).map((row) => (
                <motion.div whileHover={{ y: -3 }} key={row.id} style={{ borderRadius: 18, border: '1px solid #e2e8f0', background: '#ffffff', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ fontWeight: 800 }}>{row.lender}</div><div style={{ fontSize: 12, color: '#64748b' }}>#{row.costRank}</div></div>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Rate</div><div style={{ fontSize: 20, fontWeight: 800 }}>{formatPct(row.rate)}</div></div>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>APR</div><div style={{ fontSize: 20, fontWeight: 800 }}>{formatPct(row.apr)}</div></div>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Payment</div><div style={{ fontWeight: 700 }}>{formatDollar(row.payment)}</div></div>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Fees</div><div style={{ fontWeight: 700 }}>{formatDollar(row.fees)}</div></div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: '#334155' }}>{row.bestFor}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#64748b' }}>This lender section is dynamic against the live market benchmark and user scenario. Individual lender rows are curated model outputs, not a full live lender marketplace feed.</div>
          </div>
        </SimpleCard>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["rates", "Rates"], ["macro", "Macro"], ["meetings", "Fed meetings"], ["analysis", "AI Economist Review"]].map(([id, label]) => <a key={id} href={`#${id}`} style={{ display: "inline-block", borderRadius: 999, background: "#0f172a", color: "#ffffff", padding: "10px 16px", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{label}</a>)}
        </div>

        <section id="rates" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SimpleCard>
            <SectionHeader title="Mortgage Rates Trend" description="General mortgage products over the selected historical period" icon={<TrendingUp size={18} />} />
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <ChartRangeControls range={chartRanges.rates} setRange={(value) => setChartRanges((prev) => ({ ...prev, rates: value }))} customRange={customRanges.rates} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, rates: typeof value === "function" ? value(prev.rates) : value }))} />
              {ratesSeries.length ? <div style={{ width: "100%", height: 420 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={ratesSeries}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={24} /><YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} domain={["dataMin - 0.1", "dataMax + 0.1"]} /><Tooltip formatter={(value) => formatPct(value)} /><Legend /><Line type="monotone" dataKey="conforming30" name="Conforming 30Y" stroke={getSeriesColor("conforming30")} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="conforming15" name="Conforming 15Y" stroke={getSeriesColor("conforming15")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="fha30" name="FHA 30Y" stroke={getSeriesColor("fha30")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="va30" name="VA 30Y" stroke={getSeriesColor("va30")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="jumbo30" name="Jumbo 30Y" stroke={getSeriesColor("jumbo30")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="heloc" name="HELOC" stroke={getSeriesColor("heloc")} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div> : <NoDataBox />}
            </div>
          </SimpleCard>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)", gap: 16 }}>
            <SimpleCard>
              <SectionHeader title="Treasury yields and curve" description="10Y, 2Y, and curve spread over time" icon={<CircleDollarSign size={18} />} />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                <ChartRangeControls range={chartRanges.yields} setRange={(value) => setChartRanges((prev) => ({ ...prev, yields: value }))} customRange={customRanges.yields} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, yields: typeof value === "function" ? value(prev.yields) : value }))} />
                {yieldsSeries.length ? <div style={{ width: "100%", height: 420 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={yieldsSeries}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={24} /><YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} domain={["dataMin - 0.1", "dataMax + 0.1"]} /><Tooltip formatter={(value) => formatPct(value)} /><Legend /><Line type="monotone" dataKey="treasury10" name="10Y Treasury" stroke={getSeriesColor("treasury10")} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="treasury2" name="2Y Treasury" stroke={getSeriesColor("treasury2")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="curveSpread" name="10Y-2Y Curve Spread" stroke={getSeriesColor("curveSpread")} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div> : <NoDataBox />}
              </div>
            </SimpleCard>

            <SimpleCard>
              <SectionHeader title="Rate pressure heatmap" description="Higher score means more pressure keeping mortgage rates elevated" />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                {analysis.factors.map((factor) => <div key={factor.name}><div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14 }}><span style={{ fontWeight: 600, color: "#334155" }}>{factor.name}</span><span style={{ color: "#64748b" }}>{factor.score}/100</span></div><HeatBar value={factor.score} /></div>)}
              </div>
            </SimpleCard>
          </div>
        </section>

        <section id="macro" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 16 }}>
            <SimpleCard>
              <SectionHeader title="Macro Factors" description="Fed funds, inflation, and unemployment" icon={<Activity size={18} />} />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                <ChartRangeControls range={chartRanges.macro} setRange={(value) => setChartRanges((prev) => ({ ...prev, macro: value }))} customRange={customRanges.macro} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, macro: typeof value === "function" ? value(prev.macro) : value }))} />
                {macroSeries.length ? <div style={{ width: "100%", height: 420 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={macroSeries}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={24} /><YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} domain={["dataMin - 0.1", "dataMax + 0.1"]} /><Tooltip formatter={(value) => formatPct(value)} /><Legend /><Line type="monotone" dataKey="fedFunds" name="Fed Funds" stroke={getSeriesColor("fedFunds")} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="inflationYoY" name="Inflation YoY" stroke={getSeriesColor("inflationYoY")} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="unemployment" name="Unemployment" stroke={getSeriesColor("unemployment")} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div> : <NoDataBox />}
              </div>
            </SimpleCard>

            <SimpleCard>
              <SectionHeader title="Mortgage spread vs 10Y Treasury" description="Current spread and historical pattern" />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                <ChartRangeControls range={chartRanges.spread} setRange={(value) => setChartRanges((prev) => ({ ...prev, spread: value }))} customRange={customRanges.spread} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, spread: typeof value === "function" ? value(prev.spread) : value }))} />
                {spreadSeries.length ? <><div style={{ width: "100%", height: 250 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={spreadSeries}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={24} /><YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} domain={["dataMin - 0.1", "dataMax + 0.1"]} /><Tooltip formatter={(value) => formatPct(value)} /><ReferenceLine y={0} strokeDasharray="4 4" /><Area type="monotone" dataKey="mortgageSpread" name="Mortgage Spread" stroke={getSeriesColor("mortgageSpread")} fill={getSeriesColor("mortgageSpread")} fillOpacity={0.22} strokeWidth={3} /></AreaChart></ResponsiveContainer></div><div style={{ width: "100%", height: 150 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={spreadSeries.slice(-12)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} /><Tooltip formatter={(value) => formatPct(value)} /><Bar dataKey="curveSpread" name="Curve Spread" fill={getSeriesColor("curveSpread")} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></> : <NoDataBox />}
              </div>
            </SimpleCard>
          </div>
        </section>

        <section id="meetings">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(360px, 0.95fr)", gap: 16 }}>
            <SimpleCard>
              <SectionHeader title="Fed Meetings" description="Past and upcoming meetings with decision and takeaway" icon={<CalendarDays size={18} />} />
              <div style={{ maxHeight: 620, overflow: "auto", padding: 20, paddingTop: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {FOMC_MEETINGS.map((meeting) => {
                    const active = selectedMeeting?.date === meeting.date;
                    return <button key={meeting.date} onClick={() => setSelectedMeeting(meeting)} style={{ width: "100%", borderRadius: 18, border: `1px solid ${active ? "#0f172a" : "#e2e8f0"}`, background: active ? "#0f172a" : "#f8fafc", color: active ? "#ffffff" : "#0f172a", padding: 16, textAlign: "left", cursor: "pointer", transition: "all 180ms ease" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><CalendarDays size={16} /><div><div style={{ fontWeight: 700 }}>{meeting.label}</div><div style={{ marginTop: 4, fontSize: 13, color: active ? "#cbd5e1" : "#64748b" }}>{meeting.date}</div></div></div><div style={{ borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700, background: active ? "#ffffff" : "transparent", color: active ? "#0f172a" : "#475569", border: active ? "none" : "1px solid #cbd5e1" }}>{meeting.rateChange}</div></div></button>;
                  })}
                </div>
              </div>
            </SimpleCard>

            <SimpleCard>
              <SectionHeader title="Meeting detail" description="Decision summary, key points, and mortgage interpretation" />
              <div style={{ padding: 20 }}>
                <AnimatePresence mode="wait">
                  <motion.div key={selectedMeeting?.date} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} style={{ display: "flex", flexDirection: "column", gap: 16, borderRadius: 24, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 20 }}>
                    <div><div style={{ fontSize: 13, color: "#64748b" }}>Selected meeting</div><div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{selectedMeeting?.label}</div><div style={{ marginTop: 4, fontSize: 14, color: "#64748b" }}>{selectedMeeting?.date}</div></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#ffffff", padding: 14 }}><div style={{ fontSize: 12, color: "#64748b" }}>Rate move</div><div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{selectedMeeting?.rateChange}</div></div>
                      <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#ffffff", padding: 14 }}><div style={{ fontSize: 12, color: "#64748b" }}>Target range</div><div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{selectedMeeting?.targetRange}</div></div>
                    </div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Policy summary</div><p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>{selectedMeeting?.summary}</p></div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Key points</div><ul style={{ marginTop: 8, paddingLeft: 20, color: "#334155" }}>{selectedMeeting?.keyPoints?.map((point) => <li key={point} style={{ marginBottom: 8, lineHeight: 1.6 }}>{point}</li>)}</ul></div>
                    <div style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#ffffff", padding: 16 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Mortgage interpretation</div><p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>{selectedMeeting?.mortgageView}</p></div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </SimpleCard>
          </div>
        </section>

        <section id="analysis">
          <SimpleCard>
            <SectionHeader title="AI Economist Review" description="Decision-support commentary built from rates, spreads, inflation, labor, and policy pressure" icon={<TrendingUp size={18} />} />
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 20 }}><div style={{ fontSize: 14, color: "#64748b" }}>Economist score</div><div style={{ marginTop: 8, fontSize: 42, fontWeight: 800 }}>{analysis.score}/100</div><div style={{ marginTop: 10, display: "inline-flex", borderRadius: 999, background: "#0f172a", color: "#ffffff", padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>{analysis.tone}</div></motion.div>
                <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 20 }}><div style={{ fontSize: 14, color: "#64748b" }}>Tomorrow&apos;s rate call</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{analysis.rateBias}</div><p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: "#475569" }}>{analysis.shortCall}</p></motion.div>
                <motion.div whileHover={{ y: -3 }} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 20 }}><div style={{ fontSize: 14, color: "#64748b" }}>Mortgage spread</div><div style={{ marginTop: 8, fontSize: 36, fontWeight: 800 }}>{formatPct(analysis.mortgageSpread)}</div><div style={{ marginTop: 10 }}><TrendPill current={analysis.mortgageSpread} previous={analysis.previousSpread} /></div></motion.div>
              </div>
              <div style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#ffffff", padding: 20 }}><h3 style={{ margin: 0, fontSize: 18 }}>Economist narrative</h3><p style={{ marginTop: 12, marginBottom: 0, fontSize: 14, lineHeight: 1.8, color: "#334155" }}>{analysis.narrative}</p></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>{analysis.factors.map((factor) => <motion.div whileHover={{ y: -3 }} key={factor.name} style={{ borderRadius: 18, border: "1px solid #e2e8f0", background: "#ffffff", padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div style={{ fontWeight: 700 }}>{factor.name}</div><div style={{ fontSize: 13, color: "#64748b" }}>{factor.score}/100</div></div><div style={{ marginTop: 12 }}><HeatBar value={factor.score} /></div><div style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>{factor.level != null ? `Current: ${formatPct(factor.level)}` : "Qualitative factor"}</div><p style={{ marginTop: 12, marginBottom: 0, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>{factor.detail}</p></motion.div>)}</div>
            </div>
          </SimpleCard>
        </section>
      </div>
    </div>
  );
}
