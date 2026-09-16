import { isUnlocked } from "@/lib/guard";
import { Passcode } from "@/components/Passcode";
import { StaffBoard } from "@/components/StaffBoard";
import { STANDALONE } from "@/lib/mode";
import { StandaloneNotice } from "@/components/StandaloneNotice";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string }>;
}) {
  if (STANDALONE) return <StandaloneNotice screen="The booth monitor" />;
  const { bad } = await searchParams;
  if (!(await isUnlocked())) return <Passcode next="/staff" bad={Boolean(bad)} />;
  return <StaffBoard />;
}
