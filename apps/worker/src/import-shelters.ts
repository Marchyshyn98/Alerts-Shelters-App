/**
 * Одноразовий (ідемпотентний) імпорт укриттів з CSV у data/raw.
 * Повторний запуск оновлює наявні записи за (source, external_id).
 *
 *   pnpm import:shelters              # усі джерела
 *   pnpm import:shelters kyiv odesa   # лише вказані, решту не чіпає
 */
import { createDb, shelters, sql } from "@alerts-shelters/db";
import { parse } from "csv-parse/sync";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

type NewShelter = typeof shelters.$inferInsert;
type Row = Record<string, string>;

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const BATCH_SIZE = 500;

function readCsv(file: string): Row[] {
  // у джерелах трапляються змішані закінчення рядків (заголовок \r\n, дані \n),
  // а csv-parse визначає роздільник за першим рядком
  const text = readFileSync(new URL(file, RAW_DIR), "utf8").replace(/\r\n?/g, "\n");
  return parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

/** "null" і порожні рядки → null */
const val = (v: string | undefined) => (v === undefined || v === "" || v === "null" ? null : v);

/** "м. Івано-Франківськ" / "с.Угорники" → назва без префікса */
const placeName = (v: string | undefined) =>
  val(v)?.replace(/^(м|с|смт)\.\s*/u, "").trim() ?? null;

/** Координати в джерелі бувають з хвостами: "48.9001, " → 48.9001 */
const coord = (v: string | undefined) => {
  const n = Number.parseFloat(v ?? "");
  return Number.isFinite(n) ? n : null;
};

const hash = (...parts: (string | number | null | undefined)[]) =>
  createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);

/**
 * Робить externalId унікальними в межах файлу: повтори отримують суфікс -2, -3, ...
 * (в одній будівлі буває кілька укриттів, а в джерелах трапляються дублі рядків).
 * Порядок рядків у CSV стабільний, тож повторний імпорт дає ті самі id.
 */
function withUniqueIds(rows: NewShelter[]): NewShelter[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const n = (seen.get(row.externalId) ?? 0) + 1;
    seen.set(row.externalId, n);
    return n === 1 ? row : { ...row, externalId: `${row.externalId}-${n}` };
  });
}

export function fromIvanoFrankivsk(): NewShelter[] {
  const rows = readCsv("ivano-frankivsk.csv").map((r): NewShelter => {
    const lat = coord(r.lat);
    const lon = coord(r.lon);
    const street = val(r.addressThoroughfare);
    const building = val(r.addressLocatorDesignator);
    return {
      source: "ivano-frankivsk",
      // id заповнений лише у частини рядків
      externalId: val(r.id) ?? hash(r.type, street, building, lat, lon),
      type: r.type!,
      address: [street, building].filter(Boolean).join(", "),
      city: placeName(r.addressPostName),
      district: val(r.addressAdminUnitL3),
      community: val(r.addressAdminUnitL4),
      capacity: null,
      location: lat !== null && lon !== null ? { x: lon, y: lat } : null,
      raw: r,
    };
  });
  return withUniqueIds(rows);
}

const STREET_TYPE: Record<string, string> = {
  вулиця: "вул.",
  проспект: "просп.",
  площа: "пл.",
};

export function fromLviv(): NewShelter[] {
  return readCsv("lviv.csv").map((r): NewShelter => {
    const streetType = val(r.street_type);
    const street = [streetType && (STREET_TYPE[streetType] ?? streetType), val(r.street_name)]
      .filter(Boolean)
      .join(" ");
    const pavilion = val(r.pavilion);
    const entrance = val(r.entrance);
    const lon = coord(r.x);
    const lat = coord(r.y);
    return {
      source: "lviv",
      externalId: r._id!,
      // тип укриття в джерелі не вказано, лише тип будівлі (житловий будинок, паркінг, ...)
      type: r.object!,
      address: [
        street,
        val(r.housenumber),
        pavilion && `корп. ${pavilion}`,
        entrance && `під’їзд ${entrance}`,
      ]
        .filter(Boolean)
        .join(", "),
      city: val(r.settlement),
      district: val(r.district),
      community: null,
      capacity: val(r.capacity) ? Number.parseInt(r.capacity!, 10) : null,
      location: lat !== null && lon !== null ? { x: lon, y: lat } : null,
      raw: r,
    };
  });
}

