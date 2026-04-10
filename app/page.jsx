"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, AreaChart, Area } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Info, Minus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FRED_API_KEY = process.env.NEXT_PUBLIC_FRED_API_KEY;
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const AUTO_REFRESH_MS = 15 * 60 * 1000;

const RANGE_OPTIONS = [
  { key: "6m", label: "6M", months: 6 },
  { key: "1y", label: "1Y", years: 1 },
  { key: "3y", label: "3Y", years: 3 },
  { key: "5y", label: "5Y", years: 5 },
  { key: "10y", label: "10Y", years: 10 },
  { key: "15y", label: "15Y", years: 15 },
  { key: "custom", label: "Custom" },
];

const DEFAULT_CHART_RANGES = {
  rates: "5y",
  macro: "5y",
  spread: "5y",
};

const SERIES = {
  conforming30: "OBMMIC30YF",
  conforming15: "OBMMIC15YF",
  fha30: "OBMMIFHA30YF",
  va30: "OBMMIVA30YF",
  jumbo30: "OBMMIJUMBO30YF",
  heloc: "BRMHELOC01",
  unemployment: "UNRATE",
  inflation: "CPIAUCSL",
  fedFunds: "DFF",
  treasury10: "DGS10",
  treasury2: "DGS2",
};

const FOMC_MEETINGS = [
  { date: "2023-01-31", label: "Jan 31-Feb 1, 2023", summary: "The Fed raised rates and reinforced its anti-inflation stance. Mortgage markets stayed pressured because investors saw policy remaining restrictive for longer than borrowers had hoped.", mortgageView: "This was mortgage-negative because it kept the floor under Treasury yields and delayed expectations for easier financing conditions." },
  { date: "2023-03-21", label: "Mar 21-22, 2023", summary: "The meeting came during banking-sector stress. The Fed balanced inflation concerns against financial-stability risks, creating large swings in rates expectations.", mortgageView: "This meeting increased volatility. Mortgage rates became more sensitive to risk sentiment and spread behavior, not just Fed policy itself." },
  { date: "2023-07-25", label: "Jul 25-26, 2023", summary: "Policy remained tight as inflation was still above target. Mortgage rates stayed elevated because markets saw little immediate path to lower long-end yields.", mortgageView: "This extended the higher-rate environment and kept affordability under pressure." },
  { date: "2024-03-19", label: "Mar 19-20, 2024", summary: "The Fed kept a careful tone, signaling that disinflation progress mattered more than market optimism around cuts. Mortgage sentiment remained mixed.", mortgageView: "Mortgage markets treated this as a reminder that rate relief needed data confirmation, not just narrative shifts." },
  { date: "2024-09-17", label: "Sep 17-18, 2024", summary: "Markets focused on whether growth was slowing enough to justify a more accommodative future stance. Long-end rates reacted more to guidance than the policy decision itself.", mortgageView: "Mortgage pricing became highly expectation-driven, with Treasuries doing most of the movement." },
  { date: "2025-03-18", label: "Mar 18-19, 2025", summary: "The Fed held rates steady and emphasized that inflation progress remained uneven. That kept mortgage borrowers in a wait-and-see environment.", mortgageView: "This preserved lender pricing discipline while limiting immediate rate relief for borrowers." },
  { date: "2025-12-09", label: "Dec 9-10, 2025", summary: "Year-end guidance mattered more than the rate decision. Mortgage markets watched for clues on the next year's easing path and the durability of inflation cooling.", mortgageView: "This meeting mattered for forward rate expectations and year-end lock behavior." },
  { date: "2026-01-27", label: "Jan 27-28, 2026", summary: "The Fed held rates steady and emphasized that inflation was still not fully back to target. Markets read the tone as cautious and restrictive, which limited hopes for near-term mortgage rate relief.", mortgageView: "Mortgage-negative tone because it preserved higher-for-longer expectations." },
  { date: "2026-03-17", label: "Mar 17-18, 2026", summary: "The committee again left rates unchanged but stressed upside inflation risks. That reinforced higher-for-longer expectations and contributed to upward pressure on Treasury yields and mortgage coupons.", mortgageView: "This raised the risk of higher mortgage coupons through both Treasury yields and sentiment." },
  { date: "2026-04-28", label: "Apr 28-29, 2026", summary: "This meeting is expected to focus on whether inflation is cooling enough to justify a softer policy path. Mortgage markets will watch the statement and press conference for hints on the pace of future easing.", mortgageView: "Potential turning-point meeting if disinflation improves, but mortgage markets will still need Treasury confirmation." },
  { date: "2026-06-16", label: "Jun 16-17, 2026", summary: "This is viewed as a possible inflection window if inflation and labor data continue to soften. Any change in the projected path of rates could quickly ripple through mortgage pricing.", mortgageView: "A softer tone here would likely matter more for refinance psychology than for immediate purchase affordability." },
  { date: "2026-07-28", label: "Jul 28-29, 2026", summary: "By mid-year, the market will likely be judging whether the Fed is close to a true pivot or just pausing. Mortgage rates may respond more to forward guidance than the rate decision itself.", mortgageView: "Mortgage reaction would depend on how clearly the Fed signals the next phase of policy." },
  { date: "2026-09-15", label: "Sep 15-16, 2026", summary: "September meetings tend to matter because they often clarify end-of-year policy expectations. Mortgage markets will focus on the balance between inflation persistence and slowing growth.", mortgageView: "Important for lock decisions heading into year-end pipeline planning." },
  { date: "2026-10-27", label: "Oct 27-28, 2026", summary: "Late-year meetings often shape year-end lock behavior. If long-end yields are volatile, even a steady Fed can still lead to mortgage repricing through market expectations.", mortgageView: "A reminder that mortgage rates can move materially even when the Fed does not move." },
  { date: "2026-12-08", label: "Dec 8-9, 2026", summary: "The final meeting of the year can reset expectations for the next cycle. Mortgage lenders and borrowers both watch it closely for the policy tone heading into the new year.", mortgageView: "This is one of the most important meetings for framing next-year mortgage expectations." },
];

