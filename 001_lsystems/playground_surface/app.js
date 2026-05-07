import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#surfaceCanvas");

const controls = {
  n: document.querySelector("#n"),
  octaves: document.querySelector("#octaves"),
  amp: document.querySelector("#amp"),
  decay: document.querySelector("#decay"),
  heightScale: document.querySelector("#heightScale"),
  warp: document.querySelector("#warp"),
  baseFreq: document.querySelector("#baseFreq"),
  phaseU: document.querySelector("#phaseU"),
  phaseV: document.querySelector("#phaseV"),
  phaseDrift: document.querySelector("#phaseDrift"),
  scanFps: document.querySelector("#scanFps"),
  scanN: document.querySelector("#scanN"),
  autoRotate: document.querySelector("#autoRotate"),
  scan: document.querySelector("#scan"),
};

const outputs = {
  n: document.querySelector("#nValue"),
  octaves: document.querySelector("#octavesValue"),
  amp: document.querySelector("#ampValue"),
  decay: document.querySelector("#decayValue"),
  heightScale: document.querySelector("#heightValue"),
  warp: document.querySelector("#warpValue"),
  baseFreq: document.querySelector("#freqValue"),
  phaseU: document.querySelector("#phaseUValue"),
  phaseV: document.querySelector("#phaseVValue"),
  phaseDrift: document.querySelector("#phaseDriftValue"),
  scanFps: document.querySelector("#scanFpsValue"),
  scanN: document.querySelector("#scanNValue"),
  vertexCount: document.querySelector("#vertexCount"),
  faceCount: document.querySelector("#faceCount"),
  statusPanel: document.querySelector("#statusPanel"),
};

const buttons = {
  reset: document.querySelector("#reset"),
  randomize: document.querySelector("#randomize"),
  exportObj: document.querySelector("#exportObj"),
};

const defaults = {
  n: 160,
  octaves: 9,
  amp: 0.55,
  decay: 0.52,
  heightScale: 1,
  warp: 1,
  baseFreq: 1,
  phaseU: 0,
  phaseV: 0,
  phaseDrift: 0,
  scanFps: 12,
  scanN: 96,
};

let viewMode = "solid";
let scanPhase = 0;
let lastScanBuild = 0;
let scanBaseN = defaults.n;
let pendingBuild = false;
let cameraWasFit = false;
let surfaceObject = null;
let wireObject = null;
let currentSurface = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7fafb);

const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 500);
camera.position.set(6, -8, 5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 0, 0.15);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0ad, 2.1));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(5, -6, 8);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x7ec7ff, 1.8);
rimLight.position.set(-6, 4, 5);
scene.add(rimLight);

const solidMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x87d8ff,
  roughness: 0.38,
  metalness: 0.0,
  transmission: 0.22,
  thickness: 0.45,
  transparent: true,
  opacity: 0.82,
  side: THREE.DoubleSide,
});

const ghostMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x87d8ff,
  roughness: 0.25,
  transmission: 0.38,
  thickness: 0.6,
  transparent: true,
  opacity: 0.48,
  side: THREE.DoubleSide,
});

const wireMaterial = new THREE.LineBasicMaterial({
  color: 0x246070,
  transparent: true,
  opacity: 0.32,
});

function readSettings() {
  return {
    n: Number(controls.n.value),
    octaves: Number(controls.octaves.value),
    amp: Number(controls.amp.value),
    decay: Number(controls.decay.value),
    heightScale: Number(controls.heightScale.value),
    warp: Number(controls.warp.value),
    baseFreq: Number(controls.baseFreq.value),
    phaseU: Number(controls.phaseU.value),
    phaseV: Number(controls.phaseV.value),
    phaseDrift: Number(controls.phaseDrift.value),
    scanFps: Number(controls.scanFps.value),
    scanN: Number(controls.scanN.value),
    autoRotate: controls.autoRotate.checked,
    scan: controls.scan.checked,
  };
}

function syncOutputs(settings) {
  outputs.n.value = String(settings.n);
  outputs.octaves.value = String(settings.octaves);
  outputs.amp.value = settings.amp.toFixed(2);
  outputs.decay.value = settings.decay.toFixed(2);
  outputs.heightScale.value = settings.heightScale.toFixed(2);
  outputs.warp.value = settings.warp.toFixed(2);
  outputs.baseFreq.value = settings.baseFreq.toFixed(2);
  outputs.phaseU.value = settings.phaseU.toFixed(2);
  outputs.phaseV.value = settings.phaseV.toFixed(2);
  outputs.phaseDrift.value = settings.phaseDrift.toFixed(3);
  outputs.scanFps.value = String(settings.scanFps);
  outputs.scanN.value = String(settings.scanN);
}

