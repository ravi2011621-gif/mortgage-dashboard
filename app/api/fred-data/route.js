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
  wageYoY: "CES0500000003",
  cpi: "CPIAUCSL",
  coreCpi: "CPILFESL",
  pce: "PCEPI",
  corePce: "PCEPILFE",
  gdp: "GDP",

  fedMbsHoldings: "WSHOMCB",
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
  const byMonth = new Map(series.map((item) => [item.date.slice(0, 7), item.value]));

  return series
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

function computeMoM(series) {
  return series
    .map((item, idx) => {
      if (idx === 0) return null;
      const prior = series[idx - 1]?.value;
      if (prior == null || prior === 0) return null;
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
  const valid = series.filter((x) => x.value != null);
  return valid.length ? valid[valid.length - 1].value : null;
}

function classifyTrend(current, prior, inverse = false) {
  if (current == null || prior == null) return "neutral";
  const diff = current - prior;
  if (Math.abs(diff) < 0.05) return "stable";
  if (!inverse) return diff > 0 ? "rising" : "falling";
  return diff > 0 ? "worsening" : "improving";
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
      trend: classifyTrend(lastValue(data.cpiYoY), data.cpiYoY.at(-5)?.value, true),
    },
    labor: {
      unemployment: lastValue(data.unemployment),
      wage_yoy: lastValue(data.wageYoYYoY),
      wage_mom: lastValue(data.wageYoYMoM),
      trend: classifyTrend(lastValue(data.unemployment), data.unemployment.at(-5)?.value),
    },
    growth: {
      gdp: lastValue(data.gdp),
      prior_gdp: data.gdp.filter((x) => x.value != null).at(-2)?.value ?? null,
      trend: classifyTrend(lastValue(data.gdp), data.gdp.filter((x) => x.value != null).at(-2)?.value),
    },
    fed: {
      fedFunds: lastValue(data.fedFunds),
      expectedNextMove:
        lastValue(data.cpiYoY) != null && lastValue(data.cpiYoY) > 3
          ? "hold / hawkish"
          : lastValue(data.unemployment) != null && lastValue(data.unemployment) > 4.4
          ? "cut bias"
          : "hold / neutral",
      next3MeetingsBias:
        lastValue(data.cpiYoY) != null && lastValue(data.cpiYoY) > 3
          ? "fewer cuts priced"
          : "cuts priced",
      tone:
        lastValue(data.cpiYoY) != null && lastValue(data.cpiYoY) > 3
          ? "hawkish"
          : "neutral",
    },
  };
}

function buildBondMarket(rows) {
  const latest = rows.at(-1) || {};
  const prior = rows.at(-5) || latest;

  let interpretation = "mixed";
  if (latest.curveSpread != null && prior.curveSpread != null) {
    if (latest.curveSpread > prior.curveSpread && latest.treasury10 < prior.treasury10) {
      interpretation = "bull steepening";
    } else if (latest.curveSpread > prior.curveSpread && latest.treasury10 > prior.treasury10) {
      interpretation = "bear steepening";
    } else if (latest.curveSpread < prior.curveSpread) {
      interpretation = "flattening";
    }
  }

  return {
    latest: {
      treasury10: latest.treasury10 ?? null,
      treasury2: latest.treasury2 ?? null,
      curveSpread: latest.curveSpread ?? null,
    },
    interpretation,
  };
}

