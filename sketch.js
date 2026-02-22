const WIDE_SCREEN_BREAKPOINT = 1200;

let cardTemplateImg = null; // 透卡模板永远在最上层

let fileInputAvatar, uploadAvatarBtn, deleteAvatarBtn;

let introOverlay = null;
let introCard = null;
let introBtn = null;

let showIntro = true;

let uploadedAvatarImg = null;
let drawerHandle = null;

const DEBUG_LOADING = false;

let uiContainer; // UI 的容器
let uiContentH = 0; // UI 实际高度（自动测量）

let mobileAvatarAreaHPx = null; // 窄屏预览区域的“当前高度”（用于动画）
const MOBILE_AVATAR_LERP = 0.12; // 动画速度：0.08~0.2 都行

const UI_BASE_W = 320; // 放到最前

let UI_PANEL_W = UI_BASE_W;
let UI_RIGHT_COL_X = 0;

const UI_Z_MOBILE = 2;
const UI_Z_DESKTOP = 1;

const MOBILE_PEEK_H = 44; // 抽屉关闭时露出高度
const DESKTOP_MARGIN = 20; // layoutUI 宽屏 margin

const RIGHT_COL_SHIFT = 0; //导出部分UI 的右移位置

const UI_SHIFT_X = 80; // UI整体右移量（px）
const SEAM_FIX = 8; // 拼接缝修正

const USER_IMG_SCALE_MIN = 0.05; //缩放滑条的最小值
const USER_IMG_SCALE_MAX = 1.8; // 缩放滑条的最大值

let exportHeadBtn, exportHalfBtn, exportFullBtn;
let exportCardComboBtn;

let isDrawerOpen = true; // 默认打开
let lastIsMobile = null; // 用来检测屏幕模式切换

const MOBILE_DRAWER_H_RATIO = 0.4; // 手机抽屉占屏高度比例（0.35~0.5）
const MOBILE_DRAWER_MARGIN = 12; // 抽屉离屏幕边缘的间距
const MOBILE_DRAWER_RADIUS = 16; // 抽屉圆角

let randBtn;

const EXPORT_SCALE_NORMAL = 4; // 普通 png/jpg
const EXPORT_SCALE_OUTLINE = 4; // png_outline 专用
// ===== Card mode state =====
let userImgScale = 1; // 等比缩放
let userImgRot = 0; // 角度（度）
let userImgX = 0,
  userImgY = 0; // 图片中心点（画布坐标）
let isDraggingUserImg = false;
let dragDX = 0,
  dragDY = 0; // 鼠标点与中心点偏移

//全局工具函数区
function setUserImgScale(v) {
  userImgScale = constrain(v, USER_IMG_SCALE_MIN, USER_IMG_SCALE_MAX);

  // 自动同步滑条显示（避免程序改了值但滑条不动）
  if (scaleSlider && scaleSlider.value() !== userImgScale) {
    scaleSlider.value(userImgScale);
  }
}

function syncPlacementUI() {
  if (scaleSlider) scaleSlider.value(userImgScale);
  if (rotSlider) rotSlider.value(userImgRot);
}

// ===== Card UI refs =====
let scaleSlider, rotSlider;

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
// 可微调这两个数：越大，透卡在左侧显示越大
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
let rgbSwatch, rgbInput; // 颜色预览框 + RGB输入框

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
      () => {
        if (DEBUG_LOADING) console.log("loaded:", path);
      },
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
    () => {
      if (DEBUG_LOADING) console.log("loaded template");
    },
    (err) => console.error("FAILED to load template", err),
  );
}

