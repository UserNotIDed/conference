import { prisma } from "@/lib/db";
import { guardApi } from "@/lib/guard";
import { toCsv } from "@/lib/csv";
import { toRow } from "@/lib/rows";

export const dynamic = "force-dynamic";

const HEADERS = [
  "token",
  "phone",
  "source",
  "keyword",
  "role",
  "ehr_system",
  "tech_stack",
  "competitor_tool",
  "competitor_satisfaction",
  "created_at",
  "link_opened_at",
  "intake_started_at",
  "intake_finished_at",
  "intake_seconds",
  "link_opened_to_done",
  "patients_per_day",
  "no_show_rate",
  "front_desk_staff",
  "estimated_annual_leak",
  "result_texted_at",
  "capture_name",
  "capture_title",
  "capture_email",
  "capture_practice",
  "capture_street",
  "capture_unit",
  "capture_city",
  "capture_state",
  "capture_zip",
  "capture_address",
  "benchmark_opt_in",
  "captured_at",
  "booked_at",
  "booked_slot",
  "retarget",
];

/** Everything, flat, one row per phone number. The on-site escape hatch. */
export async function GET() {
  const denied = await guardApi();
  if (denied) return denied;

  const sessions = await prisma.session.findMany({ orderBy: { createdAt: "asc" } });
  const rows = sessions.map(toRow).map((r) => [
    r.token,
    r.phone,
    r.source,
    r.keyword,
    r.roleLabel,
    r.ehrSystem,
    r.techStack.join(" | "),
    r.competitorTool,
    r.competitorSatisfaction,
    r.createdAt,
    r.openedAt,
    r.startedAt,
    r.finishedAt,
    r.elapsedMs !== null ? (r.elapsedMs / 1000).toFixed(1) : "",
    r.openedAt && r.finishedAt
      ? ((Date.parse(r.finishedAt) - Date.parse(r.openedAt)) / 1000).toFixed(1)
      : "",
    r.calcInputs?.patientsPerDay ?? "",
    r.calcInputs?.noShowRate !== undefined
      ? `${Math.round((r.calcInputs.noShowRate ?? 0) * 100)}%`
      : "",
    r.calcInputs?.frontDeskStaff ?? "",
    r.calcTotal !== null ? Math.round(r.calcTotal) : "",
    r.calcSmsAt,
    r.captureName,
    r.captureTitle,
    r.captureEmail,
    r.capturePractice,
    r.captureStreet,
    r.captureUnit,
    r.captureCity,
    r.captureState,
    r.captureZip,
    r.captureAddress,
    r.captureOptIn ? "yes" : "no",
    r.capturedAt,
    r.bookedAt,
    r.bookedSlot,
    r.capturedAt && !r.bookedAt ? "yes" : "no",
  ]);

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response("﻿" + toCsv(HEADERS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yosi-booth-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
