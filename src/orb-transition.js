const clamp = (value) => Math.min(1, Math.max(0, value));

const smoothstep = (value) => value * value * (3 - 2 * value);

export function getOrbTransition(progress) {
  const morph = smoothstep(clamp(progress / 0.45));
  const entrance = smoothstep(clamp(progress / 0.68));
  const exit = smoothstep(clamp((progress - 0.48) / 0.32));

  return {
    footballOpacity: 1 - morph,
    earthOpacity: morph,
    scale: 1 + entrance * 0.95,
    x: progress * 5.5,
    y: entrance * 0.12 + exit * 0.15,
    spin: entrance * Math.PI * 3,
    ringOpacity: 0.08 + (1 - morph) * 0.92,
    glowOpacity: morph * 0.42,
  };
}
