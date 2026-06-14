import { describe, expect, it } from "vitest";

import { HOSTS, getCountdown } from "./data.js";

describe("getCountdown", () => {
  it("returns zero-padded tournament countdown values", () => {
    const now = new Date("2026-06-10T00:00:00Z");
    const start = new Date("2026-06-11T12:05:07Z");

    expect(getCountdown(now, start)).toEqual({
      days: "01",
      hours: "12",
      minutes: "05",
      seconds: "07",
    });
  });

  it("never returns negative values after kickoff", () => {
    const now = new Date("2026-06-12T00:00:00Z");
    const start = new Date("2026-06-11T00:00:00Z");

    expect(getCountdown(now, start)).toEqual({
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    });
  });
});

describe("HOSTS", () => {
  it("describes all three host nations and their venues", () => {
    expect(HOSTS).toHaveLength(3);
    expect(HOSTS.map((host) => host.code)).toEqual(["CAN", "MEX", "USA"]);
    expect(HOSTS.every((host) => host.cities.length > 0)).toBe(true);
  });
});
