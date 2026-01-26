const WIDE_SCREEN_BREAKPOINT = 700;

let cardTemplateImg = null; // 透卡模板永远在最上层
let toolMode = "avatar"; // "avatar" | "card"
let modeBtn;

let fileInput;

let uiContainer; // UI 的容器
let uiContentH = 0; // UI 实际高度（自动测量）

const UI_BASE_W = 320; // 面板宽度基准
const UI_MIN_SCALE = 0.3;
const UI_MAX_SCALE = 1;
const UI_SHIFT_X = 80; // UI整体右移量（px）

let exportHeadBtn, exportHalfBtn, exportFullBtn;

let drawerShell, drawerPanel, drawerHandle;
let isDrawerOpen = true; // 默认打开（你也可以改成 false）
let lastIsMobile = null; // 用来检测屏幕模式切换

const MOBILE_DRAWER_H_RATIO = 0.42; // 手机抽屉占屏高度比例（0.35~0.5）
const MOBILE_DRAWER_MARGIN = 12; // 抽屉离屏幕边缘的间距
const MOBILE_DRAWER_RADIUS = 16; // 抽屉圆角

let randBtn;

// ===== Card mode state =====
let userImg = null; // 用户上传的角色图
let userImgScale = 1; // 等比缩放
let userImgRot = 0; // 角度（度）
let userImgX = 0,
  userImgY = 0; // 图片中心点（画布坐标）
let isDraggingUserImg = false;
let dragDX = 0,
  dragDY = 0; // 鼠标点与中心点偏移

//全局工具函数区
function setUserImgScale(v) {
  userImgScale = constrain(v, 0.05, 0.4);
  if (scaleSlider) scaleSlider.value(userImgScale);
}

// ===== Card UI refs =====
let uploadBtn, scaleSlider, rotSlider, exportCardBtn;

// 用来存所有 UI 元素及其相对位置
let uiElements = []; // { el, relX, relY }

let groupBoxes = []; // 记录所有黑框
let uiBaseX = 4; // 当前框整体的左偏移（桌面默认 4）

function applyUIBaseX(newBaseX) {
  uiBaseX = Math.max(0, Math.round(newBaseX));

  // 移动所有框
  for (const b of groupBoxes) {
    b.box.position(uiBaseX + (b.relX || 0), b.relY);
  }

  // 移动所有 UI 元素
  for (const u of uiElements) {
    u.el.position(uiBaseX + u.relX, u.relY);
  }
}

function registerUI(el, relX, relY) {
  // 把元素挂到 uiContainer 里
  el.parent(uiContainer);

  // 元素在容器内部定位
  el.position(uiBaseX + relX, relY);

  el.style("z-index", "1"); // 永远在分组框上面

  uiElements.push({ el, relX, relY });
}

// ==== 配置：每个部件有多少张图 ====
const HAIR_COUNT = 17;
const EYES_COUNT = 31;
const MOUTH_COUNT = 12;
const CHEEK_COUNT = 10;
const TOP_COUNT = 7;
const BOTTOM_COUNT = 2;
const SHOES_COUNT = 5;
const SHOES_COLOR_COUNT = 3;

const OUTLINE_PX = 6; // 白边粗细（逻辑像素）

// ==== 逻辑画布尺寸 & 人物位置（不随屏幕变）====
const BASE_W_DESKTOP = 1100;
const BASE_H_DESKTOP = 750;

const BASE_W_MOBILE = 520;
const BASE_H_MOBILE = 750;

// 头像 / 身体的尺寸
const HEAD_W = 288;
const HEAD_H = 288;
const HEAD_RADIUS = 60; // 圆角半径

// 新身体三块尺寸（2头身总高 576 = 288 + 288）
const BODY_TOP_W = 216;
const BODY_TOP_H = 144;

const BODY_BOTTOM_W = 144;
const BODY_BOTTOM_H = 99;

const SHOES_W = 216;
const SHOES_H = 45;

// 人物中心点（x）和头部顶部 y（逻辑坐标系）
const AVATAR_CENTER_X = 250;
const AVATAR_HEAD_TOP_Y = 80;

// ===== Card preview area (logical coords) =====
// 透卡实际比例 70x100 -> 0.7
const CARD_ASPECT = 70 / 100;

// 在左侧预览区 给透卡预留的最大高度（逻辑坐标）
// 可以微调这两个数：越大，透卡在左侧显示越大
const CARD_MAX_H = 620; // 逻辑高度
const CARD_MAX_W = CARD_MAX_H * CARD_ASPECT;

// 透明窗口在卡片里的比例（0~1）
const CARD_WIN_RX = 0.0;
const CARD_WIN_RY = 0.1;
const CARD_WIN_RW = 1.0;
const CARD_WIN_RH = 0.7;

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
let rgbSwatch, rgbInput; // ✅ 颜色预览框 + RGB输入框

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

// 当前缩放信息
const DESKTOP_FIXED_SCALE = 1.5;
const MOBILE_AVATAR_AREA_RATIO = 0.65; // 窄屏：人物占屏幕高度比例（0.5~0.65）
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;

function loadImages(arr, count, pathFn) {
  for (let i = 0; i < count; i++) {
    const path = pathFn(i);
    arr[i] = loadImage(
      path,
      () => console.log("loaded:", path),
      (err) => console.error("FAILED:", path, err),
    );
  }
}

function preload() {
  loadImages(hairImgs, HAIR_COUNT, (i) => `assets/head/hair/hair${i + 1}.png`);
  loadImages(eyesImgs, EYES_COUNT, (i) => `assets/head/eyes/eyes${i + 1}.png`);
  loadImages(
    mouthImgs,
    MOUTH_COUNT,
    (i) => `assets/head/mouth/mouth${i + 1}.png`,
  );
  loadImages(
    cheekImgs,
    CHEEK_COUNT,
    (i) => `assets/head/cheek/cheek${i + 1}.png`,
  );
  loadImages(topImgs, TOP_COUNT, (i) => `assets/body/top/top${i + 1}.png`);
  loadImages(
    bottomImgs,
    BOTTOM_COUNT,
    (i) => `assets/body/bottom/bottom${i + 1}.png`,
  );
  loadImages(
    shoesLineImgs,
    SHOES_COUNT,
    (i) => `assets/body/shoes/shoes_line/shoes${i + 1}.png`,
  );
  loadImages(
    shoesColorImgs,
    SHOES_COLOR_COUNT,
    (i) => `assets/body/shoes/shoes_fill/colors${i + 1}.png`,
  );

  cardTemplateImg = loadImage(
    "assets/card/template.png",
    () => console.log("loaded template"),
    (err) => console.error("FAILED to load template", err),
  );
}

