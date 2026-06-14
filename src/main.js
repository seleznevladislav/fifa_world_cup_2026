import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import { HOSTS, getCountdown } from "./data.js";
import { LOADER_GATES } from "./loader.js";
import {
  MATCH,
  PLAYERS,
  fetchNearestMatch,
  formatMatchDateTime,
  getBallPassRoute,
  getMatchStatus,
} from "./match.js";
import { getOrbTransition } from "./orb-transition.js";
import { getPointerOrbit } from "./pointer-orbit.js";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finalDate = new Date("2026-07-19T19:00:00-04:00");

function renderHosts() {
  const hostGrid = document.querySelector("[data-hosts]");

  hostGrid.innerHTML = HOSTS.map(
    ({ code, country, index, color, cities, note }) => `
      <article class="host-card" style="--card-color: ${color}">
        <div class="host-card__top">
          <span>${index} / ${code}</span>
          <span>${cities.length.toString().padStart(2, "0")} cities</span>
        </div>
        <div class="host-card__ball"></div>
        <div class="host-card__main">
          <strong>${code}</strong>
          <p>${cities.join(" · ")}</p>
        </div>
        <div class="host-card__bottom">
          <span>${country}</span>
          <span>${note}</span>
        </div>
      </article>
    `,
  ).join("");
}

function renderLoader() {
  document.querySelector("[data-loader-gates]").innerHTML = LOADER_GATES.map(
    ({ color, side, outer, inner }, index) => `
      <span
        class="gate gate--${color} gate--${side}"
        data-side="${side}"
        style="
          --gate-index:${index};
          --outer-top:${outer[0]}%;
          --outer-mid:${outer[1]}%;
          --outer-bottom:${outer[2]}%;
          --inner-top:${inner[0]}%;
          --inner-mid:${inner[1]}%;
          --inner-bottom:${inner[2]}%;
        "
      ><i></i></span>
    `,
  ).join("");
}

function updateCountdown() {
  const values = getCountdown(new Date(), finalDate);

  Object.entries(values).forEach(([unit, value]) => {
    document.querySelector(`[data-time="${unit}"]`).textContent = value;
  });
}

