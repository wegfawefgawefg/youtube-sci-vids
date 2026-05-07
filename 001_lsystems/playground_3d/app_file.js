const THREE = window.THREE;

const canvas = document.querySelector("#meshCanvas");

const controls = {
  depth: document.querySelector("#depth"),
  leftMul: document.querySelector("#leftMul"),
  rightMul: document.querySelector("#rightMul"),
  sineFreq: document.querySelector("#sineFreq"),
  spread: document.querySelector("#spread"),
  twist: document.querySelector("#twist"),
  curl: document.querySelector("#curl"),
  lengthScale: document.querySelector("#lengthScale"),
  radiusScale: document.querySelector("#radiusScale"),
  sides: document.querySelector("#sides"),
  leaves: document.querySelector("#leaves"),
  autoRotate: document.querySelector("#autoRotate"),
  scan: document.querySelector("#scan"),
};

const outputs = {
  depth: document.querySelector("#depthValue"),
  leftMul: document.querySelector("#leftValue"),
  rightMul: document.querySelector("#rightValue"),
  spread: document.querySelector("#spreadValue"),
  twist: document.querySelector("#twistValue"),
  curl: document.querySelector("#curlValue"),
  lengthScale: document.querySelector("#lengthValue"),
  radiusScale: document.querySelector("#radiusValue"),
  sides: document.querySelector("#sidesValue"),
  vertexCount: document.querySelector("#vertexCount"),
  faceCount: document.querySelector("#faceCount"),
  ruleText: document.querySelector("#ruleText"),
  formulaText: document.querySelector("#formulaText"),
  sineFreq: document.querySelector("#sineFreqValue"),
  statusPanel: document.querySelector("#statusPanel"),
};

const buttons = {
  reset: document.querySelector("#reset"),
  randomize: document.querySelector("#randomize"),
  exportObj: document.querySelector("#exportObj"),
};

const defaults = {
  depth: 9,
  leftMul: 0.66,
  rightMul: 0.52,
  sineFreq: 6.2,
  spread: 44,
  twist: 137,
  curl: 16,
  lengthScale: 4.6,
  radiusScale: 0.2,
  sides: 8,
};

let viewMode = "solid";
let ruleMode = "sine";
let scanPhase = 0;
let meshObject = null;
let leafObject = null;
let currentMeshData = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111416);

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
camera.position.set(9, 7, 11);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function createOrbitControls(camera, domElement) {
  const target = new THREE.Vector3(0, 3.2, 0);
  const spherical = new THREE.Spherical();
  const pointer = { active: false, x: 0, y: 0 };

  function readCamera() {
    spherical.setFromVector3(camera.position.clone().sub(target));
    spherical.radius = Math.max(0.25, spherical.radius);
  }

  function applyCamera() {
    spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi));
    spherical.radius = Math.max(0.35, Math.min(240, spherical.radius));
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
    camera.lookAt(target);
  }

  domElement.addEventListener("pointerdown", (event) => {
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    readCamera();
    domElement.setPointerCapture(event.pointerId);
  });

  domElement.addEventListener("pointermove", (event) => {
    if (!pointer.active) {
      return;
    }

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    spherical.theta -= dx * 0.006;
    spherical.phi -= dy * 0.006;
    applyCamera();
  });

  domElement.addEventListener("pointerup", (event) => {
    pointer.active = false;
    domElement.releasePointerCapture(event.pointerId);
  });

  domElement.addEventListener("wheel", (event) => {
    event.preventDefault();
    readCamera();
    spherical.radius *= event.deltaY > 0 ? 1.08 : 0.92;
    applyCamera();
  }, { passive: false });

  return {
    target,
    enableDamping: false,
    dampingFactor: 0,
    update() {
      camera.lookAt(target);
    },
  };
}

const orbit = createOrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 3.2, 0);

const hemiLight = new THREE.HemisphereLight(0xf5fff9, 0x25302d, 2.2);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
keyLight.position.set(7, 12, 9);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x89c7ff, 1.4);
rimLight.position.set(-7, 6, -9);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(10, 80),
  new THREE.MeshStandardMaterial({
    color: 0x20282a,
    roughness: 0.92,
    metalness: 0.0,
  }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.03;
scene.add(ground);

const grid = new THREE.GridHelper(20, 32, 0x54605d, 0x303735);
grid.position.y = 0.002;
scene.add(grid);

const meshMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.58,
  metalness: 0.08,
  side: THREE.DoubleSide,
});

const ghostMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.5,
  metalness: 0.0,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.36,
});

const wireMaterial = new THREE.MeshBasicMaterial({
  color: 0xddeee7,
  wireframe: true,
  transparent: true,
  opacity: 0.82,
});

