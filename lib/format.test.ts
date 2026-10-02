import { describe, expect, it } from "vitest";
import { discountPercent, formatPrice } from "./format";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("formatPrice", () => {
  it("convertit les centimes en euros", () => {
    expect(nbsp(formatPrice(8900, "EUR"))).toBe("89,00 €");
  });

  it("n'a pas de décimales pour le franc guinéen", () => {
    expect(nbsp(formatPrice(450000, "GNF"))).toMatch(/^450 000/);
  });
});

describe("discountPercent", () => {
  it("arrondit la remise", () => {
    expect(discountPercent(5900, 8500)).toBe(31);
  });

  it("renvoie 0 sans remise", () => {
    expect(discountPercent(5900, 5900)).toBe(0);
  });
});
