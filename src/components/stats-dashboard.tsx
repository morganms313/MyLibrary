"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpen,
  FileText,
  Star,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import type { YearStats } from "@/lib/actions/stats";

interface StatsDashboardProps {
  stats: YearStats;
  year: number;
  availableYears: number[];
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#818cf8",
  "#4f46e5",
  "#7c3aed",
  "#6d28d9",
];

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsDashboard({
  stats,
  year,
  availableYears,
}: StatsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setYear = (y: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", y.toString());
    router.push(`/stats?${params.toString()}`);
  };

  const canGoPrev = availableYears.includes(year - 1) || year > Math.min(...availableYears);
  const canGoNext = year < new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setYear(year - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tabular-nums">{year}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setYear(year + 1)}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Books Finished"
          value={stats.totalFinished}
          icon={BookOpen}
        />
        <StatCard
          title="Pages Read"
          value={stats.totalPages.toLocaleString()}
          icon={FileText}
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating || "-"}
          icon={Star}
          subtitle={stats.averageRating ? "out of 5" : undefined}
        />
        <StatCard
          title="Audiobooks"
          value={stats.typeSplit.find((t) => t.type === "Audiobooks")?.count || 0}
          icon={Headphones}
          subtitle={`of ${stats.totalFinished} total`}
        />
      </div>

      {stats.totalFinished === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No finished books in {year} yet.</p>
          <p className="text-sm">
            Finish reading some books to see your stats!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Books per month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Books Per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.booksPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="rating"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}★`}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tag breakdown */}
          {stats.tagBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Tag</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.tagBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      nameKey="name"
                      label={(props: { name?: string; value?: number }) => `${props.name || ""} (${props.value || 0})`}
                      labelLine={false}
                    >
                      {stats.tagBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Type split */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Books vs Audiobooks</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.typeSplit.filter((t) => t.count > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="type"
                    label={(props: { name?: string; value?: number }) => `${props.name || ""} (${props.value || 0})`}
                    labelLine={false}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