const leafMaterial = new THREE.PointsMaterial({
  color: 0xdd5264,
  size: 0.075,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.9,
});

function readSettings() {
  return {
    ruleMode,
    depth: Number(controls.depth.value),
    leftMul: Number(controls.leftMul.value),
    rightMul: Number(controls.rightMul.value),
    sineFreq: Number(controls.sineFreq.value),
    spread: Number(controls.spread.value),
    twist: Number(controls.twist.value),
    curl: Number(controls.curl.value),
    lengthScale: Number(controls.lengthScale.value),
    radiusScale: Number(controls.radiusScale.value),
    sides: Number(controls.sides.value),
    leaves: controls.leaves.checked,
    autoRotate: controls.autoRotate.checked,
    scan: controls.scan.checked,
  };
}

function syncOutputs(settings) {
  outputs.depth.value = String(settings.depth);
  outputs.leftMul.value = settings.leftMul.toFixed(2);
  outputs.rightMul.value = settings.rightMul.toFixed(2);
  outputs.sineFreq.value = settings.sineFreq.toFixed(1);
  outputs.spread.value = `${Math.round(settings.spread)} deg`;
  outputs.twist.value = `${Math.round(settings.twist)} deg`;
  outputs.curl.value = `${Math.round(settings.curl)} deg`;
  outputs.lengthScale.value = settings.lengthScale.toFixed(1);
  outputs.radiusScale.value = settings.radiusScale.toFixed(2);
  outputs.sides.value = String(settings.sides);
  if (settings.ruleMode === "sine") {
    outputs.ruleText.textContent = `x -> a*x*Sx, b*x*Sy`;
    outputs.formulaText.textContent = "Sx = .44 + .56*abs(sin(freq*x + phase))";
  } else {
    outputs.ruleText.textContent = `x -> ${settings.leftMul.toFixed(2)}x, ${settings.rightMul.toFixed(2)}x`;
    outputs.formulaText.textContent = "f(x) -> [f(a*x), f(b*x)]";
  }
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function branchColor(value, depth, maxDepth) {
  const t = Math.max(0, Math.min(1, depth / Math.max(1, maxDepth)));
  const base = new THREE.Color(0x8a6f43);
  const mid = new THREE.Color(0x15786e);
  const tip = new THREE.Color(0xb84452);
  const color = t < 0.62
    ? base.clone().lerp(mid, t / 0.62)
    : mid.clone().lerp(tip, (t - 0.62) / 0.38);
  color.multiplyScalar(0.72 + Math.min(0.34, Math.sqrt(value) * 0.34));
  return color;
}

function buildTree(settings) {
  const positions = [];
  const colors = [];
  const indices = [];
  const leafPositions = [];
  const leafValues = [];

  const sides = settings.sides;
  const spread = degToRad(settings.spread);
  const twist = degToRad(settings.twist);
  const curl = degToRad(settings.curl);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const scratchDir = new THREE.Vector3();
  const scratchPos = new THREE.Vector3();
  const scratchQuat = new THREE.Quaternion();
  const ringQuat = new THREE.Quaternion();
  const ringUnit = new THREE.Vector3();
  const start = new THREE.Vector3(0, 0, 0);
  const startQuat = new THREE.Quaternion();
  let segmentCount = 0;

  function childValues(value, depthRemaining, turnIndex) {
    if (settings.ruleMode === "product") {
      return [value * settings.leftMul, value * settings.rightMul];
    }

    const depthMade = settings.depth - depthRemaining;
    const phase = depthMade * 0.73 + turnIndex * 1.618;
    const leftFold = 0.44 + 0.56 * Math.abs(Math.sin(settings.sineFreq * value + phase));
    const rightFold = 0.44 + 0.56 * Math.abs(Math.sin(settings.sineFreq * value + phase + Math.PI * 0.5));

    return [
      value * settings.leftMul * leftFold,
      value * settings.rightMul * rightFold,
    ];
  }

  function addRing(center, direction, radius, color) {
    ringQuat.setFromUnitVectors(yAxis, direction);
    const firstIndex = positions.length / 3;

    for (let side = 0; side < sides; side += 1) {
      const theta = (side / sides) * Math.PI * 2;
      ringUnit.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
      ringUnit.applyQuaternion(ringQuat).add(center);
      positions.push(ringUnit.x, ringUnit.y, ringUnit.z);
      colors.push(color.r, color.g, color.b);
    }

    return firstIndex;
  }

  function addSegment(a, b, value, depthRemaining) {
    scratchDir.subVectors(b, a).normalize();
    const depthMade = settings.depth - depthRemaining;
    const color = branchColor(value, depthMade, settings.depth);
    const baseRadius = settings.radiusScale * Math.pow(Math.max(value, 0.0001), 0.58);
    const tipRadius = Math.max(0.006, baseRadius * (0.64 + value * 0.18));
    const ringA = addRing(a, scratchDir, baseRadius, color);
    const ringB = addRing(b, scratchDir, tipRadius, color);

    for (let side = 0; side < sides; side += 1) {
      const next = (side + 1) % sides;
      indices.push(ringA + side, ringB + side, ringB + next);
      indices.push(ringA + side, ringB + next, ringA + next);
    }

    const capCenterA = positions.length / 3;
    positions.push(a.x, a.y, a.z);
    colors.push(color.r * 0.75, color.g * 0.75, color.b * 0.75);
    const capCenterB = positions.length / 3;
    positions.push(b.x, b.y, b.z);
    colors.push(color.r, color.g, color.b);

    for (let side = 0; side < sides; side += 1) {
      const next = (side + 1) % sides;
      indices.push(capCenterA, ringA + next, ringA + side);
      indices.push(capCenterB, ringB + side, ringB + next);
    }

    segmentCount += 1;
  }

  function visit(position, quaternion, value, depthRemaining, turnIndex) {
    const length = settings.lengthScale * Math.pow(value, 0.72) * (0.84 + depthRemaining * 0.035);
    scratchDir.set(0, 1, 0).applyQuaternion(quaternion).normalize();
    scratchPos.copy(position).addScaledVector(scratchDir, length);
    addSegment(position, scratchPos, value, depthRemaining);

    if (depthRemaining <= 0 || value < 0.003) {
      leafPositions.push(scratchPos.x, scratchPos.y, scratchPos.z);
      leafValues.push(value);
      return;
    }

    const twistOffset = twist * (turnIndex + 1);
    const curlOffset = curl * Math.sin((settings.depth - depthRemaining + 1) * 1.618 + turnIndex);

    const leftQuat = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(spread * 0.5 + curlOffset, twistOffset, -spread * 0.55, "YXZ"));
    const rightQuat = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(spread * 0.5 - curlOffset, twistOffset + Math.PI, spread * 0.55, "YXZ"));

    const leftWorld = scratchQuat.copy(quaternion).multiply(leftQuat);
    const rightWorld = quaternion.clone().multiply(rightQuat);
    const childStart = scratchPos.clone();
    const [leftValue, rightValue] = childValues(value, depthRemaining, turnIndex);

    visit(childStart, leftWorld, leftValue, depthRemaining - 1, turnIndex + 1);
    visit(childStart, rightWorld, rightValue, depthRemaining - 1, turnIndex + 2);
  }

  visit(start, startQuat, 1, settings.depth, 0);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  const leafGeometry = new THREE.BufferGeometry();
  leafGeometry.setAttribute("position", new THREE.Float32BufferAttribute(leafPositions, 3));

  return {
    geometry,
    leafGeometry,
    positions,
    indices,
    leafValues,
    segmentCount,
    vertexCount: positions.length / 3,
    faceCount: indices.length / 3,
  };
}