function showIntroOverlay() {
  // 如果已存在，先删掉
  if (introOverlay) introOverlay.remove();

  // ===== 全屏半透明遮罩 =====
  introOverlay = createDiv();
  introOverlay.position(0, 0);
  introOverlay.style("position", "fixed");
  introOverlay.style("left", "0");
  introOverlay.style("top", "0");
  introOverlay.style("width", "100vw");
  introOverlay.style("height", "100vh");
  introOverlay.style("background", "rgba(0,0,0,0.55)"); // 半透明黑
  introOverlay.style("z-index", "20000"); // 比UI高
  introOverlay.style("display", "flex");
  introOverlay.style("justify-content", "center");

  const isMobileNow = windowWidth <= WIDE_SCREEN_BREAKPOINT;
  introOverlay.style("align-items", isMobileNow ? "flex-start" : "center");

  introOverlay.style("pointer-events", "auto");

  // ===== 中央卡片 =====
  introCard = createDiv();
  introCard.parent(introOverlay);
  introCard.style("width", "min(520px, 86vw)");
  introCard.style("border", "2px solid rgba(255,255,255,0.85)");
  introCard.style("border-radius", "22px");
  introCard.style("background", "rgba(20,20,20,0.55)");
  introCard.style("padding", "22px 22px 18px 22px");
  introCard.style("box-sizing", "border-box");
  introCard.style("color", "#fff");
  introCard.style(
    "font-family",
    "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  );
  const isMobileNow2 = windowWidth <= WIDE_SCREEN_BREAKPOINT;
  introCard.style(
    "margin-top",
    isMobileNow2 ? "max(12px, env(safe-area-inset-top))" : "0px",
  );
  //  窄屏靠上；数值越大越往下

  // 标题
  const title = createDiv("Ciao! 👋");
  title.parent(introCard);
  title.style("font-size", "34px");
  title.style("font-weight", "800");
  title.style("letter-spacing", "0.5px");
  title.style("margin", "0 0 8px 0");

  // 黄色提示框
  const note = createDiv();
  note.parent(introCard);
  note.style("border", "2px solid rgba(255,210,70,0.9)");
  note.style("border-radius", "16px");
  note.style("background", "rgba(255,210,70,0.12)");
  note.style("padding", "12px 14px 10px 14px");
  note.style("margin", "0 0 16px 0");
  note.style("line-height", "1.5");

  // 这里放更短引导页说明（意大利语）
  const guideHTML = `
<div style="font-size:14px; opacity:0.95; line-height:1.55;">
  <b>游戏说明 / Guida rapida</b><br/><br/>

  <b>1) 捏脸搭配 / Personalizza</b><br/>
  ◀/▶ 切换外观；Random 一键随机<br/>
  Usa ◀/▶ per cambiare l’aspetto; Random per un look casuale.<br/><br/>

  <b>2) 上传角色图 / Carica immagine</b><br/>
  Upload 导入 → 拖动摆放；Delete 恢复<br/>
  Upload per importare → trascina; Delete per ripristinare.<br/><br/>

  <b>3) 调整位置 / Regola</b><br/>
  可直接拖拽,也可用Scale和Rotate滑条调整大小和角度<br/>
  Scale per la dimensione, Rotate (0–360°), oppure trascina.<br/><br/>

  <b>4) 导出 / Esporta</b><br/>
  格式：png / jpg / png_outline(白色描边)<br/>
  Formato: png / jpg / png_outline (contorno bianco)<br/>

  <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.25); opacity:0.9;">
    <b>移动端提示：</b>在手机端，点击顶部短横线可展开/收起面板。<br/>
    <b>Su mobile:</b>  tocca la barretta in alto per aprire/chiudere il pannello.
  </div>
</div>`;
  const guide = createDiv(guideHTML);
  guide.parent(note);

  // ===== 底部按钮 =====
  introBtn = createButton("Inizia!");
  introBtn.parent(introCard);
  introBtn.style("width", "100%");
  introBtn.style("height", "44px");
  introBtn.style("border", "2px solid rgba(255,255,255,0.85)");
  introBtn.style("border-radius", "12px");
  introBtn.style("background", "rgba(255,255,255,0.9)");
  introBtn.style("color", "#111");
  introBtn.style("font-weight", "700");
  introBtn.style("font-size", "16px");
  introBtn.style("cursor", "pointer");
  introBtn.style("margin-top", "6px");

  introBtn.mousePressed(() => {
    if (introOverlay) introOverlay.remove();
    introOverlay = null;

    // 如果“只弹一次”，取消下面注释：
    // localStorage.setItem("SHEI_GEN_INTRO_SEEN", "1");
  });
}

function setup() {
  // 画布大小 = 当前窗口大小（自适应）
  createCanvas(windowWidth, windowHeight);
  cnv = createCanvas(windowWidth, windowHeight);
  cnv.elt.addEventListener(
    "touchstart",
    (e) => {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
  cnv.elt.addEventListener(
    "touchmove",
    (e) => {
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );

  pixelDensity(2); // 先写 2，mac/retina 会更细腻
  smooth();

  background(255);

  createUI();
  randomizeAvatar();
  initPlacementForLiveAvatar();
  if (showIntro) showIntroOverlay();
}

function createGroupBox(relX, relY, w, h) {
  const box = createDiv();
  box.parent(uiContainer);
  box.style("position", "absolute");
  box.style("background", "#fff");
  box.style("border", "3px solid #111");
  box.style("border-radius", "12px");
  box.style("box-sizing", "border-box");
  box.style("z-index", "0"); // 在最底层

  // 也用 uiBaseX 偏移
  box.position(uiBaseX + relX, relY);
  box.size(w, h);

  // 记录：之后窄屏时用来居中
  groupBoxes.push({ box, relX, relY });

  return box;
}

function handleAvatarUpload(file) {
  if (file.type === "image") {
    loadImage(file.data, (img) => {
      uploadedAvatarImg = img;

      // 初始摆放：居中 + 合理缩放
      const r = getCardRect();
      userImgX = r.winX + r.winW / 2;
      userImgY = r.winY + r.winH / 2;

      const s = Math.min(r.winW / img.width, r.winH / img.height) * 0.95;
      setUserImgScale(s);
      userImgRot = 0;

      syncPlacementUI();
    });
  }
}

function createUI() {
  if (uiContainer) uiContainer.remove();

  uiContainer = createDiv();
  uiContainer.style("position", "absolute");
  uiContainer.style("left", "0px");
  uiContainer.style("top", "0px");
  uiContainer.style("transform-origin", "top left");
  uiContainer.style("pointer-events", "auto");

  const isMobileNow = windowWidth <= WIDE_SCREEN_BREAKPOINT;

  if (isMobileNow) {
    if (!drawerHandle) {
      drawerHandle = createDiv();
      drawerHandle.mousePressed(() => (isDrawerOpen = !isDrawerOpen));
    }

    drawerHandle.parent(uiContainer);
    drawerHandle.show();

    drawerHandle.style("width", "44px");
    drawerHandle.style("height", "6px");
    drawerHandle.style("border-radius", "99px");
    drawerHandle.style("background", "#000");
    drawerHandle.style("margin", "10px auto 8px auto");
    drawerHandle.style("cursor", "pointer");
  } else {
    // 宽屏：不需要抽屉把手
    if (drawerHandle) drawerHandle.hide();
  }

  // 用抽屉滚动 保留
  uiContainer.style("overflow-y", "visible");
  uiContainer.style("overflow-x", "visible"); // 宽屏不裁切
  uiContainer.style("-webkit-overflow-scrolling", "touch");

  // 每次重建 UI 先清空记录，避免旧框/旧元素残留导致位置错乱
  uiElements = [];
  groupBoxes = [];
  applyUIBaseX(4); // 宽屏默认整体左边距（调宽屏贴左/更靠右）

  // ===== 可调参数（改间距）=====
  const BOX_PAD_Y = 12; // 框内上下留白（越大越松）
  const BOX_PAD_X = 18; // 框内左边距（内容离框左边的距离）
  const GROUP_GAP = 18; // 框与框之间的距离（越大越松）
  const BOX_W = UI_BASE_W - 8; // 黑框宽度（保持不变，窄屏会自动居中）

  const x = BOX_PAD_X; // 内容相对“框左边”的 x（不要写死绝对像素）
  const COL_GAP = GROUP_GAP;
  const COL_W = Math.floor((BOX_W - COL_GAP) / 2);
  const RIGHT_COL_X = BOX_W + GROUP_GAP + RIGHT_COL_SHIFT; //导出组往右移

  UI_RIGHT_COL_X = RIGHT_COL_X;
  UI_PANEL_W = UI_RIGHT_COL_X + BOX_W + 20; // 右侧安全留白

  uiContainer.style("width", UI_PANEL_W + "px");
  // ===== y 从 0 开始往下排 =====
  const TOP_RESERVED = isMobileNow ? 30 : 0;

  let y = TOP_RESERVED;
  let yRight = TOP_RESERVED;
  let yR = TOP_RESERVED;

  const yLeftRef = { get: () => y, set: (v) => (y = v) };
  const yRightRef = { get: () => yR, set: (v) => (yR = v) };

  const TITLE_TO_CONTROL_Y = 28;
  const CONTROL_TO_NEXT_Y = 30;

  function beginGroupBox(
    relX = 0,
    boxW = BOX_W,
    yRef = { get: () => y, set: (v) => (y = v) },
  ) {
    const boxTop = yRef.get();
    const box = createGroupBox(relX, boxTop, boxW, 0);

    const contentTop = boxTop + BOX_PAD_Y;
    yRef.set(contentTop);

    return { box, boxTop, contentTop, relX, boxW, yRef };
  }

  function endGroupBox(g) {
    const contentEnd = g.yRef.get();
    const boxH = contentEnd - g.contentTop + BOX_PAD_Y * 2;

    g.box.style("width", g.boxW + "px");
    g.box.position(uiBaseX + g.relX, g.boxTop);
    g.box.size(g.boxW, boxH);

    g.yRef.set(g.boxTop + boxH + GROUP_GAP);
  }

  // ======================
  // 头部组
  // ======================
  const headGroup = beginGroupBox();

  //  右列起点（两列布局：右列）
  const HEAD_RIGHT_X = x + COL_W + COL_GAP;
  let yTools = headGroup.contentTop; // 右列自己的 y 游标
  yTools += TITLE_TO_CONTROL_Y;

  // 随机按钮放进 headGroup 右列
  randBtn = createButton("随机 Random");
  randBtn.mousePressed(onRandomPressed);
  styleSecondaryButton(randBtn, 108);
  registerUI(randBtn, HEAD_RIGHT_X, yTools); //随机按钮的 x / y
  yTools += CONTROL_TO_NEXT_Y;

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

  // 让 headGroup 的框高度覆盖右列内容
  y = max(y, yTools);

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

  // 记录三条滑条开始的 y，用于把右侧组件对齐到同一高度
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

  // 右侧：颜色预览框
  const RGB_BOX_X = x + 170; // 越大越往右

  const SWATCH_W = 36; // 预览框宽度
  const SWATCH_H = 36; // 预览框高度

  const INPUT_W = 100; // 输入框宽度
  const INPUT_H = 34; // 输入框高度

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

  // 用户输入 -> 同步鞋子颜色 + 三条滑条
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

  // 初始化一次显示
  updateRGBUI();

  y = max(y, sliderStartY + SWATCH_H + INPUT_H);

  endGroupBox(shoesGroup);

  // ======================
  // Placement 组
  // ======================
  const placeGroup = beginGroupBox();

  createUISectionTitle("缩放 Scale", x, y);
  y += TITLE_TO_CONTROL_Y;
  scaleSlider = createSlider(
    USER_IMG_SCALE_MIN,
    USER_IMG_SCALE_MAX,
    userImgScale,
    0.01,
  );
  scaleSlider.input(() => setUserImgScale(scaleSlider.value()));
  registerUI(scaleSlider, x, y);
  y += CONTROL_TO_NEXT_Y;

  createUISectionTitle("旋转 Rotate", x, y);
  y += TITLE_TO_CONTROL_Y;

  // 0 在最左；范围 0~360
  rotSlider = createSlider(0, 360, ((userImgRot % 360) + 360) % 360, 1);
  rotSlider.input(() => {
    userImgRot = rotSlider.value() % 360; // 保持在 0~360
  });
  registerUI(rotSlider, x, y);
  // 底部空间
  const PLACE_BOTTOM_PAD = 28;
  y += PLACE_BOTTOM_PAD;

  endGroupBox(placeGroup);

  // ======================
  // 导出组
  // ======================
  const EXPORT_BTN_ROW_GAP = 52; //  导出按钮上下间隙（越大越松）
  const savedLeftY = y; //  左列已经排到哪了
  yR = headGroup.boxTop; //  右列自己的 y 游标（只在宽屏用）
  const exportGroup = isMobileNow
    ? beginGroupBox(0, BOX_W, yLeftRef)
    : beginGroupBox(RIGHT_COL_X, BOX_W, yRightRef);

  const ex = x + exportGroup.relX;

  // ===== Upload/Delete row (first row in Export) =====
  if (!fileInputAvatar) {
    fileInputAvatar = createFileInput(handleAvatarUpload);
    fileInputAvatar.hide();
  }

  uploadAvatarBtn = createButton("上传 Upload");
  uploadAvatarBtn.mousePressed(() => fileInputAvatar.elt.click());
  styleSecondaryButton(uploadAvatarBtn, 110);

  deleteAvatarBtn = createButton("删除 Delete");
  deleteAvatarBtn.mousePressed(() => {
    uploadedAvatarImg = null;
    initPlacementForLiveAvatar(); // 删除后恢复实时角色并居中
    if (scaleSlider) scaleSlider.value(userImgScale);
    if (rotSlider) rotSlider.value(userImgRot);
  });

  styleSecondaryButton(deleteAvatarBtn, 110);

  let yy = exportGroup.yRef.get();
  // 上传/删除
  registerUI(uploadAvatarBtn, ex, yy);
  registerUI(deleteAvatarBtn, ex + 114, yy);
  yy += 60;

  createUISectionTitle("导出格式 Export Format", ex, yy);
  yy += 32;

  exportFormatSelect = createSelect();
  exportFormatSelect.option("png");
  exportFormatSelect.option("jpg");
  exportFormatSelect.option("png_outline");
  exportFormatSelect.selected("png");
  exportFormatSelect.changed(() => {
    exportFormat = exportFormatSelect.value();
  });
  styleExportSelect(exportFormatSelect, isMobileNow);
  registerUI(exportFormatSelect, ex, yy);
  yy += EXPORT_BTN_ROW_GAP;

  createUISectionTitle("导出选择 Export", ex, yy);
  yy += 32;

  // ---- 右列按钮排布参数 ----
  const EXPORT_BTN_NARROW = 166; // 越大越窄
  const BTN_W = exportGroup.boxW - BOX_PAD_X * 2 - EXPORT_BTN_NARROW; //三个按钮宽度

  // Head
  exportHeadBtn = createButton("头部 Head");
  exportHeadBtn.mousePressed(() => exportAvatar("head"));
  styleExportButton(exportHeadBtn, isMobileNow, BTN_W);
  registerUI(exportHeadBtn, ex, yy);
  yy += EXPORT_BTN_ROW_GAP;

  // Half
  exportHalfBtn = createButton("半身 Half");
  exportHalfBtn.mousePressed(() => exportAvatar("half"));
  styleExportButton(exportHalfBtn, isMobileNow, BTN_W);
  registerUI(exportHalfBtn, ex, yy);
  yy += EXPORT_BTN_ROW_GAP;

  // 第二行：Full（单独一颗）
  exportFullBtn = createButton("全身 Full");
  exportFullBtn.mousePressed(() => exportAvatar("full"));
  styleExportButton(exportFullBtn, isMobileNow, BTN_W);
  registerUI(exportFullBtn, ex, yy);

  yy += EXPORT_BTN_ROW_GAP;

  // 第三行：人物+卡片（做成一整行按钮）
  exportCardComboBtn = createButton("人物+卡片 Character+Card");
  exportCardComboBtn.mousePressed(() => {
    exportCardPNG(); // 按当前下拉框 exportFormat 执行
  });

  // 右列整行宽度：用 COL_W 减去左右 padding（左右各 BOX_PAD_X）
  const comboW = (isMobileNow ? BOX_W : COL_W) - BOX_PAD_X * 2;
  styleExportButton(exportCardComboBtn, isMobileNow, comboW);
  registerUI(exportCardComboBtn, ex, yy);

  yy += EXPORT_BTN_ROW_GAP;

  const EXPORT_BOX_BOTTOM_PAD = 12; // 导出UI的框架底部长度（px）
  yy += EXPORT_BOX_BOTTOM_PAD;

  exportGroup.yRef.set(yy);
  endGroupBox(exportGroup);

  if (!isMobileNow) {
    yRight = yR;
    y = savedLeftY; // 恢复左列 y）
  }

  // 计算 UI 实际内容高度（重要：否则 uiContainer 高度=0，UI 会“消失”）
  // y 是左列最终的游标；yRight 是右列最终的游标（宽屏两列时）
  uiContentH = Math.ceil(Math.max(y, yRight, 1));

  // 给容器一个真实高度（宽屏时用于定位、窄屏抽屉会覆盖掉这个高度）
  uiContainer.style("height", uiContentH + "px");
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

function styleExportButton(btn, isMobile, wOverride = null) {
  const w = wOverride != null ? wOverride : isMobile ? 88 : 84;

  // 统一样式：白底黑字 + hover 反色（和上传/删除同）
  styleSecondaryButton(btn, w);
}

function bindHover(btn, normalBg, normalColor, hoverBg, hoverColor) {
  if (!btn || !btn.elt) return;

  // 只绑定一次事件
  if (btn.elt.dataset.hoverBound) return;
  btn.elt.dataset.hoverBound = "1";

  // 初始态
  btn.style("background", normalBg);
  btn.style("color", normalColor);

  btn.mouseOver(() => {
    btn.style("background", hoverBg);
    btn.style("color", hoverColor);
  });

  btn.mouseOut(() => {
    btn.style("background", normalBg);
    btn.style("color", normalColor);
  });
}

function styleSecondaryButton(btn, w) {
  btn.style("width", w + "px");
  btn.style("height", "42px");
  btn.style("border", "3px solid #111");
  btn.style("border-radius", "10px");

  // 字体统一
  btn.style("font-size", "14px");
  btn.style("font-weight", "600");

  btn.style("cursor", "pointer");
  btn.style("transition", "all 140ms ease");

  bindHover(btn, "#fff", "#111", "#111", "#fff");
}

function styleExportSelect(sel, isMobile) {
  sel.style("height", isMobile ? "30px" : "32px");
  sel.style("width", isMobile ? "120px" : "114px"); // 下拉框宽度
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
  // 随机鞋子颜色（RGB）
  shoeR = floor(random(256));
  shoeG = floor(random(256));
  shoeB = floor(random(256));
  // 同步滑条 UI
  if (rSlider) rSlider.value(shoeR);
  if (gSlider) gSlider.value(shoeG);
  if (bSlider) bSlider.value(shoeB);

  updateRGBUI();
}

function onRandomPressed() {
  randomizeAvatar();
}

// function randomizeCardPlacement() {
//   if (!uploadedAvatarImg) return;

//   const r = getCardRect();
//   // 只限制“中心点”在透明窗口内
//   setUserImgScale(random(USER_IMG_SCALE_MIN, USER_IMG_SCALE_MAX));
//   userImgRot = random(0, 360);

//   userImgX = random(r.winX, r.winX + r.winW);
//   userImgY = random(r.winY, r.winY + r.winH);

//   if (rotSlider) rotSlider.value(userImgRot);
// }

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
    // 窄屏：预览高度跟抽屉开合联动，并做平滑过渡（点击把手就会“放大/缩小”）
    const targetAvatarAreaH = getTargetMobileAvatarAreaH();
    if (mobileAvatarAreaHPx == null) mobileAvatarAreaHPx = targetAvatarAreaH;
    mobileAvatarAreaHPx = lerp(
      mobileAvatarAreaHPx,
      targetAvatarAreaH,
      MOBILE_AVATAR_LERP,
    );

    const avatarAreaH = mobileAvatarAreaHPx;

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

  drawCardEditor();

  pop();

  layoutUI();
}

function setStyles(el, styles) {
  for (const k in styles) el.style(k, styles[k]);
}

function applyMobileDrawerLayout(drawerW, drawerH) {
  // 关闭时露出的高度（原来 layoutUI 里写死 44）
  const y = isDrawerOpen
    ? height - drawerH - MOBILE_DRAWER_MARGIN
    : height - MOBILE_PEEK_H;

  setStyles(uiContainer, {
    transform: "scale(1)",
    position: "fixed",
    width: drawerW + "px",
    height: drawerH + "px",
    left: Math.round((width - drawerW) / 2) + "px",
    top: y + "px",

    background: "none",
    border: "none",
    "border-radius": `${MOBILE_DRAWER_RADIUS}px ${MOBILE_DRAWER_RADIUS}px 0 0`,
    "box-sizing": "border-box",
    "overflow-y": "auto",
    "overflow-x": "hidden",
    "-webkit-overflow-scrolling": "touch",
    "z-index": UI_Z_MOBILE,
    padding: "0px",
  });
}

function getTargetMobileAvatarAreaH() {
  const drawerH = Math.floor(height * MOBILE_DRAWER_H_RATIO);
  const drawerTopY = isDrawerOpen
    ? height - drawerH - MOBILE_DRAWER_MARGIN
    : height - MOBILE_PEEK_H;

  // 留一点缝，避免刚好顶住抽屉
  return Math.max(120, drawerTopY + 60);
}

function applyDesktopPanelLayout(panelX, panelY, uiScale) {
  setStyles(uiContainer, {
    width: UI_PANEL_W + "px",
    position: "absolute",
    "overflow-y": "auto",
    "overflow-x": "visible",
    "z-index": UI_Z_DESKTOP,
    border: "none",
    background: "transparent",
    "border-radius": "0",
    padding: "0px",
    transform: `scale(${uiScale})`,
    "transform-origin": "top left",
  });

  // 宽屏用 position()
  uiContainer.position(Math.round(panelX), Math.round(panelY));
}

function layoutUI() {
  if (!uiContainer) return;

  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;

  // 断点切换时重建 UI：让导出组在窄屏变成单列
  if (lastIsMobile === null) lastIsMobile = isMobile;

  if (isMobile !== lastIsMobile) {
    lastIsMobile = isMobile;
    createUI(); // 重新按当前屏幕模式创建：导出组会进单列抽屉
    return; // 这一帧先结束，避免旧元素被继续 layout
  }

  if (drawerHandle) {
    if (isMobile) drawerHandle.show();
    else drawerHandle.hide();
  }

  // 每帧/每次布局都按当前模式刷新导出控件尺寸
  if (exportFormatSelect) styleExportSelect(exportFormatSelect, isMobile);

  if (exportCardComboBtn) {
    styleExportButton(exportCardComboBtn, isMobile, isMobile ? 140 : 160);
    exportCardComboBtn.style("height", "48px"); //人物卡片按钮高度
  }
  if (randBtn) {
    randBtn.style("width", isMobile ? "86px" : "108px"); // 窄屏宽度
    randBtn.style("height", isMobile ? "68px" : "40px"); // 窄屏高度
  }

  // ========== 窄屏：UI 当抽屉固定在底部 ==========
  if (isMobile) {
    const drawerH = Math.floor(height * MOBILE_DRAWER_H_RATIO);
    const drawerW = Math.floor(width - MOBILE_DRAWER_MARGIN * 2);

    const centeredBaseX = (drawerW - (UI_BASE_W - 8)) / 2;
    applyUIBaseX(centeredBaseX);

    applyMobileDrawerLayout(drawerW, drawerH);
    return; // 窄屏做完就结束
  }

  // ========== 宽屏：正常右侧面板（禁用抽屉） ==========
  applyUIBaseX(0);

  const margin = DESKTOP_MARGIN;
  const uiScale = 1;

  // 角色绘制区的右边界（原来是 420*scaleFactor）
  const avatarRightScreen = offsetX + 420 * scaleFactor;

  // 计算 Y
  const headY = AVATAR_HEAD_TOP_Y;
  const topY = headY + HEAD_H - SEAM_FIX;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  const avatarTopScreenReal = offsetY + headY * scaleFactor;
  const avatarBottomScreenReal = offsetY + (shoesY + SHOES_H) * scaleFactor;
  const avatarCenterY = (avatarTopScreenReal + avatarBottomScreenReal) / 2;

  const scaledUIH = uiContentH * uiScale;
  let panelY = avatarCenterY - scaledUIH / 2;
  panelY = constrain(panelY, margin, height - scaledUIH - margin);

  // 关键：X 做 clamp，保证 UI 不会跑到画布左侧去盖住预览
  const minX = avatarRightScreen + margin; // 最左：至少在角色右侧
  const maxX = width - UI_PANEL_W * uiScale - margin; // 最右：贴右边距
  let panelX = maxX; // 默认贴右

  if (maxX >= minX) {
    const desiredX = avatarRightScreen + margin + UI_SHIFT_X;
    panelX = constrain(desiredX, minX, maxX);
  }

  // 最终只用这一句收口
  applyDesktopPanelLayout(panelX, panelY, uiScale);
}

function renderAvatar(g, centerX) {
  const headX = centerX - HEAD_W / 2;
  const headY = AVATAR_HEAD_TOP_Y;

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

function initPlacementForLiveAvatar() {
  const r = getCardRect();
  const { rawW, rawH } = getAvatarRawSize();

  userImgX = r.winX + r.winW / 2;
  userImgY = r.winY + r.winH / 2;

  const s = Math.min(r.winW / rawW, r.winH / rawH) * 0.95;
  setUserImgScale(s);

  userImgRot = 0;
  syncPlacementUI();
}

function drawLiveAvatarPlaced(g) {
  const { rawH, headY } = getAvatarRawSize();

  g.push();
  g.translate(userImgX, userImgY);
  g.rotate(radians(userImgRot));
  g.scale(userImgScale);

  // 关键：把 renderAvatar 的“绝对 headY”抵消掉，并把整体高度居中
  g.translate(0, -(headY + rawH / 2));

  renderAvatar(g, 0); // centerX=0，让它在 x 方向以 0 为中心
  g.pop();
}

function getAvatarRawSize() {
  const headY = AVATAR_HEAD_TOP_Y;
  const topY = headY + HEAD_H - SEAM_FIX;
  const bottomY = topY + BODY_TOP_H - SEAM_FIX;
  const shoesY = bottomY + BODY_BOTTOM_H - SEAM_FIX;

  const rawW = Math.max(HEAD_W, BODY_TOP_W, BODY_BOTTOM_W, SHOES_W);
  const rawH = shoesY + SHOES_H - headY;

  return { rawW, rawH, headY };
}

function getCardRect() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  const baseW = isMobile ? BASE_W_MOBILE : BASE_W_DESKTOP;

  // 卡片在左侧区域的中心点
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
      fill(isDark ? 195 : 240);
      rect(x + xx, y + yy, min(cell, w - xx), min(cell, h - yy));
    }
  }
}

function drawCardEditor() {
  const r = getCardRect();

  // 透明窗口棋盘格（在模板下）
  drawCheckerboard(r.winX, r.winY, r.winW, r.winH, 18);

  // 先画人物（裁剪到透明窗口）——无论有没有 userImg 都要裁剪
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(r.winX, r.winY, r.winW, r.winH);
  drawingContext.clip();

  if (uploadedAvatarImg) {
    // 上传图
    push();
    translate(userImgX, userImgY);
    rotate(radians(userImgRot));
    scale(userImgScale);
    imageMode(CENTER);
    image(uploadedAvatarImg, 0, 0);
    pop();
  } else {
    // 实时捏脸角色
    drawLiveAvatarPlaced(this);
  }

  drawingContext.restore();

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

  const isOutline = exportFormat === "png_outline";
  const PAD = isOutline ? OUTLINE_PX : 0; // 仅白边模式留边距=白边宽度

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
    const bottom = bottomY; // 为避免露出裤子

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

  const EXPORT_SCALE = isOutline ? EXPORT_SCALE_OUTLINE : EXPORT_SCALE_NORMAL;

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

  const isOutline = exportFormat === "png_outline";
  const isJpg = exportFormat === "jpg";

  const EXPORT_SCALE = isOutline ? EXPORT_SCALE_OUTLINE : EXPORT_SCALE_NORMAL;
  const outW = Math.round(r.cardW * EXPORT_SCALE);
  const outH = Math.round(r.cardH * EXPORT_SCALE);

  // --- 1) 人物层（透明底）---
  const charPg = createGraphics(outW, outH);
  charPg.pixelDensity(1);
  charPg.clear();

  charPg.push();
  charPg.scale(EXPORT_SCALE);

  // 坐标系：卡片左上角 = (0,0)
  const localWinX = r.winX - r.x;
  const localWinY = r.winY - r.y;

  // 裁剪到透明窗口
  charPg.drawingContext.save();
  charPg.drawingContext.beginPath();
  charPg.drawingContext.rect(localWinX, localWinY, r.winW, r.winH);
  charPg.drawingContext.clip();

  if (uploadedAvatarImg) {
    charPg.push();
    charPg.translate(userImgX - r.x, userImgY - r.y);
    charPg.rotate(radians(userImgRot));
    charPg.scale(userImgScale);
    charPg.imageMode(CENTER);
    charPg.image(uploadedAvatarImg, 0, 0);
    charPg.pop();
  } else {
    // live avatar：在卡片局部坐标系里画
    charPg.push();
    charPg.translate(-r.x, -r.y);
    drawLiveAvatarPlaced(charPg);
    charPg.pop();
  }

  charPg.drawingContext.restore();
  charPg.pop();

  // --- 2) 只对人物层做白描边 ---
  let charImg;
  if (isOutline) {
    charImg = addWhiteOutline(charPg, Math.round(OUTLINE_PX * EXPORT_SCALE));
  } else {
    charImg = charPg; // 直接用人物层
  }

  // --- 3) 最终合成：人物(可描边) + 模板 ---
  const pg = createGraphics(outW, outH);
  pg.pixelDensity(1);

  if (isJpg) pg.background(255);
  else pg.clear(); // png / png_outline 透明底

  pg.imageMode(CORNER);
  pg.image(charImg, 0, 0);

  if (cardTemplateImg) {
    pg.image(
      cardTemplateImg,
      0,
      0,
      r.cardW * EXPORT_SCALE,
      r.cardH * EXPORT_SCALE,
    );
  }

  // --- 4) 保存格式 ---
  if (isJpg) save(pg, "card_export", "jpg");
  else save(pg, "card_export", "png"); // png_outline 也强制 png
}

// 窗口尺寸变化时，让画布跟着变
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (introOverlay) {
    // 兜底：确保还在最上层
    introOverlay.style("z-index", "20000");
  }
  layoutUI();
}

function addWhiteOutline(srcPg, radiusPx) {
  const w = srcPg.width;
  const h = srcPg.height;

  srcPg.loadPixels();
  const sp = srcPg.pixels;

  const outlinePg = createGraphics(w, h);
  outlinePg.pixelDensity(1);
  outlinePg.clear();
  outlinePg.loadPixels();
  const op = outlinePg.pixels;

  // 预计算圆形邻域 offset
  const offsets = [];
  const r2 = radiusPx * radiusPx;
  for (let dy = -radiusPx; dy <= radiusPx; dy++) {
    for (let dx = -radiusPx; dx <= radiusPx; dx++) {
      if (dx * dx + dy * dy <= r2) offsets.push([dx, dy]);
    }
  }

  // 关键优化：只遍历不透明像素，然后把周围透明像素标成白色
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = 4 * (y * w + x);
      if (sp[idx + 3] === 0) continue; // 只处理“人物像素”

      for (let k = 0; k < offsets.length; k++) {
        const dx = offsets[k][0];
        const dy = offsets[k][1];
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

        const nidx = 4 * (ny * w + nx);

        // 只在“原图透明”的地方画描边，避免覆盖人物内部
        if (sp[nidx + 3] === 0) {
          op[nidx] = 255;
          op[nidx + 1] = 255;
          op[nidx + 2] = 255;
          op[nidx + 3] = 255;
        }
      }
    }
  }

  outlinePg.updatePixels();

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

