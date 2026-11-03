import { Results } from "@/components/event-pages";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Results code={code.toUpperCase()} />;
}
