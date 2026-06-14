const PHI = (1 + Math.sqrt(5)) / 2;

const REFERENCE_VERTICES = [
  [0, 1, 3 * PHI],
  [0, 1, -3 * PHI],
  [0, -1, 3 * PHI],
  [0, -1, -3 * PHI],
  [1, 3 * PHI, 0],
  [1, -3 * PHI, 0],
  [-1, 3 * PHI, 0],
  [-1, -3 * PHI, 0],
  [3 * PHI, 0, 1],
  [-3 * PHI, 0, 1],
  [3 * PHI, 0, -1],
  [-3 * PHI, 0, -1],
  [2, 1 + 2 * PHI, PHI],
  [2, 1 + 2 * PHI, -PHI],
  [2, -(1 + 2 * PHI), PHI],
  [-2, 1 + 2 * PHI, PHI],
  [2, -(1 + 2 * PHI), -PHI],
  [-2, 1 + 2 * PHI, -PHI],
  [-2, -(1 + 2 * PHI), PHI],
  [-2, -(1 + 2 * PHI), -PHI],
  [1 + 2 * PHI, PHI, 2],
  [1 + 2 * PHI, -PHI, 2],
  [-(1 + 2 * PHI), PHI, 2],
  [1 + 2 * PHI, PHI, -2],
  [-(1 + 2 * PHI), -PHI, 2],
  [1 + 2 * PHI, -PHI, -2],
  [-(1 + 2 * PHI), PHI, -2],
  [-(1 + 2 * PHI), -PHI, -2],
  [PHI, 2, 1 + 2 * PHI],
  [-PHI, 2, 1 + 2 * PHI],
  [PHI, 2, -(1 + 2 * PHI)],
  [PHI, -2, 1 + 2 * PHI],
  [-PHI, 2, -(1 + 2 * PHI)],
  [-PHI, -2, 1 + 2 * PHI],
  [PHI, -2, -(1 + 2 * PHI)],
  [-PHI, -2, -(1 + 2 * PHI)],
  [1, 2 + PHI, 2 * PHI],
  [1, 2 + PHI, -2 * PHI],
  [1, -(2 + PHI), 2 * PHI],
  [-1, 2 + PHI, 2 * PHI],
  [1, -(2 + PHI), -2 * PHI],
  [-1, 2 + PHI, -2 * PHI],
  [-1, -(2 + PHI), 2 * PHI],
  [-1, -(2 + PHI), -2 * PHI],
  [2 + PHI, 2 * PHI, 1],
  [2 + PHI, -2 * PHI, 1],
  [-(2 + PHI), 2 * PHI, 1],
  [2 + PHI, 2 * PHI, -1],
  [-(2 + PHI), -2 * PHI, 1],
  [2 + PHI, -2 * PHI, -1],
  [-(2 + PHI), 2 * PHI, -1],
  [-(2 + PHI), -2 * PHI, -1],
  [2 * PHI, 1, 2 + PHI],
  [-2 * PHI, 1, 2 + PHI],
  [2 * PHI, 1, -(2 + PHI)],
  [2 * PHI, -1, 2 + PHI],
  [-2 * PHI, 1, -(2 + PHI)],
  [-2 * PHI, -1, 2 + PHI],
  [2 * PHI, -1, -(2 + PHI)],
  [-2 * PHI, -1, -(2 + PHI)],
];

const REFERENCE_PENTAGONS = [
  [0, 28, 36, 39, 29],
  [1, 32, 41, 37, 30],
  [2, 33, 42, 38, 31],
  [3, 34, 40, 43, 35],
  [4, 12, 44, 47, 13],
  [5, 16, 49, 45, 14],
  [6, 17, 50, 46, 15],
  [7, 18, 48, 51, 19],
  [8, 20, 52, 55, 21],
  [9, 24, 57, 53, 22],
  [10, 25, 58, 54, 23],
  [11, 26, 56, 59, 27],
];

