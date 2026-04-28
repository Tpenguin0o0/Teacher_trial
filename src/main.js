import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const MODEL_URL = `${import.meta.env.BASE_URL}models/teacher_splat.sog`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, -3);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = true;
controls.enableZoom = true;

const spark = new SparkRenderer({
  renderer: renderer
});

scene.add(spark);

const splatMesh = new SplatMesh({
  url: MODEL_URL
});

scene.add(splatMesh);

const appState = {
  mode: "view",
  backgroundIndex: 0,
  autoRotate: true
};

const backgroundNames = ["Cyber", "Gold", "Studio"];
let backgroundPlane = null;

const keys = new Set();

const clock = new THREE.Clock();

const defaultModelPosition = new THREE.Vector3(0, 0, -3);
const defaultModelScale = new THREE.Vector3(1, 1, 1);
const defaultCameraPosition = new THREE.Vector3(0, 1.8, 6);
const defaultControlTarget = new THREE.Vector3(0, 0.8, -3);

const groundY = 0;
let verticalVelocity = 0;
let isJumping = false;
let orbitAngle = 0;

function resetScene() {
  splatMesh.position.copy(defaultModelPosition);
  splatMesh.rotation.set(0, 0, 0);
  splatMesh.quaternion.set(1, 0, 0, 0);
  splatMesh.scale.copy(defaultModelScale);

  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultControlTarget);
  controls.update();

  verticalVelocity = 0;
  isJumping = false;
  orbitAngle = 0;
}

function createCyberTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#02030a");
  bg.addColorStop(0.45, "#080d1e");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 260; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.68;
    const r = Math.random() * 1.6 + 0.3;
    const a = Math.random() * 0.7 + 0.12;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGlow(ctx, w * 0.18, h * 0.24, 230, "rgba(0, 220, 255, 0.22)");
  drawGlow(ctx, w * 0.82, h * 0.18, 250, "rgba(190, 40, 255, 0.18)");
  drawGlow(ctx, w * 0.50, h * 0.34, 180, "rgba(60, 90, 255, 0.14)");

  drawMountainLayer(ctx, w, h, "#030409", 0.72);
  drawMountainLayer(ctx, w, h, "#080a12", 0.82);

  const horizonY = h * 0.72;
  drawNeonGrid(ctx, w, h, horizonY, "rgba(0, 255, 220, 0.24)");

  const line = ctx.createLinearGradient(0, horizonY, w, horizonY);
  line.addColorStop(0, "rgba(0,255,220,0)");
  line.addColorStop(0.5, "rgba(0,255,220,0.95)");
  line.addColorStop(1, "rgba(0,255,220,0)");

  ctx.strokeStyle = line;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(w, horizonY);
  ctx.stroke();

  return createTextureFromCanvas(canvas);
}

function createGoldTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#050404");
  bg.addColorStop(0.5, "#100b05");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGlow(ctx, w * 0.24, h * 0.28, 260, "rgba(255, 190, 80, 0.16)");
  drawGlow(ctx, w * 0.72, h * 0.22, 300, "rgba(255, 120, 40, 0.12)");

  for (let i = 0; i < 130; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = Math.random() * 70 + 25;

    ctx.strokeStyle = `rgba(255, 202, 110, ${Math.random() * 0.22 + 0.06})`;
    ctx.lineWidth = Math.random() * 2 + 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y - len * 0.25);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 200, 90, 0.10)";
  for (let i = 0; i < 9; i++) {
    const x = w * (0.08 + i * 0.11);
    const y = h * 0.18 + Math.sin(i) * 60;
    ctx.fillRect(x, y, 4, h * 0.55);
  }

  const groundY = h * 0.76;
  const ground = ctx.createLinearGradient(0, groundY, 0, h);
  ground.addColorStop(0, "rgba(255, 180, 60, 0.08)");
  ground.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, w, h - groundY);

  drawNeonGrid(ctx, w, h, groundY, "rgba(255, 190, 80, 0.20)");

  ctx.strokeStyle = "rgba(255, 205, 120, 0.75)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  return createTextureFromCanvas(canvas);
}

function createStudioTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const bg = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, w * 0.75);
  bg.addColorStop(0, "#1a1a1f");
  bg.addColorStop(0.55, "#09090d");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGlow(ctx, w * 0.5, h * 0.36, 420, "rgba(255, 255, 255, 0.08)");

  const floorY = h * 0.70;
  const floor = ctx.createLinearGradient(0, floorY, 0, h);
  floor.addColorStop(0, "rgba(255,255,255,0.04)");
  floor.addColorStop(1, "rgba(0,0,0,0.90)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY, w, h - floorY);

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const y = floorY + i * 32;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(w, floorY);
  ctx.stroke();

  return createTextureFromCanvas(canvas);
}

function drawGlow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountainLayer(ctx, w, h, color, baseRatio) {
  const baseY = h * baseRatio;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(w * 0.10, baseY - 120);
  ctx.lineTo(w * 0.22, baseY - 35);
  ctx.lineTo(w * 0.36, baseY - 170);
  ctx.lineTo(w * 0.50, baseY - 55);
  ctx.lineTo(w * 0.65, baseY - 145);
  ctx.lineTo(w * 0.78, baseY - 30);
  ctx.lineTo(w * 0.90, baseY - 130);
  ctx.lineTo(w, baseY - 60);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

function drawNeonGrid(ctx, w, h, horizonY, color) {
  const vanishX = w / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (let x = -w * 0.35; x <= w * 1.35; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(vanishX, horizonY);
    ctx.stroke();
  }

  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const y = horizonY + Math.pow(t, 2.25) * (h - horizonY);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function createTextureFromCanvas(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createBackgroundTexture(index) {
  if (index === 0) {
    return createCyberTexture();
  }

  if (index === 1) {
    return createGoldTexture();
  }

  return createStudioTexture();
}

function getPlaneSizeForCameraDepth(targetZ) {
  const distance = Math.abs(camera.position.z - targetZ);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFov / 2) * distance;
  const width = height * camera.aspect;
  return { width, height };
}

function createBackgroundPlane() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: createBackgroundTexture(appState.backgroundIndex),
    depthWrite: false
  });

  backgroundPlane = new THREE.Mesh(geometry, material);
  backgroundPlane.position.set(0, 1.5, -40);
  scene.add(backgroundPlane);

  updateBackgroundPlaneSize();
}

