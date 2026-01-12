const WIDE_SCREEN_BREAKPOINT = 700;

let uiContainer; // UI 的容器
let uiContentH = 0; // UI 实际高度（自动测量）

const UI_BASE_W = 320; // 你现在面板宽度基准
const UI_MIN_SCALE = 0.3;
const UI_MAX_SCALE = 1;
const UI_BOTTOM_BOOST = 1.18; // UI到下面时额外放大（1.1~1.25）
const UI_MAX_SCALE_BOTTOM = 1.25; // UI在下面允许放大到多少

let exportHeadBtn, exportHalfBtn, exportFullBtn;

let drawerShell, drawerPanel, drawerHandle;
let isDrawerOpen = true; // 默认打开（你也可以改成 false）
let lastIsMobile = null; // 用来检测屏幕模式切换

const MOBILE_DRAWER_H_RATIO = 0.42; // 手机抽屉占屏高度比例（0.35~0.5）
const MOBILE_DRAWER_MARGIN = 12; // 抽屉离屏幕边缘的间距
const MOBILE_DRAWER_RADIUS = 16; // 抽屉圆角

let randBtn;

// 用来存所有 UI 元素及其相对位置
let uiElements = []; // { el, relX, relY }

let groupBoxes = []; // 记录所有黑框
let uiBaseX = 4; // 当前框整体的左偏移（桌面默认 4）

