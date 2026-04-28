import * as cheerio from "cheerio";
import type { ScrapedBookData } from "./types";
import { lookupByIsbn } from "./openlibrary";

async function fetchWithBrowser(url: string): Promise<string> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Check for CAPTCHA — wait for user to solve it
    const hasCaptcha = await page.evaluate(() =>
      document.body.innerText.includes("Type the characters") ||
      document.body.innerText.includes("captcha") ||
      document.querySelector('form[action*="validateCaptcha"]') !== null
    );

    if (hasCaptcha) {
      // Wait up to 2 minutes for the user to solve the CAPTCHA
      await page.waitForFunction(
        () =>
          document.getElementById("productTitle") !== null ||
          document.querySelector('meta[property="og:title"]') !== null,
        { timeout: 120000 }
      );
    }

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

async function fetchSimple(url: string): Promise<{ html: string; blocked: boolean }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();
  const blocked =
    html.length < 20000 &&
    (html.includes("captcha") ||
      html.includes("CAPTCHA") ||
      html.includes("validateCaptcha") ||
      html.includes("robot check"));
  return { html, blocked };
}

function parseAmazonHtml(html: string, url: string): ScrapedBookData {
  const $ = cheerio.load(html);

  // --- Title ---
  const title =
    $("#productTitle").text().trim() ||
    $("span#ebooksProductTitle").text().trim() ||
    $('h1[data-feature-name="title"]').text().trim() ||
    $('meta[property="og:title"]').attr("content")?.split(":")[0]?.trim() ||
    $("title").text().split(":")[0]?.trim() ||
    null;

  // --- Author ---
  let author =
    $(".author a").first().text().trim() ||
    $(".contributorNameID").first().text().trim() ||
    $('a.a-link-normal[href*="/e/"]').first().text().trim() ||
    $("span.author a").first().text().trim() ||
    null;

  if (!author) {
    author =
      $("li.authorLabel a").first().text().trim() ||
      $("a.authorLabel").first().text().trim() ||
      $('[class*="author"] a').first().text().trim() ||
      null;
  }

  if (!author) {
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const parts = ogTitle.split(":");
    if (parts.length >= 2) {
      const candidate = parts[1].trim();
      if (candidate && !candidate.toLowerCase().includes("amazon")) {
        author = candidate;
      }
    }
  }

  if (!author) {
    const pageTitle = $("title").text();
    const parts = pageTitle.split(":");
    if (parts.length >= 2) {
      const candidate = parts[1].trim();
      if (
        candidate &&
        !candidate.toLowerCase().includes("amazon") &&
        !candidate.match(/^\d/)
      ) {
        author = candidate;
      }
    }
  }

  // --- Cover Image ---
  let coverUrl: string | null = null;
  const imgEl = $(
    "#imgBlkFront, #landingImage, #ebooksImgBlkFront, #main-image, img#imgTagWrapperId img"
  ).first();
  if (imgEl.length) {
    const dynamicImage = imgEl.attr("data-a-dynamic-image");
    if (dynamicImage) {
      try {
        const urls = Object.keys(JSON.parse(dynamicImage));
        coverUrl = urls[urls.length - 1] || null;
      } catch {
        coverUrl = imgEl.attr("src") || null;
      }
    } else {
      coverUrl = imgEl.attr("src") || null;
    }
  }
  if (!coverUrl) {
    coverUrl = $('meta[property="og:image"]').attr("content") || null;
  }
  if (coverUrl && coverUrl.includes("_SY")) {
    coverUrl = coverUrl.replace(/\._SY\d+_/, "");
  }

  // --- Narrator ---
  let narrator: string | null = null;

  // Amazon audiobook detail section
  const narratorSection = $('[data-rpi-attribute-name*="narrator"]');
  if (narratorSection.length) {
    const link = narratorSection.find("a").first().text().trim();
    if (link) narrator = link;
  }

  // JSON-LD pattern: "readBy": [{"name": "..."}]
  if (!narrator) {
    const narratorJsonMatch = html.match(
      /"readBy"\s*:\s*\[\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/
    );
    if (narratorJsonMatch) narrator = narratorJsonMatch[1];
  }

  // Text pattern "Narrated by X" or "Performed by X"
  if (!narrator) {
    const narratorLinkMatch = html.match(
      /[Nn]arrat(?:ed|or)\s*(?:by)?[:\s]*<[^>]*>([^<]+)/
    );
    if (narratorLinkMatch) {
      const candidate = narratorLinkMatch[1].trim();
      // Filter out generic labels
      if (candidate && candidate !== "Narrator" && candidate.length > 1) {
        narrator = candidate;
      }
    }
  }
  if (!narrator) {
    const performedMatch = html.match(
      /[Pp]erformed\s+by[:\s]*<[^>]*>([^<]+)/
    );
    if (performedMatch) narrator = performedMatch[1].trim();
  }

  // --- Description ---
  const description =
    $("#bookDescription_feature_div .a-expander-content")
      .text()
      .trim()
      .substring(0, 1000) ||
    $("#bookDescription_feature_div span").text().trim().substring(0, 1000) ||
    $('div[data-a-expander-name="book_description_expander"] span')
      .text()
      .trim()
      .substring(0, 1000) ||
    $('meta[property="og:description"]')
      .attr("content")
      ?.substring(0, 1000) ||
    $('meta[name="description"]').attr("content")?.substring(0, 1000) ||
    null;

  // --- ISBN & Page Count ---
  let isbn: string | null = null;
  let pageCount: number | null = null;

  $(".detail-bullet-list li, #detailBullets_feature_div li").each((_, el) => {
    const text = $(el).text();
    if (text.includes("ISBN-13") && !isbn) {
      const match = text.match(/(\d[\d-]{12,})/);
      if (match) isbn = match[1].replace(/-/g, "");
    }
    if (text.includes("ISBN-10") && !isbn) {
      const match = text.match(/(\d[\dX-]{9,})/);
      if (match) isbn = match[1].replace(/-/g, "");
    }
    if (text.includes("pages") && !pageCount) {
      const match = text.match(/(\d+)\s*pages/);
      if (match) pageCount = parseInt(match[1]);
    }
  });

  if (!isbn || !pageCount) {
    $(
      "#productDetails_techSpec_section_1 tr, #productDetails_db_sections tr, #detailsResi tr"
    ).each((_, el) => {
      const label = $(el).find("th, td:first-child").text().trim();
      const value = $(el).find("td:last-child, td:nth-child(2)").text().trim();
      if (label.includes("ISBN-13") && !isbn) {
        const match = value.match(/(\d[\d-]{12,})/);
        if (match) isbn = match[1].replace(/-/g, "");
      }
      if (label.includes("ISBN-10") && !isbn) {
        const match = value.match(/(\d[\dX-]{9,})/);
        if (match) isbn = match[1].replace(/-/g, "");
      }
      if (
        (label.includes("pages") || label.includes("Print length")) &&
        !pageCount
      ) {
        const match = value.match(/(\d+)/);
        if (match) pageCount = parseInt(match[1]);
      }
    });
  }

  if (!isbn) {
    const fullText = $.text();
    const isbnMatch = fullText.match(
      /ISBN[^:]*?[:.\s]+(\d{3}[\s-]?\d[\s-]?\d{3}[\s-]?\d{5}[\s-]?\d)/
    );
    if (isbnMatch) isbn = isbnMatch[1].replace(/[\s-]/g, "");
  }

  if (!pageCount) {
    const fullText = $.text();
    const pagesMatch = fullText.match(/(\d{2,4})\s*pages/);
    if (pagesMatch) pageCount = parseInt(pagesMatch[1]);
  }

  // --- Duration (audiobooks) ---
  let durationMinutes: number | null = null;
  const durationMatch = html.match(
    /(\d{1,2})\s*(?:hours?|hrs?)\s*(?:and|&)?\s*(\d{1,2})\s*(?:minutes?|mins?)/i
  );
  if (durationMatch) {
    durationMinutes =
      parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
  }

  // --- Series ---
  let seriesName: string | null = null;
  let seriesNumber: number | null = null;
  let seriesTotalBooks: number | null = null;

  const seriesEl = $(
    '#seriesBulletWidget_feature_div a, a[href*="/dp/"], .series-detail a'
  );
  seriesEl.each((_, el) => {
    const text = $(el).text().trim();
    const parentText = $(el).parent().text().trim();

    if (
      $(el).attr("href")?.includes("/series/") ||
      parentText.match(/Book \d+/i)
    ) {
      if (!seriesName && text && text.length > 1) {
        seriesName = text
          .replace(/^Book\s+\d+\s*(of\s+\d+)?\s*[:.\-]\s*/i, "")
          .trim();
        if (!seriesName || seriesName.match(/^\d/)) seriesName = null;
      }
    }
  });

  const seriesText = $(
    "#seriesBulletWidget_feature_div, .series-detail"
  ).text();
  const bookNumMatch = seriesText.match(/Book\s+(\d+)\s+of\s+(\d+)/i);
  if (bookNumMatch) {
    seriesNumber = parseInt(bookNumMatch[1]);
    seriesTotalBooks = parseInt(bookNumMatch[2]);
  } else {
    const bookOnlyMatch = seriesText.match(/Book\s+(\d+)/i);
    if (bookOnlyMatch) {
      seriesNumber = parseInt(bookOnlyMatch[1]);
    }
  }

  if (!seriesName) {
    const fullText = $.text();
    const seriesMatch = fullText.match(
      /(?:Book|Volume)\s+(\d+)\s+(?:of|in)\s+(?:(\d+)\s+in\s+)?(?:the\s+)?(.+?)(?:\s+Series|\s*\()/i
    );
    if (seriesMatch) {
      seriesNumber = seriesNumber || parseInt(seriesMatch[1]);
      if (seriesMatch[2])
        seriesTotalBooks = seriesTotalBooks || parseInt(seriesMatch[2]);
      seriesName = seriesName || seriesMatch[3].trim();
    }
  }

  // Filter out error pages
  const bogusTitle =
    title &&
    /page not found|error|sorry|robot check|captcha|something went wrong/i.test(
      title
    );

  return {
    title: bogusTitle ? null : title,
    author: bogusTitle ? null : author,
    coverUrl: bogusTitle ? null : coverUrl,
    description: bogusTitle ? null : description,
    isbn,
    pageCount,
    narrator: bogusTitle ? null : narrator,
    durationMinutes: bogusTitle ? null : durationMinutes,
    seriesName: bogusTitle ? null : seriesName,
    seriesNumber: bogusTitle ? null : seriesNumber,
    seriesTotalBooks: bogusTitle ? null : seriesTotalBooks,
    sourceUrl: url,
  };
}

export async function scrapeAmazon(url: string): Promise<ScrapedBookData> {
  // Try simple fetch first
  const { html, blocked } = await fetchSimple(url);

  if (!blocked) {
    return parseAmazonHtml(html, url);
  }

  // Blocked by CAPTCHA — try browser with visible window
  try {
    const browserHtml = await fetchWithBrowser(url);
    return parseAmazonHtml(browserHtml, url);
  } catch {
    // Browser failed (timeout, etc.) — try Open Library as last resort
    const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (asinMatch) {
      const asin = asinMatch[1];
      // ASINs starting with a digit are ISBNs
      if (/^\d/.test(asin)) {
        return lookupByIsbn(asin, url);
      }
    }

    // Return empty with sourceUrl so user can fill manually
    return {
      title: null,
      author: null,
      coverUrl: null,
      description: null,
      isbn: null,
      pageCount: null,
      narrator: null,
      durationMinutes: null,
      seriesName: null,
      seriesNumber: null,
      seriesTotalBooks: null,
      sourceUrl: url,
    };
  }
}
