import { describe, expect, it } from "vitest";

import { getOrbTransition } from "./orb-transition.js";

describe("getOrbTransition", () => {
  it("starts as a centered football", () => {
    expect(getOrbTransition(0)).toEqual({
      footballOpacity: 1,
      earthOpacity: 0,
      scale: 1,
      x: 0,
      y: 0,
      spin: 0,
      ringOpacity: 1,
      glowOpacity: 0,
    });
  });

  it("finishes as a larger planet shifted to the side", () => {
    const transition = getOrbTransition(1);
    expect(transition.x).toBeCloseTo(5.55);
    expect(transition).toMatchObject({
      footballOpacity: 0,
      earthOpacity: 1,
      scale: 1.95,
      y: 0.27,
      spin: Math.PI * 3,
      ringOpacity: 0.08,
      glowOpacity: 0.42,
    });
  });

  it("reveals the planet during the first half of the hero scroll", () => {
    expect(getOrbTransition(0.25).earthOpacity).toBeGreaterThan(0.5);
    expect(getOrbTransition(0.5).earthOpacity).toBe(1);
  });

  it("keeps the planet roughly 60% visible on the right once the next section is in view", () => {
    expect(getOrbTransition(0.6).earthOpacity).toBe(1);
    expect(getOrbTransition(0.6).x).toBeLessThan(4);
    expect(getOrbTransition(0.72).x).toBeGreaterThan(4);
    expect(getOrbTransition(0.72).x).toBeLessThan(6);
    expect(getOrbTransition(1).x).toBeCloseTo(5.55);
  });

  it("clamps progress so the morph is reversible and stable", () => {
    expect(getOrbTransition(-1)).toEqual(getOrbTransition(0));
    expect(getOrbTransition(2)).toEqual(getOrbTransition(1));
  });
});
