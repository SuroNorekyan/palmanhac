type DisplayNamesLike = {
  of(code: string): string | undefined;
};

const SUPPORTED_REGIONS: string[] = (() => {
  try {
    const supported = (
      Intl as typeof Intl & {
        supportedValuesOf?: (input: string) => string[];
      }
    ).supportedValuesOf;
    if (typeof supported === "function") {
      return supported("region").filter((item) => /^[A-Za-z]{2,3}$/.test(item));
    }
  } catch {
    // Ignore
  }
  return ["PT", "ES", "FR", "DE", "IT", "NL", "BE", "GB", "US", "BR", "CA"];
})();

const LOCALES = ["en", "pt", "es", "fr"];

const normaliseName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

let cachedMap: Map<string, string> | null = null;

const buildNameMap = () => {
  if (cachedMap) return cachedMap;
  const map = new Map<string, string>();

  const translators: DisplayNamesLike[] = [];
  for (const locale of LOCALES) {
    try {
      const translator = new Intl.DisplayNames([locale], { type: "region" });
      translators.push(translator);
    } catch {
      // DisplayNames might be unavailable in some runtimes
    }
  }

  for (const code of SUPPORTED_REGIONS) {
    for (const translator of translators) {
      const name = translator.of(code);
      if (name) {
        map.set(normaliseName(name), code.toUpperCase());
      }
    }
  }

  // Manual fallbacks / aliases
  const aliases: Record<string, string> = {
    portugal: "PT",
    espanha: "ES",
    spain: "ES",
    "united kingdom": "GB",
    uk: "GB",
    "great britain": "GB",
    estadosunidos: "US",
    "united states": "US",
    brasil: "BR",
    brazil: "BR",
    alemanha: "DE",
    germany: "DE",
    franca: "FR",
    france: "FR",
  };

  for (const [name, code] of Object.entries(aliases)) {
    map.set(normaliseName(name), code);
  }

  cachedMap = map;
  return map;
};

export const normalizeCountryInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Country is required.");
  }
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const map = buildNameMap();
  const lookup = map.get(normaliseName(trimmed));
  if (lookup) {
    return lookup;
  }
  throw new Error(
    `Unsupported country "${value}". Please use a valid ISO 3166-1 alpha-2 code.`,
  );
};
