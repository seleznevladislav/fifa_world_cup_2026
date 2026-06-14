export const LOADER_BANDS = [
  { color: "green", outer: [0, 0, 0], inner: [3.4, 6, 9.2] },
  { color: "orange", outer: [3.4, 6, 9.2], inner: [10.7, 15.7, 22.5] },
  { color: "lilac", outer: [10.7, 15.7, 22.5], inner: [19.3, 27.2, 37.2] },
  { color: "blue", outer: [19.3, 27.2, 37.2], inner: [37.2, 46.4, 49.05] },
  { color: "lime", outer: [37.2, 46.4, 49.05], inner: [50, 50, 50] },
];

export const LOADER_GATES = [
  ...LOADER_BANDS.map((band) => ({ ...band, side: "left" })),
  ...[...LOADER_BANDS].reverse().map((band) => ({ ...band, side: "right" })),
];
