const WIDE_SCREEN_BREAKPOINT = 600;

// 用来存所有 UI 元素及其相对位置
let uiElements = []; // { el, relX, relY }

function registerUI(el, relX, relY) {
  uiElements.push({ el, relX, relY });
}

// ==== 配置：每个部件有多少张图 ====
const HAIR_COUNT = 17;
const EYES_COUNT = 30;
const MOUTH_COUNT = 12;
const CHEEK_COUNT = 10;
const TOP_COUNT = 7;
const BOTTOM_COUNT = 2;
const SHOES_COUNT = 2;

// ==== 逻辑画布尺寸 & 人物位置（不随屏幕变）====
const BASE_W = 1100;
const BASE_H = 750;

// 头像 / 身体的尺寸（按你要求）
const HEAD_W = 288;
const HEAD_H = 288;
const HEAD_RADIUS = 50; // 圆角半径

// 新身体三块尺寸（2头身总高 576 = 288 + 288）
const BODY_TOP_W = 216;
const BODY_TOP_H = 144;

const BODY_BOTTOM_W = 144;
const BODY_BOTTOM_H = 99;

const SHOES_W = 216;
const SHOES_H = 45;

// 区块线框厚度（后面你会调透明）
const BLOCK_STROKE = 8;

const BLOCK_STROKE_ALPHA = 0; // 0=完全透明，255=完全可见

// 人物中心点（x）和头部顶部 y（逻辑坐标系）
const AVATAR_CENTER_X = 250;
const AVATAR_HEAD_TOP_Y = 80;

// UI 起始 x，根据屏幕宽度在 setup 里决定
let UI_START_X;

// ==== 当前选择的 index ====
let currentHair = 0;
let currentEyes = 0;
let currentMouth = 0;
let currentCheek = 0;
let currentTop = 0;
let currentBottom = 0;
let currentShoes = 0;

// ==== 图片数组 ====
let hairImgs = [];
let eyesImgs = [];
let mouthImgs = [];
let cheekImgs = [];
let topImgs = [];
let bottomImgs = [];
let shoesImgs = [];

// 导出格式
let exportFormatSelect;
let exportFormat = "png"; // 默认 png

// 当前缩放信息（导出要用）
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