function updateBackgroundPlaneTexture() {
  if (!backgroundPlane) {
    return;
  }

  const oldTexture = backgroundPlane.material.map;
  const newTexture = createBackgroundTexture(appState.backgroundIndex);

  backgroundPlane.material.map = newTexture;
  backgroundPlane.material.needsUpdate = true;

  if (oldTexture) {
    oldTexture.dispose();
  }
}

function updateBackgroundPlaneSize() {
  if (!backgroundPlane) {
    return;
  }

  const { width, height } = getPlaneSizeForCameraDepth(backgroundPlane.position.z);
  backgroundPlane.scale.set(width * 1.2, height * 1.2, 1);
}

function updateModeButton() {
  const button = document.getElementById("modeButton");

  if (appState.mode === "view") {
    button.textContent = "鑑賞モード";
    button.classList.add("active");
  } else {
    button.textContent = "操作モード";
    button.classList.remove("active");
  }
}

function updateBackgroundButton() {
  const button = document.getElementById("backgroundButton");
  button.textContent = `背景切替：${backgroundNames[appState.backgroundIndex]}`;
}

function updateAutoRotateButton() {
  const button = document.getElementById("autoRotateButton");

  if (appState.autoRotate) {
    button.textContent = "自動回転：ON";
    button.classList.add("active");
  } else {
    button.textContent = "自動回転：OFF";
    button.classList.remove("active");
  }
}

function setupButtons() {
  const modeButton = document.getElementById("modeButton");
  const backgroundButton = document.getElementById("backgroundButton");
  const autoRotateButton = document.getElementById("autoRotateButton");
  const resetButton = document.getElementById("resetButton");

  modeButton.addEventListener("click", () => {
    appState.mode = appState.mode === "view" ? "play" : "view";

    if (appState.mode === "view") {
      controls.enabled = true;
    } else {
      controls.enabled = false;
    }

    updateModeButton();
  });

  backgroundButton.addEventListener("click", () => {
    appState.backgroundIndex = (appState.backgroundIndex + 1) % backgroundNames.length;
    updateBackgroundPlaneTexture();
    updateBackgroundButton();
  });

  autoRotateButton.addEventListener("click", () => {
    appState.autoRotate = !appState.autoRotate;
    updateAutoRotateButton();
  });

  resetButton.addEventListener("click", () => {
    resetScene();
  });

  updateModeButton();
  updateBackgroundButton();
  updateAutoRotateButton();
}

function setupKeyboard() {
  window.addEventListener("keydown", (event) => {
    keys.add(event.key.toLowerCase());

    if (event.code === "Space") {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });
}

function updateViewMode(delta) {
  const radius = 6;
  const height = 1.8;
  const center = splatMesh.position.clone();
  center.y += 0.85;

  orbitAngle += delta * 0.45;

  if (appState.autoRotate) {
    camera.position.x = center.x + Math.sin(orbitAngle) * radius;
    camera.position.z = center.z + Math.cos(orbitAngle) * radius;
    camera.position.y = height + Math.sin(orbitAngle * 0.7) * 0.35;

    controls.target.copy(center);
  }

  controls.enabled = true;
  controls.update();

  if (appState.autoRotate) {
    splatMesh.rotation.y += delta * 0.65;
  }
}

function updatePlayMode(delta) {
  const moveSpeed = 1.7;
  const rotateSpeed = 4.8;
  const jumpPower = 4.2;
  const gravity = 9.8;

  controls.enabled = false;

  if (keys.has("w")) {
    splatMesh.position.y += moveSpeed * delta;
  }

  if (keys.has("s")) {
    splatMesh.position.y -= moveSpeed * delta;
  }

  if (keys.has("a")) {
    splatMesh.position.x -= moveSpeed * delta;
  }

  if (keys.has("d")) {
    splatMesh.position.x += moveSpeed * delta;
  }

  if (keys.has("q")) {
    splatMesh.rotation.y += rotateSpeed * delta;
  }

  if (keys.has("e")) {
    splatMesh.rotation.y -= rotateSpeed * delta;
  }

  if (keys.has(" ") && !isJumping) {
    verticalVelocity = jumpPower;
    isJumping = true;
  }

  if (isJumping) {
    splatMesh.position.y += verticalVelocity * delta;
    verticalVelocity -= gravity * delta;

    if (splatMesh.position.y <= groundY) {
      splatMesh.position.y = groundY;
      verticalVelocity = 0;
      isJumping = false;
    }
  }

  if (appState.autoRotate) {
    splatMesh.rotation.y += delta * 2.0;
  }
}

function animate() {
  const delta = clock.getDelta();

  if (appState.mode === "view") {
    updateViewMode(delta);
  } else {
    updatePlayMode(delta);
  }

  renderer.render(scene, camera);
}

function setupResize() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    updateBackgroundPlaneSize();
  });
}

createBackgroundPlane();
setupButtons();
setupKeyboard();
setupResize();
resetScene();

renderer.setAnimationLoop(animate);