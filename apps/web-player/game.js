const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const dialogBox = document.getElementById("dialog-box");
const dialogSpeaker = document.getElementById("dialog-speaker");
const dialogText = document.getElementById("dialog-text");
const choicesBox = document.getElementById("choices-box");
const choicesList = document.getElementById("choices-list");

const touchPad = document.getElementById("touch-pad");
const padKnob = document.getElementById("pad-knob");
const btnTalk = document.getElementById("btn-talk");
const btnSelect = document.getElementById("btn-select");

const TILE = 16;
const palette = {
  grassA: "#79d26b",
  grassB: "#69bc5d",
  grassFlower: "#fce8ff",
  pathA: "#e3c088",
  pathB: "#d2ab73",
  waterA: "#4f95e8",
  waterB: "#2d6fc2",
  waterFoam: "#8fd0ff",
  bridgeA: "#ad7d4d",
  bridgeB: "#7c5330",
  bridgeEdge: "#593721",
  treeTrunk: "#5a3b24",
  treeLeafA: "#b08dff",
  treeLeafB: "#8f6de2",
};

const WORLD = {
  width: 2200,
  height: 1400,
  river: { x: 980, y: 120, w: 260, h: 1160 },
  bridge: { x: 940, y: 640, w: 340, h: 110 },
  npc: { x: 1460, y: 700, w: TILE, h: TILE, name: "AURORA" },
};

const player = {
  x: 760,
  y: 700,
  w: TILE,
  h: TILE,
  speed: 6 * TILE,
  face: "down",
  animTick: 0,
  animFrame: 0,
};

const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  touch: { active: false, dx: 0, dy: 0, id: null },
};

const dialogue = {
  active: false,
  nodeId: null,
  selectedIndex: 0,
  tree: {
    start: {
      speaker: "AURORA",
      text: "Hola, Luna. Cruzaste el puente del Reino Arcoiris. Que buscas hoy?",
      choices: [
        { text: "Solo explorar", next: "explore" },
        { text: "Busco aventura", next: "adventure" },
      ],
    },
    explore: {
      speaker: "AURORA",
      text: "Entonces visita el prado del norte. Hay cristales brillando al amanecer.",
      choices: [{ text: "Gracias", next: "end" }],
    },
    adventure: {
      speaker: "AURORA",
      text: "Perfecto. Empieza dominando el puente: moverte con calma es la clave.",
      choices: [{ text: "Acepto el reto", next: "end" }],
    },
    end: {
      speaker: "AURORA",
      text: "Cuando quieras hablar de nuevo, me encontraras aqui.",
      choices: [{ text: "Cerrar", next: null }],
    },
  },
};

const pressedThisFrame = {
  up: false,
  down: false,
  select: false,
  interact: false,
};

const camera = { x: 0, y: 0 };

let viewW = 0;
let viewH = 0;
let viewportScale = 1;
let viewportWidthWorld = 0;
let viewportHeightWorld = 0;
let lastTime = 0;

