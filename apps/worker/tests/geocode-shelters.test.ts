import { describe, expect, it } from "vitest";
import { houseVariants, sameStreet, splitAddress } from "../src/geocode-shelters";

describe("splitAddress", () => {
  it.each([
    ["вул. Яновського, 50", "вулиця Яновського", "50"],
    ["м. Луцьк, вул. Трункіна, 12", "вулиця Трункіна", "12"],
    ["с-ще Нове, вул. Металургів, 36", "вулиця Металургів", "36"],
    ["просп. Перемоги, 16", "проспект Перемоги", "16"],
    ["вул. Анатолія Бачинського (Нєдєліна), 78а", "вулиця Анатолія Бачинського", "78а"],
    ["вул. Преображенська, 6, під'їзд № 3", "вулиця Преображенська", "6"],
    ["вул. Вінстона Черчіля, 7 (під'їзд № 3)", "вулиця Вінстона Черчіля", "7"],
    ["вул. Дальницька", "вулиця Дальницька", null],
    ["пр-кт Університетський 2/5", "проспект Університетський 2/5", null],
    ["пр. Інженерів,2", "проспект Інженерів", "2"],
    ["вул. Л. Куценка, 5", "вулиця Куценка", "5"],
    ["вул. А.Тамма, 29", "вулиця Тамма", "29"],
    ["вул. Лінія 10-а, буд. 55", "вулиця Лінія 10-а", "55"],
  ])("%s", (address, street, house) => {
    expect(splitAddress(address)).toEqual({ street, house });
  });
});

describe("houseVariants", () => {
  it("drops hyphens and building parts", () => {
    expect(houseVariants("19-а")).toEqual(["19-а", "19а"]);
    expect(houseVariants("67/8")).toEqual(["67/8", "67"]);
    expect(houseVariants("50")).toEqual(["50"]);
  });
});

describe("sameStreet", () => {
  it("accepts old names and case endings", () => {
    expect(sameStreet("вулиця Трункіна", ["Транспортна вулиця", "вулиця Трункіна"])).toBe(true);
    expect(sameStreet("вулиця Клима Савури", ["вулиця Клима Савура"])).toBe(true);
    expect(sameStreet("вулиця П'ятницька", ["П’ятницька вулиця"])).toBe(true);
  });

  it("rejects fuzzy matches", () => {
    expect(sameStreet("вулиця Трункіна", ["Транспортна вулиця"])).toBe(false);
    expect(sameStreet("вулиця Дальницька", ["Дальня вулиця"])).toBe(false);
  });
});