function preload() {
  // 发型：hair1.png ~ hair8.png
  for (let i = 0; i < HAIR_COUNT; i++) {
    const path = `assets/head/hair/hair${i + 1}.png`;
    hairImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // 眼睛：eyes1.png ~ eyes19.png
  for (let i = 0; i < EYES_COUNT; i++) {
    const path = `assets/head/eyes/eyes${i + 1}.png`;
    eyesImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // 嘴：mouth1.png ~ mouthN.png
  for (let i = 0; i < MOUTH_COUNT; i++) {
    const path = `assets/head/mouth/mouth${i + 1}.png`;
    mouthImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // ★ 脸颊：cheek1.png ~ cheekN.png
  for (let i = 0; i < CHEEK_COUNT; i++) {
    const path = `assets/head/cheek/cheek${i + 1}.png`;
    cheekImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // ★ 上衣：top1.png ~ topN.png
  for (let i = 0; i < TOP_COUNT; i++) {
    const path = `assets/body/top/top${i + 1}.png`;
    topImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // ★ 下装：bottom1.png ~ bottomN.png
  for (let i = 0; i < BOTTOM_COUNT; i++) {
    const path = `assets/body/bottom/bottom${i + 1}.png`;
    bottomImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // ★ 鞋子：shoes1.png ~ shoesN.png
  for (let i = 0; i < SHOES_COUNT; i++) {
    const path = `assets/body/shoes/shoes${i + 1}.png`;
    shoesImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }
}

function setup() {
  // 画布大小 = 当前窗口大小（自适应）
  createCanvas(windowWidth, windowHeight);

  background(245);

  createUI();
  randomizeAvatar();
}

function createUI() {
  let y = 0; // 相对于 UI 面板原点的 y
  const x = 0; // 相对于 UI 面板原点的 x

  // 头部 - 发型
  createUISectionTitle("头部 - 发型", x, y);
  y += 30;
  createPrevNextButtons(
    "发型",
    x,
    y,
    () => cyclePart("hair", -1),
    () => cyclePart("hair", 1)
  );
  y += 40;

  // 头部 - 眼睛
  createUISectionTitle("头部 - 眼睛", x, y);
  y += 30;
  createPrevNextButtons(
    "眼睛",
    x,
    y,
    () => cyclePart("eyes", -1),
    () => cyclePart("eyes", 1)
  );
  y += 40;

  // 头部 - 嘴型
  createUISectionTitle("头部 - 嘴型", x, y);
  y += 30;
  createPrevNextButtons(
    "嘴型",
    x,
    y,
    () => cyclePart("mouth", -1),
    () => cyclePart("mouth", 1)
  );
  y += 40;

  // 头部 - 脸颊
  createUISectionTitle("头部 - 脸颊", x, y);
  y += 30;
  createPrevNextButtons(
    "脸颊",
    x,
    y,
    () => cyclePart("cheek", -1),
    () => cyclePart("cheek", 1)
  );
  y += 40;

  // 上半身
  createUISectionTitle("上半身", x, y);
  y += 30;
  createPrevNextButtons(
    "上衣",
    x,
    y,
    () => cyclePart("top", -1),
    () => cyclePart("top", 1)
  );
  y += 40;

  // 下半身
  createUISectionTitle("下半身", x, y);
  y += 30;
  createPrevNextButtons(
    "下装",
    x,
    y,
    () => cyclePart("bottom", -1),
    () => cyclePart("bottom", 1)
  );
  y += 40;

  // 鞋子
  createUISectionTitle("鞋子", x, y);
  y += 30;
  createPrevNextButtons(
    "鞋子",
    x,
    y,
    () => cyclePart("shoes", -1),
    () => cyclePart("shoes", 1)
  );
  y += 50;

  // 随机按钮
  let randBtn = createButton("随机一套");
  randBtn.mousePressed(randomizeAvatar);
  registerUI(randBtn, x, y);
  y += 50;

  // 导出格式选择
  createUISectionTitle("导出格式", x, y - 10);
  exportFormatSelect = createSelect();
  exportFormatSelect.option("png");
  exportFormatSelect.option("jpg");
  exportFormatSelect.selected("png");
  exportFormatSelect.changed(() => {
    exportFormat = exportFormatSelect.value();
  });
  registerUI(exportFormatSelect, x, y + 10);

  y += 60;

  // 导出按钮：头部 / 半身 / 全身
  createUISectionTitle("导出图片", x, y - 10);

  let headBtn = createButton("导出头部");
  headBtn.mousePressed(() => exportAvatar("head"));
  registerUI(headBtn, x, y + 10);

  let halfBtn = createButton("导出半身");
  halfBtn.mousePressed(() => exportAvatar("half"));
  registerUI(halfBtn, x + 90, y + 10);

  let fullBtn = createButton("导出全身");
  fullBtn.mousePressed(() => exportAvatar("full"));
  registerUI(fullBtn, x + 180, y + 10);
}

function createUISectionTitle(label, relX, relY) {
  let p = createP(label);
  p.style("margin", "0");
  p.style("font-weight", "600");
  registerUI(p, relX, relY);
}

function createPrevNextButtons(label, relX, relY, onPrev, onNext) {
  let span = createSpan(label + "：");
  registerUI(span, relX, relY + 5);

  let prevBtn = createButton("◀");
  prevBtn.mousePressed(onPrev);
  registerUI(prevBtn, relX + 60, relY);

  let nextBtn = createButton("▶");
  nextBtn.mousePressed(onNext);
  registerUI(nextBtn, relX + 100, relY);
}

// 切换某个部件的 index
function cyclePart(part, dir) {
  switch (part) {
    case "hair":
      currentHair = wrapIndex(currentHair + dir, HAIR_COUNT);
      break;
    case "eyes":
      currentEyes = wrapIndex(currentEyes + dir, EYES_COUNT);
      break;
    case "mouth":
      currentMouth = wrapIndex(currentMouth + dir, MOUTH_COUNT);
      break;
    case "cheek":
      currentCheek = wrapIndex(currentCheek + dir, CHEEK_COUNT);
      break;
    case "top":
      currentTop = wrapIndex(currentTop + dir, TOP_COUNT);
      break;
    case "bottom":
      currentBottom = wrapIndex(currentBottom + dir, BOTTOM_COUNT);
      break;
    case "shoes":
      currentShoes = wrapIndex(currentShoes + dir, SHOES_COUNT);
      break;
  }
}

function wrapIndex(i, count) {
  if (count <= 0) return 0;
  return (i + count) % count;
}

function randomizeAvatar() {
  currentHair = floor(random(HAIR_COUNT));
  currentEyes = floor(random(EYES_COUNT));
  currentMouth = floor(random(MOUTH_COUNT));
  currentCheek = floor(random(CHEEK_COUNT));
  currentTop = floor(random(TOP_COUNT));
  currentBottom = floor(random(BOTTOM_COUNT));
  currentShoes = floor(random(SHOES_COUNT));
}

function draw() {
  background(245);

  // 根据当前窗口计算缩放和偏移，让 BASE_W x BASE_H 适配屏幕
  scaleFactor = min(width / BASE_W, height / BASE_H);
  const drawW = BASE_W * scaleFactor;
  const drawH = BASE_H * scaleFactor;
  offsetX = (width - drawW) / 2;
  offsetY = (height - drawH) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // 在逻辑坐标系里画人物
  drawAvatar();

  pop();

  // 画完人物后，再根据最新的 offset/scale 布局 UI
  layoutUI();
}

function layoutUI() {
  if (uiElements.length === 0) return;

  const margin = 20;

  // 人物顶部（头像上方略留一点边距）
  const avatarTopScreen = offsetY + (AVATAR_HEAD_TOP_Y - 10) * scaleFactor;

  // 人物右侧的 x 坐标（黑框最右附近），这里简单用 BASE_W 的一部分估算
  const avatarRightScreen = offsetX + 420 * scaleFactor; // 250 中心 + 288/2 + 一点余量

  let panelX, panelY;

  if (width > WIDE_SCREEN_BREAKPOINT) {
    // 宽屏：UI 放在人物右边，顶部对齐
    panelX = avatarRightScreen + margin;
    panelY = avatarTopScreen;
  } else {
    // 窄屏：UI 放在人物下面，从左侧开始
    panelX = margin;
    const avatarBottomScreen =
      offsetY +
      (AVATAR_HEAD_TOP_Y + HEAD_H + BODY_TOP_H + BODY_BOTTOM_H + SHOES_H + 40) *
        scaleFactor;
    panelY = avatarBottomScreen + margin;
  }

  // 按相对偏移重新布局所有 UI 元素
  for (const item of uiElements) {
    item.el.position(panelX + item.relX, panelY + item.relY);
  }
}

// 画整个人物（头 + 身体）
function drawAvatar() {
  const headX = AVATAR_CENTER_X - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

  const topX = AVATAR_CENTER_X - BODY_TOP_W / 2;
  const topY = headY + HEAD_H;

  const bottomX = AVATAR_CENTER_X - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H;

  const shoesX = AVATAR_CENTER_X - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H;

  // ==== 整体外框（黑线包裹整个人）====
  push();
  noFill();
  stroke(0);
  strokeWeight(4);

  const margin = 20;
  const left = min(headX, topX, bottomX, shoesX) - margin;
  const right =
    max(
      headX + HEAD_W,
      topX + BODY_TOP_W,
      bottomX + BODY_BOTTOM_W,
      shoesX + SHOES_W
    ) + margin;
  const top = headY - margin;
  const bottom = shoesY + SHOES_H + margin;
  const frameW = right - left;
  const frameH = bottom - top;

  rect(left, top, frameW, frameH, 20);
  pop();

  // ==== 身体 ====
  // 下半身外框
  push();
  stroke(0, BLOCK_STROKE_ALPHA);
  strokeWeight(BLOCK_STROKE);
  noFill();
  rect(bottomX, bottomY, BODY_BOTTOM_W, BODY_BOTTOM_H, 15);

  // 画下装图片（贴合区块）
  const bottomImg = bottomImgs[currentBottom];
  if (bottomImg)
    image(bottomImg, bottomX, bottomY, BODY_BOTTOM_W, BODY_BOTTOM_H);

  pop();

  // 鞋子外框
  push();
  stroke(0, BLOCK_STROKE_ALPHA);
  strokeWeight(BLOCK_STROKE);
  noFill();
  rect(shoesX, shoesY, SHOES_W, SHOES_H, 10);

  // 画鞋子图片
  const shoesImg = shoesImgs[currentShoes];
  if (shoesImg) image(shoesImg, shoesX, shoesY, SHOES_W, SHOES_H);

  pop();

  // 上半身外框
  push();
  stroke(0, BLOCK_STROKE_ALPHA);
  strokeWeight(BLOCK_STROKE);
  noFill();
  rect(topX, topY, BODY_TOP_W, BODY_TOP_H, 20);

  // 画上衣图片
  const topImg = topImgs[currentTop];
  if (topImg) image(topImg, topX, topY, BODY_TOP_W, BODY_TOP_H);

  pop();

  // ==== 头部 ====
  push();
  noStroke();
  fill(255);
  rect(headX, headY, HEAD_W, HEAD_H, HEAD_RADIUS);
  pop();

  // ★ 2. 头发
  drawHair(headX, headY);

  // ★ 1. 脸颊
  drawCheek(headX, headY);

  // ★ 4. 嘴巴
  drawMouth(headX, headY);

  // ★ 3. 眼睛
  drawEyes(headX, headY);
}

// 头发
function drawHair(headX, headY) {
  const img = hairImgs[currentHair];
  if (img) {
    image(img, headX, headY, HEAD_W, HEAD_H);
  }
}

// 眼睛
function drawEyes(headX, headY) {
  const img = eyesImgs[currentEyes];
  if (img) {
    image(img, headX, headY, HEAD_W, HEAD_H);
    return;
  }
}

// 嘴巴
function drawMouth(headX, headY) {
  const img = mouthImgs[currentMouth];
  if (img) {
    image(img, headX, headY, HEAD_W, HEAD_H);
    return;
  }
}

// 脸颊（用 PNG 画）
function drawCheek(headX, headY) {
  const img = cheekImgs[currentCheek];
  if (img) {
    // 和头发/眼睛/嘴一样，整张铺在 288x288 的头框上
    image(img, headX, headY, HEAD_W, HEAD_H);
  }
}

// ==== 导出功能（考虑缩放和偏移）====
function exportAvatar(mode) {
  const headX = AVATAR_CENTER_X - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

  const topX = AVATAR_CENTER_X - BODY_TOP_W / 2;
  const topY = headY + HEAD_H;

  const bottomX = AVATAR_CENTER_X - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H;

  const shoesX = AVATAR_CENTER_X - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H;

  let x, y, w, h;

  if (mode === "head") {
    x = headX - 10;
    y = headY - 10;
    w = HEAD_W + 20;
    h = HEAD_H + 20;
  } else if (mode === "half") {
    x = min(headX, topX) - 10;
    y = headY - 10;
    const bottomHalfY = topY + BODY_TOP_H;
    w = max(headX + HEAD_W, topX + BODY_TOP_W) - x + 10;
    h = bottomHalfY - y + 20;
  } else {
    x = min(headX, topX, bottomX, shoesX) - 10;
    y = headY - 10;
    const bottomFullY = shoesY + SHOES_H;
    w =
      max(
        headX + HEAD_W,
        topX + BODY_TOP_W,
        bottomX + BODY_BOTTOM_W,
        shoesX + SHOES_W
      ) -
      x +
      10;
    h = bottomFullY - y + 20;
  }

  // 把逻辑坐标转换成屏幕坐标（考虑缩放和偏移）
  const sx = offsetX + x * scaleFactor;
  const sy = offsetY + y * scaleFactor;
  const sw = w * scaleFactor;
  const sh = h * scaleFactor;

  const img = get(sx, sy, sw, sh);
  const filename = "avatar_" + mode;
  save(img, filename, exportFormat);
}

// 窗口尺寸变化时，让画布跟着变
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutUI();
}