function startDragAt(sx, sy) {
  const m = screenToWorld(sx, sy);
  const r = getCardRect();

  // 只在卡片范围内允许拖拽
  if (m.x < r.x || m.x > r.x + r.cardW || m.y < r.y || m.y > r.y + r.cardH)
    return;

  isDraggingUserImg = true;
  dragDX = m.x - userImgX;
  dragDY = m.y - userImgY;
}

function dragTo(sx, sy) {
  if (!isDraggingUserImg) return;
  const m = screenToWorld(sx, sy);
  userImgX = m.x - dragDX;
  userImgY = m.y - dragDY;
}

function endDrag() {
  isDraggingUserImg = false;
}

function startUserImgDrag(screenX, screenY, limitToWin) {
  const m = screenToWorld(screenX, screenY);
  const r = getCardRect();

  const inArea = limitToWin
    ? m.x >= r.winX &&
      m.x <= r.winX + r.winW &&
      m.y >= r.winY &&
      m.y <= r.winY + r.winH
    : m.x >= r.x && m.x <= r.x + r.cardW && m.y >= r.y && m.y <= r.y + r.cardH;

  if (!inArea) return false;

  isDraggingUserImg = true;
  dragDX = m.x - userImgX;
  dragDY = m.y - userImgY;
  return true;
}

