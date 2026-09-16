import { redirect } from "next/navigation";
import { STANDALONE } from "@/lib/mode";
import { blankSession } from "@/lib/blank-session";
import { AttendeeFlow } from "@/components/flow/AttendeeFlow";

export const dynamic = "force-dynamic";

/**
 * The root.
 *
 * On the standalone deployment, and under the QR-direct plan generally, this
 * IS the microsite: scanning the code should open the first screen, not a page
 * about scanning a code.
 *
 * The `sms:` signage that used to live here is gone with the SMS step. The
 * printed version now lives at /booth and its QR carries this URL.
 */
export default async function RootPage() {
  if (STANDALONE) {
    return <AttendeeFlow session={blankSession()} ephemeral />;
  }
  redirect("/booth");
}