const int = (v: string | undefined) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : null;
};

/** "вулиця Будіндустрії , 3" → "вулиця Будіндустрії, 3" */
const clean = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").replace(/ ,/g, ",").trim();

/** Поля, які маппер міста бере зі свого CSV; решту заповнює shelter() */
interface Fields {
  /** id у джерелі; якщо порожній — хеш типу, адреси й координат */
  id?: string;
  type: string | undefined;
  address: string | undefined;
  city: string | null;
  district?: string;
  capacity?: string;
  lat?: string;
  lon?: string;
}

function shelter(source: string, r: Row, f: Fields): NewShelter {
  const lat = coord(f.lat);
  const lon = coord(f.lon);
  const type = clean(f.type);
  const address = clean(f.address);
  return {
    source,
    externalId: val(f.id) ?? hash(type, address, lat, lon),
    type,
    address,
    city: f.city,
    district: val(f.district),
    community: null,
    capacity: int(f.capacity),
    location: lat !== null && lon !== null ? { x: lon, y: lat } : null,
    raw: r,
  };
}

const fromCsv = (file: string, source: string, map: (r: Row) => Fields) => () =>
  withUniqueIds(readCsv(file).map((r) => shelter(source, r, map(r))));

/**
 * Спільний формат реєстру ДСНС. У Тернополі частина рядків з міської мапи
 * (модульні укриття на зупинках) — без dsns_id і району.
 */
const fromDsns = (source: string, city: string) =>
  fromCsv(`${source}_shelters.csv`, source, (r) => ({
    id: r.dsns_id,
    type: r.type,
    address: r.address,
    city,
    district: r.district,
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  }));

/** "вул. Янтарна, 77-Д, Індустріальний район, Дніпро, ..., Україна" → "вул. Янтарна, 77-Д" */
function dniproAddress(v: string | undefined) {
  const parts = (v ?? "").split(",").map((p) => p.trim());
  const end = parts.findIndex((p) => p.endsWith(" район") || p === "Дніпро");
  return (end > 0 ? parts.slice(0, end) : parts).join(", ");
}

/** Тип у джерелі не вказано, лише шар мапи: "Найпростіші укриття ОСББ", "zhyt 3", ... */
const zhytomyrType = (layer: string | undefined) =>
  layer?.startsWith("Найпростіші")
    ? "Найпростіше укриття"
    : layer?.startsWith("Захисні споруди")
      ? "Захисна споруда"
      : "Укриття";