function setup() {
  // 画布大小 = 当前窗口大小（自适应）
  createCanvas(windowWidth, windowHeight);

  pixelDensity(2); // 先写 2，mac/retina 会更细腻
  smooth();

  background(255);

  createUI();
  // ✅ 只创建一次隐藏上传控件
  fileInput = createFileInput(handleUserImageUpload);
  fileInput.hide();

  createDrawer();
  randomizeAvatar();
}

function handleUserImageUpload(file) {
  if (!file || file.type !== "image") return;

  userImg = loadImage(file.data, () => {
    const r = getCardRect();

    // 初始居中
    userImgX = r.winX + r.winW / 2;
    userImgY = r.winY + r.winH / 2;

    // ✅ 初始缩放：让图片最长边能放进透明窗口（留 10% 边距）
    const s = min(r.winW / userImg.width, r.winH / userImg.height) * 0.9;

    // ✅ 用 setUserImgScale，别直接赋值（保证 0.05~0.4 约束 + slider 同步）
    setUserImgScale(s);

    // 初始旋转
    userImgRot = 0;

    // 同步 UI
    if (rotSlider) rotSlider.value(userImgRot);
  });
}

function createGroupBox(relX, relY, w, h) {
  const box = createDiv();
  box.parent(uiContainer);
  box.style("position", "absolute");
  box.style("background", "#fff");
  box.style("border", "3px solid #111");
  box.style("border-radius", "12px");
  box.style("box-sizing", "border-box");
  box.style("z-index", "0"); // ✅ 在最底层

  // ✅ 也用 uiBaseX 偏移
  box.position(uiBaseX + relX, relY);
  box.size(w, h);

  // ✅ 记录：之后窄屏时用来居中
  groupBoxes.push({ box, relX, relY });

  return box;
}