function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const targetWorldWidth = Math.min(320, Math.floor(window.innerWidth / 2));
  viewportScale = Math.max(2, Math.floor(window.innerWidth / targetWorldWidth));
  viewportWidthWorld = Math.max(256, Math.floor(window.innerWidth / viewportScale));
  viewportHeightWorld = Math.max(144, Math.floor(window.innerHeight / viewportScale));

  canvas.width = Math.floor(viewportWidthWorld * dpr);
  canvas.height = Math.floor(viewportHeightWorld * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  canvas.style.width = `${viewportWidthWorld * viewportScale}px`;
  canvas.style.height = `${viewportHeightWorld * viewportScale}px`;
  canvas.style.margin = "0 auto";

  viewW = window.innerWidth;
  viewH = window.innerHeight;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function inRiver(rect) {
  return intersects(rect, WORLD.river) && !intersects(rect, WORLD.bridge);
}

function setTalkPrompt(show) {
  btnTalk.hidden = !show;
}

function setSelectPrompt(show) {
  btnSelect.hidden = !show;
}

function startDialogue() {
  dialogue.active = true;
  dialogue.nodeId = "start";
  dialogue.selectedIndex = 0;
  setSelectPrompt(true);
  renderDialogue();
}

function stopDialogue() {
  dialogue.active = false;
  dialogue.nodeId = null;
  dialogue.selectedIndex = 0;
  dialogBox.hidden = true;
  choicesBox.hidden = true;
  setSelectPrompt(false);
}

function renderDialogue() {
  if (!dialogue.active || !dialogue.nodeId) {
    dialogBox.hidden = true;
    choicesBox.hidden = true;
    return;
  }

  const node = dialogue.tree[dialogue.nodeId];
  dialogSpeaker.textContent = node.speaker;
  dialogText.textContent = node.text;
  dialogBox.hidden = false;
  choicesBox.hidden = false;

  choicesList.innerHTML = "";
  node.choices.forEach((choice, index) => {
    const el = document.createElement("div");
    el.className = `choice-item${index === dialogue.selectedIndex ? " active" : ""}`;
    el.textContent = `${index === dialogue.selectedIndex ? "> " : "  "}${choice.text}`;
    choicesList.appendChild(el);
  });
}

function chooseCurrentDialogueOption() {
  if (!dialogue.active || !dialogue.nodeId) return;
  const node = dialogue.tree[dialogue.nodeId];
  const option = node.choices[dialogue.selectedIndex];
  if (!option) return;
  if (!option.next) {
    stopDialogue();
    return;
  }
  dialogue.nodeId = option.next;
  dialogue.selectedIndex = 0;
  renderDialogue();
}

function processDialogueInput() {
  const node = dialogue.tree[dialogue.nodeId];
  if (!node) return;

  if (pressedThisFrame.up) {
    dialogue.selectedIndex = (dialogue.selectedIndex - 1 + node.choices.length) % node.choices.length;
    renderDialogue();
  }
  if (pressedThisFrame.down) {
    dialogue.selectedIndex = (dialogue.selectedIndex + 1) % node.choices.length;
    renderDialogue();
  }
  if (pressedThisFrame.select || pressedThisFrame.interact) {
    chooseCurrentDialogueOption();
  }
}

function clearPressedFrame() {
  pressedThisFrame.up = false;
  pressedThisFrame.down = false;
  pressedThisFrame.select = false;
  pressedThisFrame.interact = false;
}

function movementIntent() {
  if (dialogue.active) return { x: 0, y: 0 };

  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;

  if (input.touch.active) {
    const length = Math.hypot(input.touch.dx, input.touch.dy);
    if (length > 0.18) {
      x += input.touch.dx;
      y += input.touch.dy;
    }
  }

  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

function updatePlayer(dt) {
  const intent = movementIntent();
  const step = player.speed * dt;
  const moving = Math.abs(intent.x) > 0.001 || Math.abs(intent.y) > 0.001;

  if (Math.abs(intent.x) > Math.abs(intent.y)) {
    player.face = intent.x < 0 ? "left" : intent.x > 0 ? "right" : player.face;
  } else if (Math.abs(intent.y) > 0) {
    player.face = intent.y < 0 ? "up" : "down";
  }

  if (moving) {
    player.animTick += dt;
    if (player.animTick >= 0.16) {
      player.animTick = 0;
      player.animFrame = (player.animFrame + 1) % 2;
    }
  } else {
    player.animTick = 0;
    player.animFrame = 0;
  }

  const nextX = { x: player.x + intent.x * step, y: player.y, w: player.w, h: player.h };
  if (!inRiver(nextX)) {
    player.x = clamp(Math.round(nextX.x), 0, WORLD.width - player.w);
  }

  const nextY = { x: player.x, y: player.y + intent.y * step, w: player.w, h: player.h };
  if (!inRiver(nextY)) {
    player.y = clamp(Math.round(nextY.y), 0, WORLD.height - player.h);
  }
}

function nearNpc() {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const nx = WORLD.npc.x + WORLD.npc.w / 2;
  const ny = WORLD.npc.y + WORLD.npc.h / 2;
  return Math.hypot(px - nx, py - ny) < 92;
}

function updateCamera() {
  camera.x = clamp(
    Math.round(player.x + player.w / 2 - viewportWidthWorld / 2),
    0,
    WORLD.width - viewportWidthWorld,
  );
  camera.y = clamp(
    Math.round(player.y + player.h / 2 - viewportHeightWorld / 2),
    0,
    WORLD.height - viewportHeightWorld,
  );
}

function toScreen(wx, wy) {
  return { x: Math.round(wx - camera.x), y: Math.round(wy - camera.y) };
}

function drawGround() {
  ctx.fillStyle = palette.grassA;
  ctx.fillRect(0, 0, viewportWidthWorld, viewportHeightWorld);

  const startX = Math.floor(camera.x / TILE) * TILE;
  const startY = Math.floor(camera.y / TILE) * TILE;
  const endX = camera.x + viewportWidthWorld + TILE;
  const endY = camera.y + viewportHeightWorld + TILE;

  for (let y = startY; y < endY; y += TILE) {
    for (let x = startX; x < endX; x += TILE) {
      const sx = x - camera.x;
      const sy = y - camera.y;
      const v = ((x / TILE) + (y / TILE)) % 2;
      ctx.fillStyle = v === 0 ? palette.grassA : palette.grassB;
      ctx.fillRect(sx, sy, TILE, TILE);
      if (((x / TILE) * 13 + (y / TILE) * 7) % 29 === 0) {
        ctx.fillStyle = palette.grassFlower;
        ctx.fillRect(sx + 6, sy + 6, 3, 3);
      }
    }
  }
}

function drawWorld() {
  const river = toScreen(WORLD.river.x, WORLD.river.y);
  ctx.fillStyle = palette.waterA;
  ctx.fillRect(river.x, river.y, WORLD.river.w, WORLD.river.h);

  const phase = Math.floor(performance.now() / 220) % 2;
  for (let y = 0; y < WORLD.river.h; y += TILE) {
    for (let x = 0; x < WORLD.river.w; x += TILE) {
      const v = ((x / TILE) + (y / TILE) + phase) % 2;
      ctx.fillStyle = v === 0 ? palette.waterA : palette.waterB;
      ctx.fillRect(river.x + x, river.y + y, TILE, TILE);
    }
    ctx.fillStyle = palette.waterFoam;
    ctx.fillRect(river.x + ((y / TILE + phase) % 2) * 8, river.y + y + 2, WORLD.river.w - 8, 2);
  }

  const bridge = toScreen(WORLD.bridge.x, WORLD.bridge.y);
  ctx.fillStyle = palette.bridgeA;
  ctx.fillRect(bridge.x, bridge.y, WORLD.bridge.w, WORLD.bridge.h);
  ctx.fillStyle = palette.bridgeB;
  for (let x = 0; x < WORLD.bridge.w; x += TILE) {
    ctx.fillRect(bridge.x + x, bridge.y + 2, TILE - 2, WORLD.bridge.h - 4);
  }
  ctx.fillStyle = palette.bridgeEdge;
  ctx.fillRect(bridge.x, bridge.y, WORLD.bridge.w, 2);
  ctx.fillRect(bridge.x, bridge.y + WORLD.bridge.h - 2, WORLD.bridge.w, 2);

  const pathLeft = toScreen(120, 705);
  for (let x = 0; x < 860; x += TILE) {
    for (let y = 0; y < 42; y += TILE) {
      const v = ((x / TILE) + (y / TILE)) % 2;
      ctx.fillStyle = v === 0 ? palette.pathA : palette.pathB;
      ctx.fillRect(pathLeft.x + x, pathLeft.y + y, TILE, TILE);
    }
  }

  const pathRight = toScreen(1240, 705);
  for (let x = 0; x < 840; x += TILE) {
    for (let y = 0; y < 42; y += TILE) {
      const v = ((x / TILE) + (y / TILE)) % 2;
      ctx.fillStyle = v === 0 ? palette.pathA : palette.pathB;
      ctx.fillRect(pathRight.x + x, pathRight.y + y, TILE, TILE);
    }
  }

  for (let i = 0; i < 8; i += 1) {
    const tx = 140 + i * 240;
    const ty = i % 2 === 0 ? 380 : 980;
    const p = toScreen(tx, ty);
    ctx.fillStyle = palette.treeTrunk;
    ctx.fillRect(p.x + 7, p.y + 12, 8, 14);
    ctx.fillStyle = palette.treeLeafB;
    ctx.fillRect(p.x, p.y, 22, 16);
    ctx.fillStyle = palette.treeLeafA;
    ctx.fillRect(p.x + 3, p.y + 3, 16, 10);
  }
}

function drawUnicorn(x, y, body, mane, outline, facingLeft, walkFrame) {
  const p = toScreen(x, y);
  const dir = facingLeft ? -1 : 1;
  const legOffset = walkFrame ? 1 : 0;

  ctx.fillStyle = outline;
  ctx.fillRect(p.x + 2, p.y + 4, 10, 8);
  ctx.fillRect(p.x + 10, p.y + 5, 5, 5);
  ctx.fillRect(p.x + 3, p.y + 11 + legOffset, 2, 5 - legOffset);
  ctx.fillRect(p.x + 7, p.y + 11 + (1 - legOffset), 2, 5 - (1 - legOffset));

  ctx.fillStyle = body;
  ctx.fillRect(p.x + 3, p.y + 5, 8, 7);
  ctx.fillRect(p.x + 10, p.y + 6, 4, 4);
  ctx.fillRect(p.x + 3, p.y + 12, 1, 3);
  ctx.fillRect(p.x + 7, p.y + 12, 1, 3);

  ctx.fillStyle = mane;
  if (dir > 0) {
    ctx.fillRect(p.x + 2, p.y + 6, 2, 5);
    ctx.fillRect(p.x + 10, p.y + 4, 3, 2);
  } else {
    ctx.fillRect(p.x + 9, p.y + 6, 2, 5);
    ctx.fillRect(p.x + 10, p.y + 4, 3, 2);
  }

  ctx.fillStyle = "#ffe270";
  if (dir > 0) {
    ctx.fillRect(p.x + 13, p.y + 4, 1, 3);
  } else {
    ctx.fillRect(p.x + 10, p.y + 4, 1, 3);
  }
}

function drawEntities() {
  drawUnicorn(WORLD.npc.x, WORLD.npc.y, "#f7f7ff", "#ff9bd4", "#2a2a38", true, 0);

  const facingLeft = player.face === "left";
  const mane = player.face === "up" ? "#79e7ff" : "#ff77c4";
  drawUnicorn(player.x, player.y, "#ffffff", mane, "#2a2a38", facingLeft, player.animFrame);
}

function drawPrompt() {
  if (!nearNpc() || dialogue.active) return;

  const pos = toScreen(WORLD.npc.x + 22, WORLD.npc.y - 10);
  ctx.fillStyle = "#101320";
  ctx.fillRect(pos.x, pos.y, 56, 14);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(pos.x, pos.y, 56, 14);
  ctx.fillStyle = "#ff9ad1";
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.fillText("SPACE", pos.x + 6, pos.y + 9);
}

function draw() {
  ctx.clearRect(0, 0, viewportWidthWorld, viewportHeightWorld);
  drawGround();
  drawWorld();
  drawEntities();
  drawPrompt();
}

function update(dt) {
  if (dialogue.active) {
    processDialogueInput();
  } else {
    updatePlayer(dt);
    const canTalk = nearNpc();
    setTalkPrompt(canTalk);
    if (canTalk && pressedThisFrame.interact) {
      startDialogue();
    }
  }

  updateCamera();
}

function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.04);
  lastTime = ts;

  update(dt);
  draw();
  clearPressedFrame();

  requestAnimationFrame(loop);
}

