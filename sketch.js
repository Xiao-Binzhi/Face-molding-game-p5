const WIDE_SCREEN_BREAKPOINT = 600;

let uiContainer; // UI 的容器
let uiContentH = 0; // UI 实际高度（自动测量）

const UI_BASE_W = 320; // 你现在面板宽度基准
const UI_MIN_SCALE = 0.3;
const UI_MAX_SCALE = 1;

// 用来存所有 UI 元素及其相对位置
let uiElements = []; // { el, relX, relY }

function registerUI(el, relX, relY) {
  // 关键：把元素挂到 uiContainer 里
  el.parent(uiContainer);

  // 关键：元素在容器内部定位
  el.position(relX, relY);

  uiElements.push({ el, relX, relY });
}

// ==== 配置：每个部件有多少张图 ====
const HAIR_COUNT = 17;
const EYES_COUNT = 30;
const MOUTH_COUNT = 12;
const CHEEK_COUNT = 10;
const TOP_COUNT = 7;
const BOTTOM_COUNT = 2;
const SHOES_COUNT = 4;
const SHOES_COLOR_COUNT = 2;

// ==== 逻辑画布尺寸 & 人物位置（不随屏幕变）====
const BASE_W_DESKTOP = 1100;
const BASE_H_DESKTOP = 750;

const BASE_W_MOBILE = 520;
const BASE_H_MOBILE = 750;

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
// let shoesImgs = [];

let rSlider, gSlider, bSlider;

// 鞋子可调色（RGB）
let shoeR = 200;
let shoeG = 160;
let shoeB = 90;

// 鞋子分为“可上色层 + 线稿层”
let shoesColorImgs = [];
let shoesLineImgs = [];

// 导出格式
let exportFormatSelect;
let exportFormat = "png"; // 默认 png

// 当前缩放信息（导出要用）
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

let uiX = 0;
let uiY = 0;
let targetUiX = 0;
let targetUiY = 0;

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

  // ★ 鞋子线稿：shoes1.png ~ shoes4.png
  for (let i = 0; i < SHOES_COUNT; i++) {
    const path = `assets/body/shoes/shoes_line/shoes${i + 1}.png`;
    shoesLineImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }

  // ★ 鞋子颜色层：colors1.png ~ colors2.png
  for (let i = 0; i < SHOES_COLOR_COUNT; i++) {
    const path = `assets/body/shoes/shoes_fill/colors${i + 1}.png`;
    shoesColorImgs[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED to load:", path, err)
    );
  }
}

function setup() {
  // 画布大小 = 当前窗口大小（自适应）
  createCanvas(windowWidth, windowHeight);

  pixelDensity(2); // 先写 2，mac/retina 会更细腻
  smooth();

  background(245);

  createUI();
  randomizeAvatar();
}

function createUI() {
  uiContainer = createDiv();
  uiContainer.style("position", "absolute");
  uiContainer.style("left", "0px");
  uiContainer.style("top", "0px");
  uiContainer.style("width", "320px"); // 可选：给个面板宽度
  uiContainer.style("transform-origin", "top left");
  uiContainer.style("pointer-events", "auto");

  let y = 0; // 相对于 UI 面板原点的 y
  const x = 0; // 相对于 UI 面板原点的 x

  // 头部 - 发型
  createUISectionTitle("发型 Hair", x, y);
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
  createUISectionTitle("眼睛 Eyes", x, y);
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
  createUISectionTitle("嘴型 Mouth", x, y);
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
  createUISectionTitle("脸颊 Cheek", x, y);
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
  createUISectionTitle("上半身 Upper Body", x, y);
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
  createUISectionTitle("下半身 Lower Body", x, y);
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
  createUISectionTitle("鞋子 Shoes", x, y);
  y += 30;
  createPrevNextButtons(
    "鞋子",
    x,
    y,
    () => cyclePart("shoes", -1),
    () => cyclePart("shoes", 1)
  );
  y += 50;

  // —— 鞋子颜色（RGB）——
  createUISectionTitle("鞋子颜色 Shoes Color (RGB)", x, y);
  y += 30;

  // R
  rSlider = createSlider(0, 255, shoeR, 1);
  rSlider.input(() => (shoeR = rSlider.value()));
  registerUI(rSlider, x, y);
  y += 30;

  // G
  gSlider = createSlider(0, 255, shoeG, 1);
  gSlider.input(() => (shoeG = gSlider.value()));
  registerUI(gSlider, x, y);
  y += 30;

  // B
  bSlider = createSlider(0, 255, shoeB, 1);
  bSlider.input(() => (shoeB = bSlider.value()));
  registerUI(bSlider, x, y);
  y += 40;

  // 随机按钮
  let randBtn = createButton("随机一套 Random");
  randBtn.mousePressed(randomizeAvatar);
  registerUI(randBtn, x, y);
  y += 50;

  // 导出格式选择
  createUISectionTitle("导出格式 Export Format", x, y);
  y += 30;

  exportFormatSelect = createSelect();
  exportFormatSelect.option("png");
  exportFormatSelect.option("jpg");
  exportFormatSelect.selected("png");
  exportFormatSelect.changed(() => {
    exportFormat = exportFormatSelect.value();
  });
  registerUI(exportFormatSelect, x, y);

  y += 50;

  // 导出图片
  createUISectionTitle("导出图片 Export", x, y);
  y += 30;

  let headBtn = createButton("头部 Head");
  headBtn.mousePressed(() => exportAvatar("head"));
  registerUI(headBtn, x, y);

  let halfBtn = createButton("半身 Half");
  halfBtn.mousePressed(() => exportAvatar("half"));
  registerUI(halfBtn, x + 90, y);

  let fullBtn = createButton("全身 Full");
  fullBtn.mousePressed(() => exportAvatar("full"));
  registerUI(fullBtn, x + 180, y);

  y += 50;

  uiContainer.style("height", y + "px");
  uiContentH = y;
  uiContainer.style("padding", "0px");
}