function replaceMesh(settings) {
  outputs.statusPanel.classList.remove("is-ready", "is-error");
  outputs.statusPanel.textContent = "Building mesh...";
  syncOutputs(settings);
  currentMeshData = buildTree(settings);

  if (meshObject) {
    scene.remove(meshObject);
    meshObject.geometry.dispose();
  }

  if (leafObject) {
    scene.remove(leafObject);
    leafObject.geometry.dispose();
  }

  const material = viewMode === "wire" ? wireMaterial : viewMode === "ghost" ? ghostMaterial : meshMaterial;
  meshObject = new THREE.Mesh(currentMeshData.geometry, material);
  meshObject.castShadow = true;
  meshObject.receiveShadow = true;
  scene.add(meshObject);

  leafObject = new THREE.Points(currentMeshData.leafGeometry, leafMaterial);
  leafObject.visible = settings.leaves;
  scene.add(leafObject);

  fitCameraToMesh(currentMeshData.geometry);
  updateHud(currentMeshData);
  outputs.statusPanel.classList.add("is-ready");
}

function fitCameraToMesh(geometry) {
  const box = geometry.boundingBox;
  if (!box) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.5, 1);
  const distance = radius / Math.sin(degToRad(camera.fov) * 0.5);
  const direction = new THREE.Vector3(1.05, 0.72, 1.2).normalize();

  orbit.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance * 1.18);

  camera.near = Math.max(0.01, radius / 800);
  camera.far = radius * 80;
  camera.updateProjectionMatrix();
  orbit.update();
}