function buildTransmission(rows, fedMbsHoldingsSeries) {
  const latest = rows.at(-1) || {};
  const prior = rows.at(-5) || latest;

  let passThrough = "stable";
  if (latest.mortgageSpread != null && prior.mortgageSpread != null) {
    if (latest.mortgageSpread < prior.mortgageSpread - 0.05) passThrough = "improving";
    else if (latest.mortgageSpread > prior.mortgageSpread + 0.05) passThrough = "worsening";
  }

  let mbsCondition = "neutral";
  if (latest.mbsPressure != null && prior.mbsPressure != null) {
    if (latest.mbsPressure < prior.mbsPressure - 0.05) mbsCondition = "positive";
    else if (latest.mbsPressure > prior.mbsPressure + 0.05) mbsCondition = "negative";
  }

  return {
    mortgageSpread: latest.mortgageSpread ?? null,
    spreadChange:
      latest.mortgageSpread != null && prior.mortgageSpread != null
        ? +(latest.mortgageSpread - prior.mortgageSpread).toFixed(2)
        : null,
    mbsPressure: latest.mbsPressure ?? null,
    mbsCondition,
    passThrough,
    fedMbsHoldings: lastValue(fedMbsHoldingsSeries),
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
      wageYoYRaw,
      cpiRaw,
      coreCpiRaw,
      pceRaw,
      corePceRaw,
      gdpRaw,
      fedMbsHoldingsRaw,
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
      fetchSeries(SERIES.wageYoY, observationStart),
      fetchSeries(SERIES.cpi, observationStart),
      fetchSeries(SERIES.coreCpi, observationStart),
      fetchSeries(SERIES.pce, observationStart),
      fetchSeries(SERIES.corePce, observationStart),
      fetchSeries(SERIES.gdp, observationStart),
      fetchSeries(SERIES.fedMbsHoldings, observationStart).catch(() => []),
    ]);

    const cpiYoYRaw = computeYoY(cpiRaw);
    const cpiMoMRaw = computeMoM(cpiRaw);
    const coreCpiYoYRaw = computeYoY(coreCpiRaw);
    const coreCpiMoMRaw = computeMoM(coreCpiRaw);
    const pceYoYRaw = computeYoY(pceRaw);
    const pceMoMRaw = computeMoM(pceRaw);
    const corePceYoYRaw = computeYoY(corePceRaw);
    const corePceMoMRaw = computeMoM(corePceRaw);
    const wageYoYYoYRaw = computeYoY(wageYoYRaw);
    const wageYoYMoMRaw = computeMoM(wageYoYRaw);

    const timeline = buildWeeklyTimeline(observationStart);

    const aligned = {
      conforming30: alignToTimeline(timeline, toWeekly(conforming30Raw)),
      conforming15: alignToTimeline(timeline, toWeekly(conforming15Raw)),
      fha30: alignToTimeline(timeline, toWeekly(fha30Raw)),
      va30: alignToTimeline(timeline, toWeekly(va30Raw)),
      jumbo30: alignToTimeline(timeline, toWeekly(jumbo30Raw)),
      treasury10: alignToTimeline(timeline, toWeekly(treasury10Raw)),
      treasury2: alignToTimeline(timeline, toWeekly(treasury2Raw)),
      fedFunds: alignToTimeline(timeline, toWeekly(fedFundsRaw)),
      unemployment: alignToTimeline(timeline, toWeekly(unemploymentRaw)),
      cpiYoY: alignToTimeline(timeline, toWeekly(cpiYoYRaw)),
      cpiMoM: alignToTimeline(timeline, toWeekly(cpiMoMRaw)),
      coreCpiYoY: alignToTimeline(timeline, toWeekly(coreCpiYoYRaw)),
      coreCpiMoM: alignToTimeline(timeline, toWeekly(coreCpiMoMRaw)),
      pceYoY: alignToTimeline(timeline, toWeekly(pceYoYRaw)),
      pceMoM: alignToTimeline(timeline, toWeekly(pceMoMRaw)),
      corePceYoY: alignToTimeline(timeline, toWeekly(corePceYoYRaw)),
      corePceMoM: alignToTimeline(timeline, toWeekly(corePceMoMRaw)),
      wageYoYYoY: alignToTimeline(timeline, toWeekly(wageYoYYoYRaw)),
      wageYoYMoM: alignToTimeline(timeline, toWeekly(wageYoYMoMRaw)),
      gdp: alignToTimeline(timeline, toWeekly(gdpRaw)),
      fedMbsHoldings: alignToTimeline(timeline, toWeekly(fedMbsHoldingsRaw)),
    };

    let heloc = alignToTimeline(timeline, toWeekly(helocRaw));
    const helocHasData = heloc.some((x) => x.value != null);

    if (!helocHasData) {
      heloc = aligned.conforming30.map((x) => ({
        date: x.date,
        value: x.value != null ? +(x.value + 1.5).toFixed(2) : null,
      }));
    }

    const rows = mergeSeriesToRows({
      conforming30: aligned.conforming30,
      conforming15: aligned.conforming15,
      fha30: aligned.fha30,
      va30: aligned.va30,
      jumbo30: aligned.jumbo30,
      heloc,
      treasury10: aligned.treasury10,
      treasury2: aligned.treasury2,
      fedFunds: aligned.fedFunds,
      unemployment: aligned.unemployment,
      cpiYoY: aligned.cpiYoY,
      cpiMoM: aligned.cpiMoM,
      coreCpiYoY: aligned.coreCpiYoY,
      coreCpiMoM: aligned.coreCpiMoM,
      pceYoY: aligned.pceYoY,
      pceMoM: aligned.pceMoM,
      corePceYoY: aligned.corePceYoY,
      corePceMoM: aligned.corePceMoM,
      wageYoY: aligned.wageYoYYoY,
      wageMoM: aligned.wageYoYMoM,
      gdp: aligned.gdp,
      fedMbsHoldings: aligned.fedMbsHoldings,
    });

    return NextResponse.json({
      ok: true,
      range,
      helocSource: helocHasData ? "fred" : "modeled_fallback",
      fetchedAt: new Date().toISOString(),
      summary: buildSummary(rows),
      forwardSignals: buildForwardSignals(aligned),
      bondMarket: buildBondMarket(rows),
      mortgageTransmission: buildTransmission(rows, aligned.fedMbsHoldings),
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
