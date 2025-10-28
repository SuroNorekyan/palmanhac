import { promises as fs } from "node:fs";
import path from "node:path";
import type { Locale } from "../../config/site";

const ITEMS_ROOT = path.join(process.cwd(), "mock-items");

export type ParsedMockItem = {
  slug: string;
  name: string;
  description: Record<Locale, string>;
  category: "licor" | "aguardente" | "bebida-espiritosa";
  priceCents: number;
  abv: number;
  volumeMl: number;
  imageFilename?: string;
};

const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const parsePrice = (content: string): number => {
  const match = content.match(/Price\s+([\d.,]+)/i);
  if (!match || match[1] === undefined) {
    throw new Error("Price not found in mock item content.");
  }
  const normalized = match[1].replace(/\./g, "").replace(/,/g, ".");
  const euros = Number.parseFloat(normalized);
  if (Number.isNaN(euros)) {
    throw new Error(`Invalid price value "${match[1]}".`);
  }
  return Math.round(euros * 100);
};

const parseAbv = (content: string): number => {
  const match = content.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match || match[1] === undefined) {
    throw new Error("ABV not found in mock item content.");
  }
  const value = Number.parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(value)) {
    throw new Error(`Invalid ABV value "${match[1]}".`);
  }
  return value;
};

const parseVolume = (content: string): number => {
  const match = content.match(/(\d+)\s*ml/i);
  if (!match || match[1] === undefined) {
    throw new Error("Volume not found in mock item content.");
  }
  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid volume value "${match[1]}".`);
  }
  return value;
};

const extractDescription = (lines: string[], keyword: string): string => {
  const index = lines.findIndex((line) =>
    line.toLowerCase().startsWith(keyword.toLowerCase()),
  );

  if (index === -1) {
    return "";
  }

  const collected: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (!line.trim()) {
      collected.push("");
      continue;
    }

    if (/^[A-Za-zÀ-ÿ\s]+:/.test(line) || /^pt\b/i.test(line)) {
      break;
    }

    if (/^Price\b/i.test(line) || /^Palmanhac\b/i.test(line)) {
      break;
    }

    collected.push(line);
  }

  return collected
    .join("\n")
    .trim()
    .replace(/\n{2,}/g, "\n\n");
};

const inferCategory = (content: string): ParsedMockItem["category"] => {
  const normalized = content.toLowerCase();
  if (normalized.includes("aguardente")) {
    return "aguardente";
  }
  if (normalized.includes("licor")) {
    return "licor";
  }
  if (
    normalized.includes("spirit") ||
    normalized.includes("espirituosa") ||
    normalized.includes("bebida")
  ) {
    return "bebida-espiritosa";
  }
  return "licor";
};

const extractName = (lines: string[]): string => {
  const priceIndex = lines.findIndex((line) => /^price\b/i.test(line.trim()));
  const candidates = lines
    .slice(0, priceIndex === -1 ? lines.length : priceIndex)
    .filter((line) => line.trim().length > 0);

  if (!candidates.length) {
    return "Palmanhac";
  }

  const last = candidates[candidates.length - 1];
  if (!last) {
    return "Palmanhac";
  }
  const previous = candidates[candidates.length - 2];

  if (previous && previous.toLowerCase().includes("palmanhac")) {
    return `${previous} ${last}`.replace(/\s+/g, " ").trim();
  }

  if (last.toLowerCase().includes("palmanhac")) {
    return last.trim();
  }

  return `Palmanhac ${last}`.replace(/\s+/g, " ").trim();
};

const collectDescriptionByLocale = (lines: string[], locale: Locale): string => {
  if (locale === "en") {
    const description = extractDescription(lines, "Description");
    return description || extractDescription(lines, "Descrição");
  }

  const description = extractDescription(lines, "Descrição");
  return description || extractDescription(lines, "Description");
};

const discoverImageFilename = async (directory: string) => {
  const entries = await fs.readdir(directory);
  return entries.find((entry) => !entry.endsWith(".txt"));
};

export const parseMockItems = async (): Promise<ParsedMockItem[]> => {
  const itemFolders = await fs.readdir(ITEMS_ROOT);
  const items: ParsedMockItem[] = [];
  const slugCounts = new Map<string, number>();

  for (const folder of itemFolders.sort()) {
    const folderPath = path.join(ITEMS_ROOT, folder);
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      continue;
    }

    const files = await fs.readdir(folderPath);
    const textFile = files.find((file) => file.endsWith(".txt"));
    if (!textFile) {
      continue;
    }

    const content = await fs.readFile(path.join(folderPath, textFile), "utf-8");
    const lines = content.split(/\r?\n/).map((line) => line.trim());
    const name = extractName(lines);
    let slug = slugify(name);
    const existingCount = slugCounts.get(slug);
    if (existingCount) {
      const nextCount = existingCount + 1;
      slugCounts.set(slug, nextCount);
      slug = `${slug}-${nextCount}`;
    } else {
      slugCounts.set(slug, 1);
    }
    const category = inferCategory(content);
    const description: Record<Locale, string> = {
      en: collectDescriptionByLocale(lines, "en"),
      pt: collectDescriptionByLocale(lines, "pt"),
    };
    const priceCents = parsePrice(content);
    const abv = parseAbv(content);
    const volumeMl = parseVolume(content);
    const imageFilename = await discoverImageFilename(folderPath);

    items.push({
      slug,
      name,
      description,
      category,
      priceCents,
      abv,
      volumeMl,
      imageFilename,
    });
  }

  return items;
};