function updateHud(meshData) {
  outputs.vertexCount.textContent = meshData.vertexCount.toLocaleString();
  outputs.faceCount.textContent = meshData.faceCount.toLocaleString();
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needsResize = canvas.width !== Math.floor(width * renderer.getPixelRatio())
    || canvas.height !== Math.floor(height * renderer.getPixelRatio());

  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
}

function renderFrame() {
  resizeRenderer();

  if (controls.scan.checked) {
    scanPhase += 0.01;
    controls.leftMul.value = (0.55 + Math.sin(scanPhase) * 0.25).toFixed(2);
    controls.rightMul.value = (0.52 + Math.cos(scanPhase * 0.71) * 0.24).toFixed(2);
    controls.sineFreq.value = (6.4 + Math.sin(scanPhase * 0.27) * 4.8).toFixed(1);
    controls.spread.value = String(Math.round(48 + Math.sin(scanPhase * 0.43) * 34));
    controls.twist.value = String(Math.round(124 + Math.cos(scanPhase * 0.31) * 56));
    replaceMesh(readSettings());
  }

  if (controls.autoRotate.checked && meshObject) {
    meshObject.rotation.y += 0.004;
    if (leafObject) {
      leafObject.rotation.y = meshObject.rotation.y;
    }
  }

  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderFrame);
}

function setDefaults() {
  controls.depth.value = defaults.depth;
  controls.leftMul.value = defaults.leftMul;
  controls.rightMul.value = defaults.rightMul;
  controls.sineFreq.value = defaults.sineFreq;
  controls.spread.value = defaults.spread;
  controls.twist.value = defaults.twist;
  controls.curl.value = defaults.curl;
  controls.lengthScale.value = defaults.lengthScale;
  controls.radiusScale.value = defaults.radiusScale;
  controls.sides.value = defaults.sides;
  controls.leaves.checked = true;
  controls.autoRotate.checked = true;
  controls.scan.checked = false;
  viewMode = "solid";
  ruleMode = "sine";
  document.querySelector('input[name="viewMode"][value="solid"]').checked = true;
  document.querySelector('input[name="ruleMode"][value="sine"]').checked = true;
  replaceMesh(readSettings());
}

function randomize() {
  controls.depth.value = String(6 + Math.floor(Math.random() * 6));
  controls.leftMul.value = (0.34 + Math.random() * 0.48).toFixed(2);
  controls.rightMul.value = (0.34 + Math.random() * 0.48).toFixed(2);
  controls.sineFreq.value = (1.4 + Math.random() * 12.5).toFixed(1);
  controls.spread.value = String(22 + Math.floor(Math.random() * 92));
  controls.twist.value = String(-160 + Math.floor(Math.random() * 321));
  controls.curl.value = String(-48 + Math.floor(Math.random() * 97));
  controls.lengthScale.value = (2.2 + Math.random() * 4.5).toFixed(1);
  controls.radiusScale.value = (0.08 + Math.random() * 0.24).toFixed(2);
  controls.sides.value = String(5 + Math.floor(Math.random() * 7));
  replaceMesh(readSettings());
}

function exportObj() {
  if (!currentMeshData) {
    return;
  }

  const { positions, indices } = currentMeshData;
  const lines = ["# 3D number L-system mesh", "o number_lsystem_mesh"];

  for (let i = 0; i < positions.length; i += 3) {
    lines.push(`v ${positions[i].toFixed(6)} ${positions[i + 1].toFixed(6)} ${positions[i + 2].toFixed(6)}`);
  }

  for (let i = 0; i < indices.length; i += 3) {
    lines.push(`f ${indices[i] + 1} ${indices[i + 1] + 1} ${indices[i + 2] + 1}`);
  }

  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "number-lsystem-mesh.obj";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

for (const input of Object.values(controls)) {
  input.addEventListener("input", () => {
    if (input === controls.autoRotate || input === controls.scan) {
      syncOutputs(readSettings());
      return;
    }
    replaceMesh(readSettings());
  });
}

for (const radio of document.querySelectorAll('input[name="viewMode"]')) {
  radio.addEventListener("change", (event) => {
    viewMode = event.target.value;
    replaceMesh(readSettings());
  });
}

for (const radio of document.querySelectorAll('input[name="ruleMode"]')) {
  radio.addEventListener("change", (event) => {
    ruleMode = event.target.value;
    replaceMesh(readSettings());
  });
}

buttons.reset.addEventListener("click", setDefaults);
buttons.randomize.addEventListener("click", randomize);
buttons.exportObj.addEventListener("click", exportObj);
window.addEventListener("resize", resizeRenderer);

setDefaults();
renderFrame();
