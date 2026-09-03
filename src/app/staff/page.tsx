import { isUnlocked } from "@/lib/guard";
import { Passcode } from "@/components/Passcode";
import { StaffBoard } from "@/components/StaffBoard";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string }>;
}) {
  const { bad } = await searchParams;
  if (!(await isUnlocked())) return <Passcode next="/staff" bad={Boolean(bad)} />;
  return <StaffBoard />;
}
