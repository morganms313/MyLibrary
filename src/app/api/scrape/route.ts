import { NextResponse } from "next/server";
import { scrapeBookFromUrl } from "@/lib/scraper";
import { scrapeUrlSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = scrapeUrlSchema.parse(body);
    const data = await scrapeBookFromUrl(url);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
