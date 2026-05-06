import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

export type ReportSubjectType = "profile" | "event" | "mix" | "comment" | "message";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "impersonation"
  | "illegal"
  | "copyright"
  | "other";

function supabase() {
  return createClient();
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required.");
  return user.id;
}

export async function createReport(input: {
  subjectType: ReportSubjectType;
  subjectId: string;
  reason: ReportReason;
  note?: string;
}): Promise<void> {
  const userId = await requireUserId();
  const trimmed = (input.note ?? "").trim();

  const { error } = await supabase().from(TABLES.reports).insert({
    reporter_id: userId,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    reason: input.reason,
    note: trimmed ? trimmed : null,
  });
  if (error) throw error;
}

export const reportsService = {
  createReport,
};