function createUI() {
  if (uiContainer) uiContainer.remove();
  uiContainer = createDiv();
  uiContainer.style("position", "absolute");
  uiContainer.style("left", "0px");
  uiContainer.style("top", "0px");
  uiContainer.style("width", UI_BASE_W + "px");
  uiContainer.style("transform-origin", "top left");
  uiContainer.style("pointer-events", "auto");

  // 如果你还在用抽屉滚动，这些保留没问题
  uiContainer.style("overflow-y", "auto");
  uiContainer.style("overflow-x", "hidden");
  uiContainer.style("-webkit-overflow-scrolling", "touch");

  // ✅ 很关键：每次重建 UI 先清空记录，避免旧框/旧元素残留导致位置错乱
  uiElements = [];
  groupBoxes = [];
  applyUIBaseX(4); // ✅ 宽屏默认整体左边距（你想调宽屏贴左/更靠右，就改这里）

  // ===== 可调参数（你后续想改间距就改这几个）=====
  const BOX_PAD_Y = 12; // 框内上下留白（越大越松）
  const BOX_PAD_X = 18; // 框内左边距（内容离框左边的距离）
  const GROUP_GAP = 18; // 框与框之间的距离（越大越松）
  const BOX_W = UI_BASE_W - 8; // 黑框宽度（保持不变，窄屏会自动居中）

  const x = BOX_PAD_X; // 内容相对“框左边”的 x（不要写死绝对像素）

  // ===== y 从 0 开始往下排 =====
  let y = 0;

  // 一个小工具：开始一个分组框
  function beginGroupBox() {
    const boxTop = y;
    const box = createGroupBox(0, boxTop, BOX_W, 10); // relX 一律用 0
    y = boxTop + BOX_PAD_Y; // 内容从框内开始（带上内边距）
    return { box, boxTop, contentTop: y };
  }

  // 一个小工具：结束一个分组框（回填高度，并把 y 移到下一组起点）
  function endGroupBox(g) {
    const contentEnd = y;
    const boxH = contentEnd - g.contentTop + BOX_PAD_Y * 2;

    // 注意：X 统一由 uiBaseX 控制，所以这里 position 用 uiBaseX
    g.box.position(uiBaseX, g.boxTop);
    g.box.size(BOX_W, boxH);

    // 下一组起点 = 当前框底部 + 组间距
    y = g.boxTop + boxH + GROUP_GAP;
  }

  if (toolMode === "card") {
    y = buildCardUI(x, y, beginGroupBox, endGroupBox);
    uiContainer.style("height", y + "px");
    uiContentH = y;

    // ✅ 整体外框（圆角矩形）
    uiContainer.style("background", "#fff");
    uiContainer.style("border", "3px solid #111");
    uiContainer.style("border-radius", "16px");
    uiContainer.style("box-sizing", "border-box");
    uiContainer.style("padding", "0px"); // 让外框和内部两组框有一点呼吸感（与捏脸间距接近）

    return;
  }

  // ======================
  // 头部组
  // ======================
  const headGroup = beginGroupBox();

  createUISectionTitle("发型 Hair", x, y);
  y += 30;
  createPrevNextButtons(
    "发型",
    x,
    y,
    () => cyclePart("hair", -1),
    () => cyclePart("hair", 1),
  );
  y += 40;

  createUISectionTitle("眼睛 Eyes", x, y);
  y += 30;
  createPrevNextButtons(
    "眼睛",
    x,
    y,
    () => cyclePart("eyes", -1),
    () => cyclePart("eyes", 1),
  );
  y += 40;

  createUISectionTitle("嘴型 Mouth", x, y);
  y += 30;
  createPrevNextButtons(
    "嘴型",
    x,
    y,
    () => cyclePart("mouth", -1),
    () => cyclePart("mouth", 1),
  );
  y += 40;

  createUISectionTitle("脸颊 Cheek", x, y);
  y += 30;
  createPrevNextButtons(
    "脸颊",
    x,
    y,
    () => cyclePart("cheek", -1),
    () => cyclePart("cheek", 1),
  );
  y += 40;

  endGroupBox(headGroup);

  // ======================
  // 身体组
  // ======================
  const bodyGroup = beginGroupBox();

  createUISectionTitle("上半身 Upper Body", x, y);
  y += 30;
  createPrevNextButtons(
    "上衣",
    x,
    y,
    () => cyclePart("top", -1),
    () => cyclePart("top", 1),
  );
  y += 40;

  createUISectionTitle("下半身 Lower Body", x, y);
  y += 30;
  createPrevNextButtons(
    "下装",
    x,
    y,
    () => cyclePart("bottom", -1),
    () => cyclePart("bottom", 1),
  );
  y += 40;

  endGroupBox(bodyGroup);

  // ======================
  // 鞋子组
  // ======================
  const shoesGroup = beginGroupBox();

  createUISectionTitle("鞋子 Shoes", x, y);
  y += 30;
  createPrevNextButtons(
    "鞋子",
    x,
    y,
    () => cyclePart("shoes", -1),
    () => cyclePart("shoes", 1),
  );
  y += 50;

  createUISectionTitle("鞋子颜色 Shoes Color (RGB)", x, y);
  y += 30;

  // ✅ 记录三条滑条开始的 y，用于把右侧组件对齐到同一高度
  const sliderStartY = y;

  // R
  rSlider = createSlider(0, 255, shoeR, 1);
  rSlider.input(() => {
    shoeR = rSlider.value();
    updateRGBUI();
  });
  registerUI(rSlider, x, y);
  y += 30;

  // G
  gSlider = createSlider(0, 255, shoeG, 1);
  gSlider.input(() => {
    shoeG = gSlider.value();
    updateRGBUI();
  });
  registerUI(gSlider, x, y);
  y += 30;

  // B
  bSlider = createSlider(0, 255, shoeB, 1);
  bSlider.input(() => {
    shoeB = bSlider.value();
    updateRGBUI();
  });
  registerUI(bSlider, x, y);
  y += 30;

  // ✅ 右侧：颜色预览框（放在三条滑条右边）
  const RGB_BOX_X = x + 170; // ✅ 改这个：越大越往右

  const SWATCH_W = 36; // ✅ 预览框宽度
  const SWATCH_H = 36; // ✅ 预览框高度

  const INPUT_W = 100; // ✅ 输入框宽度
  const INPUT_H = 34; // ✅ 输入框高度

  rgbSwatch = createDiv(""); // 预览框（显示颜色 + 文字）
  rgbSwatch.style("border", "3px solid #111");
  rgbSwatch.style("border-radius", "10px");
  rgbSwatch.style("box-sizing", "border-box");
  rgbSwatch.style("display", "flex");
  rgbSwatch.style("align-items", "center");
  rgbSwatch.style("justify-content", "center");
  rgbSwatch.style("font-weight", "700");
  rgbSwatch.style("font-size", "12px");
  registerUI(rgbSwatch, RGB_BOX_X, sliderStartY);
  rgbSwatch.size(SWATCH_W, SWATCH_H);

  rgbInput = createInput(""); // 输入框（可输入 255/255/255）
  rgbInput.attribute("placeholder", "255/255/255");
  rgbInput.style("width", INPUT_W + "px");
  rgbInput.style("height", INPUT_H + "px");
  rgbInput.style("border", "3px solid #111");
  rgbInput.style("border-radius", "10px");
  rgbInput.style("box-sizing", "border-box");
  rgbInput.style("padding", "0 5px");
  rgbInput.style("font-weight", "600");
  rgbInput.style("font-size", "13px");
  rgbInput.style("text-align", "center");
  registerUI(rgbInput, RGB_BOX_X, sliderStartY + SWATCH_H + 10);

  // ✅ 用户输入 -> 同步鞋子颜色 + 三条滑条
  rgbInput.changed(() => {
    const raw = (rgbInput.value() || "").trim();
    const parts = raw.split(/[\s,\/]+/).filter(Boolean);

    if (parts.length >= 3) {
      setShoeRGB(parts[0], parts[1], parts[2]);
    } else {
      // 格式不对就回滚显示
      updateRGBUI();
    }
  });

  // ✅ 初始化一次显示
  updateRGBUI();

  y = max(y, sliderStartY + SWATCH_H + 10 + INPUT_H + 12);

  endGroupBox(shoesGroup);

  // ======================
  // 导出组
  // ======================
  const exportGroup = beginGroupBox();
  const TITLE_TO_CONTROL_Y = 28; // 小标题到控件的距离
  const CONTROL_TO_NEXT_Y = 40; // 控件到下一段的距离

  createUISectionTitle("导出格式 Export Format", x, y);
  y += TITLE_TO_CONTROL_Y;

  exportFormatSelect = createSelect();
  exportFormatSelect.option("png");
  exportFormatSelect.option("jpg");
  exportFormatSelect.option("png_outline");
  exportFormatSelect.selected("png");
  exportFormatSelect.changed(() => {
    exportFormat = exportFormatSelect.value();
  });
  registerUI(exportFormatSelect, x, y);
  y += CONTROL_TO_NEXT_Y;

  createUISectionTitle("导出图片 Export", x, y);
  y += TITLE_TO_CONTROL_Y;

  exportHeadBtn = createButton("头部 Head");
  exportHeadBtn.mousePressed(() => exportAvatar("head"));
  registerUI(exportHeadBtn, x, y);

  exportHalfBtn = createButton("半身 Half");
  exportHalfBtn.mousePressed(() => exportAvatar("half"));
  registerUI(exportHalfBtn, x + 90, y);

  exportFullBtn = createButton("全身 Full");
  exportFullBtn.mousePressed(() => exportAvatar("full"));
  registerUI(exportFullBtn, x + 180, y);

  y += CONTROL_TO_NEXT_Y;

  endGroupBox(exportGroup);

  // ====================== 浮动随机按钮
  randBtn = createButton("随机 Random");
  randBtn.mousePressed(onRandomPressed);
  styleRandomButton(randBtn);

  // 初始在捏人模式，按钮提示“去透卡编辑”
  modeBtn = createButton("编辑卡片 Card");
  modeBtn.mousePressed(toggleToolMode);
  styleRandomButton(modeBtn);

  // ✅ UI 实际高度：layoutUI() 的缩放/居中要用它
  uiContainer.style("height", y + "px");
  uiContentH = y;
  uiContainer.style("padding", "0px");
}

