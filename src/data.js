export const HOSTS = [
  {
    code: "CAN",
    country: "Canada",
    index: "01",
    color: "#b8f23e",
    cities: ["Toronto", "Vancouver"],
    note: "Northern pulse",
  },
  {
    code: "MEX",
    country: "México",
    index: "02",
    color: "#ff5a25",
    cities: ["Guadalajara", "Monterrey", "Mexico City"],
    note: "Three-time host",
  },
  {
    code: "USA",
    country: "United States",
    index: "03",
    color: "#5065f6",
    cities: [
      "Atlanta",
      "Boston",
      "Dallas",
      "Houston",
      "Kansas City",
      "Los Angeles",
      "Miami",
      "New York / New Jersey",
      "Philadelphia",
      "San Francisco Bay Area",
      "Seattle",
    ],
    note: "The final stage",
  },
];

const pad = (value) => String(value).padStart(2, "0");

export function getCountdown(now, target) {
  const difference = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: pad(Math.floor(totalSeconds / 86400)),
    hours: pad(Math.floor((totalSeconds % 86400) / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  };
}
