import { describe, expect, it } from "vitest";

import {
  MATCH,
  PLAYERS,
  getBallPassRoute,
  fetchNearestMatch,
  formatMatchDateTime,
  getMatchStatus,
  normalizeEspnEvent,
  selectNearestMatch,
} from "./match.js";

describe("PLAYERS", () => {
  it("contains two complete teams positioned inside the pitch", () => {
    expect(PLAYERS).toHaveLength(22);
    expect(PLAYERS.filter((player) => player.team === "home")).toHaveLength(11);
    expect(PLAYERS.filter((player) => player.team === "away")).toHaveLength(11);
    expect(PLAYERS.every(({ x, y }) => x >= 7 && x <= 93 && y >= 6 && y <= 94)).toBe(true);
  });

  it("provides a compact passing route between players", () => {
    const route = getBallPassRoute();

    expect(route.length).toBeGreaterThanOrEqual(8);
    expect(route.every(({ x, y }) => x >= 15 && x <= 85 && y >= 25 && y <= 75)).toBe(true);
    route.forEach((player, index) => {
      const next = route[(index + 1) % route.length];
      expect(Math.hypot(player.x - next.x, player.y - next.y)).toBeLessThan(43);
    });
  });
});

describe("getMatchStatus", () => {
  it("shows the scheduled time before kickoff", () => {
    expect(getMatchStatus(
      new Date("2026-06-13T20:00:00+03:00"),
      new Date("2026-06-14T04:00:00+03:00"),
    )).toEqual({
      label: "NEXT MATCH",
      detail: "04:00",
    });
  });

  it("shows a live minute during the match", () => {
    expect(getMatchStatus(
      new Date("2026-06-14T04:24:00+03:00"),
      new Date("2026-06-14T04:00:00+03:00"),
    )).toEqual({
      label: "LIVE",
      detail: "24'",
    });
  });
});

describe("normalizeEspnEvent", () => {
  it("maps scoreboard data to the match card model", () => {
    const match = normalizeEspnEvent({
      date: "2026-06-14T17:00:00Z",
      season: { slug: "group-stage" },
      competitions: [{
        venue: { fullName: "NRG Stadium" },
        status: { type: { state: "pre", detail: "Scheduled" } },
        competitors: [
          { homeAway: "home", score: "0", team: { abbreviation: "GER", displayName: "Germany", logo: "ger.png" } },
          { homeAway: "away", score: "0", team: { abbreviation: "CUW", displayName: "Curaçao", logo: "cuw.png" } },
        ],
      }],
    });

    expect(match.home).toEqual({ code: "GER", name: "Germany", logo: "ger.png", score: "0" });
    expect(match.away).toEqual({ code: "CUW", name: "Curaçao", logo: "cuw.png", score: "0" });
    expect(match.venue).toBe("NRG Stadium");
    expect(match.group).toBe("Group Stage");
  });
});

describe("selectNearestMatch", () => {
  it("prefers a live match and otherwise selects the closest future match", () => {
    const now = new Date("2026-06-14T16:00:00Z");
    const future = { kickoff: new Date("2026-06-14T17:00:00Z"), state: "pre" };
    const later = { kickoff: new Date("2026-06-15T17:00:00Z"), state: "pre" };
    const live = { kickoff: new Date("2026-06-14T15:00:00Z"), state: "in" };

    expect(selectNearestMatch([future, later], now)).toBe(future);
    expect(selectNearestMatch([future, live], now)).toBe(live);
  });
});

describe("formatMatchDateTime", () => {
  it("shows a readable date and local time", () => {
    expect(formatMatchDateTime(new Date("2026-06-14T17:00:00Z"), "Europe/Moscow")).toEqual({
      date: "14 JUN 2026",
      time: "20:00 MSK",
    });
  });
});

describe("fetchNearestMatch", () => {
  it("fetches a date range and returns the nearest normalized match", async () => {
    let requestedUrl = "";
    const fetcher = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          events: [{
            date: "2026-06-14T17:00:00Z",
            season: { slug: "group-stage" },
            competitions: [{
              venue: { fullName: "NRG Stadium" },
              status: { type: { state: "pre", detail: "Scheduled" } },
              competitors: [
                { homeAway: "home", score: "0", team: { abbreviation: "GER", displayName: "Germany", logo: "ger.png" } },
                { homeAway: "away", score: "0", team: { abbreviation: "CUW", displayName: "Curaçao", logo: "cuw.png" } },
              ],
            }],
          }],
        }),
      };
    };

    const match = await fetchNearestMatch(fetcher, new Date("2026-06-14T16:00:00Z"));

    expect(requestedUrl).toContain("dates=20260613-20260621");
    expect(match.home.code).toBe("GER");
  });
});
