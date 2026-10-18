import { describe, expect, it } from "vitest";
import { fromIvanoFrankivsk, fromLviv } from "../src/import-shelters";

// [назва, завантажувач, кількість рядків, межі координат: lat min/max, lon min/max]
describe.each([
  ["ivano-frankivsk", fromIvanoFrankivsk, 131, [48, 49.5, 24, 25.5]],
  ["lviv", fromLviv, 4795, [49.7, 50, 23.8, 24.3]],
] as const)("%s CSV", (_name, load, expected, [latMin, latMax, lonMin, lonMax]) => {
  const rows = load();

  it("imports every row", () => {
    expect(rows).toHaveLength(expected);
  });

  it("produces unique external ids", () => {
    expect(new Set(rows.map((r) => r.externalId)).size).toBe(rows.length);
  });

  it("has type and address", () => {
    expect(rows.every((r) => r.type && r.address)).toBe(true);
  });

  it("has coordinates within the region", () => {
    for (const r of rows) {
      expect(r.location).toBeTruthy();
      expect(r.location!.y).toBeGreaterThan(latMin);
      expect(r.location!.y).toBeLessThan(latMax);
      expect(r.location!.x).toBeGreaterThan(lonMin);
      expect(r.location!.x).toBeLessThan(lonMax);
    }
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