const fallbackSeries = Array.from({ length: 260 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (259 - i) * 7);
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    conforming30: +(6.05 + i * 0.002 + Math.sin(i / 9) * 0.12).toFixed(2),
    conforming15: +(5.42 + i * 0.0017 + Math.sin(i / 10) * 0.09).toFixed(2),
    fha30: +(5.96 + i * 0.0018 + Math.sin(i / 8.5) * 0.1).toFixed(2),
    va30: +(5.86 + i * 0.0016 + Math.sin(i / 9.5) * 0.08).toFixed(2),
    jumbo30: +(6.24 + i * 0.0021 + Math.sin(i / 8.8) * 0.12).toFixed(2),
    heloc: +(7.45 + i * 0.001 + Math.sin(i / 11) * 0.06).toFixed(2),
    treasury10: +(4.02 + i * 0.0011 + Math.sin(i / 10) * 0.08).toFixed(2),
    treasury2: +(3.77 + i * 0.0009 + Math.cos(i / 11) * 0.06).toFixed(2),
    fedFunds: +(4.33 - Math.max(0, i - 180) * 0.0008).toFixed(2),
    unemployment: +(4.02 + Math.sin(i / 18) * 0.18).toFixed(2),
    inflationYoY: +(2.45 + Math.cos(i / 16) * 0.3).toFixed(2),
  };
});

