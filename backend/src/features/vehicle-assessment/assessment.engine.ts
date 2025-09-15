import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import type { MarketCheckResponse, Listing } from "../../services/marketcheck";
import type { NHTSAResponse } from "../../services/nhtsa";

export type IssueKey =
  | "exterior_scratches"
  | "dents"
  | "paint_fade"
  | "rust"
  | "glass_chips"
  | "wheel_curb_rash"
  | "tire_wear"
  | "interior_wear"
  | "odor"
  | "dashboard_warning"
  | "mods"
  | "lights_damage"
  | "undercarriage_leak"
  | "missing_parts";

export interface AssessInput {
  mileage: number;
  description: string;
  photos: Array<string | { data: Buffer | string; mediaType: string }>;
  vin?: string;

  market?: MarketCheckResponse;
  nhtsa?: NHTSAResponse;
}

export interface VehicleAssessmentPrismaShape {
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    mileage: string;
    vin: string;
  };
  visualScore: number;
  maxScore: number;
  scoreDescription: string;
  conditionIssues: Array<{
    issueKey: IssueKey;
    title: string;
    description: string;
    icon: string;
  }>;
  marketValueRange: string;
  tradeInValue: string;
  tradeInDescription: string;
  aiConfidence: number;
  aiConfidenceDescription: string;
}

const FindingSchema = z.object({
  issueKey: z.enum([
    "exterior_scratches",
    "dents",
    "paint_fade",
    "rust",
    "glass_chips",
    "wheel_curb_rash",
    "tire_wear",
    "interior_wear",
    "odor",
    "dashboard_warning",
    "mods",
    "lights_damage",
    "undercarriage_leak",
    "missing_parts",
  ] as const),
  title: z.string().min(2),
  description: z.string().min(2),
  icon: z
    .string()
    .min(2)
    .describe(
      'Concise lucide-react icon name, e.g., "Car", "Armchair", "Wrench"'
    ),
  severity: z.number().int().min(1).max(5).describe("1=minor, 5=severe"),
  confidence: z.number().min(0).max(1),
});

const LlmOutputSchema = z.object({
  observations: z.object({
    exterior: z.array(FindingSchema).default([]),
    interior: z.array(FindingSchema).default([]),
    tires_wheels: z.array(FindingSchema).default([]),
    glass_lights: z.array(FindingSchema).default([]),
    mechanical: z.array(FindingSchema).default([]),
    other: z.array(FindingSchema).default([]),
  }),
  cleanliness: z.enum(["rough", "average", "clean", "excellent"]),
  overallComment: z.string().min(2),

  coverage: z.object({
    angles: z
      .array(
        z.enum([
          "front",
          "rear",
          "left",
          "right",
          "interior",
          "dash",
          "odometer",
          "engine_bay",
        ])
      )
      .default([]),
    photoCount: z.number().int().min(0),
    photoQualityScore: z.number().min(0).max(1),
  }),
});

const DEDUCTION_PER_LEVEL: Record<IssueKey, number> = {
  dents: 10,
  exterior_scratches: 4,
  paint_fade: 5,
  rust: 8,
  glass_chips: 6,
  wheel_curb_rash: 3,
  tire_wear: 5,
  interior_wear: 6,
  odor: 10,
  dashboard_warning: 12,
  mods: 4,
  lights_damage: 5,
  undercarriage_leak: 12,
  missing_parts: 7,
};
const MAX_SCORE = 100;

