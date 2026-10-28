/**
 * Дозаповнює порожні lat/lon у CSV з data/raw через Nominatim (OpenStreetMap).
 * Рядки з координатами не змінює. Ліміт Nominatim — 1 запит/с.
 *
 *   pnpm geocode:shelters kropyvnytskyi odesa
 */
import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "alerts-shelters-import/0.1";
const DELAY_MS = 1100;
/** як часто зберігати файл, щоб не втратити прогрес при збої */
const SAVE_EVERY = 20;

export const FILES: Record<string, { file: string; city: string }> = {
  chernihiv: { file: "chernihiv_shelters.csv", city: "Чернігів" },
  kropyvnytskyi: { file: "kropyvnytskyi_shelters.csv", city: "Кропивницький" },
  lutsk: { file: "lutsk_shelters_geocoded.csv", city: "Луцьк" },
  odesa: { file: "odesa_shelters.csv", city: "Одеса" },
};

const STREET_TYPE: [RegExp, string][] = [
  [/^вул\.\s*/u, "вулиця "],
  [/^(просп\.|пр-кт|пр-т|пр\.)\s*/u, "проспект "],
  [/^пров\.\s*/u, "провулок "],
  [/^пл\.\s*/u, "площа "],
  [/^бул(ьв)?\.\s*/u, "бульвар "],
  [/^узв\.\s*/u, "узвіз "],
];

/**
 * "м. Луцьк, вул. Трункіна, 12" → { street: "вулиця Трункіна", house: "12" }.
 * Прибирає населений пункт, дужки ("(Нєдєліна)"), під'їзди та ініціали ("Л. Куценка").
 */
