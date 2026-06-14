import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylePath = fileURLToPath(new URL("./style.css", import.meta.url));
const styles = readFileSync(stylePath, "utf8");
const tickerRule = styles.match(/\.ticker\s*\{([^}]+)\}/)?.[1] ?? "";
const scrollCueRule = styles.match(/\.scroll-cue\s*\{([^}]+)\}/)?.[1] ?? "";
const manifestoRule = styles.match(/\.manifesto\s*\{([^}]+)\}/)?.[1] ?? "";
const zIndex = (rule) => Number(rule.match(/z-index:\s*(-?\d+)/)?.[1] ?? "0");
const TICKER_Z = zIndex(tickerRule);
const STAGE_Z = 2;
const loaderMarkTextRule =
  styles.match(/\.loader__mark span,\s*\.loader__mark strong\s*\{([^}]+)\}/)?.[1] ??
  "";

describe("ticker transition layout", () => {
  it("overlaps the seam but stays behind the WebGL sphere", () => {
    // Below the stage (z-index 2) so the planet renders in front of it, while a
    // negative top margin pulls it up to cover the hero/manifesto seam.
    expect(tickerRule).toMatch(/z-index:\s*1\b/);
    expect(tickerRule).toMatch(/margin:\s*-[\d.]+rem/);
  });

  it("keeps the ticker below the sphere but above the seam neighbours", () => {
    // Sphere (stage) renders in front of the ticker...
    expect(TICKER_Z).toBeLessThan(STAGE_Z);
    // ...while the scroll cue and the second section both sit below the ticker
    // so neither bleeds over nor clips the blue band at the seam.
    expect(zIndex(scrollCueRule)).toBeLessThan(TICKER_Z);
    expect(zIndex(manifestoRule)).toBeLessThan(TICKER_Z);
  });
});

describe("loader mark", () => {
  it("uses a subtle outline to stay readable across the loader colors", () => {
    expect(loaderMarkTextRule).toContain("-webkit-text-stroke: 1px");
    expect(loaderMarkTextRule).toContain("paint-order: stroke fill");
  });
});
