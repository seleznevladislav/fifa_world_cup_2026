import { describe, expect, it } from "vitest";

import { getPointerOrbit } from "./pointer-orbit.js";

describe("getPointerOrbit", () => {
  it("keeps cursor influence subtle and centered", () => {
    expect(getPointerOrbit(500, 400, 1000, 800)).toEqual({ x: 0, y: 0 });
    expect(getPointerOrbit(0, 0, 1000, 800)).toEqual({ x: 0.04, y: -0.055 });
    expect(getPointerOrbit(1000, 800, 1000, 800)).toEqual({ x: -0.04, y: 0.055 });
  });
});
