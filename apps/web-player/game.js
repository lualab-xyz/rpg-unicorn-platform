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

const WORLD = {
  width: 2200,
  height: 1400,
  river: { x: 980, y: 120, w: 260, h: 1160 },
  bridge: { x: 940, y: 640, w: 340, h: 110 },
  npc: { x: 1460, y: 700, w: 30, h: 34, name: "AURORA" },
};

const player = {
  x: 760,
  y: 700,
  w: 30,
  h: 34,
  speed: 240,
  face: "down",
};

const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  interact: false,
  select: false,
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

const camera = { x: 0, y: 0 };

let viewW = 0;
let viewH = 0;
let lastTime = 0;

function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
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
  if (!dialogue.active || !dialogue.nodeId) {
    return;
  }
  const node = dialogue.tree[dialogue.nodeId];
  const option = node.choices[dialogue.selectedIndex];
  if (!option) {
    return;
  }
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
  if (!node) {
    return;
  }

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

const pressedThisFrame = {
  up: false,
  down: false,
  select: false,
  interact: false,
};

function clearPressedFrame() {
  pressedThisFrame.up = false;
  pressedThisFrame.down = false;
  pressedThisFrame.select = false;
  pressedThisFrame.interact = false;
}

function movementIntent() {
  if (dialogue.active) {
    return { x: 0, y: 0 };
  }

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

  if (Math.abs(intent.x) > Math.abs(intent.y)) {
    player.face = intent.x < 0 ? "left" : intent.x > 0 ? "right" : player.face;
  } else if (Math.abs(intent.y) > 0) {
    player.face = intent.y < 0 ? "up" : "down";
  }

  const nextX = {
    x: player.x + intent.x * step,
    y: player.y,
    w: player.w,
    h: player.h,
  };

  if (!inRiver(nextX)) {
    player.x = clamp(nextX.x, 0, WORLD.width - player.w);
  }

  const nextY = {
    x: player.x,
    y: player.y + intent.y * step,
    w: player.w,
    h: player.h,
  };

  if (!inRiver(nextY)) {
    player.y = clamp(nextY.y, 0, WORLD.height - player.h);
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
  camera.x = clamp(player.x + player.w / 2 - viewW / 2, 0, WORLD.width - viewW);
  camera.y = clamp(player.y + player.h / 2 - viewH / 2, 0, WORLD.height - viewH);
}

function toScreen(wx, wy) {
  return { x: Math.round(wx - camera.x), y: Math.round(wy - camera.y) };
}

function drawGround() {
  ctx.fillStyle = "#7ad173";
  ctx.fillRect(0, 0, viewW, viewH);

  for (let y = 0; y < viewH; y += 40) {
    for (let x = (y / 2) % 20; x < viewW; x += 40) {
      ctx.fillStyle = "#8add80";
      ctx.fillRect(x, y, 5, 5);
    }
  }
}

function drawWorld() {
  const river = toScreen(WORLD.river.x, WORLD.river.y);
  ctx.fillStyle = "#4ea4ff";
  ctx.fillRect(river.x, river.y, WORLD.river.w, WORLD.river.h);

  const waveOffset = Math.floor((performance.now() / 120) % 22);
  for (let y = 0; y < WORLD.river.h; y += 26) {
    ctx.fillStyle = "#7dc6ff";
    ctx.fillRect(river.x + waveOffset, river.y + y, WORLD.river.w - 30, 5);
    ctx.fillStyle = "#2a7de0";
    ctx.fillRect(river.x + 12, river.y + y + 10, WORLD.river.w - 24, 4);
  }

  const bridge = toScreen(WORLD.bridge.x, WORLD.bridge.y);
  ctx.fillStyle = "#a57547";
  ctx.fillRect(bridge.x, bridge.y, WORLD.bridge.w, WORLD.bridge.h);
  ctx.fillStyle = "#6f4a2a";
  for (let x = 0; x < WORLD.bridge.w; x += 22) {
    ctx.fillRect(bridge.x + x, bridge.y + 8, 8, WORLD.bridge.h - 16);
  }

  ctx.fillStyle = "#eacb94";
  const pathLeft = toScreen(120, 705);
  ctx.fillRect(pathLeft.x, pathLeft.y, 860, 42);
  const pathRight = toScreen(1240, 705);
  ctx.fillRect(pathRight.x, pathRight.y, 840, 42);

  ctx.fillStyle = "#af86ff";
  for (let i = 0; i < 8; i += 1) {
    const tx = 140 + i * 240;
    const ty = i % 2 === 0 ? 380 : 980;
    const p = toScreen(tx, ty);
    ctx.fillRect(p.x, p.y, 22, 38);
    ctx.fillStyle = "#d2b0ff";
    ctx.fillRect(p.x - 10, p.y - 24, 42, 26);
    ctx.fillStyle = "#af86ff";
  }
}

function drawUnicorn(x, y, body, mane, outline, facingLeft) {
  const p = toScreen(x, y);
  const dir = facingLeft ? -1 : 1;

  ctx.fillStyle = outline;
  ctx.fillRect(p.x + 6, p.y + 6, 18, 18);
  ctx.fillRect(p.x + 20, p.y + 8, 10, 10);
  ctx.fillRect(p.x + 8, p.y + 20, 4, 10);
  ctx.fillRect(p.x + 18, p.y + 20, 4, 10);

  ctx.fillStyle = body;
  ctx.fillRect(p.x + 7, p.y + 7, 16, 16);
  ctx.fillRect(p.x + 21, p.y + 9, 8, 8);
  ctx.fillRect(p.x + 9, p.y + 21, 3, 8);
  ctx.fillRect(p.x + 18, p.y + 21, 3, 8);

  ctx.fillStyle = mane;
  if (dir > 0) {
    ctx.fillRect(p.x + 6, p.y + 9, 4, 10);
    ctx.fillRect(p.x + 21, p.y + 5, 6, 3);
  } else {
    ctx.fillRect(p.x + 20, p.y + 9, 4, 10);
    ctx.fillRect(p.x + 22, p.y + 5, 6, 3);
  }

  ctx.fillStyle = "#ffe270";
  if (dir > 0) {
    ctx.fillRect(p.x + 26, p.y + 4, 2, 6);
  } else {
    ctx.fillRect(p.x + 22, p.y + 4, 2, 6);
  }
}

function drawEntities() {
  drawUnicorn(WORLD.npc.x, WORLD.npc.y, "#f7f7ff", "#ff9bd4", "#2a2a38", true);

  const facingLeft = player.face === "left";
  const mane = player.face === "up" ? "#79e7ff" : "#ff77c4";
  drawUnicorn(player.x, player.y, "#ffffff", mane, "#2a2a38", facingLeft);
}

function drawPrompt() {
  if (!nearNpc() || dialogue.active) {
    return;
  }
  const pos = toScreen(WORLD.npc.x + 34, WORLD.npc.y - 12);
  ctx.fillStyle = "#101320";
  ctx.fillRect(pos.x, pos.y, 72, 24);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x, pos.y, 72, 24);
  ctx.fillStyle = "#ff9ad1";
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillText("ESPACIO", pos.x + 6, pos.y + 16);
}

function draw() {
  ctx.clearRect(0, 0, viewW, viewH);
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
  if (!lastTime) {
    lastTime = ts;
  }
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
  if (!input.touch.active || input.touch.id !== e.pointerId) {
    return;
  }
  const vec = touchVectorFromEvent(e);
  input.touch.dx = vec.nx;
  input.touch.dy = vec.ny;
  updateKnobVisual();
});

touchPad.addEventListener("pointerup", (e) => {
  if (input.touch.id === e.pointerId) {
    resetTouchPad();
  }
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