function createUISectionTitle(label, relX, relY) {
  let p = createP(label);
  p.style("margin", "0");
  p.style("font-weight", "600");
  registerUI(p, relX, relY);
}

function createPrevNextButtons(label, relX, relY, onPrev, onNext) {
  let prevBtn = createButton("◀");
  prevBtn.mousePressed(onPrev);
  styleArrowButton(prevBtn);
  registerUI(prevBtn, relX, relY);

  let nextBtn = createButton("▶");
  nextBtn.mousePressed(onNext);
  styleArrowButton(nextBtn);
  registerUI(nextBtn, relX + 44, relY);
}

function styleArrowButton(btn) {
  btn.style("width", "40px");
  btn.style("height", "32px");
  btn.style("padding", "0");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "5px");
  btn.style("background", "#fff");
  btn.style("color", "#111");
  btn.style("cursor", "pointer");
  btn.style("display", "flex");
  btn.style("align-items", "center"); // 垂直居中
  btn.style("justify-content", "center"); // 水平居中
  btn.style("font-size", "16px");
  btn.style("text-align", "center");
  btn.style("box-shadow", "0");
  btn.style("transition", "all 140ms ease");

  btn.mouseOver(() => {
    btn.style("background", "#111");
    btn.style("color", "#fff");
  });

  btn.mouseOut(() => {
    btn.style("background", "#fff");
    btn.style("color", "#111");
  });
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
  // ✅ 随机鞋子颜色（RGB）
  shoeR = floor(random(256));
  shoeG = floor(random(256));
  shoeB = floor(random(256));
  // ✅ 同步滑条 UI
  if (rSlider) rSlider.value(shoeR);
  if (gSlider) gSlider.value(shoeG);
  if (bSlider) bSlider.value(shoeB);
}

