import { describe, expect, it } from "vitest";

import { LOADER_BANDS, LOADER_GATES } from "./loader.js";

describe("LOADER_GATES", () => {
  it("uses five solid stepped bands on both sides", () => {
    expect(LOADER_BANDS.map(({ color }) => color)).toEqual([
      "green",
      "orange",
      "lilac",
      "blue",
      "lime",
    ]);
    expect(LOADER_GATES).toHaveLength(10);
  });

  it("mirrors every band across the center line", () => {
    LOADER_BANDS.forEach((band) => {
      const matchingGates = LOADER_GATES.filter(({ color }) => color === band.color);

      expect(matchingGates.map(({ side }) => side).sort()).toEqual(["left", "right"]);
      expect(band.outer).toHaveLength(3);
      expect(band.inner).toHaveLength(3);
      expect(band.inner.every((edge, index) => edge >= band.outer[index])).toBe(true);
    });
  });

  it("places both lime gates together so the opening starts at the center", () => {
    expect(LOADER_GATES.map(({ color }) => color)).toEqual([
      "green",
      "orange",
      "lilac",
      "blue",
      "lime",
      "lime",
      "blue",
      "lilac",
      "orange",
      "green",
    ]);
  });
});
