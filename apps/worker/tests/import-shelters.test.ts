import { describe, expect, it } from "vitest";
import { SOURCES, fromIvanoFrankivsk, fromLviv, selectSources } from "../src/import-shelters";

// [джерело, кількість рядків, з координатами, межі координат: lat min/max, lon min/max]
describe.each([
  ["ivano-frankivsk", 131, 131, [48, 49.5, 24, 25.5]],
  ["lviv", 4795, 4795, [49.7, 50, 23.8, 24.3]],
  ["cherkasy", 237, 237, [49.2, 49.7, 31.8, 32.3]],
  ["chernihiv", 1168, 1166, [51.3, 51.7, 31, 31.5]],
  ["chernivtsi", 414, 414, [48, 48.5, 25.4, 26.2]],
  ["dnipro", 785, 785, [48.2, 48.7, 34.6, 35.4]],
  ["kharkiv", 2542, 2542, [49.8, 50.2, 36, 36.6]],
  ["khmelnytskyi", 710, 710, [49.2, 49.6, 26.7, 27.2]],
  ["kropyvnytskyi", 319, 300, [48.3, 48.7, 32, 32.5]],
  ["kyiv", 4193, 4193, [50.2, 50.7, 30.1, 30.9]],
  ["lutsk", 104, 102, [50.6, 50.9, 25, 25.6]],
  ["mykolaiv", 328, 328, [46.7, 47.2, 31.7, 32.3]],
  ["odesa", 1026, 1025, [46.2, 46.8, 30.5, 31]],
  ["poltava", 335, 335, [49.4, 49.8, 34.3, 34.8]],
  ["rivne", 258, 258, [50.4, 50.8, 26, 26.5]],
  ["sumy", 183, 183, [50.7, 51.1, 34.6, 35.1]],
  ["ternopil", 321, 321, [49.4, 49.7, 25.4, 25.8]],
  ["uzhhorod", 249, 249, [48.5, 48.75, 22.1, 22.5]],
  ["vinnytsia", 1169, 1169, [49.1, 49.4, 28.2, 28.8]],
  ["zaporizhzhia", 687, 687, [47.6, 48.1, 34.8, 35.5]],
  ["zhytomyr", 703, 703, [50.1, 50.5, 28.4, 28.9]],
] as const)("%s CSV", (source, expected, withCoords, [latMin, latMax, lonMin, lonMax]) => {
  const rows = SOURCES[source]!();

  it("imports every row", () => {
    expect(rows).toHaveLength(expected);
  });

  it("produces unique external ids", () => {
    expect(new Set(rows.map((r) => r.externalId)).size).toBe(rows.length);
  });

  it("has source, type and address", () => {
    expect(rows.every((r) => r.source === source && r.type && r.address)).toBe(true);
  });

  it("has coordinates within the region", () => {
    const located = rows.filter((r) => r.location);
    expect(located).toHaveLength(withCoords);
    for (const r of located) {
      expect(r.location!.y).toBeGreaterThan(latMin);
      expect(r.location!.y).toBeLessThan(latMax);
      expect(r.location!.x).toBeGreaterThan(lonMin);
      expect(r.location!.x).toBeLessThan(lonMax);
    }
  });
});

describe("selectSources", () => {
  it("returns every source without arguments", () => {
    expect(selectSources([])).toEqual(Object.keys(SOURCES));
  });

  it("returns only the requested sources", () => {
    expect(selectSources(["kyiv", "odesa", "kyiv"])).toEqual(["kyiv", "odesa"]);
  });

  it("rejects unknown sources", () => {
    expect(() => selectSources(["kyiv", "atlantis"])).toThrow(/atlantis/);
  });
});

describe("ivano-frankivsk", () => {
  it("strips settlement prefixes from city", () => {
    const cities = new Set(fromIvanoFrankivsk().map((r) => r.city));
    expect(cities).toContain("Івано-Франківськ");
    expect(cities).toContain("Угорники");
  });
});

describe("lviv", () => {
  it("builds a readable address", () => {
    const first = fromLviv()[0]!;
    expect(first.address).toBe("вул. Личаківська, 92");
    expect(first.city).toBe("Львів");
    expect(first.capacity).toBe(24);
  });
});

describe("dsns format", () => {
  it("normalizes spacing in address", () => {
    const first = SOURCES.cherkasy!()[0]!;
    expect(first.address).toBe("вулиця Будіндустрії, 3");
    expect(first.externalId).toBe("44511");
    expect(first.capacity).toBe(150);
  });
});

describe("lutsk", () => {
  it("moves settlement from address to city", () => {
    const rows = SOURCES.lutsk!();
    expect(rows[0]!.address).toBe("вул. Рівненська, 76-А");
    expect(rows[0]!.city).toBe("Луцьк");
    expect(new Set(rows.map((r) => r.city))).toContain("Княгининок");
  });
});
