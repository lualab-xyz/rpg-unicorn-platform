const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const textCanvas = document.getElementById("pixel-text-layer");
const textCtx = textCanvas.getContext("2d");

const dialogBox = document.getElementById("dialog-box");
const dialogSpeaker = document.getElementById("dialog-speaker");
const dialogText = document.getElementById("dialog-text");
const choicesBox = document.getElementById("choices-box");
const choicesList = document.getElementById("choices-list");

const touchPad = document.getElementById("touch-pad");
const padKnob = document.getElementById("pad-knob");
const btnTalk = document.getElementById("btn-talk");
const btnSelect = document.getElementById("btn-select");
const hudTop = document.querySelector(".hud-top");
const hudPanels = Array.from(document.querySelectorAll(".hud-top .panel"));
const hudNav = document.getElementById("hud-nav");
const hudPrev = document.getElementById("hud-prev");
const hudNext = document.getElementById("hud-next");

const TILE = 16;
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

const assets = {
  tileset: new Image(),
  player: new Image(),
  npc: new Image(),
  panel: new Image(),
  button: new Image(),
  font: new Image(),
};

const fontAtlas = {
  chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?+-/ '",
  cols: 8,
  glyphW: 6,
  glyphH: 8,
};

let viewW = 0;
let viewH = 0;
let viewportScale = 1;
let viewportWidthWorld = 0;
let viewportHeightWorld = 0;
let lastTime = 0;
let activeHudPanelIndex = 0;

function loadAssets() {
  const files = [
    ["tileset", "./assets/sprites/tileset.png"],
    ["player", "./assets/sprites/unicorn_player.png"],
    ["npc", "./assets/sprites/unicorn_npc.png"],
    ["panel", "./assets/ui/panel-9slice.png"],
    ["button", "./assets/ui/button-9slice.png"],
    ["font", "./assets/ui/font-6x8.png"],
  ];

  return Promise.all(
    files.map(([key, src]) =>
      new Promise((resolve, reject) => {
        assets[key].onload = resolve;
        assets[key].onerror = reject;
        assets[key].src = src;
      }),
    ),
  );
}

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

  const dprText = window.devicePixelRatio || 1;
  textCanvas.width = Math.floor(viewW * dprText);
  textCanvas.height = Math.floor(viewH * dprText);
  textCanvas.style.width = `${viewW}px`;
  textCanvas.style.height = `${viewH}px`;
  textCtx.setTransform(dprText, 0, 0, dprText, 0, 0);
  textCtx.imageSmoothingEnabled = false;

  updateHudCarousel();
  renderDialogue();
}

function isMobileHudMode() {
  return window.innerWidth <= 720;
}