function draw() {
  background(245);

  // 根据当前窗口计算缩放和偏移，让 BASE_W x BASE_H 适配屏幕
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;

  const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;
  const baseH = isMobile ? BASE_H_MOBILE : BASE_H_DESKTOP;

  scaleFactor = min(width / baseW, height / baseH);

  const drawW = Math.round(baseW * scaleFactor);
  const drawH = Math.round(baseH * scaleFactor);

  offsetX = Math.round((width - drawW) / 2);
  offsetY = Math.round((height - drawH) / 2);

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
  if (!uiContainer) return;

  const margin = 20;
  const avatarRightScreen = offsetX + 420 * scaleFactor;

  let panelX, panelY;

  // ===== UI 自适应缩放 =====

  let availableH, availableW;

  if (width > WIDE_SCREEN_BREAKPOINT) {
    availableH = height - 40;
    availableW = width - (avatarRightScreen + margin) - 40;
  } else {
    availableH = height - 40;
    availableW = width - 2 * margin;
  }

  // ✅ 防止负数导致缩放跳变
  availableW = max(0, availableW);
  availableH = max(0, availableH);

  let sH = uiContentH > 0 ? availableH / uiContentH : 1;
  let sW = UI_BASE_W > 0 ? availableW / UI_BASE_W : 1;

  let uiScale = min(sH, sW);

  // ✅ 用你上面的常量
  uiScale = constrain(uiScale, UI_MIN_SCALE, UI_MAX_SCALE);
  uiScale = Math.round(uiScale * 100) / 100;

  uiContainer.style("transform", `scale(${uiScale})`);

  if (width > WIDE_SCREEN_BREAKPOINT) {
    // 1) UI 放右侧
    panelX = avatarRightScreen + margin;

    // 2) 算人物中心 Y（和 drawAvatar 同一套定位）
    const headY = AVATAR_HEAD_TOP_Y;
    const SEAM_FIX = 8;

    const topY = headY + HEAD_H - SEAM_FIX;
    const bottomY = topY + BODY_TOP_H - SEAM_FIX;
    const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

    const avatarTopScreenReal = offsetY + headY * scaleFactor;
    const avatarBottomScreenReal = offsetY + (shoesY + SHOES_H) * scaleFactor;
    const avatarCenterY = (avatarTopScreenReal + avatarBottomScreenReal) / 2;

    // 3) 用缩放后的 UI 高度来居中
    const scaledUIH = uiContentH * uiScale;
    panelY = avatarCenterY - scaledUIH / 2;

    // 4) 防止 UI 掉出屏幕
    panelY = constrain(panelY, 20, height - scaledUIH - 20);
  } else {
    // 窄屏：UI 放人物下面
    panelX = margin;
    const avatarBottomScreen =
      offsetY +
      (AVATAR_HEAD_TOP_Y + HEAD_H + BODY_TOP_H + BODY_BOTTOM_H + SHOES_H + 40) *
        scaleFactor;
    panelY = avatarBottomScreen + margin;
  }

  // 位置取整，避免子像素抖动
  panelX = Math.round(panelX);
  panelY = Math.round(panelY);

  // ===== lerp 平滑 UI 位置（防跳、防硬切）=====
  targetUiX = panelX;
  targetUiY = panelY;

  // lerp 平滑跟随
  uiX = lerp(uiX, targetUiX, 0.15);
  uiY = lerp(uiY, targetUiY, 0.15);

  // 防止子像素抖动
  uiContainer.position(Math.round(uiX), Math.round(uiY));
}

// 画整个人物（头 + 身体）
function drawAvatar() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const centerX = isMobile ? BASE_W_MOBILE / 2 : AVATAR_CENTER_X;

  // ===== 基础定位 =====
  const headX = centerX - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

  // 消缝：让下一个区块往上盖住 8px
  const SEAM_FIX = 8;

  // 身体位置（新2头身）
  const topX = centerX - BODY_TOP_W / 2;
  const topY = headY + HEAD_H - SEAM_FIX;

  const bottomX = centerX - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;

  // 鞋子宽 216，需要以人物中心对齐
  const shoesX = centerX - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  // ===== 身体（只画素材，不画区块线框）=====
  const topImg = topImgs[currentTop];
  if (topImg) image(topImg, topX, topY, BODY_TOP_W, BODY_TOP_H);

  const bottomImg = bottomImgs[currentBottom];
  if (bottomImg)
    image(bottomImg, bottomX, bottomY, BODY_BOTTOM_W, BODY_BOTTOM_H);

  // currentShoes: 0~3 代表 shoes1~4
  const lineImg = shoesLineImgs[currentShoes];

  // shoes1-2 -> colors1, shoes3-4 -> colors2
  const colorIndex = currentShoes < 2 ? 0 : 1;
  const fillImg = shoesColorImgs[colorIndex];

  // 先画可上色的 fill（底层）
  if (fillImg) {
    push();
    tint(shoeR, shoeG, shoeB); // 这里用你 RGB 滑条变量
    image(fillImg, shoesX, shoesY, SHOES_W, SHOES_H);
    pop();
  }

  // 再画线稿 line（最上层）
  if (lineImg) {
    image(lineImg, shoesX, shoesY, SHOES_W, SHOES_H);
  }

  // ===== 头部贴图（顺序决定图层）=====
  // 嘴（最底）
  const mouthImg = mouthImgs[currentMouth];
  if (mouthImg) image(mouthImg, headX, headY, HEAD_W, HEAD_H);

  // 头发
  const hairImg = hairImgs[currentHair];
  if (hairImg) image(hairImg, headX, headY, HEAD_W, HEAD_H);

  // 脸颊
  const cheekImg = cheekImgs[currentCheek];
  if (cheekImg) image(cheekImg, headX, headY, HEAD_W, HEAD_H);

  // 眼睛（最上）
  const eyesImg = eyesImgs[currentEyes];
  if (eyesImg) image(eyesImg, headX, headY, HEAD_W, HEAD_H);
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

// 脸颊
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

  const SEAM_FIX = 2;

  const topX = AVATAR_CENTER_X - BODY_TOP_W / 2;
  const topY = headY + HEAD_H - SEAM_FIX;

  const bottomX = AVATAR_CENTER_X - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;

  const shoesX = AVATAR_CENTER_X - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

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
