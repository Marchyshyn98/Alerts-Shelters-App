/**
 * Одноразовий (ідемпотентний) імпорт укриттів з CSV у data/raw.
 * Повторний запуск оновлює наявні записи за (source, external_id).
 *
 *   pnpm import:shelters
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

async function main() {
  const db = createDb();
  const batches = { "ivano-frankivsk": fromIvanoFrankivsk(), lviv: fromLviv() };

  for (const [source, rows] of Object.entries(batches)) {
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
  await main();
}
