const clamp = (value) => Math.min(1, Math.max(-1, value));

export function getPointerOrbit(clientX, clientY, width, height) {
  const normalizedX = clamp((clientX / width - 0.5) * 2);
  const normalizedY = clamp((clientY / height - 0.5) * 2);

  return {
    x: normalizedY === 0 ? 0 : normalizedY * -0.04,
    y: normalizedX === 0 ? 0 : normalizedX * 0.055,
  };
}