function moveUserImgDrag(screenX, screenY, limitToWin) {
  if (!isDraggingUserImg) return;

  const m = screenToWorld(screenX, screenY);
  const r = getCardRect();

  let nx = m.x - dragDX;
  let ny = m.y - dragDY;

  // 窄屏触屏：强制把中心点限制在透明窗口内，避免拖到外面找不回来
  if (limitToWin) {
    nx = constrain(nx, r.winX, r.winX + r.winW);
    ny = constrain(ny, r.winY, r.winY + r.winH);
  }

  userImgX = nx;
  userImgY = ny;
}

function mousePressed() {
  // 窄屏不走 mouse（触屏用 touch* 处理）
  if (width <= WIDE_SCREEN_BREAKPOINT) return;

  startUserImgDrag(mouseX, mouseY, false); // 桌面：卡片范围内可拖
}

function mouseDragged() {
  if (width <= WIDE_SCREEN_BREAKPOINT) return;

  moveUserImgDrag(mouseX, mouseY, false);
}

function mouseReleased() {
  if (width <= WIDE_SCREEN_BREAKPOINT) return;

  isDraggingUserImg = false;
}

function touchStarted() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  if (!isMobile) return true;

  if (!touches || touches.length === 0) return true;
  const t = touches[0];

  // 只在透明窗口内允许开始拖拽
  const started = startUserImgDrag(t.x, t.y, true);

  // started=true => 阻止默认（避免滚动），开始拖拽
  // started=false => 不拦截，让区域外保持正常点击/滚动
  return started ? false : true;
}

function touchMoved() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  if (!isMobile) return true;

  if (!isDraggingUserImg) return true;
  const t = touches[0];

  moveUserImgDrag(t.x, t.y, true);

  // 拖拽过程中阻止页面/抽屉滚动
  return false;
}

function touchEnded() {
  const isMobile = width <= WIDE_SCREEN_BREAKPOINT;
  if (!isMobile) return true;

  isDraggingUserImg = false;
  return true;
}