function applyUIBaseX(newBaseX) {
  uiBaseX = Math.max(0, Math.round(newBaseX));

  // 移动所有框
  for (const b of groupBoxes) {
    b.box.position(uiBaseX, b.relY);
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
const DESKTOP_FIXED_SCALE = 1.36;
const MOBILE_AVATAR_AREA_RATIO = 0.65; // 窄屏：人物占屏幕高度比例（0.5~0.65）
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

  background(255);

  createUI();
  createDrawer();
  randomizeAvatar();
}

function createUIGroupTitle(label, relX, relY) {
  let p = createP(label);
  p.style("margin", "10px 0 0 0");
  p.style("font-weight", "800");
  p.style("font-size", "14px");
  registerUI(p, relX, relY);
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
  groupBoxes.push({ box, relY });

  return box;
}

function createUI() {
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
    () => cyclePart("hair", 1)
  );
  y += 40;

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
    () => cyclePart("top", 1)
  );
  y += 40;

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
    () => cyclePart("shoes", 1)
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

  // ======================
  // 浮动随机按钮
  // ======================
  randBtn = createButton("随机 Random");
  randBtn.mousePressed(randomizeAvatar);
  styleRandomButton(randBtn);

  // ✅ UI 实际高度：layoutUI() 的缩放/居中要用它
  uiContainer.style("height", y + "px");
  uiContentH = y;
  uiContainer.style("padding", "0px");
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
  drawAvatar();
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

    // 抽屉尺寸（像素）
    const drawerH = Math.floor(height * MOBILE_DRAWER_H_RATIO);
    const drawerW = Math.floor(width - MOBILE_DRAWER_MARGIN * 2);
    const centeredBaseX = (drawerW - (UI_BASE_W - 8)) / 2; // (drawerW - BOX_W) / 2
    applyUIBaseX(centeredBaseX);

    // 打开/关闭：关闭时只露出一点点高度（你可以调这个数）
    const PEEK_H = 44; // 关闭时露出的高度
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
      `${MOBILE_DRAWER_RADIUS}px ${MOBILE_DRAWER_RADIUS}px 0 0`
    );
    uiContainer.style("box-sizing", "border-box");
    uiContainer.style("overflow-y", "auto");
    uiContainer.style("overflow-x", "hidden");
    uiContainer.style("-webkit-overflow-scrolling", "touch");
    uiContainer.style("z-index", "9998");

    // ✅ 用 fixed 的 left/top（不要用 position()）
    uiContainer.style("left", MOBILE_DRAWER_MARGIN + "px");
    uiContainer.style("top", y + "px");

    // 随机按钮仍在右上角
    if (randBtn) {
      const m = 16;
      const w = randBtn.elt.offsetWidth || 140;
      randBtn.position(Math.round(width - w - m), m);
    }

    return; // ✅ 窄屏不走宽屏布局
  }

  // ========== 宽屏：正常右侧面板（禁用抽屉） ==========
  if (drawerShell) drawerShell.hide();

  // 宽屏用 absolute
  uiContainer.style("position", "absolute");
  uiContainer.style("overflow-y", "visible"); // 宽屏不需要内部滚动
  uiContainer.style("border", "none");
  uiContainer.style("background", "transparent");
  uiContainer.style("border-radius", "0");
  uiContainer.style("z-index", "1");

  const margin = 20;
  const avatarRightScreen = offsetX + 420 * scaleFactor;

  // 可用空间
  let availableH = height - 40;
  let availableW = width - (avatarRightScreen + margin) - 40;
  availableW = max(0, availableW);
  availableH = max(0, availableH);

  let sH = uiContentH > 0 ? availableH / uiContentH : 1;
  let sW = UI_BASE_W > 0 ? availableW / UI_BASE_W : 1;

  let uiScale = min(sH, sW);
  uiScale = constrain(uiScale, UI_MIN_SCALE, UI_MAX_SCALE);
  uiScale = Math.round(uiScale * 100) / 100;
  uiContainer.style("transform", `scale(${uiScale})`);

  // 右侧居中
  let panelX = avatarRightScreen + margin;

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
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;

  const centerX = isMobile ? BASE_W_MOBILE / 2 : AVATAR_CENTER_X;

  // ✅ 建议和 drawAvatar() 统一（画人物用的是 8）
  const SEAM_FIX = 8;

  // ====== 先把“人物各块在逻辑坐标系里的位置”算出来（必须用 centerX）======
  const headX = centerX - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

  const topX = centerX - BODY_TOP_W / 2;
  const topY = headY + HEAD_H - SEAM_FIX;

  const bottomX = centerX - BODY_BOTTOM_W / 2;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;

  const shoesX = centerX - SHOES_W / 2;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  // ====== 根据导出模式，决定裁切框（逻辑坐标系）======
  let x, y, w, h;

  if (mode === "head") {
    // 头部：头框外多留 10px
    x = headX - 10;
    y = headY - 10;
    w = HEAD_W + 20;
    h = HEAD_H + 20;
  } else if (mode === "half") {
    // 半身：头 + 上半身（到上衣底部）
    x = min(headX, topX) - 10;
    y = headY - 10;

    const halfBottomY = topY + BODY_TOP_H; // 上衣底部
    const rightMost = max(headX + HEAD_W, topX + BODY_TOP_W);

    w = rightMost - x + 10;
    h = halfBottomY - y + 20;
  } else if (mode === "full") {
    // 全身：头 + 上衣 + 下装 + 鞋
    x = min(headX, topX, bottomX, shoesX) - 10;
    y = headY - 10;

    const fullBottomY = shoesY + SHOES_H; // 鞋底
    const rightMost = max(
      headX + HEAD_W,
      topX + BODY_TOP_W,
      bottomX + BODY_BOTTOM_W,
      shoesX + SHOES_W
    );

    w = rightMost - x + 10;
    h = fullBottomY - y + 20;
  } else {
    // 容错：未知 mode 默认导出全身
    x = min(headX, topX, bottomX, shoesX) - 10;
    y = headY - 10;

    const fullBottomY = shoesY + SHOES_H;
    const rightMost = max(
      headX + HEAD_W,
      topX + BODY_TOP_W,
      bottomX + BODY_BOTTOM_W,
      shoesX + SHOES_W
    );

    w = rightMost - x + 10;
    h = fullBottomY - y + 20;
    mode = "full";
  }

  // ====== 把逻辑坐标 -> 屏幕坐标（考虑 offsetX / offsetY / scaleFactor）======
  let sx = Math.round(offsetX + x * scaleFactor);
  let sy = Math.round(offsetY + y * scaleFactor);
  let sw = Math.round(w * scaleFactor);
  let sh = Math.round(h * scaleFactor);

  // ✅ 防止超出画布导致截取空白/异常
  sx = constrain(sx, 0, width - 1);
  sy = constrain(sy, 0, height - 1);
  sw = constrain(sw, 1, width - sx);
  sh = constrain(sh, 1, height - sy);

  // ====== 截图并保存 ======
  const img = get(sx, sy, sw, sh);
  const filename = "avatar_" + mode;
  save(img, filename, exportFormat);
}

// 窗口尺寸变化时，让画布跟着变
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutUI();
}
