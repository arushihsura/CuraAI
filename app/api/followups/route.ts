import { and, asc, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { followUpsTable, sessionChatTable } from "@/config/schema";

export async function GET() {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const followUps = await db
      .select({
        id: followUpsTable.id,
        consultationId: followUpsTable.consultationId,
        scheduledFor: followUpsTable.scheduledFor,
        reason: followUpsTable.reason,
        status: followUpsTable.status,
      })
      .from(followUpsTable)
      .where(
        and(
          eq(followUpsTable.userEmail, userEmail),
          eq(followUpsTable.status, "scheduled"),
        ),
      )
      .orderBy(asc(followUpsTable.scheduledFor));

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("Failed to fetch follow-ups:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow-ups" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      consultationId?: unknown;
      scheduledFor?: unknown;
      reason?: unknown;
    };
    const consultationId =
      typeof body.consultationId === "number" ? body.consultationId : Number(body.consultationId);
    const scheduledFor = typeof body.scheduledFor === "string"
      ? new Date(body.scheduledFor)
      : new Date("invalid");
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!Number.isInteger(consultationId) || Number.isNaN(scheduledFor.getTime()) || !reason) {
      return NextResponse.json(
        { error: "consultationId, scheduledFor, and reason are required." },
        { status: 400 },
      );
    }

    const session = await db
      .select({ id: sessionChatTable.id })
      .from(sessionChatTable)
      .where(
        and(
          eq(sessionChatTable.id, consultationId),
          eq(sessionChatTable.createdBy, userEmail),
        ),
      );

    if (session.length === 0) {
      return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
    }

    const created = await db
      .insert(followUpsTable)
      .values({ consultationId, userEmail, scheduledFor, reason })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create follow-up:", error);
    return NextResponse.json(
      { error: "Failed to create follow-up" },
      { status: 500 },
    );
  }
}
