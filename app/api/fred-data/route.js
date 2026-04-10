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

function computeInflationYoY(inflationSeries) {
  const monthlyMap = new Map(
    inflationSeries.map((item) => [item.date.slice(0, 7), item.value])
  );

  return inflationSeries
    .map((item) => {
      const d = new Date(item.date);
      d.setFullYear(d.getFullYear() - 1);
      const base = monthlyMap.get(d.toISOString().slice(0, 7));
      if (base == null) return null;

      return {
        date: item.date,
        value: +(((item.value - base) / base) * 100).toFixed(2),
      };
    })
    .filter(Boolean);
}

function mergeSeries(seriesMap) {
  const map = new Map();

  const add = (key, arr) => {
    arr.forEach((point) => {
      const labelDate = new Date(point.date);
      const row = map.get(point.date) ?? {
        date: point.date,
        label: labelDate.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
      };
      row[key] = point.value;
      map.set(point.date, row);
    });
  };

  Object.entries(seriesMap).forEach(([key, arr]) => add(key, arr));

  return [...map.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "5y";
    const observationStart = getObservationStart(range);

    const [
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
      inflation,
    ] = await Promise.all([
      fetchSeries(SERIES.conforming30, observationStart),
      fetchSeries(SERIES.conforming15, observationStart),
      fetchSeries(SERIES.fha30, observationStart),
      fetchSeries(SERIES.va30, observationStart),
      fetchSeries(SERIES.jumbo30, observationStart),
      fetchSeries(SERIES.heloc, observationStart),
      fetchSeries(SERIES.treasury10, observationStart),
      fetchSeries(SERIES.treasury2, observationStart),
      fetchSeries(SERIES.fedFunds, observationStart),
      fetchSeries(SERIES.unemployment, observationStart),
      fetchSeries(SERIES.inflation, observationStart),
    ]);

    const inflationYoY = computeInflationYoY(inflation);

    const merged = mergeSeries({
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
      data: merged,
      fetchedAt: new Date().toISOString(),
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
