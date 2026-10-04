import { NextRequest, NextResponse } from "next/server";
import { geminiModel, openai } from "@/config/OpenAiModel";

const urgencyValues = ["EMERGENCY", "URGENT", "ROUTINE"] as const;
const specialtyValues = [
  "GENERAL_PHYSICIAN",
  "CARDIOLOGIST",
  "DERMATOLOGIST",
  "PEDIATRICIAN",
  "PSYCHOLOGIST",
  "NUTRITIONIST",
  "ENT",
  "ORTHOPEDIC",
  "GYNECOLOGIST",
  "DENTIST",
] as const;

type Urgency = (typeof urgencyValues)[number];
type Specialty = (typeof specialtyValues)[number];

type TriageResult = {
  urgency: Urgency;
  specialty: Specialty;
  reason: string;
  should_book: boolean;
  red_flags: string[];
};

const isUrgency = (value: unknown): value is Urgency =>
  typeof value === "string" &&
  urgencyValues.includes(value as Urgency);

const isSpecialty = (value: unknown): value is Specialty =>
  typeof value === "string" &&
  specialtyValues.includes(value as Specialty);

function parseTriageResult(content: string): TriageResult {
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd < jsonStart) {
    throw new Error("The triage assistant did not return a JSON object.");
  }

  const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1)) as Partial<TriageResult>;
  const redFlags = Array.isArray(parsed.red_flags)
    ? parsed.red_flags.filter((flag): flag is string => typeof flag === "string")
    : [];

  if (
    !isUrgency(parsed.urgency) ||
    !isSpecialty(parsed.specialty) ||
    typeof parsed.reason !== "string" ||
    typeof parsed.should_book !== "boolean"
  ) {
    throw new Error("The triage assistant returned an invalid result.");
  }

  return {
    urgency: parsed.urgency,
    specialty: parsed.specialty,
    reason: parsed.reason,
    should_book: parsed.urgency !== "EMERGENCY" && parsed.should_book,
    red_flags: redFlags,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { symptoms?: unknown };
    const symptoms = typeof body.symptoms === "string" ? body.symptoms.trim() : "";

    if (!symptoms) {
      return NextResponse.json(
        { error: "Symptoms are required." },
        { status: 400 },
      );
    }

    if (symptoms.length > 4000) {
      return NextResponse.json(
        { error: "Please keep the symptom description under 4000 characters." },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: geminiModel,
      messages: [
        {
          role: "system",
          content: `You are a healthcare triage assistant. Identify potential emergency red flags, determine urgency, and recommend a medical specialty. Do not diagnose or prescribe medication. If emergency symptoms are present, do not recommend an AI consultation. Return only valid JSON with exactly these fields:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "specialty": "GENERAL_PHYSICIAN" | "CARDIOLOGIST" | "DERMATOLOGIST" | "PEDIATRICIAN" | "PSYCHOLOGIST" | "NUTRITIONIST" | "ENT" | "ORTHOPEDIC" | "GYNECOLOGIST" | "DENTIST",
  "reason": "brief explanation",
  "should_book": true | false,
  "red_flags": ["specific concerning symptom"]
}`,
        },
        {
          role: "user",
          content: symptoms,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("The triage assistant returned an empty response.");
    }

    return NextResponse.json(parseTriageResult(content));
  } catch (error) {
    console.error("Triage request failed:", error);
    const upstreamStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      {
        error:
          upstreamStatus === 404
            ? "The configured Gemini model is unavailable for this API key. Set GEMINI_MODEL to an enabled model and restart the server."
            : upstreamStatus === 503
              ? "The triage service is temporarily unavailable. Please try again in a moment."
            : "Unable to assess these symptoms right now. Please try again.",
      },
      { status: upstreamStatus === 404 || upstreamStatus === 503 ? upstreamStatus : 500 },
    );
  }
}