function setupMatchday() {
  const playerLayer = document.querySelector("[data-players]");
  const ball = document.querySelector(".field-card__ball");
  const statusElement = document.querySelector("[data-match-status]");
  const timeElement = document.querySelector("[data-match-time]");
  const dateElement = document.querySelector("[data-match-date]");
  const venueElement = document.querySelector("[data-match-venue]");
  const versusElement = document.querySelector("[data-match-versus]");
  const homeLogo = document.querySelector("[data-home-logo]");
  const awayLogo = document.querySelector("[data-away-logo]");
  const homeCode = document.querySelector("[data-home-code]");
  const awayCode = document.querySelector("[data-away-code]");
  let activeMatch = MATCH;

  playerLayer.innerHTML = PLAYERS.map(
    ({ team, number, x, y }) =>
      `<span class="pitch-player pitch-player--${team}" style="--x:${x}%;--y:${y}%"><b>${number}</b></span>`,
  ).join("");
  playerLayer.append(ball);

  const renderMatch = (match) => {
    activeMatch = match;
    const dateTime = formatMatchDateTime(match.kickoff);
    homeLogo.src = match.home.logo;
    homeLogo.alt = match.home.name;
    awayLogo.src = match.away.logo;
    awayLogo.alt = match.away.name;
    homeCode.textContent = match.home.code;
    awayCode.textContent = match.away.code;
    dateElement.textContent = dateTime.date;
    dateElement.dateTime = match.kickoff.toISOString();
    venueElement.textContent = `${match.group} · ${match.venue}`;
    versusElement.textContent =
      match.state === "pre" ? "V" : `${match.home.score ?? "0"} — ${match.away.score ?? "0"}`;
    updateStatus();
  };

  const updateStatus = () => {
    const status = getMatchStatus(
      new Date(),
      activeMatch.kickoff,
      activeMatch.state,
      activeMatch.statusDetail,
    );
    const dateTime = formatMatchDateTime(activeMatch.kickoff);
    statusElement.textContent = status.label;
    timeElement.textContent = status.label === "NEXT MATCH" ? dateTime.time : status.detail;
    statusElement.closest(".field-card__status").classList.toggle("is-live", status.label === "LIVE");
  };

  const refreshMatch = async () => {
    try {
      const nearestMatch = await fetchNearestMatch();
      if (nearestMatch) renderMatch(nearestMatch);
    } catch {
      renderMatch(activeMatch);
    }
  };

  renderMatch(MATCH);
  refreshMatch();
  setInterval(updateStatus, 30000);
  setInterval(refreshMatch, 300000);

  if (reducedMotion) return;

  document.querySelectorAll(".pitch-player").forEach((player, index) => {
    const driftX = index % 2 === 0 ? 20 : -20;
    const driftY = (index % 5 - 2) * 7;
    gsap.to(player, {
      x: driftX,
      y: driftY,
      duration: 2.2 + (index % 6) * 0.28,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: (index % 4) * -0.4,
    });
  });

  const passRoute = getBallPassRoute();
  const passTimeline = gsap.timeline({ repeat: -1 });
  gsap.set(ball, { left: `${passRoute[0].x}%`, top: `${passRoute[0].y}%`, xPercent: -50, yPercent: -50 });

  [...passRoute.slice(1), passRoute[0]].forEach((player, index) => {
    passTimeline
      .to(ball, {
        left: `${player.x}%`,
        top: `${player.y}%`,
        rotation: `+=${180 + (index % 3) * 90}`,
        duration: 0.62 + (index % 4) * 0.08,
        ease: "power2.inOut",
      })
      .to(ball, { scale: 1.22, duration: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" });
  });
}

function setupCursor() {
  const cursor = document.querySelector(".cursor");
  const interactive = document.querySelectorAll("a, .host-card");

  window.addEventListener("pointermove", ({ clientX, clientY }) => {
    gsap.to(cursor, { x: clientX, y: clientY, duration: 0.35, ease: "power3.out" });
  });

  document.body.addEventListener("pointerenter", () => {
    gsap.to(cursor, { scale: 0.25, duration: 0.3 });
  });

  document.body.addEventListener("pointerleave", () => {
    gsap.to(cursor, { scale: 0, duration: 0.3 });
  });

  interactive.forEach((element) => {
    element.addEventListener("pointerenter", () => {
      gsap.to(cursor, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    });
    element.addEventListener("pointerleave", () => {
      gsap.to(cursor, { scale: 0.25, duration: 0.25 });
    });
  });

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", ({ clientX, clientY }) => {
      const bounds = element.getBoundingClientRect();
      gsap.to(element, {
        x: (clientX - bounds.left - bounds.width / 2) * 0.2,
        y: (clientY - bounds.top - bounds.height / 2) * 0.2,
        duration: 0.3,
      });
    });
    element.addEventListener("pointerleave", () => {
      gsap.to(element, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, .35)" });
    });
  });
}

