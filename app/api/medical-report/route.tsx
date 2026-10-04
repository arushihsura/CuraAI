import { geminiModel, openai } from "../../../config/OpenAiModel";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { followUpsTable, sessionChatTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";

const REPORT_GEN_PROMPT=`You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on the doctor AI agent info and Conversation between AI medical agent and user., generate a structured report with the following fields:
sessionId: a unique session identifier
agent: the medical specialist name (e.g., "General Physician AI")
user: name stated by the patient in the conversation, or "Anonymous" when no name was stated
timestamp: current date and time in ISO format
chiefComplaint: one-sentence summary of the main health concern
summary: a 2–3 sentence summary of the conversation, symptoms, and recommendations
symptoms: list of symptoms mentioned by the user
duration: how long the user has experienced the symptoms
severity: mild, moderate, or severe
medicationsMentioned: list of any medicines mentioned
recommendations: list of AI suggestions (e.g., rest, see a doctor)
carePlan: list of practical, non-prescriptive next steps
followUp: object with recommended (boolean), days (positive integer or null), and reason
emergencyWarning: string or null
Return the result in this JSON format:
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "string",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"],
  "carePlan": ["step 1", "step 2"],
  "followUp": { "recommended": true, "days": 7, "reason": "brief reason" },
  "emergencyWarning": null
}
For the user field, only use a name explicitly stated by the patient. Never infer a name from an email address or account metadata. If no name is stated, use "Anonymous".
Only include valid fields. Respond with nothing else.
`;

const REPORT_MODEL = geminiModel;
const MAX_LLM_ATTEMPTS = 3;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function isTransientLlmError(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return false;
  }

  const status = (error as { status?: unknown }).status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function extractConversationName(messages: unknown[]) {
  const userMessages = messages
    .filter(
      (message): message is { role?: unknown; text?: unknown } =>
        Boolean(message && typeof message === "object"),
    )
    .filter(
      (message) =>
        (message.role === "user" || message.role === "human") &&
        typeof message.text === "string",
    )
    .map((message) => String(message.text).trim());

  for (const text of userMessages) {
    const match =
      text.match(
        /\b(?:my name is|call me)\s+([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){0,2})/i,
      ) ||
      text.match(
        /\b(?:I am|I'm)\s+([A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,2})/,
      );
    if (match?.[1]) {
      return match[1].trim().replace(/[.!?,;:]+$/, "");
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    sessionId,
    sessionDetail: requestedSessionDetail,
    messages: requestedMessages,
  } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  console.log("Received data for report generation:", {
    messages: requestedMessages,
    sessionDetail: requestedSessionDetail,
    sessionId,
  });

  try {
    // 1. Verify session ownership BEFORE calling LLM or modifying database
    const existingSession = await db
      .select()
      .from(sessionChatTable)
      .where(
        and(
          eq(sessionChatTable.sessionId, sessionId),
          eq(sessionChatTable.createdBy, userEmail)
        )
      );

    if (!existingSession || existingSession.length === 0) {
      return NextResponse.json(
        { error: "Forbidden: Session not found or unauthorized access" },
        { status: 403 }
      );
    }

    const storedSession = existingSession[0];
    const sessionDetail = requestedSessionDetail ?? {
      sessionId: storedSession.sessionId,
      note: storedSession.note,
      selectedDoctor: storedSession.selectedDoctor,
    };
    const messages = Array.isArray(requestedMessages) ? requestedMessages : [];
    const conversationName = extractConversationName(messages);
    const UserInput =
      "AI Doctor Agent Info: " +
      JSON.stringify(sessionDetail) +
      ", Conversation: " +
      JSON.stringify(messages);
    let completion;
    for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt += 1) {
      try {
        completion = await openai.chat.completions.create({
          model: REPORT_MODEL,
          messages: [
            { role: "system", content: REPORT_GEN_PROMPT },
            {
              role: "user",
              content: UserInput
            }
          ],
        });
        break;
      } catch (error) {
        if (!isTransientLlmError(error) || attempt === MAX_LLM_ATTEMPTS) {
          throw error;
        }

        const delay = 1000 * 2 ** (attempt - 1);
        console.warn(
          `Gemini report request failed with a transient error; retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_LLM_ATTEMPTS})`
        );
        await wait(delay);
      }
    }

    if (!completion) {
      throw new Error("The AI report request did not return a completion");
    }

    const rawContent = completion.choices[0]?.message?.content;

    if (typeof rawContent !== "string" || !rawContent.trim()) {
      throw new Error("The AI returned an empty report response");
    }

    const fencedContent = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const jsonStart = fencedContent.indexOf("{");
    const jsonEnd = fencedContent.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
      throw new Error("The AI response did not contain a valid JSON report");
    }

    const JSONResp = JSON.parse(
      fencedContent.slice(jsonStart, jsonEnd + 1)
    );
    JSONResp.user = conversationName || "Anonymous";

    // 2. Final UPDATE scoped by sessionId AND createdBy as defense-in-depth
    const result = await db
      .update(sessionChatTable)
      .set({
        report: JSONResp,
        conversation: messages
      })
      .where(
        and(
          eq(sessionChatTable.sessionId, sessionId),
          eq(sessionChatTable.createdBy, userEmail)
        )
      )
      .returning({ id: sessionChatTable.sessionId });

    console.log("Update result:", result);

    if (result.length === 0) {
      throw new Error("The session report update did not match the requested session");
    }

    const followUp = JSONResp.followUp;
    if (
      followUp &&
      followUp.recommended === true &&
      Number.isInteger(followUp.days) &&
      followUp.days > 0 &&
      typeof followUp.reason === "string"
    ) {
      const existingFollowUp = await db
        .select({ id: followUpsTable.id })
        .from(followUpsTable)
        .where(
          and(
            eq(followUpsTable.consultationId, storedSession.id),
            eq(followUpsTable.userEmail, userEmail),
          ),
        );

      if (existingFollowUp.length === 0) {
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + followUp.days);
        await db.insert(followUpsTable).values({
          consultationId: storedSession.id,
          userEmail,
          scheduledFor,
          reason: followUp.reason,
        });
      }
    }

    return NextResponse.json(JSONResp);
  } catch (err) {
    console.error("Error generating report:", err);
    const upstreamUnavailable = isTransientLlmError(err);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: upstreamUnavailable
          ? "The AI service is temporarily unavailable after multiple attempts. Please try generating the report again."
          : err instanceof Error
            ? err.message
            : String(err),
      },
      { status: upstreamUnavailable ? 503 : 500 }
    );
  }
}