function buildCardUI(x, y, beginGroupBox, endGroupBox) {
  y += 16;
  const contentW = 96;

  // ===== 卡片编辑（不再包黑框）=====
  uploadBtn = createButton("上传人物 Upload");
  uploadBtn.mousePressed(() => fileInput.elt.click());
  styleTextFitButton(uploadBtn);
  registerUI(uploadBtn, x, y);
  y += 60;

  const sLabel = createUILabel("缩放 Scale");
  registerUI(sLabel, x, y);
  y += 20;

  scaleSlider = createSlider(0.05, 0.4, userImgScale, 0.01);
  scaleSlider.input(() => setUserImgScale(scaleSlider.value()));
  styleCleanSlider(scaleSlider, contentW);
  registerUI(scaleSlider, x, y);
  y += 30;

  const rLabel = createUILabel("旋转 Rotate");
  registerUI(rLabel, x, y);
  y += 20;

  rotSlider = createSlider(0, 360, userImgRot, 1);
  rotSlider.input(() => (userImgRot = rotSlider.value()));
  styleCleanSlider(rotSlider, contentW);
  registerUI(rotSlider, x, y);
  y += 30;

  // 留一点组间距（和你原来的 GROUP_GAP 观感接近）
  y += 18;

  // ===== 导出（不再包黑框）=====
  exportCardBtn = createButton("导出卡片 PNG Export");
  exportCardBtn.mousePressed(exportCardPNG);
  styleTextFitButton(exportCardBtn);

  registerUI(exportCardBtn, x, y);
  y += 60;

  return y;
}

function createDrawer() {
  drawerShell = createDiv();
  drawerShell.style("position", "fixed");
  drawerShell.style("left", "0");
  drawerShell.style("bottom", "0");
  drawerShell.style("width", "100vw");
  drawerShell.style("pointer-events", "none"); // 让里面的 panel 接管点击
  drawerShell.hide();

  drawerPanel = createDiv();
  drawerPanel.parent(drawerShell);
  drawerPanel.style("position", "absolute");
  drawerPanel.style("left", "50%");
  drawerPanel.style("transform", "translateX(-50%)");
  drawerPanel.style("pointer-events", "auto");
  drawerPanel.style("background", "#fff");
  drawerPanel.style("border", "3px solid #111");
  drawerPanel.style("border-radius", "16px 16px 0 0");
  drawerPanel.style("box-sizing", "border-box");

  drawerHandle = createDiv();
  drawerHandle.parent(drawerPanel);
  drawerHandle.style("width", "44px");
  drawerHandle.style("height", "6px");
  drawerHandle.style("border-radius", "99px");
  drawerHandle.style("background", "#000000ff");
  drawerHandle.style("margin", "10px auto 8px auto");
  drawerHandle.style("cursor", "pointer");

  drawerHandle.mousePressed(() => {
    isDrawerOpen = !isDrawerOpen;
  });
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

function styleRandomButton(btn) {
  btn.style("height", "48px");
  btn.style("width", "120px");
  btn.style("padding", "0 12px");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "5px");
  btn.style("background", "#fff");
  btn.style("color", "#111");
  btn.style("cursor", "pointer");
  btn.style("display", "flex");
  btn.style("align-items", "center");
  btn.style("justify-content", "center");
  btn.style("font-size", "14px");
  btn.style("font-weight", "600");
  btn.style("transition", "all 140ms ease");
  btn.style("z-index", "9999");

  btn.mouseOver(() => {
    btn.style("background", "#111");
    btn.style("color", "#fff");
  });
  btn.mouseOut(() => {
    btn.style("background", "#fff");
    btn.style("color", "#111");
  });
}

function styleExportButton(btn, isMobile) {
  btn.style("height", "32px");
  btn.style("width", isMobile ? "88px" : "84px");
  btn.style("padding", "0");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "8px");
  btn.style("cursor", "pointer");
  btn.style("font-size", isMobile ? "13px" : "14px");
  btn.style("font-weight", "600");
  btn.style("display", "flex");
  btn.style("align-items", "center");
  btn.style("justify-content", "center");
  btn.style("transition", "all 140ms ease");

  // ✅ 只绑定一次 hover 事件
  if (!btn.elt.dataset.hoverBound) {
    btn.elt.dataset.hoverBound = "1";
    btn.elt.dataset.isHover = "0";

    btn.mouseOver(() => {
      btn.elt.dataset.isHover = "1";
      btn.style("background", "#111");
      btn.style("color", "#fff");
    });

    btn.mouseOut(() => {
      btn.elt.dataset.isHover = "0";
      btn.style("background", "#fff");
      btn.style("color", "#111");
    });
  }

  // ✅ 每帧根据状态决定最终颜色（避免被重置）
  const hovering = btn.elt.dataset.isHover === "1";
  btn.style("background", hovering ? "#111" : "#fff");
  btn.style("color", hovering ? "#fff" : "#111");
}

function createUILabel(text) {
  const d = createDiv(text);
  d.style("margin", "0");
  d.style("padding", "0");
  d.style("font-size", "16px");
  d.style("font-weight", "600");
  d.style("line-height", "16px");
  d.style("color", "#111");
  return d;
}

function bindHover(btn, normalBg, normalColor, hoverBg, hoverColor) {
  if (!btn || !btn.elt) return;

  // 初始态
  btn.style("background", normalBg);
  btn.style("color", normalColor);

  // 只绑定一次事件
  if (btn.elt.dataset.hoverBound) return;
  btn.elt.dataset.hoverBound = "1";

  btn.mouseOver(() => {
    btn.style("background", hoverBg);
    btn.style("color", hoverColor);
  });

  btn.mouseOut(() => {
    btn.style("background", normalBg);
    btn.style("color", normalColor);
  });
}

function stylePrimaryButton(btn, w) {
  btn.style("width", w + "px");
  btn.style("height", "36px");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "10px");
  btn.style("font-weight", "700");
  btn.style("font-size", "16px");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 140ms ease");

  // 默认黑底白字（捏脸界面如果你需要同款 primary 才用它）
  bindHover(btn, "#111", "#fff", "#fff", "#111");
}

function styleSecondaryButton(btn, w) {
  btn.style("width", w + "px");
  btn.style("height", "36px");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "10px");

  // 字体统一
  btn.style("font-size", "14px");
  btn.style("font-weight", "600");

  btn.style("cursor", "pointer");
  btn.style("transition", "all 140ms ease");

  bindHover(btn, "#fff", "#111", "#111", "#fff");
}

