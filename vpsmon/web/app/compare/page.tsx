import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompareView } from "@/components/layout/CompareView";

interface ComparePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const ids = [params.a, params.b, params.c, params.d]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 4);

  return (
    <DashboardLayout>
      <CompareView serverIds={ids} />
    </DashboardLayout>
  );
}