const RAW_VERTICES = [
  [0, -1, -PHI],
  [0, -1, PHI],
  [0, 1, -PHI],
  [0, 1, PHI],
  [-1, -PHI, 0],
  [-1, PHI, 0],
  [1, -PHI, 0],
  [1, PHI, 0],
  [-PHI, 0, -1],
  [PHI, 0, -1],
  [-PHI, 0, 1],
  [PHI, 0, 1],
];

const normalize = ([x, y, z]) => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};

const dot = (left, right) => left.reduce((total, value, index) => total + value * right[index], 0);

const cross = ([ax, ay, az], [bx, by, bz]) => [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx,
];

const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));

const VERTICES = RAW_VERTICES.map(normalize);
const EDGE_LENGTH = Math.min(
  ...VERTICES.flatMap((vertex, index) =>
    VERTICES.slice(index + 1).map((otherVertex) => distance(vertex, otherVertex)),
  ),
);

export function getPentagonDirections() {
  return VERTICES;
}

export function getReferenceFootballGeometry() {
  const vertices = REFERENCE_VERTICES.map(normalize);
  const edgeLength = Math.min(
    ...vertices.flatMap((vertex, index) =>
      vertices.slice(index + 1).map((otherVertex) => distance(vertex, otherVertex)),
    ),
  );
  const edges = [];

  vertices.forEach((vertex, first) => {
    vertices.slice(first + 1).forEach((otherVertex, offset) => {
      if (distance(vertex, otherVertex) < edgeLength + 0.0001) {
        edges.push([first, first + offset + 1]);
      }
    });
  });

  return {
    vertices,
    edges,
    pentagons: REFERENCE_PENTAGONS.map((face) => [...face]),
  };
}

export function getFootballPanelUVs() {
  return getPentagonDirections().map((direction) => {
    const [x, y, z] = direction;
    return {
      u: 0.5 + Math.atan2(z, x) / (Math.PI * 2),
      v: 0.5 - Math.asin(y) / Math.PI,
      direction,
    };
  });
}

export function getFootballPanels() {
  const connected = (left, right) => distance(VERTICES[left], VERTICES[right]) < EDGE_LENGTH + 0.0001;
  const neighbors = VERTICES.map((_, vertexIndex) =>
    VERTICES.map((__, index) => index).filter((index) => index !== vertexIndex && connected(vertexIndex, index)),
  );
  const truncate = (from, to) =>
    normalize(VERTICES[from].map((value, axis) => value * 2 + VERTICES[to][axis]));

  const pentagons = neighbors.map((neighborIndices, vertexIndex) => {
    const normal = VERTICES[vertexIndex];
    const reference = normalize(cross(normal, Math.abs(normal[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0]));
    const tangent = cross(normal, reference);
    const sortedNeighbors = [...neighborIndices].sort((left, right) => {
      const leftDirection = VERTICES[left];
      const rightDirection = VERTICES[right];
      return (
        Math.atan2(dot(leftDirection, tangent), dot(leftDirection, reference)) -
        Math.atan2(dot(rightDirection, tangent), dot(rightDirection, reference))
      );
    });

    return {
      type: "pentagon",
      points: sortedNeighbors.map((neighbor) => truncate(vertexIndex, neighbor)),
    };
  });

  const faces = [];
  for (let first = 0; first < VERTICES.length; first += 1) {
    for (let second = first + 1; second < VERTICES.length; second += 1) {
      for (let third = second + 1; third < VERTICES.length; third += 1) {
        if (connected(first, second) && connected(second, third) && connected(third, first)) {
          faces.push([first, second, third]);
        }
      }
    }
  }

  const hexagons = faces.map(([first, second, third]) => ({
    type: "hexagon",
    points: [
      truncate(first, second),
      truncate(second, first),
      truncate(second, third),
      truncate(third, second),
      truncate(third, first),
      truncate(first, third),
    ],
  }));

  return [...hexagons, ...pentagons];
}
