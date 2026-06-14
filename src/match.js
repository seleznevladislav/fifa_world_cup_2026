const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const DISPLAY_TIME_ZONE = "Europe/Moscow";

export const MATCH = {
  home: {
    code: "GER",
    name: "Germany",
    logo: "https://a.espncdn.com/i/teamlogos/countries/500/ger.png",
    score: "0",
  },
  away: {
    code: "CUW",
    name: "Curaçao",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/11678.png",
    score: "0",
  },
  kickoff: new Date("2026-06-14T17:00:00Z"),
  venue: "NRG Stadium",
  group: "Group E",
  state: "pre",
  statusDetail: "Scheduled",
};

const formation = (team, positions) =>
  positions.map(([x, y], index) => ({ team, number: index + 1, x, y }));

export const PLAYERS = [
  ...formation("home", [
    [50, 91], [20, 76], [40, 79], [60, 79], [80, 76], [29, 59],
    [50, 63], [71, 59], [24, 39], [50, 33], [76, 39],
  ]),
  ...formation("away", [
    [50, 9], [20, 24], [40, 21], [60, 21], [80, 24], [29, 41],
    [50, 37], [71, 41], [24, 61], [50, 67], [76, 61],
  ]),
];

const BALL_PASS_PLAYER_INDICES = [9, 17, 18, 10, 7, 21, 20, 6, 19, 5, 16, 8];

export function getBallPassRoute(players = PLAYERS) {
  return BALL_PASS_PLAYER_INDICES.map((index) => players[index]);
}

const titleCase = (value) =>
  value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateForUrl = (date) =>
  date.toISOString().slice(0, 10).replaceAll("-", "");

export function formatMatchDateTime(kickoff, timeZone = DISPLAY_TIME_ZONE) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(kickoff).toUpperCase();
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(kickoff);
  const zone = timeZone === "Europe/Moscow" ? "MSK" : timeZone;

  return { date, time: `${time} ${zone}` };
}

export function getMatchStatus(now, kickoff, state, sourceDetail) {
  const elapsedMinutes = Math.floor((now.getTime() - kickoff.getTime()) / 60000);

  if (state === "in") {
    return { label: "LIVE", detail: sourceDetail || `${Math.max(1, Math.min(elapsedMinutes, 120))}'` };
  }

  if (state === "post") {
    return { label: "FULL TIME", detail: "FT" };
  }

  if (elapsedMinutes < 0) {
    return {
      label: "NEXT MATCH",
      detail: formatMatchDateTime(kickoff).time.replace(" MSK", ""),
    };
  }

  if (elapsedMinutes <= 120) {
    return { label: "LIVE", detail: `${Math.min(elapsedMinutes, 90)}'` };
  }

  return { label: "FULL TIME", detail: "FT" };
}

export function normalizeEspnEvent(event) {
  const competition = event.competitions?.[0] ?? {};
  const home = competition.competitors?.find(({ homeAway }) => homeAway === "home");
  const away = competition.competitors?.find(({ homeAway }) => homeAway === "away");
  const note = competition.altGameNote?.split(",").at(-1)?.trim();

  if (!home?.team || !away?.team || !event.date) return null;

  const mapTeam = ({ score, team }) => ({
    code: team.abbreviation,
    name: team.displayName,
    logo: team.logo,
    score,
  });

  return {
    home: mapTeam(home),
    away: mapTeam(away),
    kickoff: new Date(event.date),
    venue: competition.venue?.fullName ?? "Venue TBA",
    group: note || titleCase(event.season?.slug ?? "FIFA World Cup"),
    state: competition.status?.type?.state ?? event.status?.type?.state ?? "pre",
    statusDetail:
      competition.status?.displayClock ||
      competition.status?.type?.shortDetail ||
      event.status?.type?.shortDetail ||
      "",
  };
}

export function selectNearestMatch(matches, now = new Date()) {
  const live = matches.find(({ state }) => state === "in");
  if (live) return live;

  const future = matches
    .filter(({ kickoff, state }) => state === "pre" && kickoff >= now)
    .sort((left, right) => left.kickoff - right.kickoff);
  if (future.length) return future[0];

  return [...matches]
    .filter(({ kickoff }) => kickoff <= now)
    .sort((left, right) => right.kickoff - left.kickoff)[0] ?? null;
}

export async function fetchNearestMatch(fetcher = fetch, now = new Date()) {
  const start = new Date(now);
  const end = new Date(now);
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 7);
  const url = `${SCOREBOARD_URL}?dates=${formatDateForUrl(start)}-${formatDateForUrl(end)}&limit=100`;
  const response = await fetcher(url);

  if (!response.ok) throw new Error(`Scoreboard request failed with ${response.status}`);

  const data = await response.json();
  const matches = (data.events ?? []).map(normalizeEspnEvent).filter(Boolean);
  return selectNearestMatch(matches, now);
}
