import { EmailPreview } from "@/components/EmailPreview";

export const dynamic = "force-dynamic";

/**
 * The follow-up email, previewable and copyable.
 *
 * Not gated behind the booth passcode, for the same reason /preview is not:
 * there is no data on it, and marketing needs to be able to open it and argue
 * with the copy without anyone finding them a password.
 */
export default function EmailPage() {
  return <EmailPreview />;
}
