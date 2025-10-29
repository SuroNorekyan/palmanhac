import { promises as fs } from "node:fs";
import path from "node:path";
import type { Locale } from "@/config/site";
import type { ProductCategorySlug } from "@/types/product";

const ITEMS_ROOT = path.join(process.cwd(), "mock-items");
const LABEL_LINE_REGEX = /^[A-Za-zÀ-ÿ][\w\s/()º°.-]*:/u;
const BULLET_TRIM_REGEX = /^[\s•*⭐-]+/u;

export type ParsedMockItem = {
  id: number;
  slug: string;
  name: string;
  description: Record<Locale, string>;
  category: ProductCategorySlug;
  priceCents: number;
  abv: number;
  volumeMl: number;
  image: string;
  details: {
    region: Record<Locale, string>;
    base: Record<Locale, string>;
    type: Record<Locale, string>;
    bottleSize: Record<Locale, string>;
    servingTemperature: Record<Locale, string>;
    alcoholContent: Record<Locale, string>;
    awards: Record<Locale, string[]>;
  };
};

const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const parsePrice = (content: string): number => {
  const match = content.match(/\bPrice\s+([\d.,]+)/i);
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

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const splitLocaleSections = (content: string) => {
  const lines = content.split(/\r?\n/);
  const sections: Record<Locale, string[]> = {
    en: [],
    pt: [],
  };

  let localeRef: Locale | null = null;
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (/^EN\b/i.test(trimmed)) {
      localeRef = "en";
      continue;
    }
    if (/^PT\b/i.test(trimmed)) {
      localeRef = "pt";
      continue;
    }

    if (localeRef) {
      sections[localeRef].push(trimmed);
    }
  }

  return sections;
};

const extractFieldValue = (
  lines: string[],
  patterns: RegExp[],
  fallback?: string,
): string => {
  const index = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line)));
  if (index === -1) {
    return fallback ?? "";
  }

  const labelLine = lines[index] ?? "";
  const inline = labelLine.split(":").slice(1).join(":").trim();
  const collected: string[] = [];
  if (inline) {
    collected.push(inline);
  }

  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line === undefined) {
      break;
    }
    if (!line.trim()) {
      break;
    }
    if (LABEL_LINE_REGEX.test(line)) {
      break;
    }
    collected.push(line);
  }

  if (!collected.length) {
    return fallback ?? "";
  }

  return normalizeWhitespace(collected.join(" "));
};

const extractListValue = (lines: string[], patterns: RegExp[]): string[] => {
  const index = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line)));
  if (index === -1) {
    return [];
  }

  const items: string[] = [];
  const labelLine = lines[index] ?? "";
  const inline = labelLine.split(":").slice(1).join(":").trim();
  if (inline) {
    items.push(inline);
  }

  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line === undefined) {
      break;
    }
    if (!line.trim()) {
      break;
    }
    if (LABEL_LINE_REGEX.test(line)) {
      break;
    }
    items.push(line);
  }

  return items
    .map((item) => normalizeWhitespace(item.replace(BULLET_TRIM_REGEX, "")))
    .filter(Boolean);
};

const englishLabels = {
  description: [/^Description\b/i],
  region: [/^Region\b/i],
  base: [/^Base\b/i],
  type: [/^Type\/?Color\b/i],
  bottleSize: [/^Bottle Size\b/i],
  servingTemperature: [/^Serving Temperature\b/i],
  alcoholContent: [/^Alcohol Content\b/i],
  awards: [/^Awards?\b/i],
};

const portugueseLabels = {
  description: [/^Descri[cç][aã]o\b/i],
  region: [/^Regi[ãa]o\b/i],
  base: [/^Base\b/i],
  type: [/^Tipo\/?Cor\b/i],
  bottleSize: [/^Formato\b/i],
  servingTemperature: [/^Temperatura de Servi[cç]o\b/i],
  alcoholContent: [/^Teor Alco[oó]lico\b/i],
  awards: [/^Pr[ée]mios?\b/i],
};

const extractDescription = (lines: string[], patterns: RegExp[]): string => {
  const index = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line)));
  if (index === -1) {
    return "";
  }

  const collected: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line === undefined) {
      break;
    }
    if (!line.trim()) {
      collected.push("");
      continue;
    }
    if (LABEL_LINE_REGEX.test(line)) {
      break;
    }
    collected.push(line);
  }

  return collected
    .join("\n")
    .trim()
    .replace(/\n{2,}/g, "\n\n");
};

