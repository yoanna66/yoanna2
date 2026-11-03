import { Invite } from "@/components/event-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Invite code={code.toUpperCase()} />;
}
