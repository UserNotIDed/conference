import { headers } from "next/headers";
import { isUnlocked } from "@/lib/guard";
import { Passcode } from "@/components/Passcode";
import { AdminTable } from "@/components/AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string }>;
}) {
  const { bad } = await searchParams;
  if (!(await isUnlocked())) return <Passcode next="/admin" bad={Boolean(bad)} />;

  // The links copied out of here get texted and typed, so they need the real
  // public origin rather than whatever the browser happens to be on.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  return <AdminTable origin={origin} />;
}
