import { NextResponse } from "next/server";

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

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

const RANGE_OPTIONS = {
  "6m": { months: 6 },
  "1y": { years: 1 },
  "3y": { years: 3 },
  "5y": { years: 5 },
  "10y": { years: 10 },
  "15y": { years: 15 },
};

function getObservationStart(rangeKey) {
  const now = new Date();
  const start = new Date(now);
  const selected = RANGE_OPTIONS[rangeKey] || RANGE_OPTIONS["5y"];

  if (selected.months) start.setMonth(start.getMonth() - selected.months);
  if (selected.years) start.setFullYear(start.getFullYear() - selected.years);

  return start.toISOString().slice(0, 10);
}

async function fetchSeries(seriesId, observationStart) {
  if (!FRED_API_KEY) {
    throw new Error("Missing FRED_API_KEY");
  }

  const query = new URLSearchParams({
    series_id: seriesId,
    api_key: FRED_API_KEY,
    file_type: "json",
    sort_order: "asc",
    observation_start: observationStart,
  });

  const response = await fetch(`${FRED_BASE}?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FRED request failed for ${seriesId}: ${response.status} ${text}`);
  }

  const json = await response.json();

  return (json.observations || [])
    .map((item) => ({
      date: item.date,
      value: Number(item.value),
    }))
    .filter((item) => Number.isFinite(item.value));
}

function toWeekly(series) {
  const buckets = new Map();

  for (const point of series) {
    const d = new Date(point.date);
    if (Number.isNaN(d.getTime())) continue;

    const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = utc.getUTCDay();
    utc.setUTCDate(utc.getUTCDate() - day);
    const weekKey = utc.toISOString().slice(0, 10);

    buckets.set(weekKey, point.value);
  }

  return [...buckets.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function computeInflationYoY(monthlySeries) {
  const byMonth = new Map(monthlySeries.map((item) => [item.date.slice(0, 7), item.value]));

  return monthlySeries
    .map((item) => {
      const d = new Date(item.date);
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      const priorKey = d.toISOString().slice(0, 7);
      const prior = byMonth.get(priorKey);

      if (prior == null) return null;

      return {
        date: item.date,
        value: +(((item.value - prior) / prior) * 100).toFixed(2),
      };
    })
    .filter(Boolean);
}

function buildWeeklyTimeline(observationStart) {
  const start = new Date(observationStart);
  const end = new Date();

  const startUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  const day = startUtc.getUTCDay();
  startUtc.setUTCDate(startUtc.getUTCDate() - day);

  const timeline = [];
  const cursor = new Date(startUtc);

  while (cursor <= endUtc) {
    timeline.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return timeline;
}

function alignToTimeline(timeline, weeklySeries) {
  const map = new Map(weeklySeries.map((item) => [item.date, item.value]));
  let last = null;

  return timeline.map((date) => {
    const current = map.has(date) ? map.get(date) : null;
    if (current != null) last = current;
    return {
      date,
      value: current != null ? current : last,
    };
  });
}

function mergeSeriesToRows(seriesMap) {
  const rowMap = new Map();

  for (const [key, arr] of Object.entries(seriesMap)) {
    for (const point of arr) {
      const dateObj = new Date(point.date);
      const label = dateObj.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });

      const row = rowMap.get(point.date) || {
        date: point.date,
        label,
      };

      row[key] = point.value;
      rowMap.set(point.date, row);
    }
  }

  const rows = [...rowMap.values()].sort((a, b) => new Date(a.date) - new Date(b.date));

  return rows.map((row) => {
    const mortgageSpread =
      row.conforming30 != null && row.treasury10 != null
        ? +(row.conforming30 - row.treasury10).toFixed(2)
        : null;

    const curveSpread =
      row.treasury10 != null && row.treasury2 != null
        ? +(row.treasury10 - row.treasury2).toFixed(2)
        : null;

    return {
      ...row,
      mortgageSpread,
      curveSpread,
    };
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "5y";
    const observationStart = getObservationStart(range);

    const [
      conforming30Raw,
      conforming15Raw,
      fha30Raw,
      va30Raw,
      jumbo30Raw,
      helocRaw,
      treasury10Raw,
      treasury2Raw,
      fedFundsRaw,
      unemploymentRaw,
      inflationRaw,
    ] = await Promise.all([
      fetchSeries(SERIES.conforming30, observationStart),
      fetchSeries(SERIES.conforming15, observationStart),
      fetchSeries(SERIES.fha30, observationStart),
      fetchSeries(SERIES.va30, observationStart),
      fetchSeries(SERIES.jumbo30, observationStart),
      fetchSeries(SERIES.heloc, observationStart).catch(() => []),
      fetchSeries(SERIES.treasury10, observationStart),
      fetchSeries(SERIES.treasury2, observationStart),
      fetchSeries(SERIES.fedFunds, observationStart),
      fetchSeries(SERIES.unemployment, observationStart),
      fetchSeries(SERIES.inflation, observationStart),
    ]);

    const inflationYoYRaw = computeInflationYoY(inflationRaw);
    const timeline = buildWeeklyTimeline(observationStart);

    const conforming30 = alignToTimeline(timeline, toWeekly(conforming30Raw));
    const conforming15 = alignToTimeline(timeline, toWeekly(conforming15Raw));
    const fha30 = alignToTimeline(timeline, toWeekly(fha30Raw));
    const va30 = alignToTimeline(timeline, toWeekly(va30Raw));
    const jumbo30 = alignToTimeline(timeline, toWeekly(jumbo30Raw));
    const treasury10 = alignToTimeline(timeline, toWeekly(treasury10Raw));
    const treasury2 = alignToTimeline(timeline, toWeekly(treasury2Raw));
    const fedFunds = alignToTimeline(timeline, toWeekly(fedFundsRaw));
    const unemployment = alignToTimeline(timeline, toWeekly(unemploymentRaw));
    const inflationYoY = alignToTimeline(timeline, toWeekly(inflationYoYRaw));

    let heloc = alignToTimeline(timeline, toWeekly(helocRaw));
    const helocHasData = heloc.some((x) => x.value != null);

    if (!helocHasData) {
      heloc = conforming30.map((x) => ({
        date: x.date,
        value: x.value != null ? +(x.value + 1.5).toFixed(2) : null,
      }));
    }

    const rows = mergeSeriesToRows({
      conforming30,
      conforming15,
      fha30,
      va30,
      jumbo30,
      heloc,
      treasury10,
      treasury2,
      fedFunds,
      unemployment,
      inflationYoY,
    });

    return NextResponse.json({
      ok: true,
      range,
      helocSource: helocHasData ? "fred" : "modeled_fallback",
      fetchedAt: new Date().toISOString(),
      data: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}
