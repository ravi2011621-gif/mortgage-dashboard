import { NextResponse } from "next/server";

const FOMC_MEETINGS = [
  {
    date: "2023-01-31",
    label: "Jan 31-Feb 1, 2023",
    rateChange: "+25 bps",
    targetRange: "4.50% - 4.75%",
    summary:
      "The Fed raised rates by 25 basis points and slowed the pace of tightening, but the overall tone stayed restrictive.",
    keyPoints: [
      "Slower hike pace, still hawkish.",
      "Inflation easing but still elevated.",
      "Labor market remained tight.",
    ],
    mortgageView:
      "Mortgage-negative overall because the meeting kept long-end rate relief limited.",
    statementTone: "hawkish",
    powellTone: "firm",
    dotPlotSummary: "higher-for-longer",
  },
  {
    date: "2023-03-21",
    label: "Mar 21-22, 2023",
    rateChange: "+25 bps",
    targetRange: "4.75% - 5.00%",
    summary:
      "The committee raised rates during regional bank stress and acknowledged tighter credit conditions.",
    keyPoints: [
      "Bank stress mattered.",
      "Inflation still a concern.",
      "Forward guidance softened modestly.",
    ],
    mortgageView:
      "Mortgage volatility increased because markets had to price both banking stress and policy restraint.",
    statementTone: "cautiously hawkish",
    powellTone: "measured",
    dotPlotSummary: "cuts not imminent",
  },
  {
    date: "2023-07-25",
    label: "Jul 25-26, 2023",
    rateChange: "+25 bps",
    targetRange: "5.25% - 5.50%",
    summary:
      "The Fed delivered another hike and reinforced the higher-for-longer theme.",
    keyPoints: [
      "Cycle highs for policy rate.",
      "Inflation still above target.",
      "Data dependence emphasized.",
    ],
    mortgageView:
      "Kept affordability under pressure by supporting elevated Treasury yields.",
    statementTone: "hawkish",
    powellTone: "restrictive",
    dotPlotSummary: "higher-for-longer",
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
      "Neutral to mildly restrictive because mortgage relief still depended on more data.",
    statementTone: "neutral",
    powellTone: "cautious",
    dotPlotSummary: "cuts possible but data dependent",
  },
  {
    date: "2024-09-17",
    label: "Sep 17-18, 2024",
    rateChange: "No change",
    targetRange: "5.00% - 5.25%",
    summary:
      "Markets focused on the growth outlook and whether future easing could accelerate.",
    keyPoints: [
      "Growth slowdown risk rose.",
      "Guidance mattered more than hold.",
      "Long-end rates drove mortgage repricing.",
    ],
    mortgageView:
      "Mortgage pricing became more expectation-driven than policy-move-driven.",
    statementTone: "balanced",
    powellTone: "watchful",
    dotPlotSummary: "easing bias forming",
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
    statementTone: "neutral",
    powellTone: "patient",
    dotPlotSummary: "gradual easing path",
  },
  {
    date: "2025-12-09",
    label: "Dec 9-10, 2025",
    rateChange: "No change",
    targetRange: "3.75% - 4.00%",
    summary:
      "Year-end guidance mattered more than the hold itself, shaping expectations for the next year.",
    keyPoints: [
      "Year-end guidance shaped expectations.",
      "Markets focused on easing pace.",
      "Inflation durability still watched.",
    ],
    mortgageView:
      "Important for lock behavior and forward mortgage pricing expectations.",
    statementTone: "neutral",
    powellTone: "measured",
    dotPlotSummary: "moderate cuts priced",
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
      "Mortgage-negative because restrictive messaging can keep yields and spreads sticky.",
    statementTone: "hawkish",
    powellTone: "firm",
    dotPlotSummary: "cuts delayed",
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
    statementTone: "tbd",
    powellTone: "tbd",
    dotPlotSummary: "market watching for shift",
  },
  {
    date: "2026-06-16",
    label: "Jun 16-17, 2026",
    rateChange: "Expected / upcoming",
    targetRange: "TBD",
    summary:
      "This could become an inflection meeting if labor softens and inflation continues to cool.",
    keyPoints: [
      "Possible inflection window.",
      "Labor and inflation data will drive tone.",
      "Refi psychology would respond quickly to dovish language.",
    ],
    mortgageView:
      "A softer tone here could matter more for refinance psychology than purchase affordability.",
    statementTone: "tbd",
    powellTone: "tbd",
    dotPlotSummary: "watch for faster easing bias",
  },
];

export async function GET() {
  const now = new Date();
  const nextUpcoming =
    FOMC_MEETINGS.find((m) => new Date(m.date) >= now) ||
    FOMC_MEETINGS[FOMC_MEETINGS.length - 1];

  return NextResponse.json({
    ok: true,
    nextUpcomingMeeting: nextUpcoming,
    meetings: FOMC_MEETINGS,
  });
}