function handleKeyDown(e) {
  if (e.code === "ArrowLeft") input.left = true;
  if (e.code === "ArrowRight") input.right = true;
  if (e.code === "ArrowUp") {
    input.up = true;
    pressedThisFrame.up = true;
  }
  if (e.code === "ArrowDown") {
    input.down = true;
    pressedThisFrame.down = true;
  }
  if (e.code === "Space") {
    pressedThisFrame.interact = true;
    pressedThisFrame.select = true;
    e.preventDefault();
  }
  if (e.code === "Enter") {
    pressedThisFrame.select = true;
  }
}

function handleKeyUp(e) {
  if (e.code === "ArrowLeft") input.left = false;
  if (e.code === "ArrowRight") input.right = false;
  if (e.code === "ArrowUp") input.up = false;
  if (e.code === "ArrowDown") input.down = false;
}

function updateKnobVisual() {
  const max = 40;
  const x = input.touch.dx * max;
  const y = input.touch.dy * max;
  padKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}

function resetTouchPad() {
  input.touch.active = false;
  input.touch.dx = 0;
  input.touch.dy = 0;
  input.touch.id = null;
  updateKnobVisual();
}

function touchVectorFromEvent(e) {
  const rect = touchPad.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const radius = rect.width / 2;
  const nx = clamp(dx / radius, -1, 1);
  const ny = clamp(dy / radius, -1, 1);
  return { nx, ny };
}

touchPad.addEventListener("pointerdown", (e) => {
  input.touch.active = true;
  input.touch.id = e.pointerId;
  const vec = touchVectorFromEvent(e);
  input.touch.dx = vec.nx;
  input.touch.dy = vec.ny;
  updateKnobVisual();
  touchPad.setPointerCapture(e.pointerId);
});

touchPad.addEventListener("pointermove", (e) => {
  if (!input.touch.active || input.touch.id !== e.pointerId) return;
  const vec = touchVectorFromEvent(e);
  input.touch.dx = vec.nx;
  input.touch.dy = vec.ny;
  updateKnobVisual();
});

touchPad.addEventListener("pointerup", (e) => {
  if (input.touch.id === e.pointerId) resetTouchPad();
});

touchPad.addEventListener("pointercancel", resetTouchPad);

btnTalk.addEventListener("click", () => {
  if (!dialogue.active && nearNpc()) {
    startDialogue();
  }
});

btnSelect.addEventListener("click", () => {
  if (dialogue.active) {
    chooseCurrentDialogueOption();
  }
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("resize", resize);

resize();
updateCamera();
requestAnimationFrame(loop);