function styleCleanSlider(sl, w) {
  sl.style("width", w + "px");
  sl.style("margin", "0");
  sl.style("padding", "0");
}

function styleExportSelect(sel, isMobile) {
  sel.style("height", isMobile ? "30px" : "32px");
  sel.style("width", isMobile ? "120px" : "110px"); // ✅ 下拉框宽度
  sel.style("padding", "0 5px");
  sel.style("border", "3px solid #111");
  sel.style("border-radius", "8px");
  sel.style("background", "#fff");
  sel.style("color", "#111");
  sel.style("font-size", isMobile ? "13px" : "14px");
  sel.style("font-weight", "600");
  sel.style("outline", "none");
  sel.style("box-sizing", "border-box");
}

function styleTextFitButton(btn) {
  // 宽度跟文字走
  btn.style("width", "fit-content");
  btn.style("min-width", "0");
  btn.style("height", "36px");
  btn.style("padding", "0 14px"); // 关键：让按钮有左右留白
  btn.style("box-sizing", "border-box");
  btn.style("display", "inline-flex");
  btn.style("align-items", "center");
  btn.style("justify-content", "center");

  btn.style("border", "3px solid #111");
  btn.style("border-radius", "10px");

  btn.style("font-size", "14px");
  btn.style("font-weight", "600");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 140ms ease");

  // 默认白底黑字 + 悬停反色（你要求）
  bindHover(btn, "#fff", "#111", "#111", "#fff");
}

function clamp255(v) {
  v = int(v);
  return constrain(v, 0, 255);
}

function setShoeRGB(r, g, b) {
  shoeR = clamp255(r);
  shoeG = clamp255(g);
  shoeB = clamp255(b);

  if (rSlider) rSlider.value(shoeR);
  if (gSlider) gSlider.value(shoeG);
  if (bSlider) bSlider.value(shoeB);

  updateRGBUI();
}

