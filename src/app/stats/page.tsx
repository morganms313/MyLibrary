import { Suspense } from "react";
import { getYearStats, getAvailableYears } from "@/lib/actions/stats";
import { StatsDashboard } from "@/components/stats-dashboard";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function StatsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year) : currentYear;

  const [stats, availableYears] = await Promise.all([
    getYearStats(year),
    getAvailableYears(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reading Stats</h1>
      <Suspense>
        <StatsDashboard
          stats={stats}
          year={year}
          availableYears={availableYears}
        />
      </Suspense>
    </div>
  );
}