function height(u, v, settings) {
  let z = 0;
  let amp = settings.amp;
  let freq = settings.baseFreq;
  const phaseU = settings.phaseU + scanPhase * settings.phaseDrift;
  const phaseV = settings.phaseV - scanPhase * settings.phaseDrift * 0.73;

  for (let k = 0; k < settings.octaves; k += 1) {
    z += amp * Math.sin(freq * Math.PI * (u + 0.35 * Math.sin(2 * Math.PI * v + phaseV)) + phaseU);
    z += amp * 0.55 * Math.cos(freq * Math.PI * (v - 0.25 * Math.sin(2 * Math.PI * u + phaseU)) + phaseV);
    z += amp * 0.35 * Math.sin(freq * Math.PI * (u + v) + phaseU - phaseV);
    amp *= settings.decay;
    freq *= 2;
  }

  return z * settings.heightScale;
}

function warp(u, v, settings) {
  const x = (u - 0.5) * 5;
  const y = (v - 0.5) * 5;
  const r = Math.sqrt(x * x + y * y);
  const theta = settings.warp * 0.45 * Math.sin(1.2 * r);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);

  return [
    ct * x - st * y + settings.warp * 0.25 * Math.sin(2 * Math.PI * v),
    st * x + ct * y + settings.warp * 0.25 * Math.sin(2 * Math.PI * u),
  ];
}

function buildSurface(settings) {
  const n = settings.n;
  const positions = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();

  for (let j = 0; j <= n; j += 1) {
    const v = j / n;
    for (let i = 0; i <= n; i += 1) {
      const u = i / n;
      const [x, y] = warp(u, v, settings);
      const z = height(u, v, settings);
      positions.push(x, y, z);

      const shade = THREE.MathUtils.clamp((z + 2.5) / 5, 0, 1);
      color.setHSL(0.55, 0.82, 0.58 + shade * 0.18);
      colors.push(color.r, color.g, color.b);
    }
  }

  const gridIndex = (i, j) => j * (n + 1) + i;

  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = gridIndex(i, j);
      const b = gridIndex(i + 1, j);
      const c = gridIndex(i + 1, j + 1);
      const d = gridIndex(i, j + 1);
      indices.push(a, b, c, a, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return {
    geometry,
    positions,
    n,
    vertexCount: (n + 1) * (n + 1),
    faceCount: n * n,
  };
}

function replaceSurface(settings, options = {}) {
  const shouldFitCamera = options.fitCamera || !cameraWasFit;
  outputs.statusPanel.classList.remove("is-ready", "is-error");
  outputs.statusPanel.textContent = "Building coherent surface...";
  syncOutputs(settings);
  currentSurface = buildSurface(settings);

  if (surfaceObject) {
    scene.remove(surfaceObject);
    surfaceObject.geometry.dispose();
  }

  if (wireObject) {
    scene.remove(wireObject);
    wireObject.geometry.dispose();
  }

  const material = viewMode === "ghost" ? ghostMaterial : solidMaterial;
  surfaceObject = new THREE.Mesh(currentSurface.geometry, material);
  surfaceObject.castShadow = true;
  surfaceObject.receiveShadow = true;
  surfaceObject.visible = viewMode !== "wire";
  scene.add(surfaceObject);

  wireObject = new THREE.LineSegments(new THREE.WireframeGeometry(currentSurface.geometry), wireMaterial);
  wireObject.visible = viewMode !== "solid";
  scene.add(wireObject);

  outputs.vertexCount.textContent = currentSurface.vertexCount.toLocaleString();
  outputs.faceCount.textContent = currentSurface.faceCount.toLocaleString();
  if (shouldFitCamera) {
    fitCamera(currentSurface.geometry);
    cameraWasFit = true;
  }
  outputs.statusPanel.classList.add("is-ready");
}

function fitCamera(geometry) {
  const box = geometry.boundingBox;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.5, 1);
  const distance = radius / Math.sin((camera.fov * Math.PI / 180) * 0.5);
  const direction = new THREE.Vector3(0.9, -1.25, 0.78).normalize();

  orbit.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance * 0.95);
  camera.near = Math.max(0.01, radius / 800);
  camera.far = radius * 80;
  camera.updateProjectionMatrix();
  orbit.update();
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = renderer.getPixelRatio();

  if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
}