function updateRGBUI() {
  const txt = `${shoeR}/${shoeG}/${shoeB}`;

  // 输入框：不打断用户正在输入
  if (rgbInput && document.activeElement !== rgbInput.elt) {
    rgbInput.value(txt);
  }

  // 颜色预览框
  if (rgbSwatch) {
    rgbSwatch.style("background", `rgb(${shoeR},${shoeG},${shoeB})`);
    rgbSwatch.html("");
  }
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

function getShoeColorIndex(shoeIdx) {
  if (shoeIdx <= 1) return 0; // shoes1-2 -> colors1
  if (shoeIdx <= 3) return 1; // shoes3-4 -> colors2
  return 2; // shoes5 -> colors3
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

  updateRGBUI();
}

function onRandomPressed() {
  if (toolMode === "card") randomizeCardPlacement();
  else randomizeAvatar();
}

function randomizeCardPlacement() {
  if (!userImg) return;

  const r = getCardRect();
  // 只限制“中心点”在透明窗口内
  setUserImgScale(random(0.05, 0.4));
  userImgRot = random(0, 360);

  userImgX = random(r.winX, r.winX + r.winW);
  userImgY = random(r.winY, r.winY + r.winH);

  if (rotSlider) rotSlider.value(userImgRot);
}

function toggleToolMode() {
  toolMode = toolMode === "avatar" ? "card" : "avatar";

  applyUIBaseX(4); // ✅ 每次切模式强制重置 X 基准
  // ✅ 切模式后重建右侧 UI
  createUI();
  if (modeBtn)
    modeBtn.html(toolMode === "avatar" ? "编辑卡片 Card" : "创建角色 Avatar");
}

function draw() {
  background(255);

  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;

  const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;
  const baseH = isMobile ? BASE_H_MOBILE : BASE_H_DESKTOP;

  let fitScale;

  if (!isMobile) {
    // ===== 宽屏：用整个屏幕 fit =====
    fitScale = min(width / baseW, height / baseH);

    // 固定 1.36，但屏幕装不下就缩小
    scaleFactor = min(DESKTOP_FIXED_SCALE, fitScale);

    const drawW = Math.round(baseW * scaleFactor);
    const drawH = Math.round(baseH * scaleFactor);

    offsetX = Math.round((width - drawW) / 2);
    offsetY = Math.round((height - drawH) / 2);
  } else {
    // ===== 窄屏：人物只用“上半区域” fit，避免被抽屉挡住 =====
    const avatarAreaH = height * MOBILE_AVATAR_AREA_RATIO;

    fitScale = min(width / baseW, avatarAreaH / baseH);
    scaleFactor = fitScale;

    const drawW = Math.round(baseW * scaleFactor);
    const drawH = Math.round(baseH * scaleFactor);

    offsetX = Math.round((width - drawW) / 2);

    // 注意：这里是“在 avatarAreaH 内居中”，不是在整个 height 内居中
    offsetY = Math.round((avatarAreaH - drawH) / 2);
  }

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  if (toolMode === "card")
    drawCardEditor(); // ✅ 卡片模式左侧预览
  else drawAvatar(); // ✅ 捏脸模式原样

  pop();

  layoutUI();
}

function layoutUI() {
  if (!uiContainer) return;

  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;

  // ✅ 每帧/每次布局都按当前模式刷新导出控件尺寸
  if (exportFormatSelect) styleExportSelect(exportFormatSelect, isMobile);
  if (exportHeadBtn) styleExportButton(exportHeadBtn, isMobile);
  if (exportHalfBtn) styleExportButton(exportHalfBtn, isMobile);
  if (exportFullBtn) styleExportButton(exportFullBtn, isMobile);
  if (randBtn) randBtn.style("width", isMobile ? "80px" : "120px");
  if (modeBtn) modeBtn.style("width", isMobile ? "80px" : "120px");

  // ✅ 随机按钮：窄屏 80px / 宽屏 120px
  if (randBtn) {
    randBtn.style("width", isMobile ? "80px" : "120px");
  }

  // ===== 检测从窄屏 <-> 宽屏的切换，做一次性清理 =====
  if (lastIsMobile === null) lastIsMobile = isMobile;

  if (isMobile !== lastIsMobile) {
    if (!isMobile) {
      // ✅ 从窄屏回到宽屏：强制关抽屉壳
      if (drawerShell) drawerShell.hide();

      applyUIBaseX(4);

      // ✅ 把 UI 从抽屉里“拔出来”（防止还在 drawerPanel 里面）
      uiContainer.parent(document.body);

      // ✅ 清掉窄屏抽屉遗留样式（避免看起来还像抽屉）
      uiContainer.style("position", "absolute");
      uiContainer.style("width", UI_BASE_W + "px");
      uiContainer.style("height", uiContentH + "px");
      uiContainer.style("background", "transparent");
      uiContainer.style("border", "none");
      uiContainer.style("border-radius", "0");
      uiContainer.style("overflow-y", "visible");
      uiContainer.style("overflow-x", "visible");
      uiContainer.style("left", "0px");
      uiContainer.style("top", "0px");
    } else {
      // ✅ 从宽屏进入窄屏：显示抽屉壳（如果你需要它）
      if (drawerShell) drawerShell.show();
      // 如果你希望 UI 放进抽屉壳里对齐：
      // uiContainer.parent(drawerPanel);
    }

    lastIsMobile = isMobile;
  }

  // ========== 窄屏：UI 当抽屉固定在底部 ==========
  if (isMobile) {
    // 宽屏用的样式别带过来
    uiContainer.style("transform", "scale(1)");
    uiContainer.style("position", "fixed"); // 让它真的贴在屏幕底部

    const drawerH = Math.floor(height * MOBILE_DRAWER_H_RATIO);

    // ✅ 捏脸模式：全宽抽屉；卡片模式：同样用 UI_BASE_W 的宽度体系（更窄）
    const drawerW =
      toolMode === "card"
        ? Math.min(UI_BASE_W, Math.floor(width - MOBILE_DRAWER_MARGIN * 2))
        : Math.floor(width - MOBILE_DRAWER_MARGIN * 2);

    const centeredBaseX = (drawerW - (UI_BASE_W - 8)) / 2;

    // ✅ 卡片也需要居中 baseX（否则内容会贴左）
    applyUIBaseX(centeredBaseX);

    // 打开/关闭：关闭时只露出一点点高度（你可以调这个数）
    const PEEK_H = 44; // 关闭时露出的高度
    // ✅ 卡片模式额外往下推（像素）
    const CARD_MOBILE_Y_PUSH = toolMode === "card" ? 40 : 0;
    const y = isDrawerOpen
      ? height - drawerH - MOBILE_DRAWER_MARGIN
      : height - PEEK_H;

    // 应用位置 & 外观
    uiContainer.style("width", drawerW + "px");
    uiContainer.style("height", drawerH + "px");
    uiContainer.style("background", "none");
    uiContainer.style("border", "none");
    uiContainer.style(
      "border-radius",
      `${MOBILE_DRAWER_RADIUS}px ${MOBILE_DRAWER_RADIUS}px 0 0`,
    );
    uiContainer.style("box-sizing", "border-box");
    uiContainer.style("overflow-y", "auto");
    uiContainer.style("overflow-x", "hidden");
    uiContainer.style("-webkit-overflow-scrolling", "touch");
    uiContainer.style("z-index", "9998");

    // ✅ 用 fixed 的 left/top（不要用 position()）
    uiContainer.style("left", MOBILE_DRAWER_MARGIN + "px");
    uiContainer.style("top", y + "px");

    if (toolMode === "card") {
      uiContainer.style("background", "#fff");
      uiContainer.style("border", "3px solid #111");
    } else {
      uiContainer.style("background", "none");
      uiContainer.style("border", "none");
    }

    // 随机按钮仍在右上角
    if (randBtn) {
      const m = 16;
      const w = randBtn.elt.offsetWidth || 140;
      randBtn.position(Math.round(width - w - m), m);
    }

    if (modeBtn) {
      const m = 16;
      modeBtn.position(m, m); // 模式切换按钮在左上角
    }

    return; // ✅ 窄屏不走宽屏布局
  }

  // ========== 宽屏：正常右侧面板（禁用抽屉） ==========
  if (drawerShell) drawerShell.hide();

  // 宽屏用 absolute
  uiContainer.style("position", "absolute");
  uiContainer.style("overflow-y", "visible");
  uiContainer.style("z-index", "1");

  uiContainer.style("position", "absolute");
  uiContainer.style("overflow-y", "visible");
  uiContainer.style("z-index", "1");

  if (toolMode === "card") {
    // ✅ 卡片模式保留外框（与你 createUI 里一致）
    uiContainer.style("background", "#fff");
    uiContainer.style("border", "3px solid #111");
    uiContainer.style("border-radius", "16px");
    uiContainer.style("box-sizing", "border-box");
    uiContainer.style("padding", "16px 4px 8px 4px");
  } else {
    // ✅ 捏脸模式保持原逻辑：透明无外框
    uiContainer.style("border", "none");
    uiContainer.style("background", "transparent");
    uiContainer.style("border-radius", "0");
    uiContainer.style("padding", "0px");
  }

  const margin = 20;
  const avatarRightScreen = offsetX + 420 * scaleFactor;

  // 可用空间
  let availableH = height - 40;
  let availableW = width - (avatarRightScreen + margin) - 40;
  availableW = max(0, availableW);
  availableH = max(0, availableH);

  let sH = uiContentH > 0 ? availableH / uiContentH : 1;
  let sW = UI_BASE_W > 0 ? availableW / UI_BASE_W : 1;

  let uiScale = 1;

  if (toolMode !== "card") {
    uiScale = min(sH, sW);
    uiScale = constrain(uiScale, UI_MIN_SCALE, UI_MAX_SCALE);
    uiScale = Math.round(uiScale * 100) / 100;
  }

  uiContainer.style("transform", `scale(${uiScale})`);

  // 右侧ui
  let panelX = avatarRightScreen + margin + UI_SHIFT_X;

  const headY = AVATAR_HEAD_TOP_Y;
  const SEAM_FIX = 8;
  const topY = headY + HEAD_H - SEAM_FIX;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  const avatarTopScreenReal = offsetY + headY * scaleFactor;
  const avatarBottomScreenReal = offsetY + (shoesY + SHOES_H) * scaleFactor;
  const avatarCenterY = (avatarTopScreenReal + avatarBottomScreenReal) / 2;

  const scaledUIH = uiContentH * uiScale;
  let panelY = avatarCenterY - scaledUIH / 2;
  panelY = constrain(panelY, 20, height - scaledUIH - 20);

  uiContainer.position(Math.round(panelX), Math.round(panelY));

  if (randBtn) {
    const m = 16;
    const w = randBtn.elt.offsetWidth || 140;
    randBtn.position(Math.round(width - w - m), m);
  }

  if (modeBtn) {
    const m = 16;
    modeBtn.position(m, m); // ✅ 宽屏：左上角
  }
}

function renderAvatar(g, centerX) {
  const headX = centerX - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;
  const SEAM_FIX = 8;

  const topX = centerX - BODY_TOP_W / 2;
  const topY = headY + HEAD_H - SEAM_FIX;

  const bottomX = centerX - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;

  const shoesX = centerX - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  g.noStroke();
  g.fill("#f5d2c2ff");
  g.rect(headX, headY, HEAD_W, HEAD_H, HEAD_RADIUS);

  const topImg = topImgs[currentTop];
  if (topImg) g.image(topImg, topX, topY, BODY_TOP_W, BODY_TOP_H);

  const bottomImg = bottomImgs[currentBottom];
  if (bottomImg)
    g.image(bottomImg, bottomX, bottomY, BODY_BOTTOM_W, BODY_BOTTOM_H);

  const lineImg = shoesLineImgs[currentShoes];
  const fillImg =
    shoesColorImgs[
      constrain(getShoeColorIndex(currentShoes), 0, SHOES_COLOR_COUNT - 1)
    ];

  if (fillImg) {
    g.push();
    g.tint(shoeR, shoeG, shoeB);
    g.image(fillImg, shoesX, shoesY, SHOES_W, SHOES_H);
    g.pop();
  }
  if (lineImg) g.image(lineImg, shoesX, shoesY, SHOES_W, SHOES_H);

  const mouthImg = mouthImgs[currentMouth];
  if (mouthImg) g.image(mouthImg, headX, headY, HEAD_W, HEAD_H);

  const hairImg = hairImgs[currentHair];
  if (hairImg) g.image(hairImg, headX, headY, HEAD_W, HEAD_H);

  const cheekImg = cheekImgs[currentCheek];
  if (cheekImg) g.image(cheekImg, headX, headY, HEAD_W, HEAD_H);

  const eyesImg = eyesImgs[currentEyes];
  if (eyesImg) g.image(eyesImg, headX, headY, HEAD_W, HEAD_H);
}

function drawAvatar() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const centerX = isMobile ? BASE_W_MOBILE / 2 : AVATAR_CENTER_X;
  renderAvatar(this, centerX);
}