export function splitAddress(address: string): { street: string; house: string | null } {
  const parts = address
    .replace(/\([^)]*\)/gu, "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^(м|с|смт|с-ще)\.?\s/u.test(p) && !/під['’]їзд/u.test(p));
  const street = STREET_TYPE.reduce((s, [re, full]) => s.replace(re, full), parts[0] ?? "")
    .replace(/(^|\s)\p{Lu}\.\s*/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const house = parts[1]?.replace(/^буд\.\s*/u, "");
  return { street, house: house && /^\d/.test(house) ? house : null };
}

/** "19-а" → ["19-а", "19а"], "67/8" → ["67/8", "67"] */
export const houseVariants = (house: string) => [
  ...new Set([house, house.replace(/[-\s]/g, ""), house.split("/")[0]!]),
];

const STREET_WORDS = new Set(STREET_TYPE.map(([, full]) => full.trim()));
const norm = (s: string) => s.toLowerCase().replace(/[’`ʼ]/g, "'");

/**
 * Nominatim шукає нечітко, тож перевіряємо, що знайдена вулиця — та сама:
 * кожне слово назви збігається основою (Савури/Савура) з однією з назв у OSM,
 * зокрема old_name — після перейменувань у джерелах трапляються старі назви.
 */
export function sameStreet(wanted: string, names: string[]): boolean {
  const haystack = norm(names.join(" | "));
  const words = norm(wanted)
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STREET_WORDS.has(w));
  return words.length > 0 && words.every((w) => haystack.includes(w.slice(0, Math.max(4, w.length - 2))));
}

interface Hit {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox: [string, string, string, string];
  address?: { house_number?: string; road?: string };
  namedetails?: Record<string, string>;
}

let lastRequest = 0;

async function search(params: Record<string, string>): Promise<Hit | null> {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  const url = new URL(NOMINATIM);
  const query = { format: "jsonv2", limit: "1", addressdetails: "1", countrycodes: "ua", ...params };
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "uk" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}: ${await res.text()}`);
  const [hit] = (await res.json()) as Hit[];
  return hit ?? null;
}

type Precision = "house" | "street";

async function geocode(address: string, city: string, viewbox: string) {
  const { street, house } = splitAddress(address);
  if (!street) return null;
  const area = { city, viewbox, bounded: "1" };

  for (const h of house ? houseVariants(house) : []) {
    const hit = await search({ ...area, street: `${h} ${street}` });
    // без house_number Nominatim повертає саму вулицю — пробуємо інші варіанти номера
    if (hit?.address?.house_number) return { hit, precision: "house" as Precision };
  }
  const hit = await search({ ...area, street, namedetails: "1" });
  const names = [hit?.address?.road ?? "", ...Object.values(hit?.namedetails ?? {})];
  return hit && sameStreet(street, names) ? { hit, precision: "street" as Precision } : null;
}

const cell = (v: string) => (/[",\r\n]/.test(v) || v !== v.trim() ? `"${v.replaceAll('"', '""')}"` : v);

async function geocodeFile(source: string) {
  const { file, city } = FILES[source]!;
  const path = new URL(file, RAW_DIR);
  const text = readFileSync(path, "utf8");
  const bom = text.startsWith("﻿");
  const eol = (text.match(/\r\n/g)?.length ?? 0) > (text.match(/\n/g)?.length ?? 0) / 2 ? "\r\n" : "\n";
  const [header, ...rows] = parse(text.replace(/\r\n?/g, "\n"), { bom: true, skip_empty_lines: true }) as string[][];
  if (!header) throw new Error(`${file}: порожній файл`);

  // точність: у Чернігові вже є coords_source, іншим додаємо колонки як у Луцьку
  const hasSource = header.includes("coords_source");
  if (!hasSource) {
    for (const col of ["geocode_precision", "geocode_matched"]) {
      if (!header.includes(col)) {
        header.push(col);
        for (const r of rows) r.push("");
      }
    }
  }
  const col = (name: string) => header.indexOf(name);
  const [iAddr, iLat, iLon] = [col("address"), col("lat"), col("lon")];
  const save = () =>
    writeFileSync(path, (bom ? "﻿" : "") + [header, ...rows].map((r) => r.map(cell).join(",")).join(eol) + eol);

  const todo = rows.filter((r) => !Number.isFinite(Number.parseFloat(r[iLat]!)) || !Number.isFinite(Number.parseFloat(r[iLon]!)));
  console.log(`${source}: без координат ${todo.length} з ${rows.length}`);
  if (todo.length === 0) return;

  const cityHit = await search({ city, featuretype: "city" });
  if (!cityHit) throw new Error(`${city}: місто не знайдено`);
  const [south, north, west, east] = cityHit.boundingbox;
  const viewbox = `${west},${north},${east},${south}`;

  const cache = new Map<string, Awaited<ReturnType<typeof geocode>>>();
  const stats = { house: 0, street: 0, not_found: 0 };
  for (const [i, r] of todo.entries()) {
    const address = r[iAddr]!;
    if (!cache.has(address)) cache.set(address, await geocode(address, city, viewbox));
    const found = cache.get(address);

    if (found) {
      r[iLat] = found.hit.lat;
      r[iLon] = found.hit.lon;
    }
    if (hasSource) {
      if (found) r[col("coords_source")] = `osm_geocoded_${found.precision}`;
    } else {
      r[col("geocode_precision")] = found?.precision ?? "not_found";
      r[col("geocode_matched")] = found?.hit.display_name ?? "";
    }
    stats[found?.precision ?? "not_found"]++;
    console.log(`  [${i + 1}/${todo.length}] ${address} → ${found?.precision ?? "не знайдено"}`);
    if ((i + 1) % SAVE_EVERY === 0) save();
  }
  save();
  console.log(`${source}: будинок ${stats.house}, вулиця ${stats.street}, не знайдено ${stats.not_found}`);
}

async function main(args: string[]) {
  const unknown = args.filter((a) => !Object.hasOwn(FILES, a));
  if (args.length === 0 || unknown.length > 0) {
    throw new Error(`Вкажіть джерела: ${Object.keys(FILES).join(", ")}`);
  }
  for (const source of new Set(args)) await geocodeFile(source);
}

// запуск лише як скрипта (не при імпорті в тестах)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