const inferCategory = (content: string): ProductCategorySlug => {
  const normalized = content.toLowerCase();
  if (normalized.includes("aguardente")) {
    return "aguardente";
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

const discoverImageFilename = async (directory: string) => {
  const entries = await fs.readdir(directory);
  return entries.find((entry) => !entry.endsWith(".txt"));
};

const resolveImagePath = (slug: string, imageFilename?: string) => {
  if (!imageFilename) {
    return `/assets/${slug}.jpg`;
  }
  const ext = path.extname(imageFilename) || ".jpg";
  return `/assets/${slug}${ext.toLowerCase()}`;
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
    const rawLines = content.split(/\r?\n/).map((line) => line.trim());
    const name = extractName(rawLines);
    const sections = splitLocaleSections(content);

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
    const priceCents = parsePrice(content);
    const abv = parseAbv(content);
    const volumeMl = parseVolume(content);
    const imageFilename = await discoverImageFilename(folderPath);

    const linesForLocale = (locale: Locale) =>
      sections[locale].length ? sections[locale] : rawLines;

    const descriptionEn =
      extractDescription(linesForLocale("en"), englishLabels.description) ||
      extractDescription(linesForLocale("pt"), portugueseLabels.description);
    const descriptionPt =
      extractDescription(linesForLocale("pt"), portugueseLabels.description) ||
      extractDescription(linesForLocale("en"), englishLabels.description) ||
      descriptionEn;

    const regionEn =
      extractFieldValue(linesForLocale("en"), englishLabels.region) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.region);
    const regionPt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.region) || regionEn;

    const baseEn =
      extractFieldValue(linesForLocale("en"), englishLabels.base) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.base);
    const basePt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.base) || baseEn;

    const typeEn =
      extractFieldValue(linesForLocale("en"), englishLabels.type) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.type);
    const typePt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.type) || typeEn;

    const bottleEn =
      extractFieldValue(linesForLocale("en"), englishLabels.bottleSize) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.bottleSize) ||
      `${volumeMl} ml`;
    const bottlePt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.bottleSize) ||
      extractFieldValue(linesForLocale("en"), englishLabels.bottleSize) ||
      `${volumeMl} ml`;

    const servingEn =
      extractFieldValue(linesForLocale("en"), englishLabels.servingTemperature) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.servingTemperature);
    const servingPt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.servingTemperature) ||
      servingEn;

    const alcoholEn =
      extractFieldValue(linesForLocale("en"), englishLabels.alcoholContent) ||
      extractFieldValue(linesForLocale("pt"), portugueseLabels.alcoholContent) ||
      `${abv}%`;
    const alcoholPt =
      extractFieldValue(linesForLocale("pt"), portugueseLabels.alcoholContent) ||
      extractFieldValue(linesForLocale("en"), englishLabels.alcoholContent) ||
      `${abv}%`;

    const awardsEn = extractListValue(linesForLocale("en"), englishLabels.awards);
    const awardsPt = extractListValue(linesForLocale("pt"), portugueseLabels.awards);

    const description: Record<Locale, string> = {
      en: descriptionEn,
      pt: descriptionPt,
    };

    const details = {
      region: {
        en: regionEn ?? "",
        pt: regionPt ?? "",
      },
      base: {
        en: baseEn ?? "",
        pt: basePt ?? "",
      },
      type: {
        en: typeEn ?? "",
        pt: typePt ?? "",
      },
      bottleSize: {
        en: bottleEn,
        pt: bottlePt,
      },
      servingTemperature: {
        en: servingEn ?? "",
        pt: servingPt ?? "",
      },
      alcoholContent: {
        en: alcoholEn,
        pt: alcoholPt,
      },
      awards: {
        en: awardsEn.length ? awardsEn : awardsPt,
        pt: awardsPt.length ? awardsPt : awardsEn,
      },
    } satisfies ParsedMockItem["details"];

    items.push({
      id: items.length + 1,
      slug,
      name,
      description,
      category,
      priceCents,
      abv,
      volumeMl,
      image: resolveImagePath(slug, imageFilename),
      details,
    });
  }

  return items;
};