const RECON_COST_PER_LEVEL: Partial<Record<IssueKey, number>> = {
  dents: 300,
  exterior_scratches: 120,
  paint_fade: 180,
  rust: 350,
  glass_chips: 220,
  wheel_curb_rash: 80,
  tire_wear: 150,
  interior_wear: 180,
  odor: 250,
  dashboard_warning: 400,
  mods: 120,
  lights_damage: 160,
  undercarriage_leak: 450,
  missing_parts: 200,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function numberToUSD(n: number): string {
  return n <= 0 || !Number.isFinite(n)
    ? "N/A"
    : `$${Math.round(n).toLocaleString()}`;
}

type LlmOutput = z.infer<typeof LlmOutputSchema>;

function simpleRegression(x: number[], y: number[]) {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(x);
  const my = mean(y);
  const cov = x.reduce((acc, xi, i) => acc + (xi - mx) * (y[i] - my), 0);
  const varx = x.reduce((acc, xi) => acc + (xi - mx) ** 2, 0);
  const slope = varx === 0 ? 0 : cov / varx;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  return (
    sorted[base] +
    (sorted[base + 1] - (sorted[base] ?? 0)) *
      (isNaN(sorted[base + 1]) ? 0 : rest)
  );
}

function computeMarketValues(
  listings: Listing[] | undefined,
  subjectMiles: number
) {
  if (!listings || listings.length === 0)
    return { p25: NaN, p50: NaN, p75: NaN };

  const rows = listings
    .filter(
      (l) =>
        typeof l.price === "number" &&
        Number.isFinite(l.price!) &&
        Number.isFinite(l.miles)
    )
    .map((l) => ({ miles: l.miles, price: l.price! }));

  if (rows.length < 3) return { p25: NaN, p50: NaN, p75: NaN };

  const x = rows.map((r) => r.miles);
  const y = rows.map((r) => r.price);
  const { slope } = simpleRegression(x, y);

  const adjusted = rows
    .map((r) => r.price + slope * (subjectMiles - r.miles))
    .sort((a, b) => a - b);

  const q1 = percentile(adjusted, 0.25);
  const q3 = percentile(adjusted, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const clipped = adjusted
    .filter((v) => v >= lo && v <= hi)
    .sort((a, b) => a - b);

  return {
    p25: percentile(clipped, 0.25),
    p50: percentile(clipped, 0.5),
    p75: percentile(clipped, 0.75),
  };
}

function describeScore(score: number): string {
  if (score >= 90) return "Excellent visual condition with minimal wear.";
  if (score >= 80) return "Clean vehicle with light, typical wear.";
  if (score >= 70) return "Average condition; several cosmetic items noted.";
  if (score >= 60) return "Below-average condition; visible defects and wear.";
  return "Rough condition with notable visible issues.";
}

function describeConfidence(
  c: number,
  coverage: LlmOutput["coverage"]
): string {
  const bucket = c >= 85 ? "High" : c >= 65 ? "Medium" : "Low";
  const angles = coverage.angles.length
    ? ` (${coverage.angles.join(", ")})`
    : "";
  return `${bucket} confidence based on ${coverage.photoCount} photos and coverage${angles}.`;
}

async function llmFindings(input: AssessInput): Promise<LlmOutput> {
  const model = google("gemini-2.5-flash");

  const contentParts = [
    {
      type: "text",
      text: [
        "You are an automotive visual inspector.",
        "Analyze the following photos and notes. Extract visible condition issues ONLY if they are clearly supported by the images or explicitly stated in the description.",
        "Return the issues with an appropriate issueKey, severity (1-5), short title, concise description, a suitable icon name, and your confidence (0-1).",
        "Also estimate cleanliness (rough/average/clean/excellent), overall comment, and coverage (angles observed, count, and a photoQualityScore).",
        "",
        "Assumptions you MUST avoid:",
        "- Do not infer mechanical problems that are not visually indicated.",
        "- If unsure, omit the issue or set very low confidence.",
      ].join("\n"),
    },
    { type: "text", text: `Mileage: ${input.mileage}` },
    { type: "text", text: `User description: ${input.description ?? ""}` },
  ];

  for (const p of input.photos) {
    if (typeof p === "string") {
      contentParts.push({ type: "file", data: p, mediaType: "image/jpeg" });
    } else {
      contentParts.push({
        type: "file",
        data: p.data,
        mediaType: p.mediaType || "image/jpeg",
      });
    }
  }

  const { object } = await generateObject({
    model,

    messages: [{ role: "user", content: contentParts }],
    schema: LlmOutputSchema,
  });

  return object;
}

export async function assessVehicle(
  input: AssessInput
): Promise<VehicleAssessmentPrismaShape> {
  const n = input.nhtsa?.Results?.[0];
  const make = (n?.Make || "").trim() || "Unknown";
  const model = (n?.Model || "").trim() || "Unknown";
  const year = Number(n?.ModelYear || "") || new Date().getFullYear();
  const vin = (input.vin || n?.VIN || "").trim() || "Unknown";

  const llm = await llmFindings(input);

  const allFindings = [
    ...llm.observations.exterior,
    ...llm.observations.interior,
    ...llm.observations.tires_wheels,
    ...llm.observations.glass_lights,
    ...llm.observations.mechanical,
    ...llm.observations.other,
  ];

  const totalDeduction = allFindings.reduce((sum, f) => {
    const per = DEDUCTION_PER_LEVEL[f.issueKey] ?? 0;
    return sum + per * f.severity;
  }, 0);

  const visualScore = clamp(MAX_SCORE - totalDeduction, 0, MAX_SCORE);
  const scoreDescription = describeScore(visualScore);

  const { p25, p50, p75 } = computeMarketValues(
    input.market?.listings,
    input.mileage
  );
  const reconCost = allFindings.reduce((sum, f) => {
    const base = RECON_COST_PER_LEVEL[f.issueKey] ?? 0;
    return sum + base * f.severity;
  }, 0);

  const tradeIn = Number.isFinite(p50)
    ? Math.max(0, (p50 as number) * 0.9 - reconCost)
    : NaN;

  const avgFindingConfidence =
    allFindings.length > 0
      ? allFindings.reduce((a, b) => a + b.confidence, 0) / allFindings.length
      : 0.4;
  const coverageFactor =
    (llm.coverage.photoQualityScore || 0) * 0.6 +
    Math.min(1, llm.coverage.angles.length / 6) * 0.4;
  const aiConfidence = clamp(
    Math.round((avgFindingConfidence * 0.5 + coverageFactor * 0.5) * 100),
    0,
    100
  );
  const aiConfidenceDescription = describeConfidence(
    aiConfidence,
    llm.coverage
  );

  const conditionIssues = allFindings.map((f) => ({
    issueKey: f.issueKey,
    title: f.title,
    description: f.description,
    icon: f.icon,
  }));

  const assessment: VehicleAssessmentPrismaShape = {
    vehicleDetails: {
      make,
      model,
      year,
      mileage: String(input.mileage),
      vin,
    },
    visualScore,
    maxScore: MAX_SCORE,
    scoreDescription,
    conditionIssues,
    marketValueRange:
      Number.isFinite(p25) && Number.isFinite(p75)
        ? `${numberToUSD(p25 as number)} - ${numberToUSD(p75 as number)}`
        : "N/A",
    tradeInValue: numberToUSD(tradeIn),
    tradeInDescription:
      Number.isFinite(tradeIn) && Number.isFinite(p50)
        ? `Estimated trade-in assumes ~10% dealer margin from mid-market (${numberToUSD(
            p50 as number
          )}) and ~$${Math.round(
            reconCost
          ).toLocaleString()} reconditioning based on visible issues.`
        : "Insufficient market comps to estimate trade-in value.",
    aiConfidence,
    aiConfidenceDescription,
  };

  return assessment;
}
