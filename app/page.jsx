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
  Brain,
  ShieldAlert,
} from "lucide-react";

const RANGE_OPTIONS = [
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" },
  { key: "5y", label: "5Y" },
  { key: "10y", label: "10Y" },
  { key: "15y", label: "15Y" },
  { key: "custom", label: "Custom" },
];

const DEFAULT_SCENARIO = {
  zip: "20433",
  purchasePrice: 595000,
  downPaymentPct: 20,
  creditBand: "760-779",
  termYears: 30,
  product: "30Y Fixed",
};

const TOP_LENDERS = [
  { id: "better", lender: "Better", rateAdj: 0.0, aprAdj: 0.04 },
  { id: "rocket", lender: "Rocket Mortgage", rateAdj: 0.06, aprAdj: 0.11 },
  { id: "uwm", lender: "United Wholesale Mortgage (UWM)", rateAdj: -0.06, aprAdj: -0.01 },
  { id: "chase", lender: "JPMorgan Chase", rateAdj: 0.02, aprAdj: 0.07 },
  { id: "wells", lender: "Wells Fargo", rateAdj: 0.04, aprAdj: 0.08 },
  { id: "bofa", lender: "Bank of America", rateAdj: 0.03, aprAdj: 0.08 },
  { id: "loandepot", lender: "loanDepot", rateAdj: 0.02, aprAdj: 0.07 },
  { id: "pennymac", lender: "Pennymac", rateAdj: -0.01, aprAdj: 0.04 },
  { id: "navyfed", lender: "Navy Federal", rateAdj: -0.03, aprAdj: 0.01 },
  { id: "veteransunited", lender: "Veterans United", rateAdj: -0.02, aprAdj: 0.03 },
];

function formatPct(value) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}%`;
}

function formatNum(value, digits = 2) {
  return value == null || Number.isNaN(Number(value)) ? "—" : Number(value).toFixed(digits);
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
        height: 320,
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

function getStartDate(rangeKey) {
  const now = new Date();
  const d = new Date(now);
  if (rangeKey === "6m") d.setMonth(d.getMonth() - 6);
  if (rangeKey === "1y") d.setFullYear(d.getFullYear() - 1);
  if (rangeKey === "3y") d.setFullYear(d.getFullYear() - 3);
  if (rangeKey === "5y") d.setFullYear(d.getFullYear() - 5);
  if (rangeKey === "10y") d.setFullYear(d.getFullYear() - 10);
  if (rangeKey === "15y") d.setFullYear(d.getFullYear() - 15);
  return d;
}

function filterRows(rows, rangeKey, customRange) {
  if (!rows.length) return [];
  if (rangeKey !== "custom") {
    const start = getStartDate(rangeKey);
    return rows.filter((r) => new Date(r.date) >= start);
  }
  const start = customRange.start ? new Date(customRange.start) : null;
  const end = customRange.end ? new Date(customRange.end) : null;
  return rows.filter((r) => {
    const d = new Date(r.date);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

function buildStats(filteredRows, key) {
  const values = filteredRows.map((r) => r[key]).filter((v) => v != null && Number.isFinite(Number(v)));
  if (!values.length) {
    return { latest: null, prior: null, change: null, low: null, high: null };
  }
  const latest = values[values.length - 1];
  const prior = values.length > 1 ? values[0] : latest;
  return {
    latest,
    prior,
    change: +(latest - prior).toFixed(2),
    low: Math.min(...values),
   
