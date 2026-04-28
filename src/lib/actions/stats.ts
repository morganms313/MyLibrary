"use server";

import { prisma } from "@/lib/db";

export interface YearStats {
  totalFinished: number;
  totalPages: number;
  averageRating: number;
  booksPerMonth: { month: string; count: number }[];
  tagBreakdown: { name: string; color: string; count: number }[];
  typeSplit: { type: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function getYearStats(year: number): Promise<YearStats> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  // Get all finished readings for this year
  const finishedReadings = await prisma.reading.findMany({
    where: {
      status: "finished",
      finishDate: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
    include: {
      book: {
        include: {
          tags: { include: { tag: true } },
        },
      },
    },
  });

  const totalFinished = finishedReadings.length;

  const totalPages = finishedReadings.reduce(
    (sum, r) => sum + (r.book.pageCount || 0),
    0
  );

  const ratings = finishedReadings
    .map((r) => r.rating)
    .filter((r): r is number => r !== null);
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : 0;

  // Books per month
  const monthCounts = new Array(12).fill(0);
  finishedReadings.forEach((r) => {
    if (r.finishDate) {
      monthCounts[r.finishDate.getMonth()]++;
    }
  });
  const booksPerMonth = MONTH_NAMES.map((month, i) => ({
    month,
    count: monthCounts[i],
  }));

  // Tag breakdown
  const tagCounts = new Map<string, { name: string; color: string; count: number }>();
  finishedReadings.forEach((r) => {
    r.book.tags.forEach((bt) => {
      const existing = tagCounts.get(bt.tag.id);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(bt.tag.id, {
          name: bt.tag.name,
          color: bt.tag.color,
          count: 1,
        });
      }
    });
  });
  const tagBreakdown = Array.from(tagCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  // Type split
  const bookCount = finishedReadings.filter(
    (r) => r.book.type === "book"
  ).length;
  const audiobookCount = finishedReadings.filter(
    (r) => r.book.type === "audiobook"
  ).length;
  const typeSplit = [
    { type: "Books", count: bookCount },
    { type: "Audiobooks", count: audiobookCount },
  ];

  // Rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  ratings.forEach((r) => {
    ratingCounts[r - 1]++;
  });
  const ratingDistribution = ratingCounts.map((count, i) => ({
    rating: i + 1,
    count,
  }));

  return {
    totalFinished,
    totalPages,
    averageRating,
    booksPerMonth,
    tagBreakdown,
    typeSplit,
    ratingDistribution,
  };
}

export async function getAvailableYears(): Promise<number[]> {
  const readings = await prisma.reading.findMany({
    where: { status: "finished", finishDate: { not: null } },
    select: { finishDate: true },
    orderBy: { finishDate: "desc" },
  });

  const years = new Set<number>();
  readings.forEach((r) => {
    if (r.finishDate) years.add(r.finishDate.getFullYear());
  });

  // Always include current year
  years.add(new Date().getFullYear());

  return Array.from(years).sort((a, b) => b - a);
}
