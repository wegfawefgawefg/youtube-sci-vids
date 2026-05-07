const canvas = document.querySelector("#fractalCanvas");
const ctx = canvas.getContext("2d");

const controls = {
  depth: document.querySelector("#depth"),
  leftMul: document.querySelector("#leftMul"),
  rightMul: document.querySelector("#rightMul"),
  angle: document.querySelector("#angle"),
  scale: document.querySelector("#scale"),
  bias: document.querySelector("#bias"),
  prune: document.querySelector("#prune"),
  sequenceOverlay: document.querySelector("#sequenceOverlay"),
  scan: document.querySelector("#scan"),
};

const outputs = {
  depth: document.querySelector("#depthValue"),
  leftMul: document.querySelector("#leftValue"),
  rightMul: document.querySelector("#rightValue"),
  angle: document.querySelector("#angleValue"),
  scale: document.querySelector("#scaleValue"),
  bias: document.querySelector("#biasValue"),
  prune: document.querySelector("#pruneValue"),
  nodeCount: document.querySelector("#nodeCount"),
  valueRange: document.querySelector("#valueRange"),
  ruleText: document.querySelector("#ruleText"),
};

const buttons = {
  reset: document.querySelector("#reset"),
  randomize: document.querySelector("#randomize"),
};

const defaults = {
  depth: 10,
  leftMul: 0.6,
  rightMul: 0.4,
  angle: 42,
  scale: 120,
  bias: 0,
  prune: 0,
};

let renderMode = "branches";
let animationId = null;
let scanPhase = 0;

function readSettings() {
  return {
    depth: Number(controls.depth.value),
    leftMul: Number(controls.leftMul.value),
    rightMul: Number(controls.rightMul.value),
    angle: Number(controls.angle.value),
    scale: Number(controls.scale.value),
    bias: Number(controls.bias.value),
    prune: Number(controls.prune.value),
    sequenceOverlay: controls.sequenceOverlay.checked,
    scan: controls.scan.checked,
  };
}

function syncOutputs(settings) {
  outputs.depth.value = String(settings.depth);
  outputs.leftMul.value = settings.leftMul.toFixed(2);
  outputs.rightMul.value = settings.rightMul.toFixed(2);
  outputs.angle.value = `${Math.round(settings.angle)} deg`;
  outputs.scale.value = String(Math.round(settings.scale));
  outputs.bias.value = `${Math.round(settings.bias)} deg`;
  outputs.prune.value = settings.prune.toFixed(3);
  outputs.ruleText.textContent = `x -> ${settings.leftMul.toFixed(2)}x, ${settings.rightMul.toFixed(2)}x`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeTree(settings) {
  const angle = (settings.angle * Math.PI) / 180;
  const bias = (settings.bias * Math.PI) / 180;
  const segments = [];
  const leaves = [];
  const values = [];
  let nodeCount = 0;

  function visit(x, y, heading, value, depth, path) {
    if (value < settings.prune) {
      return;
    }

    nodeCount += 1;
    values.push(value);

    const length = settings.scale * value * (0.94 + depth * 0.012);
    const endX = x + Math.cos(heading) * length;
    const endY = y + Math.sin(heading) * length;
    segments.push({ x1: x, y1: y, x2: endX, y2: endY, value, depth, path });

    if (depth <= 0) {
      leaves.push({ x: endX, y: endY, value, path });
      return;
    }

    visit(endX, endY, heading - angle * 0.5 + bias, value * settings.leftMul, depth - 1, `${path}L`);
    visit(endX, endY, heading + angle * 0.5 + bias, value * settings.rightMul, depth - 1, `${path}R`);
  }

  visit(0, 0, -Math.PI / 2, 1, settings.depth, "");

  return { segments, leaves, values, nodeCount };
}

function boundsFor(items) {
  if (items.length === 0) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    minX = Math.min(minX, item.x1 ?? item.x, item.x2 ?? item.x);
    minY = Math.min(minY, item.y1 ?? item.y, item.y2 ?? item.y);
    maxX = Math.max(maxX, item.x1 ?? item.x, item.x2 ?? item.x);
    maxY = Math.max(maxY, item.y1 ?? item.y, item.y2 ?? item.y);
  }

  return { minX, minY, maxX, maxY };
}

