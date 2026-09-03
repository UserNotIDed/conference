import { FlowPreview } from "@/components/FlowPreview";

export const dynamic = "force-dynamic";

/**
 * Screen index for the whole attendee flow. Not gated behind the booth
 * passcode: there is no data on it, and a rep needs to be able to pull it up
 * on a phone mid-conversation.
 */
export default function PreviewPage() {
  return <FlowPreview />;
}