function formatPct(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}%`;
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

function SimpleCard({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function SectionHeader({ title, description }) {
  return (
    <div style={{ padding: 20, paddingBottom: 0 }}>
      <div className="text-xl font-semibold text-slate-900">{title}</div>
      {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
    </div>
  );
}

function TrendPill({ current, previous }) {
  const trend = getTrend(current, previous);
  if (trend.direction === "up") {
    return <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"><ArrowUpRight className="h-3 w-3" />+{trend.delta}%</div>;
  }
  if (trend.direction === "down") {
    return <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"><ArrowDownRight className="h-3 w-3" />{trend.delta}%</div>;
  }
  return <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"><Minus className="h-3 w-3" />0.00%</div>;
}

function Sparkline({ data, dataKey }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKey} stroke={getSeriesColor(dataKey)} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function computeStartDate(rangeKey, customRange) {
  const now = new Date();
  if (rangeKey === "custom") {
    return customRange.start ? new Date(customRange.start) : new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  }
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

function buildAnalysis(series) {
  const latest = series.at(-1) ?? {};
  const prior = series.at(-5) ?? series.at(0) ?? {};
  const mortgageSpread = latest.conforming30 != null && latest.treasury10 != null ? +(latest.conforming30 - latest.treasury10).toFixed(2) : null;
  const previousSpread = prior.conforming30 != null && prior.treasury10 != null ? +(prior.conforming30 - prior.treasury10).toFixed(2) : null;
  const rateBias = latest.treasury10 > prior.treasury10 || latest.inflationYoY > prior.inflationYoY
    ? "Slight upward bias"
    : latest.unemployment > prior.unemployment
    ? "Slight downward bias"
    : "Range-bound bias";

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
  const shortCall = rateBias === "Slight upward bias"
    ? "Tomorrow's rate bias leans slightly upward because Treasury yields and inflation pressure are not cooling decisively."
    : rateBias === "Slight downward bias"
    ? "Tomorrow's rate bias leans slightly downward because softer growth signals are beginning to offset rate pressure."
    : "Tomorrow's rate bias is range-bound because the main drivers are mixed and no single factor is dominating.";

  const narrative = "The mortgage market is in a transitional phase where several major forces are pulling in different directions. The Federal Reserve remains restrictive enough to keep borrowing costs elevated, and that supports higher mortgage coupons. At the same time, the 10-year Treasury yield remains the most important day-to-day benchmark, so when it stays firm, mortgage pricing usually does too. Inflation has moderated from earlier highs, but it is still influential enough to limit how much yields can fall. Labor data also matters because a softer employment backdrop can reduce growth expectations and help rates move down, even if lenders become more cautious on credit. Another key issue is the mortgage spread itself. When the gap between mortgage rates and Treasuries remains wide, borrowers still feel pressure even if the Treasury market is stable. That is why geopolitics, fiscal risk, energy shocks, and MBS volatility still matter. Overall, the economist view is balanced: lenders retain some pricing power, but the environment is fragile and highly sensitive to new data.";

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

function ChartRangeControls({ range, setRange, customRange, setCustomRange }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setRange(option.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${range === option.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {range === "custom" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="date" value={customRange.start} onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
          <span className="text-slate-500">to</span>
          <input type="date" value={customRange.end} onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
        </div>
      ) : null}
    </div>
  );
}

function HeatBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-900" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function Page() {
  const [selectedMeeting, setSelectedMeeting] = React.useState(FOMC_MEETINGS.at(-1));
  const [series, setSeries] = React.useState(fallbackSeries);
  const [status, setStatus] = React.useState({ loading: false, live: false, lastUpdated: new Date().toLocaleString(), error: "Demo mode active. Add NEXT_PUBLIC_FRED_API_KEY for official live data." });
  const [chartRanges, setChartRanges] = React.useState(DEFAULT_CHART_RANGES);
  const [customRanges, setCustomRanges] = React.useState({ rates: { start: "", end: "" }, macro: { start: "", end: "" }, spread: { start: "", end: "" } });

  React.useEffect(() => {
    let cancelled = false;

    async function loadLive() {
      if (!FRED_API_KEY) {
        setStatus({ loading: false, live: false, lastUpdated: new Date().toLocaleString(), error: "Demo mode active. Add NEXT_PUBLIC_FRED_API_KEY for official live data." });
        return;
      }

      try {
        setStatus((prev) => ({ ...prev, loading: true }));
        const longestRange = [chartRanges.rates, chartRanges.macro, chartRanges.spread].includes("15y") ? "15y" : [chartRanges.rates, chartRanges.macro, chartRanges.spread].includes("10y") ? "10y" : [chartRanges.rates, chartRanges.macro, chartRanges.spread].includes("5y") ? "5y" : [chartRanges.rates, chartRanges.macro, chartRanges.spread].includes("3y") ? "3y" : [chartRanges.rates, chartRanges.macro, chartRanges.spread].includes("1y") ? "1y" : "6m";
        const selected = RANGE_OPTIONS.find((item) => item.key === longestRange) ?? RANGE_OPTIONS[3];
        const now = new Date();
        const start = new Date(now);
        if (selected.months) start.setMonth(start.getMonth() - selected.months);
        if (selected.years) start.setFullYear(start.getFullYear() - selected.years);
        const observation_start = start.toISOString().slice(0, 10);

        const fetchSeries = async (seriesId) => {
          const query = new URLSearchParams({ series_id: seriesId, api_key: FRED_API_KEY, file_type: "json", sort_order: "asc", observation_start });
          const response = await fetch(`${FRED_BASE}?${query.toString()}`);
          if (!response.ok) throw new Error(`Failed ${seriesId}`);
          const json = await response.json();
          return (json.observations || []).map((item) => ({ date: item.date, value: Number(item.value) })).filter((item) => Number.isFinite(item.value));
        };

        const [conforming30, conforming15, fha30, va30, jumbo30, heloc, treasury10, treasury2, fedFunds, unemployment, inflation] = await Promise.all([
          fetchSeries(SERIES.conforming30),
          fetchSeries(SERIES.conforming15),
          fetchSeries(SERIES.fha30),
          fetchSeries(SERIES.va30),
          fetchSeries(SERIES.jumbo30),
          fetchSeries(SERIES.heloc),
          fetchSeries(SERIES.treasury10),
          fetchSeries(SERIES.treasury2),
          fetchSeries(SERIES.fedFunds),
          fetchSeries(SERIES.unemployment),
          fetchSeries(SERIES.inflation),
        ]);

        const inflationMap = new Map(inflation.map((item) => [item.date.slice(0, 7), item.value]));
        const inflationYoY = inflation.map((item) => {
          const d = new Date(item.date);
          d.setFullYear(d.getFullYear() - 1);
          const base = inflationMap.get(d.toISOString().slice(0, 7));
          if (base == null) return null;
          return { date: item.date, value: +(((item.value - base) / base) * 100).toFixed(2) };
        }).filter(Boolean);

        const map = new Map();
        const add = (key, arr) => arr.forEach((point) => {
          const labelDate = new Date(point.date);
          const row = map.get(point.date) ?? { date: point.date, label: labelDate.toLocaleDateString(undefined, { month: "short", year: "2-digit" }) };
          row[key] = point.value;
          map.set(point.date, row);
        });

        add("conforming30", conforming30);
        add("conforming15", conforming15);
        add("fha30", fha30);
        add("va30", va30);
        add("jumbo30", jumbo30);
        add("heloc", heloc);
        add("treasury10", treasury10);
        add("treasury2", treasury2);
        add("fedFunds", fedFunds);
        add("unemployment", unemployment);
        add("inflationYoY", inflationYoY);

        const merged = [...map.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (!cancelled && merged.length) {
          setSeries(merged);
          setStatus({ loading: false, live: true, lastUpdated: new Date().toLocaleString(), error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setSeries(fallbackSeries);
          setStatus({ loading: false, live: false, lastUpdated: new Date().toLocaleString(), error: "Live fetch failed. Showing demo-mode data." });
        }
      }
    }

    loadLive();
    const interval = setInterval(loadLive, AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chartRanges]);

  const cards = React.useMemo(() => buildMortgageCards(series), [series]);
  const analysis = React.useMemo(() => buildAnalysis(series), [series]);
  const ratesSeries = React.useMemo(() => filterSeriesByRange(series, chartRanges.rates, customRanges.rates), [series, chartRanges.rates, customRanges.rates]);
  const macroSeries = React.useMemo(() => filterSeriesByRange(series, chartRanges.macro, customRanges.macro), [series, chartRanges.macro, customRanges.macro]);
  const spreadSeries = React.useMemo(() => filterSeriesByRange(series, chartRanges.spread, customRanges.spread).map((row) => ({ ...row, mortgageSpread: row.conforming30 != null && row.treasury10 != null ? +(row.conforming30 - row.treasury10).toFixed(2) : null })), [series, chartRanges.spread, customRanges.spread]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <SimpleCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"><Activity className="h-3.5 w-3.5" /> Mortgage command center</div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">Mortgage + Macro Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">Simple deployable version. Each chart has its own historical filter and optional custom date range.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                {status.loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : status.live ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {status.loading ? "Refreshing" : status.live ? "Live official mode" : "Demo mode"}
              </div>
              <div className="mt-1 text-slate-600">Last update: {status.lastUpdated}</div>
              <div className="mt-2 text-xs text-slate-500">{status.error ?? "Connected to FRED official series."}</div>
            </div>
          </div>
        </SimpleCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <SimpleCard key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">{card.label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight">{formatPct(card.value)}</div>
                  <div className="mt-1 text-xs text-slate-500">{card.helper}</div>
                </div>
                <TrendPill current={card.value} previous={card.previous} />
              </div>
              <div className="mt-4"><Sparkline data={series.slice(-18)} dataKey={card.key} /></div>
            </SimpleCard>
          ))}
        </div>

        {!status.live ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4" />
              <div>
                <div className="font-medium">Data note</div>
                <div className="mt-1 text-sm text-slate-600">{status.error}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {[
            ["rates", "Rates"],
            ["macro", "Macro"],
            ["meetings", "Fed meetings"],
            ["analysis", "AI Economist Review"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{label}</a>
          ))}
        </div>

        <section id="rates" className="space-y-4">
          <SimpleCard>
            <SectionHeader title="Mortgage Rates Trend" description="General mortgage products over the selected historical period" />
            <div className="space-y-4 p-5">
              <ChartRangeControls range={chartRanges.rates} setRange={(value) => setChartRanges((prev) => ({ ...prev, rates: value }))} customRange={customRanges.rates} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, rates: typeof value === "function" ? value(prev.rates) : value }))} />
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratesSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Tooltip formatter={(value) => formatPct(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="conforming30" name="Conforming 30Y" stroke={getSeriesColor("conforming30")} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="conforming15" name="Conforming 15Y" stroke={getSeriesColor("conforming15")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="fha30" name="FHA 30Y" stroke={getSeriesColor("fha30")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="va30" name="VA 30Y" stroke={getSeriesColor("va30")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="jumbo30" name="Jumbo 30Y" stroke={getSeriesColor("jumbo30")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="heloc" name="HELOC" stroke={getSeriesColor("heloc")} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SimpleCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SimpleCard className="xl:col-span-2">
              <SectionHeader title="Mortgage spread vs 10Y Treasury" description="Conforming 30Y minus 10Y Treasury" />
              <div className="space-y-4 p-5">
                <ChartRangeControls range={chartRanges.spread} setRange={(value) => setChartRanges((prev) => ({ ...prev, spread: value }))} customRange={customRanges.spread} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, spread: typeof value === "function" ? value(prev.spread) : value }))} />
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spreadSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Tooltip formatter={(value) => formatPct(value)} />
                      <ReferenceLine y={0} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="mortgageSpread" name="Mortgage Spread" stroke={getSeriesColor("mortgageSpread")} fill={getSeriesColor("mortgageSpread")} fillOpacity={0.2} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </SimpleCard>

            <SimpleCard>
              <SectionHeader title="Rate pressure heatmap" description="Higher score means more pressure keeping mortgage rates elevated" />
              <div className="space-y-4 p-5">
                {analysis.factors.map((factor) => (
                  <div key={factor.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{factor.name}</span>
                      <span className="text-slate-500">{factor.score}/100</span>
                    </div>
                    <HeatBar value={factor.score} />
                  </div>
                ))}
              </div>
            </SimpleCard>
          </div>
        </section>

        <section id="macro">
          <SimpleCard>
            <SectionHeader title="Macro Factors" description="Official macro drivers over the selected historical period" />
            <div className="space-y-4 p-5">
              <ChartRangeControls range={chartRanges.macro} setRange={(value) => setChartRanges((prev) => ({ ...prev, macro: value }))} customRange={customRanges.macro} setCustomRange={(value) => setCustomRanges((prev) => ({ ...prev, macro: typeof value === "function" ? value(prev.macro) : value }))} />
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Tooltip formatter={(value) => formatPct(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="treasury10" name="10Y Treasury" stroke={getSeriesColor("treasury10")} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="treasury2" name="2Y Treasury" stroke={getSeriesColor("treasury2")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="fedFunds" name="Fed Funds" stroke={getSeriesColor("fedFunds")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="inflationYoY" name="Inflation YoY" stroke={getSeriesColor("inflationYoY")} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="unemployment" name="Unemployment" stroke={getSeriesColor("unemployment")} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SimpleCard>
        </section>

        <section id="meetings">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SimpleCard>
              <SectionHeader title="Fed Meetings" description="Past and upcoming meetings. Select one to review the policy takeaway and mortgage interpretation." />
              <div className="max-h-[34rem] space-y-3 overflow-auto p-5 pr-4">
                {FOMC_MEETINGS.map((meeting) => (
                  <button key={meeting.date} onClick={() => setSelectedMeeting(meeting)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${selectedMeeting?.date === meeting.date ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{meeting.label}</div>
                        <div className={`text-sm ${selectedMeeting?.date === meeting.date ? "text-slate-200" : "text-slate-500"}`}>{meeting.date}</div>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${selectedMeeting?.date === meeting.date ? "bg-white text-slate-900" : "border border-slate-300 text-slate-600"}`}>View</div>
                  </button>
                ))}
              </div>
            </SimpleCard>

            <SimpleCard>
              <SectionHeader title="Meeting detail" description="Animated policy summary panel" />
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={selectedMeeting?.date} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <div className="text-sm text-slate-500">Selected meeting</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{selectedMeeting?.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{selectedMeeting?.date}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Policy summary</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedMeeting?.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-medium text-slate-700">Mortgage interpretation</div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedMeeting?.mortgageView}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </SimpleCard>
          </div>
        </section>

        <section id="analysis">
          <SimpleCard>
            <SectionHeader title="AI Economist Review" description="Decision-support commentary built from rates, spreads, inflation, labor, and policy pressure" />
            <div className="space-y-5 p-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm text-slate-500">Economist score</div>
                  <div className="mt-2 text-4xl font-bold">{analysis.score}/100</div>
                  <div className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">{analysis.tone}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm text-slate-500">Tomorrow&apos;s rate call</div>
                  <div className="mt-2 text-xl font-semibold">{analysis.rateBias}</div>
                  <p className="mt-2 text-sm text-slate-600">{analysis.shortCall}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm text-slate-500">Mortgage spread</div>
                  <div className="mt-2 text-3xl font-bold">{formatPct(analysis.mortgageSpread)}</div>
                  <div className="mt-2"><TrendPill current={analysis.mortgageSpread} previous={analysis.previousSpread} /></div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold">Economist narrative</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.narrative}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analysis.factors.map((factor) => (
                  <div key={factor.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800">{factor.name}</div>
                      <div className="text-sm text-slate-500">{factor.score}/100</div>
                    </div>
                    <div className="mt-3"><HeatBar value={factor.score} /></div>
                    <div className="mt-3 text-sm text-slate-600">{factor.level != null ? `Current: ${formatPct(factor.level)}` : "Qualitative factor"}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </SimpleCard>
        </section>
      </div>
    </div>
  );
}