function updateHudCarousel() {
  const mobile = isMobileHudMode();
  if (!hudNav) return;
  hudNav.hidden = !mobile;
  hudPanels.forEach((panel, idx) => {
    const active = !mobile || idx === activeHudPanelIndex;
    panel.classList.toggle("is-active", active);
  });
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
  const wrapped = paginateText(node.text, dialogText);
  dialogSpeaker.textContent = node.speaker;
  dialogText.textContent = wrapped.visible;
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

function paginateText(text, el) {
  if (!el) return { visible: text, hasMore: false };
  const scale = 2;
  const charPx = fontAtlas.glyphW * scale;
  const linePx = fontAtlas.glyphH * scale + 2;
  const rect = el.getBoundingClientRect();
  const maxChars = Math.max(8, Math.floor(rect.width / charPx));
  const maxLines = Math.max(2, Math.floor(rect.height / linePx));
  const lines = wrapText((text || "").trim(), maxChars);
  const visibleLines = lines.slice(0, maxLines);
  return {
    visible: visibleLines.join(" "),
    hasMore: lines.length > maxLines,
  };
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

function drawTile(tileIndex, dx, dy) {
  const cols = 8;
  const sx = (tileIndex % cols) * TILE;
  const sy = Math.floor(tileIndex / cols) * TILE;
  ctx.drawImage(assets.tileset, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
}

function drawGround() {
  const startX = Math.floor(camera.x / TILE) * TILE;
  const startY = Math.floor(camera.y / TILE) * TILE;
  const endX = camera.x + viewportWidthWorld + TILE;
  const endY = camera.y + viewportHeightWorld + TILE;

  for (let y = startY; y < endY; y += TILE) {
    for (let x = startX; x < endX; x += TILE) {
      const sx = x - camera.x;
      const sy = y - camera.y;
      const check = ((x / TILE) + (y / TILE)) % 2;
      drawTile(check === 0 ? 0 : 1, sx, sy);
      if (((x / TILE) * 13 + (y / TILE) * 7) % 29 === 0) {
        drawTile(2, sx, sy);
      }
    }
  }
}

function drawWorld() {
  const river = toScreen(WORLD.river.x, WORLD.river.y);
  const phase = Math.floor(performance.now() / 220) % 2;
  for (let y = 0; y < WORLD.river.h; y += TILE) {
    for (let x = 0; x < WORLD.river.w; x += TILE) {
      const v = ((x / TILE) + (y / TILE) + phase) % 2;
      drawTile(v === 0 ? 5 : 6, river.x + x, river.y + y);
    }
  }

  const bridge = toScreen(WORLD.bridge.x, WORLD.bridge.y);
  for (let y = 0; y < WORLD.bridge.h; y += TILE) {
    for (let x = 0; x < WORLD.bridge.w; x += TILE) {
      drawTile(7, bridge.x + x, bridge.y + y);
    }
  }

  const pathZones = [
    { x: 120, y: 705, w: 860, h: 42 },
    { x: 1240, y: 705, w: 840, h: 42 },
  ];
  pathZones.forEach((zone) => {
    const p = toScreen(zone.x, zone.y);
    for (let y = 0; y < zone.h; y += TILE) {
      for (let x = 0; x < zone.w; x += TILE) {
        const v = ((x / TILE) + (y / TILE)) % 2;
        drawTile(v === 0 ? 3 : 4, p.x + x, p.y + y);
      }
    }
  });

  for (let i = 0; i < 8; i += 1) {
    const tx = 140 + i * 240;
    const ty = i % 2 === 0 ? 380 : 980;
    const p = toScreen(tx, ty);
    drawTile(8, p.x + 3, p.y + 10);
    drawTile(9 + (i % 2), p.x, p.y);
  }
}

function drawCharacter(sprite, worldX, worldY, frame) {
  const p = toScreen(worldX, worldY);
  ctx.drawImage(sprite, frame * TILE, 0, TILE, TILE, p.x, p.y, TILE, TILE);
}

function drawEntities() {
  drawCharacter(assets.npc, WORLD.npc.x, WORLD.npc.y, 0);
  drawCharacter(assets.player, player.x, player.y, player.animFrame);
}

function drawPrompt() {
  if (!nearNpc() || dialogue.active) return;

  const pos = toScreen(WORLD.npc.x + 22, WORLD.npc.y - 10);
  drawNineSlice(assets.panel, pos.x, pos.y, 56, 14, 4);
  drawBitmapText("SPACE", pos.x + 6, pos.y + 3, "#ff9ad1", 1);
}

function drawNineSlice(img, x, y, w, h, b) {
  const s = img.width;
  const c = b;
  const mW = s - c * 2;
  const mH = s - c * 2;

  ctx.drawImage(img, 0, 0, c, c, x, y, c, c);
  ctx.drawImage(img, s - c, 0, c, c, x + w - c, y, c, c);
  ctx.drawImage(img, 0, s - c, c, c, x, y + h - c, c, c);
  ctx.drawImage(img, s - c, s - c, c, c, x + w - c, y + h - c, c, c);

  ctx.drawImage(img, c, 0, mW, c, x + c, y, w - c * 2, c);
  ctx.drawImage(img, c, s - c, mW, c, x + c, y + h - c, w - c * 2, c);
  ctx.drawImage(img, 0, c, c, mH, x, y + c, c, h - c * 2);
  ctx.drawImage(img, s - c, c, c, mH, x + w - c, y + c, c, h - c * 2);
  ctx.drawImage(img, c, c, mW, mH, x + c, y + c, w - c * 2, h - c * 2);
}

function draw() {
  ctx.clearRect(0, 0, viewportWidthWorld, viewportHeightWorld);
  drawGround();
  drawWorld();
  drawEntities();
  drawPrompt();
  drawUiText();
}

function drawGlyph(ch, x, y, color, scale = 2) {
  const upper = ch.toUpperCase();
  const index = fontAtlas.chars.indexOf(upper);
  if (index < 0) return;
  const sx = (index % fontAtlas.cols) * fontAtlas.glyphW;
  const sy = Math.floor(index / fontAtlas.cols) * fontAtlas.glyphH;

  textCtx.drawImage(
    assets.font,
    sx,
    sy,
    fontAtlas.glyphW,
    fontAtlas.glyphH,
    x,
    y,
    fontAtlas.glyphW * scale,
    fontAtlas.glyphH * scale,
  );

  if (color) {
    textCtx.globalCompositeOperation = "source-atop";
    textCtx.fillStyle = color;
    textCtx.fillRect(x, y, fontAtlas.glyphW * scale, fontAtlas.glyphH * scale);
    textCtx.globalCompositeOperation = "source-over";
  }
}

function drawBitmapText(text, x, y, color = "#ffffff", scale = 2) {
  let cursor = 0;
  for (const ch of text) {
    drawGlyph(ch, x + cursor, y, color, scale);
    cursor += fontAtlas.glyphW * scale;
  }
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawBlockText(selector, color = "#ffffff", scale = 2, maxLines = 6) {
  document.querySelectorAll(selector).forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const lineHeight = fontAtlas.glyphH * scale + 2;
    const maxChars = Math.max(1, Math.floor(rect.width / (fontAtlas.glyphW * scale)));
    const lines = wrapText((el.textContent || "").trim(), maxChars).slice(0, maxLines);
    lines.forEach((line, i) => {
      drawBitmapText(line, Math.floor(rect.left), Math.floor(rect.top + i * lineHeight), color, scale);
    });
  });
}

function drawUiText() {
  textCtx.clearRect(0, 0, viewW, viewH);
  drawBlockText(".stats h1", "#ff9ad1", 2, 1);
  drawBlockText(".stats p", "#ffffff", 2, 1);
  drawBlockText(".title", "#ffffff", 2, 1);
  drawBlockText(".mini-map", "#ffffff", 2, 1);
  drawBlockText(".menu p", "#ffffff", 2, 1);
  drawBlockText(".speaker", "#ff9ad1", 2, 1);
  drawBlockText(".text", "#ffffff", 2, 3);
  drawBlockText(".choices-title", "#ffffff", 2, 1);
  drawBlockText(".choice-item", "#ffffff", 2, 1);
  drawBlockText(".action", "#ffffff", 2, 1);
  drawBlockText(".hud-nav-btn", "#ffffff", 2, 1);
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

if (hudPrev) {
  hudPrev.addEventListener("click", () => {
    activeHudPanelIndex = (activeHudPanelIndex - 1 + hudPanels.length) % hudPanels.length;
    updateHudCarousel();
  });
}

if (hudNext) {
  hudNext.addEventListener("click", () => {
    activeHudPanelIndex = (activeHudPanelIndex + 1) % hudPanels.length;
    updateHudCarousel();
  });
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("resize", resize);

async function start() {
  await loadAssets();
  resize();
  updateCamera();
  requestAnimationFrame(loop);
}

start();