function getCardRect() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;

  // 卡片在左侧区域的中心点（你原来就这么定的风格）
  const cx = isMobile ? baseW / 2 : AVATAR_CENTER_X;
  const cy = 350; //

  const cardH = CARD_MAX_H;
  const cardW = CARD_MAX_W;

  const x = cx - cardW / 2;
  const y = cy - cardH / 2;

  // 透明窗口（按比例换算到逻辑坐标）
  const winX = x + cardW * CARD_WIN_RX;
  const winY = y + cardH * CARD_WIN_RY;
  const winW = cardW * CARD_WIN_RW;
  const winH = cardH * CARD_WIN_RH;

  return { x, y, cardW, cardH, winX, winY, winW, winH, cx, cy };
}

function drawCheckerboard(x, y, w, h, cell = 18) {
  noStroke();
  for (let yy = 0; yy < h; yy += cell) {
    for (let xx = 0; xx < w; xx += cell) {
      const isDark = (xx / cell + yy / cell) % 2 === 0;
      fill(isDark ? 210 : 240);
      rect(x + xx, y + yy, min(cell, w - xx), min(cell, h - yy));
    }
  }
}

function drawCardStage() {
  // 左侧预览区用的中心点：保持跟你 avatar 一样的左侧区域观感
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;

  // 让透卡在左侧区域居中显示（逻辑坐标）
  // 你原来人物中心在 AVATAR_CENTER_X=250，卡片也用类似的中心更像“同一分区”
  const cx = isMobile ? baseW / 2 : AVATAR_CENTER_X;
  const cy = 375; // 逻辑 y 中心点（你可微调：越大越靠下）

  // 在左侧预览区里，透卡尺寸（按比例）
  const cardH = CARD_MAX_H;
  const cardW = CARD_MAX_W;

  const x = cx - cardW / 2;
  const y = cy - cardH / 2;

  // 占位：透卡模板在这个区域里
  noFill();
  stroke(0);
  strokeWeight(3);
  rect(x, y, cardW, cardH, 18);

  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("透卡模板预览区（待上传）", cx, cy);
}

function drawCardEditor() {
  const r = getCardRect();

  // ✅ 透明窗口棋盘格（在模板下）
  drawCheckerboard(r.winX, r.winY, r.winW, r.winH, 18);

  // 先画用户图（裁剪到透明窗口）
  if (userImg) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(r.winX, r.winY, r.winW, r.winH);
    drawingContext.clip();

    push();
    translate(userImgX, userImgY);
    rotate(radians(userImgRot));
    scale(userImgScale);
    imageMode(CENTER);
    image(userImg, 0, 0);
    pop();

    drawingContext.restore();
  }

  // 模板永远最上层
  if (cardTemplateImg) {
    image(cardTemplateImg, r.x, r.y, r.cardW, r.cardH);
  }

  // 卡片外框
  noFill();
  stroke(0);
  strokeWeight(3);
  rect(r.x, r.y, r.cardW, r.cardH);
}

