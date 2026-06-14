import { describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  getReferenceFootballGeometry,
  getFootballPanels,
  getFootballPanelUVs,
  getPentagonDirections,
} from "./football.js";

describe("getPentagonDirections", () => {
  it("returns twelve normalized directions for classic football panels", () => {
    const directions = getPentagonDirections();

    expect(directions).toHaveLength(12);
    directions.forEach(([x, y, z]) => {
      expect(Math.hypot(x, y, z)).toBeCloseTo(1);
    });
  });
});

describe("getFootballPanelUVs", () => {
  it("maps all twelve panels inside a texture", () => {
    const panels = getFootballPanelUVs();

    expect(panels).toHaveLength(12);
    panels.forEach(({ u, v }) => {
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});

describe("getFootballPanels", () => {
  it("builds a classic football from twelve pentagons and twenty hexagons", () => {
    const panels = getFootballPanels();

    expect(panels.filter(({ type }) => type === "pentagon")).toHaveLength(12);
    expect(panels.filter(({ type }) => type === "hexagon")).toHaveLength(20);
    expect(panels.every(({ points, type }) => points.length === (type === "pentagon" ? 5 : 6))).toBe(true);
  });
});

describe("getReferenceFootballGeometry", () => {
  it("matches the truncated icosahedron reference geometry", () => {
    const geometry = getReferenceFootballGeometry();

    expect(geometry.vertices).toHaveLength(60);
    expect(geometry.edges).toHaveLength(90);
    expect(geometry.pentagons).toHaveLength(12);
    expect(geometry.pentagons.every((face) => face.length === 5)).toBe(true);
  });
});

describe("hero football texture", () => {
  it("keeps the optimized texture below 250 KB", () => {
    const texturePath = fileURLToPath(
      new URL("../public/textures/trionda-hero-1024.webp", import.meta.url),
    );

    expect(statSync(texturePath).size).toBeLessThan(250 * 1024);
  });
});
