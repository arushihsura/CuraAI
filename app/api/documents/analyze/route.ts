import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { geminiModel, openai } from "@/config/OpenAiModel";

const ANALYSIS_PROMPT = `You are a careful medical report explanation assistant. Analyze the uploaded report content and return only valid JSON.
Do not diagnose, prescribe medication, or invent values. Use reference ranges from the report when available. Clearly distinguish reported values from general educational context.
Return this shape:
{
  "documentType": "string",
  "summary": "short patient-friendly summary",
  "results": [
    {
      "name": "test or measurement name",
      "value": "reported value",
      "unit": "unit or empty string",
      "referenceRange": "range or empty string",
      "status": "LOW" | "NORMAL" | "HIGH" | "UNKNOWN"
    }
  ],
  "whatThisMayMean": ["plain-language educational point"],
  "questionsForDoctor": ["question the patient may ask a licensed professional"],
  "disclaimer": "This explanation is informational and is not a medical diagnosis."
}`;

type ReportResult = {
  documentType: string;
  summary: string;
  results: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: "LOW" | "NORMAL" | "HIGH" | "UNKNOWN";
  }>;
  whatThisMayMean: string[];
  questionsForDoctor: string[];
  disclaimer: string;
};

const statuses = ["LOW", "NORMAL", "HIGH", "UNKNOWN"] as const;

function parseReport(content: string): ReportResult {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end < start) {
    throw new Error("The analyzer did not return a JSON object.");
  }

  const raw = JSON.parse(content.slice(start, end + 1)) as Partial<ReportResult>;
  if (typeof raw.documentType !== "string" || typeof raw.summary !== "string") {
    throw new Error("The analyzer returned an invalid report summary.");
  }

  const results = Array.isArray(raw.results)
    ? raw.results
        .filter((result) => Boolean(result && typeof result === "object"))
        .map((result) => ({
          name: typeof result.name === "string" ? result.name : "Unnamed result",
          value: typeof result.value === "string" ? result.value : String(result.value ?? ""),
          unit: typeof result.unit === "string" ? result.unit : "",
          referenceRange: typeof result.referenceRange === "string" ? result.referenceRange : "",
          status: statuses.includes(result.status as (typeof statuses)[number])
            ? (result.status as ReportResult["results"][number]["status"])
            : "UNKNOWN",
        }))
    : [];

  const strings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

  return {
    documentType: raw.documentType,
    summary: raw.summary,
    results,
    whatThisMayMean: strings(raw.whatThisMayMean),
    questionsForDoctor: strings(raw.questionsForDoctor),
    disclaimer:
      typeof raw.disclaimer === "string"
        ? raw.disclaimer
        : "This explanation is informational and is not a medical diagnosis.",
  };
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.primaryEmailAddress?.emailAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fileName?: unknown;
      mimeType?: unknown;
      content?: unknown;
    };
    const fileName = typeof body.fileName === "string" ? body.fileName : "medical-report";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const content = typeof body.content === "string" ? body.content : "";

    if (!content) {
      return NextResponse.json({ error: "A report file is required." }, { status: 400 });
    }
    if (content.length > 12_000_000) {
      return NextResponse.json({ error: "Please upload a file smaller than 8 MB." }, { status: 413 });
    }
    if (mimeType === "application/pdf") {
      return NextResponse.json(
        { error: "PDF extraction is not enabled yet. Upload a JPG, PNG, or text-based report for now." },
        { status: 415 },
      );
    }

    const userContent =
      mimeType.startsWith("image/")
        ? [
            { type: "text" as const, text: `File name: ${fileName}\n${ANALYSIS_PROMPT}` },
            { type: "image_url" as const, image_url: { url: content } },
          ]
        : `${ANALYSIS_PROMPT}\n\nFile name: ${fileName}\nReport content:\n${content}`;

    const completion = await openai.chat.completions.create({
      model: geminiModel,
      messages: [
        { role: "system", content: "You explain medical documents carefully and conservatively." },
        { role: "user", content: userContent },
      ],
    });
    const response = completion.choices[0]?.message?.content;
    if (typeof response !== "string" || !response.trim()) {
      throw new Error("The analyzer returned an empty response.");
    }

    return NextResponse.json(parseReport(response));
  } catch (error) {
    console.error("Medical document analysis failed:", error);
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: unknown }).status)
        : 0;
    const isUpstreamFailure = [404, 429, 500, 502, 503, 504].includes(status);
    return NextResponse.json(
      {
        error: isUpstreamFailure
          ? "The AI document service is currently unavailable. Check GEMINI_MODEL and try again."
          : "The report could not be analyzed. Please try again.",
      },
      { status: isUpstreamFailure ? 503 : 500 },
    );
  }
}