function setupThreeScene() {
  const canvas = document.querySelector("#world-canvas");
  const stage = document.querySelector(".stage");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const group = new THREE.Group();
  const pointerPivot = new THREE.Group();
  const orbVisual = new THREE.Group();
  const pointer = { x: 0, y: 0 };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  camera.position.z = 8;

  const football = new THREE.Group();
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const textureContext = textureCanvas.getContext("2d");
  const textureData = textureContext.createImageData(512, 512);
  for (let index = 0; index < textureData.data.length; index += 4) {
    const shade = 218 + Math.random() * 26;
    textureData.data[index] = shade;
    textureData.data[index + 1] = shade;
    textureData.data[index + 2] = shade;
    textureData.data[index + 3] = 255;
  }
  textureContext.putImageData(textureData, 0, 0);
  textureContext.fillStyle = "rgba(95, 95, 95, .22)";
  for (let index = 0; index < 750; index += 1) {
    textureContext.beginPath();
    textureContext.arc(
      Math.random() * textureCanvas.width,
      Math.random() * textureCanvas.height,
      0.5 + Math.random() * 1.25,
      0,
      Math.PI * 2,
    );
    textureContext.fill();
  }
  const leatherTexture = new THREE.CanvasTexture(textureCanvas);
  leatherTexture.wrapS = THREE.RepeatWrapping;
  leatherTexture.wrapT = THREE.RepeatWrapping;
  leatherTexture.repeat.set(5, 5);

  const textureLoader = new THREE.TextureLoader();
  const triondaTexture = textureLoader.load("/textures/trionda-hero-1024.webp");
  triondaTexture.colorSpace = THREE.SRGBColorSpace;
  triondaTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const footballMaterials = [];
  const heroBallMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: triondaTexture,
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.24,
    clearcoatRoughness: 0.42,
    specularIntensity: 0.62,
    specularColor: new THREE.Color(0xffffff),
    bumpMap: leatherTexture,
    bumpScale: 0.014,
    roughnessMap: leatherTexture,
    transparent: true,
    depthWrite: false,
  });
  footballMaterials.push(heroBallMaterial);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 96, 96),
    heroBallMaterial,
  );
  orbVisual.add(core);

  const earthTexture = textureLoader.load("/textures/earth-atmos-2048.jpg");
  const earthNormalMap = textureLoader.load("/textures/earth-normal-2048.jpg");
  const earthSpecularMap = textureLoader.load("/textures/earth-specular-2048.jpg");
  const cloudTexture = textureLoader.load("/textures/earth-clouds-1024.png");
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    normalMap: earthNormalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    specularMap: earthSpecularMap,
    specular: new THREE.Color(0x476a91),
    shininess: 18,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.462, 96, 96), earthMaterial);
  earth.visible = false;
  orbVisual.add(earth);

  const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    alphaMap: cloudTexture,
    color: 0xffffff,
    shininess: 4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.505, 96, 96), cloudMaterial);
  clouds.visible = false;
  orbVisual.add(clouds);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      dayColor: { value: new THREE.Color(0x4db2ff) },
      twilightColor: { value: new THREE.Color(0xbc490b) },
      sunDirection: { value: new THREE.Vector3(-3, 5, 6).normalize() },
      glowStrength: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * vec4(vPosition, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 dayColor;
      uniform vec3 twilightColor;
      uniform vec3 sunDirection;
      uniform float glowStrength;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = 1.0 - abs(dot(viewDirection, normal));
        float rim = pow(smoothstep(0.62, 0.98, fresnel), 2.2);
        float sunOrientation = dot(normal, normalize(sunDirection));
        float daylight = mix(0.16, 1.0, smoothstep(-0.4, 0.35, sunOrientation));
        vec3 atmosphereColor = mix(
          twilightColor,
          dayColor,
          smoothstep(-0.18, 0.62, sunOrientation)
        );
        gl_FragColor = vec4(atmosphereColor, rim * daylight * glowStrength);
      }
    `,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.528, 96, 96), atmosphereMaterial);
  atmosphere.visible = false;
  orbVisual.add(atmosphere);

  football.rotation.set(-0.32, -0.16, -0.1);
  football.scale.setScalar(0.9);
  football.position.set(0.3, -0.08, 0);
  pointerPivot.add(orbVisual);
  football.add(pointerPivot);
  group.add(football);

  const rings = [1.9, 2.25, 2.65].map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.0055 + index * 0.0018, 16, 220),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0x9fd14a : 0xaeb9d8,
        transparent: true,
        opacity: index === 1 ? 0.38 : 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / (2.8 + index * 0.3);
    ring.rotation.y = index * 0.6;
    ring.userData.baseOpacity = index === 1 ? 0.38 : 0.12;
    group.add(ring);
    return ring;
  });

  // Soft round star sprite so points read as glowing specks, not squares.
  const starCanvas = document.createElement("canvas");
  starCanvas.width = 64;
  starCanvas.height = 64;
  const starContext = starCanvas.getContext("2d");
  const starGradient = starContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  starGradient.addColorStop(0, "rgba(255,255,255,1)");
  starGradient.addColorStop(0.18, "rgba(255,255,255,0.85)");
  starGradient.addColorStop(0.45, "rgba(255,255,255,0.22)");
  starGradient.addColorStop(1, "rgba(255,255,255,0)");
  starContext.fillStyle = starGradient;
  starContext.fillRect(0, 0, 64, 64);
  const starTexture = new THREE.CanvasTexture(starCanvas);
  starTexture.colorSpace = THREE.SRGBColorSpace;

  const buildStars = (count, min, max, depth, size, opacity) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tint = new THREE.Color();
    for (let index = 0; index < count; index += 1) {
      const radius = min + Math.random() * (max - min);
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * depth;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      const roll = Math.random();
      if (roll > 0.94) tint.setHSL(0.6, 0.45, 0.82);
      else if (roll > 0.86) tint.setHSL(0.08, 0.45, 0.82);
      else tint.setHSL(0, 0, 0.72 + Math.random() * 0.28);
      const brightness = 0.45 + Math.random() * 0.55;
      colors[index * 3] = tint.r * brightness;
      colors[index * 3 + 1] = tint.g * brightness;
      colors[index * 3 + 2] = tint.b * brightness;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: starTexture,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    group.add(points);
    return points;
  };

  // Two depth layers: dense faint distant stars + a few brighter near ones.
  const starsFar = buildStars(280, 3.2, 6.6, 6.5, 0.045, 0.75);
  const starsNear = buildStars(70, 3.4, 6, 5.5, 0.1, 0.95);
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xdde4ff, 1.8));
  const keyLight = new THREE.DirectionalLight(0xfff4cf, 4.2);
  keyLight.position.set(-3, 5, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x6175ff, 2.6);
  fillLight.position.set(4, -2, 4);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xbdf339, 8, 12);
  rimLight.position.set(3.5, 2, 2);
  scene.add(rimLight);
  const leatherLight = new THREE.PointLight(0xffffff, 5, 8);
  leatherLight.position.set(-1.5, -2.8, 4);
  scene.add(leatherLight);

  let baseX = 0;
  let baseY = 0;
  let exitOffset = 0;
  const positionFootball = () => {
    const mobileScale = window.innerWidth < 700 ? 0.82 : 1;
    football.position.set(
      0.3 + (baseX + exitOffset) * mobileScale,
      -0.08 + baseY,
      0,
    );
  };

  const applyTransition = (progress) => {
    const transition = getOrbTransition(progress);
    const mobileScale = window.innerWidth < 700 ? 0.82 : 1;
    footballMaterials.forEach((material) => {
      material.opacity = transition.footballOpacity;
    });
    earthMaterial.opacity = transition.earthOpacity;
    cloudMaterial.opacity = transition.earthOpacity * 0.42;
    atmosphereMaterial.uniforms.glowStrength.value = transition.glowOpacity;
    earth.visible = transition.earthOpacity > 0.001;
    clouds.visible = transition.earthOpacity > 0.001;
    atmosphere.visible = transition.earthOpacity > 0.001;
    football.scale.setScalar(0.9 * transition.scale * mobileScale);
    baseX = transition.x;
    baseY = transition.y;
    positionFootball();
    football.userData.scrollSpin = -0.1 + transition.spin;
    rings.forEach((ring) => {
      ring.material.opacity = ring.userData.baseOpacity * transition.ringOpacity;
    });
  };

  // Continue the planet's drift fully off the right edge through the
  // second half of the manifesto section.
  const applyExit = (progress) => {
    exitOffset = progress * 4.5;
    positionFootball();
  };
  applyTransition(0);

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    group.scale.setScalar(width < 700 ? 0.7 : 1);
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", ({ clientX, clientY }) => {
    Object.assign(pointer, getPointerOrbit(clientX, clientY, window.innerWidth, window.innerHeight));
  });
  resize();

  let elapsed = 0;
  const tick = () => {
    elapsed += 0.006;
    pointerPivot.rotation.x += (pointer.x - pointerPivot.rotation.x) * 0.018;
    pointerPivot.rotation.y += (pointer.y - pointerPivot.rotation.y) * 0.018;
    orbVisual.rotation.y += 0.00085;
    football.rotation.z +=
      ((football.userData.scrollSpin ?? 0) - football.rotation.z) * 0.028;
    orbVisual.rotation.x += 0.00018;
    clouds.rotation.y += 0.00042;
    starsFar.rotation.y -= 0.0005;
    starsNear.rotation.y -= 0.0009;
    group.position.y = Math.sin(elapsed) * 0.1;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  if (reducedMotion) {
    renderer.render(scene, camera);
    setTimeout(() => renderer.render(scene, camera), 100);
  } else {
    tick();
  }

  return { group, applyTransition, applyExit };
}

function setupLoader() {
  const progress = { value: 0 };
  const progressElement = document.querySelector(".loader__progress");

  if (reducedMotion) return;

  document.body.style.overflow = "hidden";
  const timeline = gsap.timeline({
    onComplete: () => {
      document.body.style.overflow = "";
      document.querySelector(".loader").remove();
    },
  });

  timeline
    .to(progress, {
      value: 100,
      duration: 2.15,
      ease: "power2.inOut",
      onUpdate: () => {
        progressElement.textContent = Math.round(progress.value).toString().padStart(2, "0");
      },
    })
    .to(".loader__mark", { scale: 1.25, opacity: 0, duration: 0.45, ease: "power3.in" }, "-=.35")
    .to(".loader__bottom", { opacity: 0, y: 15, duration: 0.25 }, "<")
    .to(".gate", {
      xPercent: (_, gate) => (gate.dataset.side === "left" ? -105 : 105),
      duration: 1.25,
      stagger: { each: 0.06, from: "center" },
      ease: "power4.inOut",
    })
    .to(".loader", { opacity: 0, duration: 0.25 }, "-=.25")
    .from(".title-line span", { yPercent: 110, duration: 1.15, stagger: 0.12, ease: "power4.out" }, "-=.45")
    .from(".reveal-up", { y: 25, opacity: 0, duration: 0.75, stagger: 0.12, ease: "power3.out" }, "-=.85");
}

function setupScrollAnimations(threeScene) {
  if (reducedMotion) return;

  const orbMorph = { progress: 0 };
  gsap.to(orbMorph, {
    progress: 1,
    ease: "none",
    onUpdate: () => threeScene.applyTransition(orbMorph.progress),
    scrollTrigger: {
      trigger: ".hero",
      endTrigger: ".manifesto",
      start: "top top",
      end: "24% top",
      scrub: 0.7,
    },
  });
  const orbExit = { progress: 0 };
  gsap.to(orbExit, {
    progress: 1,
    ease: "none",
    onUpdate: () => threeScene.applyExit(orbExit.progress),
    scrollTrigger: {
      trigger: ".manifesto",
      start: "24% top",
      end: "bottom top",
      scrub: 0.7,
    },
  });
  gsap.to(".hero__title", {
    yPercent: -25,
    opacity: 0,
    scrollTrigger: { trigger: ".hero", start: "35% top", end: "bottom top", scrub: 0.8 },
  });

  gsap.from(".manifesto__copy p", {
    x: -120,
    opacity: 0,
    stagger: 0.08,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".manifesto__copy", start: "top 82%" },
  });

  gsap.to(".pulse-orbit span", {
    scale: 1.65,
    opacity: 0,
    repeat: -1,
    duration: 1.8,
    ease: "power2.out",
  });
  gsap.to(".pulse-orbit", {
    rotation: 180,
    scrollTrigger: { trigger: ".manifesto", start: "top bottom", end: "bottom top", scrub: 1 },
  });

  gsap.from(".host-card", {
    y: 120,
    opacity: 0,
    stagger: 0.12,
    duration: 1,
    ease: "power4.out",
    scrollTrigger: { trigger: ".host-grid", start: "top 82%" },
  });

  gsap.to(".field-card", {
    rotation: -4,
    y: -30,
    scrollTrigger: { trigger: ".matchday", start: "top bottom", end: "bottom top", scrub: 1 },
  });
  gsap.from(".stat-card", {
    y: 180,
    scale: 0.85,
    opacity: 0,
    stagger: 0.15,
    duration: 1,
    ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".numbers__grid", start: "top 85%" },
  });

  gsap.from(".finale h2 span", {
    yPercent: 110,
    opacity: 0,
    stagger: 0.12,
    duration: 1.1,
    ease: "power4.out",
    scrollTrigger: { trigger: ".finale", start: "top 60%" },
  });
  gsap.to(".finale__rings span", {
    scale: 1.3,
    stagger: 0.08,
    scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: 1 },
  });
}

renderLoader();
renderHosts();
updateCountdown();
setupMatchday();
setInterval(updateCountdown, 1000);

const threeScene = setupThreeScene();
setupLoader();
setupScrollAnimations(threeScene);

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  setupCursor();
}