function transformFor(bounds, width, height) {
  const pad = Math.max(28, Math.min(width, height) * 0.08);
  const modelWidth = Math.max(1, bounds.maxX - bounds.minX);
  const modelHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min((width - pad * 2) / modelWidth, (height - pad * 2) / modelHeight);
  const offsetX = (width - modelWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (height - modelHeight * scale) / 2 - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

function colorFor(value, depth, alpha = 1) {
  const hue = 168 + Math.min(82, depth * 7);
  const light = 30 + Math.max(0, Math.min(34, value * 34));
  return `hsla(${hue}, 55%, ${light}%, ${alpha})`;
}

function drawTree(tree, settings) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  const stripHeight = settings.sequenceOverlay ? Math.min(120, height * 0.18) : 0;
  const treeHeight = height - stripHeight;
  const bounds = boundsFor(tree.segments);
  const transform = transformFor(bounds, width, treeHeight);

  ctx.save();
  ctx.translate(transform.offsetX, transform.offsetY);
  ctx.scale(transform.scale, transform.scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (renderMode === "branches" || renderMode === "both") {
    for (const segment of tree.segments) {
      ctx.strokeStyle = colorFor(segment.value, segment.depth, 0.82);
      ctx.lineWidth = Math.max(0.7 / transform.scale, Math.sqrt(segment.value) * 5.8 / transform.scale);
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
    }
  }

  if (renderMode === "points" || renderMode === "both") {
    for (const leaf of tree.leaves) {
      ctx.fillStyle = `rgba(178, 58, 72, ${0.28 + Math.min(0.55, leaf.value)})`;
      ctx.beginPath();
      ctx.arc(leaf.x, leaf.y, Math.max(1.4 / transform.scale, 5.4 * Math.sqrt(leaf.value) / transform.scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  if (settings.sequenceOverlay) {
    drawSequenceStrip(tree.leaves, width, height, stripHeight);
  }
}

function drawSequenceStrip(leaves, width, height, stripHeight) {
  const top = height - stripHeight;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(0, top, width, stripHeight);
  ctx.strokeStyle = "rgba(31, 36, 40, 0.14)";
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(width, top + 0.5);
  ctx.stroke();

  if (leaves.length > 1) {
    const maxValue = Math.max(...leaves.map((leaf) => leaf.value), 1e-9);
    const padX = 18;
    const padY = 18;
    const graphWidth = width - padX * 2;
    const graphHeight = stripHeight - padY * 2;

    ctx.strokeStyle = "rgba(54, 76, 132, 0.78)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    leaves.forEach((leaf, index) => {
      const x = padX + (index / (leaves.length - 1)) * graphWidth;
      const y = top + stripHeight - padY - (leaf.value / maxValue) * graphHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(178, 58, 72, 0.42)";
    for (let index = 0; index < leaves.length; index += Math.max(1, Math.floor(leaves.length / 220))) {
      const leaf = leaves[index];
      const x = padX + (index / (leaves.length - 1)) * graphWidth;
      const y = top + stripHeight - padY - (leaf.value / maxValue) * graphHeight;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  ctx.restore();
}

function updateHud(tree) {
  outputs.nodeCount.textContent = tree.nodeCount.toLocaleString();

  if (tree.values.length === 0) {
    outputs.valueRange.textContent = "0 to 0";
    return;
  }

  const min = Math.min(...tree.values);
  const max = Math.max(...tree.values);
  outputs.valueRange.textContent = `${min.toExponential(2)} to ${max.toFixed(2)}`;
}

function render() {
  resizeCanvas();
  const settings = readSettings();
  syncOutputs(settings);
  const tree = makeTree(settings);
  drawTree(tree, settings);
  updateHud(tree);
}

function scanTick() {
  if (!controls.scan.checked) {
    animationId = null;
    return;
  }

  scanPhase += 0.012;
  const a = 0.515 + Math.sin(scanPhase) * 0.245;
  const b = 0.515 + Math.cos(scanPhase * 0.73) * 0.245;
  controls.leftMul.value = a.toFixed(2);
  controls.rightMul.value = b.toFixed(2);
  render();
  animationId = requestAnimationFrame(scanTick);
}

function startOrStopScan() {
  if (controls.scan.checked && animationId === null) {
    animationId = requestAnimationFrame(scanTick);
  }
}

function setDefaults() {
  controls.depth.value = defaults.depth;
  controls.leftMul.value = defaults.leftMul;
  controls.rightMul.value = defaults.rightMul;
  controls.angle.value = defaults.angle;
  controls.scale.value = defaults.scale;
  controls.bias.value = defaults.bias;
  controls.prune.value = defaults.prune;
  controls.sequenceOverlay.checked = true;
  controls.scan.checked = false;
  renderMode = "branches";
  document.querySelector('input[name="mode"][value="branches"]').checked = true;
  render();
}

function randomize() {
  controls.depth.value = String(7 + Math.floor(Math.random() * 7));
  controls.leftMul.value = (0.28 + Math.random() * 0.58).toFixed(2);
  controls.rightMul.value = (0.28 + Math.random() * 0.58).toFixed(2);
  controls.angle.value = String(18 + Math.floor(Math.random() * 118));
  controls.scale.value = String(70 + Math.floor(Math.random() * 115));
  controls.bias.value = String(-34 + Math.floor(Math.random() * 69));
  controls.prune.value = Math.random() < 0.25 ? "0.006" : "0";
  render();
}

for (const element of Object.values(controls)) {
  element.addEventListener("input", () => {
    render();
    startOrStopScan();
  });
}

for (const radio of document.querySelectorAll('input[name="mode"]')) {
  radio.addEventListener("change", (event) => {
    renderMode = event.target.value;
    render();
  });
}

buttons.reset.addEventListener("click", setDefaults);
buttons.randomize.addEventListener("click", randomize);
window.addEventListener("resize", render);

setDefaults();