// ==== 导出功能（考虑缩放和偏移）====
function exportAvatar(mode) {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const centerX = isMobile ? BASE_W_MOBILE / 2 : AVATAR_CENTER_X;

  const SEAM_FIX = 8;
  const isOutline = exportFormat === "png_outline";
  const PAD = isOutline ? OUTLINE_PX : 0; // ✅ 仅白边模式留边距=白边宽度

  // ===== 逻辑坐标下的位置 =====
  const headX = centerX - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

  const topX = centerX - BODY_TOP_W / 2;
  const topY = headY + HEAD_H - SEAM_FIX;

  const bottomX = centerX - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;

  const shoesX = centerX - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  // ===== 裁切框（逻辑坐标）=====
  let x, y, w, h;

  if (mode === "head") {
    const left = headX;
    const top = headY;
    const right = headX + HEAD_W;
    const bottom = headY + HEAD_H;

    x = left - PAD;
    y = top - PAD;
    w = right - left + PAD * 2;
    h = bottom - top + PAD * 2;
  } else if (mode === "half") {
    const left = Math.min(headX, topX);
    const top = headY;
    const right = Math.max(headX + HEAD_W, topX + BODY_TOP_W);
    const bottom = bottomY; // 你之前为避免露出裤子这样写是对的

    x = left - PAD;
    y = top - PAD;
    w = right - left + PAD * 2;
    h = bottom - top + PAD * 2;
  } else {
    mode = "full";
    const left = Math.min(headX, topX, bottomX, shoesX);
    const top = headY;
    const right = Math.max(
      headX + HEAD_W,
      topX + BODY_TOP_W,
      bottomX + BODY_BOTTOM_W,
      shoesX + SHOES_W,
    );
    const bottom = shoesY + SHOES_H;

    x = left - PAD;
    y = top - PAD;
    w = right - left + PAD * 2;
    h = bottom - top + PAD * 2;
  }

  const EXPORT_SCALE = 4;

  const outW = Math.round(w * EXPORT_SCALE);
  const outH = Math.round(h * EXPORT_SCALE);

  const pg = createGraphics(outW, outH);
  pg.pixelDensity(1);

  // 背景：png / png_outline 透明；jpg 白底
  if (exportFormat === "png" || isOutline) pg.clear();
  else pg.background(255);

  pg.push();
  pg.scale(EXPORT_SCALE);
  pg.translate(-x, -y);
  renderAvatar(pg, centerX);
  pg.pop();

  let outImg;
  if (isOutline) {
    outImg = addWhiteOutline(pg, Math.round(OUTLINE_PX * EXPORT_SCALE));
    save(outImg, "avatar_" + mode, "png"); // 强制 png
  } else {
    outImg = pg.get();
    save(outImg, "avatar_" + mode, exportFormat);
  }
}

function exportCardPNG() {
  const r = getCardRect();

  const EXPORT_SCALE = 4; // 清晰度：2/3/4
  const outW = Math.round(r.cardW * EXPORT_SCALE);
  const outH = Math.round(r.cardH * EXPORT_SCALE);

  const pg = createGraphics(outW, outH);
  pg.pixelDensity(1);
  pg.clear(); // ✅ 透明背景

  pg.push();
  pg.scale(EXPORT_SCALE);

  // 坐标系：卡片左上角 = (0,0)
  const localWinX = r.winX - r.x;
  const localWinY = r.winY - r.y;

  // 1) 上传图片（在模板下，且仅在透明窗内）
  if (userImg) {
    pg.drawingContext.save();
    pg.drawingContext.beginPath();
    pg.drawingContext.rect(localWinX, localWinY, r.winW, r.winH);
    pg.drawingContext.clip();

    pg.push();
    pg.translate(userImgX - r.x, userImgY - r.y);
    pg.rotate(radians(userImgRot));
    pg.scale(userImgScale);
    pg.imageMode(CENTER);
    pg.image(userImg, 0, 0);
    pg.pop();

    pg.drawingContext.restore(); // ✅ 必须 restore
  }

  // 2) 模板（永远最上层）
  if (cardTemplateImg) {
    pg.imageMode(CORNER);
    pg.image(cardTemplateImg, 0, 0, r.cardW, r.cardH);
  }

  pg.pop();

  // ✅ 只导出卡片内容（模板 + 用户图），没有棋盘格/外框/任何 UI
  save(pg, "card_export", "png");
}

// 窗口尺寸变化时，让画布跟着变
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutUI();
}

function addWhiteOutline(srcPg, radiusPx) {
  // radiusPx: 像素级描边半径（已经乘了 EXPORT_SCALE）
  const w = srcPg.width;
  const h = srcPg.height;

  // 读原图像素
  srcPg.loadPixels();
  const sp = srcPg.pixels;

  // 新建描边层
  const outlinePg = createGraphics(w, h);
  outlinePg.pixelDensity(1);
  outlinePg.clear();
  outlinePg.loadPixels();
  const op = outlinePg.pixels;

  // 提前算一个圆形邻域（比 r^2 全扫快很多）
  const offsets = [];
  const r2 = radiusPx * radiusPx;
  for (let dy = -radiusPx; dy <= radiusPx; dy++) {
    for (let dx = -radiusPx; dx <= radiusPx; dx++) {
      if (dx * dx + dy * dy <= r2) offsets.push([dx, dy]);
    }
  }

  // 对每个透明像素：如果它附近存在非透明像素 -> 画成白色（描边）
  // （只做外描边，不覆盖人物内部）
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = 4 * (y * w + x);
      const a = sp[idx + 3];
      if (a !== 0) continue; // 只处理透明处（外轮廓）

      let near = false;
      for (let k = 0; k < offsets.length; k++) {
        const dx = offsets[k][0];
        const dy = offsets[k][1];
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nidx = 4 * (ny * w + nx);
        if (sp[nidx + 3] !== 0) {
          near = true;
          break;
        }
      }

      if (near) {
        op[idx] = 255; // R
        op[idx + 1] = 255; // G
        op[idx + 2] = 255; // B
        op[idx + 3] = 255; // A
      }
    }
  }

  outlinePg.updatePixels();

  // 合成：描边在下面，人物在上面
  const merged = createGraphics(w, h);
  merged.pixelDensity(1);
  merged.clear();
  merged.image(outlinePg, 0, 0);
  merged.image(srcPg, 0, 0);

  return merged.get();
}

function screenToWorld(mx, my) {
  return {
    x: (mx - offsetX) / scaleFactor,
    y: (my - offsetY) / scaleFactor,
  };
}

function mousePressed() {
  if (toolMode !== "card" || !userImg) return;

  const m = screenToWorld(mouseX, mouseY);
  const r = getCardRect();

  // 只要点在卡片范围内，就允许“抓住图片移动”
  if (m.x < r.x || m.x > r.x + r.cardW || m.y < r.y || m.y > r.y + r.cardH)
    return;

  isDraggingUserImg = true;
  dragDX = m.x - userImgX;
  dragDY = m.y - userImgY;
}

function mouseDragged() {
  if (!isDraggingUserImg) return;

  const m = screenToWorld(mouseX, mouseY);
  userImgX = m.x - dragDX;
  userImgY = m.y - dragDY;
}

function mouseReleased() {
  isDraggingUserImg = false;
}
