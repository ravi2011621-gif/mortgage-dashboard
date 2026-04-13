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
  treasury10: "DGS10",
  treasury2: "DGS2",
  fedFunds: "DFF",
  unemployment: "UNRATE",

  cpi: "CPIAUCSL",
  coreCpi: "CPILFESL",
  pce: "PCEPI",
  corePce: "PCEPILFE",
  wageYoY: "CES0500000003",
  wageMoM: "CES0500000003",
  gdp: "GDPC1",
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
  const selected = RANGE_OPTIONS[rangeKey] || RANGE_OPTIONS["15y"];

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

function computeYoY(series) {
  return series
    .map((d, i, arr) => {
      const prev = arr[i - 12];
      if (!prev) return null;

      return {
        date: d.date,
        value: +(((d.value - prev.value) / prev.value) * 100).toFixed(2),
      };
    })
    .filter(Boolean);
}

function computeMoM(series) {
  return series
    .map((d, i, arr) => {
      const prev = arr[i - 1];
      if (!prev) return null;

      return {
        date: d.date,
        value: +(((d.value - prev.value) / prev.value) * 100).toFixed(2),
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

    const mbsPressure =
      mortgageSpread != null && row.treasury10 != null
        ? +(mortgageSpread + row.treasury10 / 10).toFixed(2)
        : mortgageSpread;

    return {
      ...row,
      mortgageSpread,
      curveSpread,
      mbsPressure,
    };
  });
}

function lastValue(series) {
  if (!series?.length) return null;
  return series[series.length - 1]?.value ?? null;
}

function classifyTrend(current, previous, reverse = false) {
  if (current == null || previous == null) return "neutral";
  if (!reverse) {
    if (current > previous) return "rising";
    if (current < previous) return "falling";
    return "flat";
  }
  if (current < previous) return "improving";
  if (current > previous) return "worsening";
  return "flat";
}

function buildSummary(rows) {
  const latest = rows.at(-1) || {};
  const prior = rows.at(-5) || latest;

  return {
    conforming30: latest.conforming30 ?? null,
    conforming30_change:
      latest.conforming30 != null && prior.conforming30 != null
        ? +(latest.conforming30 - prior.conforming30).toFixed(2)
        : null,
    conforming15: latest.conforming15 ?? null,
    fha30: latest.fha30 ?? null,
    va30: latest.va30 ?? null,
    jumbo30: latest.jumbo30 ?? null,
    heloc: latest.heloc ?? null,
    treasury10: latest.treasury10 ?? null,
    mortgageSpread: latest.mortgageSpread ?? null,
    mbsPressure: latest.mbsPressure ?? null,
  };
}

function buildForwardSignals(data) {
  const cpiYoYPrev = data.cpiYoY.at(-5)?.value ?? null;
  const unemploymentPrev = data.unemployment.at(-5)?.value ?? null;
  const gdpValues = data.gdp.filter((x) => x.value != null);

  return {
    inflation: {
      cpi_yoy: lastValue(data.cpiYoY),
      cpi_mom: lastValue(data.cpiMoM),
      core_cpi_yoy: lastValue(data.coreCpiYoY),
      core_cpi_mom: lastValue(data.coreCpiMoM),
      pce_yoy: lastValue(data.pceYoY),
      pce_mom: lastValue(data.pceMoM),
      core_pce_yoy: lastValue(data.corePceYoY),
      core_pce_mom: lastValue(data.corePceMoM),
      trend: classifyTrend(lastValue(data.cpiYoY), cpiYoYPrev, true),
    },
    labor: {
      unemployment: lastValue(data.unemployment),
      wage_yoy: lastValue(data.wageYoYYoY),
      wage_mom: lastValue(data.wageYoYMoM),
      trend: classifyTrend(lastValue(data.unemployment), unemploymentPrev, true),
    },
    growth: {
      gdp: lastValue(data.gdp),
      prior_gdp: gdpValues.at(-2)?.value ?? null,
      trend: classifyTrend(lastValue(data.gdp), gdpValues.at(-2)?.value ?? null),
    },
    fed: {
      fedFunds: lastValue(data.fedFunds),
      expectedNextMove: "hold",
      next3MeetingsBias: "market-based placeholder",
      tone: "neutral",
    },
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "15y";
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
      cpiRaw,
      coreCpiRaw,
      pceRaw,
      corePceRaw,
      wageRaw,
      gdpRaw,
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
      fetchSeries(SERIES.cpi, observationStart),
      fetchSeries(SERIES.coreCpi, observationStart),
      fetchSeries(SERIES.pce, observationStart),
      fetchSeries(SERIES.corePce, observationStart),
      fetchSeries(SERIES.wageYoY, observationStart),
      fetchSeries(SERIES.gdp, observationStart),
    ]);

    const cpiYoYRaw = computeYoY(cpiRaw);
    const cpiMoMRaw = computeMoM(cpiRaw);
    const coreCpiYoYRaw = computeYoY(coreCpiRaw);
    const coreCpiMoMRaw = computeMoM(coreCpiRaw);
    const pceYoYRaw = computeYoY(pceRaw);
    const pceMoMRaw = computeMoM(pceRaw);
    const corePceYoYRaw = computeYoY(corePceRaw);
    const corePceMoMRaw = computeMoM(corePceRaw);
    const wageYoYYoYRaw = computeYoY(wageRaw);
    const wageYoYMoMRaw = computeMoM(wageRaw);

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

    const cpiYoY = alignToTimeline(timeline, toWeekly(cpiYoYRaw));
    const cpiMoM = alignToTimeline(timeline, toWeekly(cpiMoMRaw));
    const coreCpiYoY = alignToTimeline(timeline, toWeekly(coreCpiYoYRaw));
    const coreCpiMoM = alignToTimeline(timeline, toWeekly(coreCpiMoMRaw));
    const pceYoY = alignToTimeline(timeline, toWeekly(pceYoYRaw));
    const pceMoM = alignToTimeline(timeline, toWeekly(pceMoMRaw));
    const corePceYoY = alignToTimeline(timeline, toWeekly(corePceYoYRaw));
    const corePceMoM = alignToTimeline(timeline, toWeekly(corePceMoMRaw));
    const wageYoYYoY = alignToTimeline(timeline, toWeekly(wageYoYYoYRaw));
    const wageYoYMoM = alignToTimeline(timeline, toWeekly(wageYoYMoMRaw));
    const gdp = alignToTimeline(timeline, toWeekly(gdpRaw));

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
      inflationYoY: cpiYoY,
    });

    const forwardSignals = buildForwardSignals({
      cpiYoY,
      cpiMoM,
      coreCpiYoY,
      coreCpiMoM,
      pceYoY,
      pceMoM,
      corePceYoY,
      corePceMoM,
      wageYoYYoY,
      wageYoYMoM,
      unemployment,
      gdp,
      fedFunds,
    });

    return NextResponse.json({
      ok: true,
      range,
      helocSource: helocHasData ? "fred" : "modeled_fallback",
      fetchedAt: new Date().toISOString(),
      summary: buildSummary(rows),
      forwardSignals,
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
