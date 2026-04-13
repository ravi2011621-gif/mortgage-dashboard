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
} from "recharts";

function formatPct(v) {
  return v == null ? "—" : `${Number(v).toFixed(2)}%`;
}

function card(title, value, change) {
  return (
    <div style={{
      background: "#fff",
      padding: 16,
      borderRadius: 12,
      border: "1px solid #e5e7eb"
    }}>
      <div style={{fontSize:12,color:"#6b7280"}}>{title}</div>
      <div style={{fontSize:28,fontWeight:700}}>{formatPct(value)}</div>
      <div style={{fontSize:12,color: change >= 0 ? "red":"green"}}>
        {change >= 0 ? "+" : ""}{change?.toFixed(2)}%
      </div>
    </div>
  );
}

function getFiltered(rows, range) {
  const now = new Date();
  let start = new Date(now);

  if (range === "6m") start.setMonth(now.getMonth() - 6);
  if (range === "1y") start.setFullYear(now.getFullYear() - 1);
  if (range === "3y") start.setFullYear(now.getFullYear() - 3);
  if (range === "5y") start.setFullYear(now.getFullYear() - 5);
  if (range === "10y") start.setFullYear(now.getFullYear() - 10);

  return rows.filter(r => new Date(r.date) >= start);
}

function buildLenders(marketRate) {
  const lenders = [
    ["Better", 0],
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
      delta: +(rate - marketRate).toFixed(2)
    };
  });
}

export default function Page() {

  const [rows, setRows] = React.useState([]);
  const [range, setRange] = React.useState("5y");
  const [status, setStatus] = React.useState("loading");

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fred-data");
        const json = await res.json();

        if (!json.ok) throw new Error();

        setRows(json.data || []);
        setStatus("live");
      } catch {
        setStatus("error");
      }
    }

    load();
  }, []);

  const filtered = getFiltered(rows, range);

  const latest = filtered.at(-1) || {};
  const prev = filtered.at(-5) || latest;

  const marketRate = latest.conforming30 || 6;

  const lenders = buildLenders(marketRate);

  return (
    <div style={{padding:20, fontFamily:"Arial"}}>

      <h1>Mortgage + Macro Dashboard</h1>

      <div style={{marginBottom:20}}>
        Status: {status === "live" ? "Live Data" : "Error / Demo"}
      </div>

      {/* RANGE */}
      <div style={{display:"flex", gap:10, marginBottom:20}}>
        {["6m","1y","3y","5y","10y"].map(r => (
          <button key={r} onClick={()=>setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* RATE CARDS */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10}}>
        {card("30Y", latest.conforming30, latest.conforming30 - prev.conforming30)}
        {card("15Y", latest.conforming15, latest.conforming15 - prev.conforming15)}
        {card("FHA", latest.fha30, latest.fha30 - prev.fha30)}
        {card("VA", latest.va30, latest.va30 - prev.va30)}
        {card("HELOC", latest.heloc, latest.heloc - prev.heloc)}
      </div>

      {/* FORWARD SIGNALS */}
      <h2 style={{marginTop:40}}>Forward Signals</h2>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10}}>
        {card("Inflation YoY", latest.inflationYoY, latest.inflationYoY - prev.inflationYoY)}
        {card("Fed Funds", latest.fedFunds, latest.fedFunds - prev.fedFunds)}
        {card("Unemployment", latest.unemployment, latest.unemployment - prev.unemployment)}
        {card("10Y Treasury", latest.treasury10, latest.treasury10 - prev.treasury10)}
      </div>

      {/* TREASURY CHART */}
      <h2 style={{marginTop:40}}>Treasury</h2>
      <div style={{height:300}}>
        <ResponsiveContainer>
          <LineChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label"/>
            <YAxis/>
            <Tooltip/>
            <Legend/>
            <Line dataKey="treasury10" stroke="green" />
            <Line dataKey="treasury2" stroke="blue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SPREAD */}
      <h2 style={{marginTop:40}}>Mortgage Spread</h2>
      <div style={{height:300}}>
        <ResponsiveContainer>
          <LineChart data={filtered}>
            <Line dataKey="mortgageSpread" stroke="orange"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MBS PANEL */}
      <h2 style={{marginTop:40}}>MBS Pressure (Proxy)</h2>
      <div>
        Spread: {formatPct(latest.mortgageSpread)}
        <br/>
        Trend: {latest.mortgageSpread < prev.mortgageSpread ? "Improving" : "Worsening"}
      </div>

      {/* MORTGAGE CHART */}
      <h2 style={{marginTop:40}}>Mortgage Rates</h2>
      <div style={{height:300}}>
        <ResponsiveContainer>
          <LineChart data={filtered}>
            <Line dataKey="conforming30" stroke="black"/>
            <Line dataKey="fha30" stroke="blue"/>
            <Line dataKey="va30" stroke="green"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* LENDERS */}
      <h2 style={{marginTop:40}}>Lender Comparison</h2>
      <table style={{width:"100%"}}>
        <thead>
          <tr>
            <th>Lender</th>
            <th>Rate</th>
            <th>Δ vs Market</th>
          </tr>
        </thead>
        <tbody>
          {lenders.map(l => (
            <tr key={l.lender}>
              <td>{l.lender}</td>
              <td>{formatPct(l.rate)}</td>
              <td>{l.delta}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* VOLUME */}
      <h2 style={{marginTop:40}}>Volume Intelligence</h2>
      <div>
        Market Trend: {latest.conforming30 < prev.conforming30 ? "Rates Falling → Volume ↑" : "Rates Rising → Volume ↓"}
      </div>

    </div>
  );
}
