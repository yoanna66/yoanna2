import { Respond } from "@/components/event-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Respond code={code.toUpperCase()} />;
}