function renderFrame() {
  resizeRenderer();

  if (controls.scan.checked) {
    const now = performance.now();
    const settings = readSettings();
    const frameMs = 1000 / Math.max(1, settings.scanFps);

    if (now - lastScanBuild >= frameMs) {
      scanPhase += 0.06;
      controls.amp.value = (0.55 + Math.sin(scanPhase * 0.7) * 0.25).toFixed(2);
      controls.decay.value = (0.52 + Math.cos(scanPhase * 0.47) * 0.16).toFixed(2);
      controls.warp.value = (1 + Math.sin(scanPhase * 0.33) * 0.7).toFixed(2);
      controls.baseFreq.value = (1 + Math.cos(scanPhase * 0.29) * 0.55).toFixed(2);
      replaceSurface({ ...readSettings(), n: Math.min(scanBaseN, settings.scanN) }, { fitCamera: false });
      lastScanBuild = now;
    }
  }

  if (controls.autoRotate.checked && surfaceObject) {
    surfaceObject.rotation.z += 0.0025;
    wireObject.rotation.z = surfaceObject.rotation.z;
  }

  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderFrame);
}

function reset() {
  for (const [key, value] of Object.entries(defaults)) {
    controls[key].value = value;
  }
  controls.autoRotate.checked = true;
  controls.scan.checked = false;
  viewMode = "solid";
  scanPhase = 0;
  cameraWasFit = false;
  document.querySelector('input[name="viewMode"][value="solid"]').checked = true;
  replaceSurface(readSettings(), { fitCamera: true });
}

function randomize() {
  controls.n.value = String(96 + Math.floor(Math.random() * 29) * 4);
  controls.octaves.value = String(5 + Math.floor(Math.random() * 7));
  controls.amp.value = (0.25 + Math.random() * 0.85).toFixed(2);
  controls.decay.value = (0.32 + Math.random() * 0.38).toFixed(2);
  controls.heightScale.value = (0.55 + Math.random() * 1.75).toFixed(2);
  controls.warp.value = (0.25 + Math.random() * 1.85).toFixed(2);
  controls.baseFreq.value = (0.55 + Math.random() * 2.4).toFixed(2);
  controls.phaseU.value = (-Math.PI + Math.random() * Math.PI * 2).toFixed(2);
  controls.phaseV.value = (-Math.PI + Math.random() * Math.PI * 2).toFixed(2);
  replaceSurface(readSettings(), { fitCamera: true });
}

function exportObj() {
  if (!currentSurface) {
    return;
  }

  const { positions, n } = currentSurface;
  const lines = [
    "# Coherent numeric subdivision surface",
    "# Connectivity follows uv-grid adjacency, not binary leaf order.",
    "o numeric_subdivision_surface_live",
  ];

  for (let i = 0; i < positions.length; i += 3) {
    lines.push(`v ${positions[i].toFixed(8)} ${positions[i + 1].toFixed(8)} ${positions[i + 2].toFixed(8)}`);
  }

  const idx = (i, j) => j * (n + 1) + i + 1;
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      lines.push(`f ${idx(i, j)} ${idx(i + 1, j)} ${idx(i + 1, j + 1)} ${idx(i, j + 1)}`);
    }
  }

  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "numeric-subdivision-surface.obj";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

for (const input of Object.values(controls)) {
  input.addEventListener("input", () => {
    if (input === controls.autoRotate) {
      return;
    }

    if (input === controls.scan) {
      if (controls.scan.checked) {
        scanBaseN = Number(controls.n.value);
        lastScanBuild = 0;
      } else {
        replaceSurface(readSettings(), { fitCamera: false });
      }
      return;
    }

    if (input === controls.scanFps || input === controls.scanN) {
      syncOutputs(readSettings());
      return;
    }

    if (pendingBuild) {
      return;
    }

    pendingBuild = true;
    requestAnimationFrame(() => {
      pendingBuild = false;
      replaceSurface(readSettings(), { fitCamera: false });
    });
  });
}

for (const radio of document.querySelectorAll('input[name="viewMode"]')) {
  radio.addEventListener("change", (event) => {
    viewMode = event.target.value;
    replaceSurface(readSettings(), { fitCamera: false });
  });
}

buttons.reset.addEventListener("click", reset);
buttons.randomize.addEventListener("click", randomize);
buttons.exportObj.addEventListener("click", exportObj);
window.addEventListener("resize", resizeRenderer);

reset();
renderFrame();