export const SOURCES: Record<string, () => NewShelter[]> = {
  "ivano-frankivsk": fromIvanoFrankivsk,
  lviv: fromLviv,
  cherkasy: fromDsns("cherkasy", "Черкаси"),
  chernihiv: fromDsns("chernihiv", "Чернігів"),
  chernivtsi: fromDsns("chernivtsi", "Чернівці"),
  khmelnytskyi: fromDsns("khmelnytskyi", "Хмельницький"),
  poltava: fromDsns("poltava", "Полтава"),
  sumy: fromDsns("sumy", "Суми"),
  ternopil: fromDsns("ternopil", "Тернопіль"),
  uzhhorod: fromDsns("uzhhorod", "Ужгород"),
  dnipro: fromCsv("dnipro_shelters.csv", "dnipro", (r) => ({
    id: r.id,
    type: r.type,
    // short_address заповнений рідко; address — повна адреса з геокодера
    address: val(r.short_address) ?? dniproAddress(r.address),
    city: "Дніпро",
    district: r.district,
    lat: r.lat,
    lon: r.lon,
  })),
  kharkiv: fromCsv("kharkiv_shelters.csv", "kharkiv", (r) => ({
    id: r.OBJECTID,
    // тип укриття не вказано, лише місце: "підвальне приміщення", "підземний перехід", ...
    type: val(r.BOMBSHELTER_PLACE) ?? "Укриття",
    address: r.ADDRESS,
    city: "Харків",
    district: r.DISTRICT,
    lat: r.LATITUDE,
    lon: r.LONGITUDE,
  })),
  // координат у джерелі не було — дозаповнені через pnpm geocode:shelters
  kropyvnytskyi: fromCsv("kropyvnytskyi_shelters.csv", "kropyvnytskyi", (r) => ({
    id: r.registry_no,
    type: r.type,
    address: r.address,
    city: "Кропивницький",
    lat: r.lat,
    lon: r.lon,
  })),
  // lat/lon у заголовку повторюються двічі, csv-parse бере останні
  kyiv: fromCsv("kyiv_shelters.csv", "kyiv", (r) => ({
    id: r.objectid,
    type: r.type,
    // у частини входів у метро адреси немає, лише координати
    address: val(r.address) ?? r.title,
    city: "Київ",
    district: r.district,
    lat: r.lat,
    lon: r.lon,
  })),
  lutsk: fromCsv("lutsk_shelters_geocoded.csv", "lutsk", (r) => ({
    // registry_no у джерелі місцями повторюється — дублі отримають суфікс
    id: r.registry_no,
    type: r.type,
    // "м. Луцьк, вул. Рівненська, 76-А" → "вул. Рівненська, 76-А"
    address: r.address?.replace(/^(м|с|смт)\.\s*[^,]+,\s*/u, ""),
    city: placeName(r.settlement),
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
  mykolaiv: fromCsv("mykolaiv_shelters.csv", "mykolaiv", (r) => ({
    type: r.type,
    address: r.address,
    city: "Миколаїв",
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
  odesa: fromCsv("odesa_shelters.csv", "odesa", (r) => ({
    id: r.id,
    type: val(r.category) ?? r.shelter_type,
    address: r.address,
    city: "Одеса",
    district: r.district,
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
  rivne: fromCsv("rivne_shelters.csv", "rivne", (r) => ({
    id: r.registry_no,
    type: r.type,
    address: r.address,
    city: "Рівне",
    capacity: r.capacity_dsns,
    lat: r.lat,
    lon: r.lon,
  })),
  vinnytsia: fromCsv("vinnytsia_shelters.csv", "vinnytsia", (r) => ({
    id: r.id,
    // тип укриття не вказано, лише тип об'єкта (житлові приміщення УК, лікарня, ...)
    type: r.kind,
    address: r.address,
    city: "Вінниця",
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
  zaporizhzhia: fromCsv("zaporizhzhia_shelters.csv", "zaporizhzhia", (r) => ({
    type: r.type,
    address: r.address_clean,
    city: "Запоріжжя",
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
  zhytomyr: fromCsv("zhytomyr_shelters.csv", "zhytomyr", (r) => ({
    id: r.registry_no,
    type: zhytomyrType(r.layer),
    address: r.address?.replace(/,\s*м\.\s*Житомир$/u, ""),
    city: "Житомир",
    capacity: r.capacity,
    lat: r.lat,
    lon: r.lon,
  })),
};

/** Аргументи CLI → список джерел; без аргументів — усі */
export function selectSources(args: string[]): string[] {
  const unknown = args.filter((a) => !Object.hasOwn(SOURCES, a));
  if (unknown.length > 0) {
    throw new Error(
      `Невідомі джерела: ${unknown.join(", ")}. Доступні: ${Object.keys(SOURCES).join(", ")}`,
    );
  }
  return args.length > 0 ? [...new Set(args)] : Object.keys(SOURCES);
}

async function main(args: string[]) {
  const selected = selectSources(args);
  const db = createDb();

  for (const source of selected) {
    const rows = SOURCES[source]!();
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await db
        .insert(shelters)
        .values(rows.slice(i, i + BATCH_SIZE))
        .onConflictDoUpdate({
          target: [shelters.source, shelters.externalId],
          set: {
            type: sql`excluded.type`,
            address: sql`excluded.address`,
            city: sql`excluded.city`,
            district: sql`excluded.district`,
            community: sql`excluded.community`,
            capacity: sql`excluded.capacity`,
            location: sql`coalesce(excluded.location, ${shelters.location})`,
            raw: sql`excluded.raw`,
            importedAt: sql`now()`,
          },
        });
    }
    const withCoords = rows.filter((r) => r.location).length;
    console.log(`${source}: ${rows.length} укриттів (з координатами: ${withCoords})`);
  }

  await db.$client.end();
}

// запуск лише як скрипта (не при імпорті в тестах)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
