const STORAGE_KEY = "student-image-slide-studio-v2";
const STORAGE_META_KEY = "student-image-slide-studio-meta-v2";
const LEGACY_STORAGE_KEY = "student-slide-studio-project-v1";
const AUTOSAVE_DB_NAME = "student-slide-studio-autosave";
const AUTOSAVE_STORE_NAME = "projects";
const AUTOSAVE_RECORD_ID = "current";
const AUTOSAVE_DELAY = 500;
const MAX_IMAGE_SIDE = 1800;
const IMAGE_QUALITY = 0.86;
const LAYOUTS = new Set(["focus", "grid", "split", "caption", "strip"]);
const PHOTO_ARRANGEMENTS = new Set(["auto", "hero", "grid", "row", "column"]);
const PHOTO_FITS = new Set(["contain", "cover"]);

const elements = {
  autosaveIndicator: document.getElementById("autosaveIndicator"),
  captionInput: document.getElementById("captionInput"),
  clearButton: document.getElementById("clearButton"),
  closePresenterButton: document.getElementById("closePresenterButton"),
  deleteSlideButton: document.getElementById("deleteSlideButton"),
  dropzone: document.getElementById("dropzone"),
  exportButton: document.getElementById("exportButton"),
  imageFilesInput: document.getElementById("imageFilesInput"),
  importButton: document.getElementById("importButton"),
  importProjectInput: document.getElementById("importProjectInput"),
  layoutInput: document.getElementById("layoutInput"),
  moveDownButton: document.getElementById("moveDownButton"),
  moveUpButton: document.getElementById("moveUpButton"),
  notesInput: document.getElementById("notesInput"),
  photoArrangeInput: document.getElementById("photoArrangeInput"),
  photoFitInput: document.getElementById("photoFitInput"),
  presentButton: document.getElementById("presentButton"),
  presentNextButton: document.getElementById("presentNextButton"),
  presentPrevButton: document.getElementById("presentPrevButton"),
  presenter: document.getElementById("presenter"),
  presenterCounter: document.getElementById("presenterCounter"),
  presenterNameInput: document.getElementById("presenterNameInput"),
  presenterStage: document.getElementById("presenterStage"),
  projectTitleInput: document.getElementById("projectTitleInput"),
  saveProjectButton: document.getElementById("saveProjectButton"),
  selectedSlideLabel: document.getElementById("selectedSlideLabel"),
  slideCount: document.getElementById("slideCount"),
  slideList: document.getElementById("slideList"),
  slideImagesInput: document.getElementById("slideImagesInput"),
  slidePhotoList: document.getElementById("slidePhotoList"),
  slidePreview: document.getElementById("slidePreview"),
  slideTitleInput: document.getElementById("slideTitleInput"),
  status: document.getElementById("status")
};

let state = normalizeProject({});
let selectedId = null;
let presenterIndex = 0;
let presentationSession = 0;
let autosaveReady = false;
let autosaveTimer = null;
let autosaveInFlight = false;
let autosavePending = false;
let lastSavedJson = "";
let statusTimer = null;

bindEvents();
init();

async function init() {
  setAutosaveIndicator("자동저장 불러오는 중");
  setStatus("자동저장된 작업을 불러오는 중입니다...");
  state = await loadProject();
  selectedId = state.slides[0]?.id || null;
  lastSavedJson = JSON.stringify(state);
  autosaveReady = true;
  renderAll();
  const message = state.slides.length ? "자동저장된 작업을 불러왔습니다." : "이미지를 넣으면 자동저장됩니다.";
  setAutosaveIndicator(state.slides.length ? "자동저장됨" : "자동저장 준비");
  setStatus(message);
}

function bindEvents() {
  elements.clearButton.addEventListener("click", clearSlides);
  elements.deleteSlideButton.addEventListener("click", deleteSelectedSlide);
  elements.exportButton.addEventListener("click", exportDeck);
  elements.importButton.addEventListener("click", () => elements.importProjectInput.click());
  elements.moveDownButton.addEventListener("click", () => moveSelectedSlide(1));
  elements.moveUpButton.addEventListener("click", () => moveSelectedSlide(-1));
  elements.presentButton.addEventListener("click", startPresentation);
  elements.presentNextButton.addEventListener("click", () => movePresenter(1));
  elements.presentPrevButton.addEventListener("click", () => movePresenter(-1));
  elements.closePresenterButton.addEventListener("click", closePresentation);
  elements.saveProjectButton.addEventListener("click", saveProjectFile);

  elements.imageFilesInput.addEventListener("change", async (event) => {
    await addImageFiles(event.target.files);
    elements.imageFilesInput.value = "";
  });

  elements.slideImagesInput.addEventListener("change", async (event) => {
    await addImagesToSelectedSlide(event.target.files);
    elements.slideImagesInput.value = "";
  });

  elements.importProjectInput.addEventListener("change", importProjectFile);

  elements.projectTitleInput.addEventListener("input", () => {
    state.title = elements.projectTitleInput.value;
    saveState();
    renderPreview();
  });

  elements.presenterNameInput.addEventListener("input", () => {
    state.presenter = elements.presenterNameInput.value;
    saveState();
    renderPreview();
  });

  elements.slideTitleInput.addEventListener("input", () => updateSelectedSlide({ title: elements.slideTitleInput.value }));
  elements.layoutInput.addEventListener("change", () => updateSelectedSlide({ layout: safeLayout(elements.layoutInput.value) }));
  elements.photoArrangeInput.addEventListener("change", () => updateSelectedSlide({ arrangement: safeArrangement(elements.photoArrangeInput.value) }));
  elements.photoFitInput.addEventListener("change", () => updateSelectedSlide({ fit: safeFit(elements.photoFitInput.value) }));
  elements.captionInput.addEventListener("input", () => updateSelectedSlide({ caption: elements.captionInput.value }));
  elements.notesInput.addEventListener("input", () => updateSelectedSlide({ notes: elements.notesInput.value }));

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, () => {
      elements.dropzone.classList.remove("is-dragging");
    });
  });

  elements.dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    await addImageFiles(event.dataTransfer.files);
  });

  document.addEventListener("keydown", (event) => {
    if (elements.presenter.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closePresentation();
      return;
    }

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      movePresenter(1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      movePresenter(-1);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAutosave();
  });

  window.addEventListener("pagehide", () => {
    flushAutosave();
  });
}

async function loadProject() {
  const indexedProject = await readIndexedProject();
  const saved = indexedProject || readStoredProject(STORAGE_KEY) || readStoredProject(LEGACY_STORAGE_KEY);
  return normalizeProject(saved || {});
}

function readStoredProject(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Could not load saved slide project.", error);
    return null;
  }
}

async function readIndexedProject() {
  try {
    const db = await openAutosaveDb();
    const record = await readAutosaveRecord(db);
    db.close();
    return record?.project || null;
  } catch (error) {
    console.warn("Could not load IndexedDB autosave.", error);
    return null;
  }
}

function openAutosaveDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(AUTOSAVE_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUTOSAVE_STORE_NAME)) {
        db.createObjectStore(AUTOSAVE_STORE_NAME, { keyPath: "id" });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function readAutosaveRecord(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readonly");
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    const request = store.get(AUTOSAVE_RECORD_ID);
    request.addEventListener("success", () => resolve(request.result || null));
    request.addEventListener("error", () => reject(request.error));
  });
}

function normalizeProject(project) {
  const slides = Array.isArray(project?.slides)
    ? project.slides.map(normalizeSlide).filter((slide) => slide.images.length)
    : [];

  return {
    title: typeof project?.title === "string" ? project.title : "나의 발표",
    presenter: typeof project?.presenter === "string" ? project.presenter : "",
    slides
  };
}

function normalizeSlide(slide) {
  const images = normalizeImages(slide);

  return {
    id: typeof slide?.id === "string" && slide.id ? slide.id : createId(),
    title: typeof slide?.title === "string" ? slide.title : "사진",
    layout: safeLayout(slide?.layout),
    arrangement: safeArrangement(slide?.arrangement),
    fit: safeFit(slide?.fit),
    caption: typeof slide?.caption === "string" ? slide.caption : typeof slide?.body === "string" ? slide.body : "",
    notes: typeof slide?.notes === "string" ? slide.notes : "",
    accent: normalizeAccent(slide?.accent || blendImageAccents(images)),
    images
  };
}

function normalizeImages(slide) {
  const sourceImages = Array.isArray(slide?.images) ? slide.images : [];
  const legacyImages = slide?.image?.src ? [slide.image] : [];
  return [...sourceImages, ...legacyImages]
    .map(normalizeImage)
    .filter((image) => image.src);
}

function normalizeImage(image) {
  return {
    src: image?.src ? String(image.src) : "",
    alt: typeof image?.alt === "string" ? image.alt : "",
    name: typeof image?.name === "string" ? image.name : "",
    width: Number(image?.width) || 0,
    height: Number(image?.height) || 0,
    accent: normalizeAccent(image?.accent)
  };
}

function normalizeAccent(accent) {
  if (
    accent &&
    Number.isFinite(accent.r) &&
    Number.isFinite(accent.g) &&
    Number.isFinite(accent.b)
  ) {
    return {
      r: clampColor(accent.r),
      g: clampColor(accent.g),
      b: clampColor(accent.b)
    };
  }

  return { r: 15, g: 118, b: 110 };
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function safeLayout(layout) {
  return LAYOUTS.has(layout) ? layout : "focus";
}

function safeArrangement(arrangement) {
  return PHOTO_ARRANGEMENTS.has(arrangement) ? arrangement : "auto";
}

function safeFit(fit) {
  return PHOTO_FITS.has(fit) ? fit : "contain";
}

function blendImageAccents(images) {
  if (!images.length) return { r: 15, g: 118, b: 110 };
  const sum = images.reduce(
    (total, image) => {
      const accent = normalizeAccent(image.accent);
      total.r += accent.r;
      total.g += accent.g;
      total.b += accent.b;
      return total;
    },
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: sum.r / images.length,
    g: sum.g / images.length,
    b: sum.b / images.length
  };
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function saveState(options = {}) {
  if (!autosaveReady) return Promise.resolve();
  if (options.immediate) return flushAutosave();
  scheduleAutosave();
  return Promise.resolve();
}

function scheduleAutosave() {
  autosavePending = true;
  setAutosaveIndicator("자동저장 중...");
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(flushAutosave, AUTOSAVE_DELAY);
}

async function flushAutosave() {
  if (!autosaveReady) return;

  window.clearTimeout(autosaveTimer);
  autosaveTimer = null;

  const snapshot = JSON.parse(JSON.stringify(state));
  const serialized = JSON.stringify(snapshot);
  if (serialized === lastSavedJson && !autosavePending) return;

  if (autosaveInFlight) {
    autosavePending = true;
    return;
  }

  autosaveInFlight = true;
  autosavePending = false;
  setAutosaveIndicator("자동저장 중...");

  try {
    await persistProject(snapshot, serialized);
    lastSavedJson = serialized;
    const time = formatTime(new Date());
    setAutosaveIndicator(`자동저장됨 ${time}`);
    setStatus(`자동저장됨 ${time}`, { temporary: true });
  } catch (error) {
    console.warn("Could not autosave project.", error);
    setAutosaveIndicator("자동저장 실패");
    setStatus("자동저장 실패: 저장 버튼으로 프로젝트 파일을 받아 두세요.");
  } finally {
    autosaveInFlight = false;
    if (autosavePending) scheduleAutosave();
  }
}

async function persistProject(project, serialized) {
  try {
    await writeIndexedProject(project);
    localStorage.setItem(
      STORAGE_META_KEY,
      JSON.stringify({
        title: project.title,
        presenter: project.presenter,
        slideCount: project.slides.length,
        savedAt: Date.now()
      })
    );
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("IndexedDB autosave failed; trying localStorage fallback.", error);
    localStorage.setItem(STORAGE_KEY, serialized);
  }
}

async function writeIndexedProject(project) {
  const db = await openAutosaveDb();
  try {
    await writeAutosaveRecord(db, {
      id: AUTOSAVE_RECORD_ID,
      savedAt: Date.now(),
      project
    });
  } finally {
    db.close();
  }
}

function writeAutosaveRecord(db, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    store.put(record);
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error));
    transaction.addEventListener("abort", () => reject(transaction.error));
  });
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getSelectedIndex() {
  if (!state.slides.length) return -1;
  const index = state.slides.findIndex((slide) => slide.id === selectedId);
  return index === -1 ? 0 : index;
}

function getSelectedSlide() {
  const index = getSelectedIndex();
  if (index === -1) return null;
  selectedId = state.slides[index].id;
  return state.slides[index];
}

async function addImageFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    setStatus("이미지 파일을 선택해 주세요.");
    return;
  }

  setStatus(`${files.length}장의 이미지를 슬라이드로 만드는 중입니다...`);
  const newSlides = [];

  for (const file of files) {
    try {
      const slideNumber = state.slides.length + newSlides.length + 1;
      const fallbackTitle = `사진 ${slideNumber}`;
      const processed = await processImageFile(file);
      newSlides.push({
        id: createId(),
        title: fallbackTitle,
        layout: "focus",
        arrangement: "auto",
        fit: "contain",
        caption: "",
        notes: "",
        accent: processed.accent,
        images: [{
          src: processed.src,
          alt: titleFromFileName(file.name, slideNumber),
          name: file.name,
          width: processed.width,
          height: processed.height,
          accent: processed.accent
        }]
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (!newSlides.length) {
    setStatus("이미지를 처리하지 못했습니다. 다른 이미지 파일로 다시 시도해 주세요.");
    return;
  }

  state.slides.push(...newSlides);
  selectedId = newSlides[0].id;
  await saveState({ immediate: true });
  renderAll();
  setStatus(`${newSlides.length}장의 슬라이드를 만들었습니다.`);
}

async function addImagesToSelectedSlide(fileList) {
  const slide = getSelectedSlide();
  if (!slide) {
    setStatus("먼저 왼쪽에서 이미지를 넣어 슬라이드를 만들어 주세요.");
    return;
  }

  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    setStatus("추가할 이미지 파일을 선택해 주세요.");
    return;
  }

  setStatus(`${files.length}장의 사진을 현재 슬라이드에 추가하는 중입니다...`);
  const additions = [];

  for (const file of files) {
    try {
      const processed = await processImageFile(file);
      additions.push({
        src: processed.src,
        alt: titleFromFileName(file.name, slide.images.length + additions.length + 1),
        name: file.name,
        width: processed.width,
        height: processed.height,
        accent: processed.accent
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (!additions.length) {
    setStatus("사진을 추가하지 못했습니다. 다른 이미지 파일로 다시 시도해 주세요.");
    return;
  }

  slide.images.push(...additions);
  slide.accent = blendImageAccents(slide.images);
  await saveState({ immediate: true });
  renderAll();
  setStatus(`현재 슬라이드에 사진 ${additions.length}장을 추가했습니다.`);
}

function titleFromFileName(fileName, fallbackNumber) {
  const raw = String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return raw || `사진 ${fallbackNumber}`;
}

async function processImageFile(file) {
  const original = await readFileAsDataUrl(file);
  const image = await loadImage(original);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return {
    src: canvas.toDataURL("image/jpeg", IMAGE_QUALITY),
    width,
    height,
    accent: getAverageColor(canvas)
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

function getAverageColor(sourceCanvas) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 12;
  sampleCanvas.height = 12;
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleContext.drawImage(sourceCanvas, 0, 0, 12, 12);
  const pixels = sampleContext.getImageData(0, 0, 12, 12).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 16) continue;
    r += pixels[index];
    g += pixels[index + 1];
    b += pixels[index + 2];
    count += 1;
  }

  if (!count) return { r: 15, g: 118, b: 110 };

  return strengthenColor({
    r: r / count,
    g: g / count,
    b: b / count
  });
}

function strengthenColor(color) {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  const saturation = max - min;

  if (saturation < 28) {
    return { r: 15, g: 118, b: 110 };
  }

  return {
    r: clampColor(color.r * 0.82),
    g: clampColor(color.g * 0.82),
    b: clampColor(color.b * 0.82)
  };
}

function renderAll() {
  elements.projectTitleInput.value = state.title;
  elements.presenterNameInput.value = state.presenter;
  renderSlideList();
  renderForm();
  renderPreview();
  updateControls();
}

function renderSlideList() {
  elements.slideCount.textContent = `${state.slides.length}장`;
  elements.slideList.innerHTML = "";
  const selectedIndex = getSelectedIndex();

  state.slides.forEach((slide, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `image-card${index === selectedIndex ? " is-active" : ""}`;
    button.setAttribute("aria-label", `${index + 1}번 이미지 슬라이드 선택`);
    const firstImage = slide.images[0];
    button.innerHTML = `
      <img src="${escapeAttribute(firstImage.src)}" alt="">
      <span>
        <strong>${escapeHtml(slide.title || `사진 ${index + 1}`)}</strong>
        <span>${index + 1}번 · 사진 ${slide.images.length}장${slide.caption ? " · 설명 있음" : ""}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      selectedId = slide.id;
      renderAll();
    });
    item.append(button);
    elements.slideList.append(item);
  });
}

function renderForm() {
  const slide = getSelectedSlide();
  const hasSlide = Boolean(slide);
  elements.selectedSlideLabel.textContent = hasSlide ? `${getSelectedIndex() + 1}번 이미지` : "이미지를 넣어 주세요";
  elements.slideTitleInput.value = slide?.title || "";
  elements.layoutInput.value = slide?.layout || "focus";
  elements.photoArrangeInput.value = slide?.arrangement || "auto";
  elements.photoFitInput.value = slide?.fit || "contain";
  elements.captionInput.value = slide?.caption || "";
  elements.notesInput.value = slide?.notes || "";
  elements.slideTitleInput.disabled = !hasSlide;
  elements.layoutInput.disabled = !hasSlide;
  elements.photoArrangeInput.disabled = !hasSlide;
  elements.photoFitInput.disabled = !hasSlide;
  elements.slideImagesInput.disabled = !hasSlide;
  elements.captionInput.disabled = !hasSlide;
  elements.notesInput.disabled = !hasSlide;
  renderSlidePhotoList(slide);
}

function renderSlidePhotoList(slide) {
  elements.slidePhotoList.innerHTML = "";
  if (!slide) {
    elements.slidePhotoList.hidden = true;
    return;
  }

  elements.slidePhotoList.hidden = false;
  slide.images.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "slide-photo-chip";
    item.innerHTML = `
      <img src="${escapeAttribute(image.src)}" alt="">
      <span>${index + 1}</span>
      <div class="photo-chip-actions">
        <button type="button" data-action="left" aria-label="${index + 1}번 사진 앞으로 이동">‹</button>
        <button type="button" data-action="right" aria-label="${index + 1}번 사진 뒤로 이동">›</button>
        <button type="button" data-action="remove" aria-label="${index + 1}번 사진 제거">×</button>
      </div>
    `;
    item.querySelector('[data-action="left"]').disabled = index === 0;
    item.querySelector('[data-action="right"]').disabled = index === slide.images.length - 1;
    item.querySelector('[data-action="left"]').addEventListener("click", () => movePhotoInSelectedSlide(index, -1));
    item.querySelector('[data-action="right"]').addEventListener("click", () => movePhotoInSelectedSlide(index, 1));
    item.querySelector('[data-action="remove"]').addEventListener("click", () => removePhotoFromSelectedSlide(index));
    elements.slidePhotoList.append(item);
  });
}

function renderPreview() {
  const slide = getSelectedSlide();
  if (!slide) {
    elements.slidePreview.innerHTML = `
      <div class="empty-slide">
        <div>
          <strong>이미지로 시작하세요</strong>
          <span>왼쪽에서 여러 이미지를 넣으면 자동으로 발표용 슬라이드가 만들어집니다.</span>
        </div>
      </div>
    `;
    return;
  }

  elements.slidePreview.innerHTML = renderSlideMarkup(slide, getSelectedIndex(), state.slides.length, state);
}

function updateControls() {
  const selectedIndex = getSelectedIndex();
  const hasSlides = state.slides.length > 0;
  elements.clearButton.disabled = !hasSlides;
  elements.deleteSlideButton.disabled = !hasSlides;
  elements.exportButton.disabled = !hasSlides;
  elements.presentButton.disabled = !hasSlides;
  elements.slideImagesInput.disabled = !hasSlides;
  elements.photoArrangeInput.disabled = !hasSlides;
  elements.photoFitInput.disabled = !hasSlides;
  elements.moveUpButton.disabled = selectedIndex <= 0;
  elements.moveDownButton.disabled = selectedIndex === -1 || selectedIndex >= state.slides.length - 1;
}

function updateSelectedSlide(patch) {
  const slide = getSelectedSlide();
  if (!slide) return;
  Object.assign(slide, patch);
  saveState();
  renderSlideList();
  renderPreview();
}

function moveSelectedSlide(direction) {
  const index = getSelectedIndex();
  const nextIndex = index + direction;
  if (index === -1 || nextIndex < 0 || nextIndex >= state.slides.length) return;

  const [slide] = state.slides.splice(index, 1);
  state.slides.splice(nextIndex, 0, slide);
  selectedId = slide.id;
  saveState({ immediate: true });
  renderAll();
}

function deleteSelectedSlide() {
  const index = getSelectedIndex();
  if (index === -1) return;
  state.slides.splice(index, 1);
  selectedId = state.slides[Math.min(index, state.slides.length - 1)]?.id || null;
  saveState({ immediate: true });
  renderAll();
  setStatus("선택한 슬라이드를 삭제했습니다.");
}

function removePhotoFromSelectedSlide(photoIndex) {
  const slide = getSelectedSlide();
  if (!slide) return;

  if (slide.images.length <= 1) {
    deleteSelectedSlide();
    return;
  }

  slide.images.splice(photoIndex, 1);
  slide.accent = blendImageAccents(slide.images);
  saveState({ immediate: true });
  renderAll();
  setStatus("현재 슬라이드에서 사진을 제거했습니다.");
}

function movePhotoInSelectedSlide(photoIndex, direction) {
  const slide = getSelectedSlide();
  if (!slide) return;

  const nextIndex = photoIndex + direction;
  if (nextIndex < 0 || nextIndex >= slide.images.length) return;

  const [image] = slide.images.splice(photoIndex, 1);
  slide.images.splice(nextIndex, 0, image);
  slide.accent = blendImageAccents(slide.images);
  saveState({ immediate: true });
  renderAll();
  setStatus("사진 순서를 바꿨습니다.");
}

function clearSlides() {
  if (!state.slides.length) return;
  const shouldClear = window.confirm("모든 이미지 슬라이드를 비울까요?");
  if (!shouldClear) return;
  state.slides = [];
  selectedId = null;
  saveState({ immediate: true });
  renderAll();
  setStatus("슬라이드를 모두 비웠습니다.");
}

function saveProjectFile() {
  const json = JSON.stringify(state, null, 2);
  downloadFile(`${safeFileName(state.title || "image-slide-project")}.json`, json, "application/json;charset=utf-8");
  setStatus("프로젝트 파일을 만들었습니다.");
}

function importProjectFile(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state = normalizeProject(JSON.parse(String(reader.result)));
      selectedId = state.slides[0]?.id || null;
      saveState({ immediate: true });
      renderAll();
      setStatus("프로젝트를 불러왔습니다.");
    } catch (error) {
      console.error(error);
      setStatus("프로젝트 파일을 읽지 못했습니다.");
    } finally {
      elements.importProjectInput.value = "";
    }
  });
  reader.readAsText(file, "utf-8");
}

function startPresentation() {
  if (!state.slides.length) return;
  const session = presentationSession + 1;
  presentationSession = session;
  presenterIndex = Math.max(0, getSelectedIndex());
  elements.presenter.hidden = false;
  document.body.style.overflow = "hidden";
  renderPresenter();

  if (elements.presenter.requestFullscreen) {
    elements.presenter
      .requestFullscreen()
      .then(() => {
        if (presentationSession !== session || elements.presenter.hidden) exitPresenterFullscreen();
      })
      .catch(() => {});
  }
}

function closePresentation() {
  presentationSession += 1;
  elements.presenter.hidden = true;
  document.body.style.overflow = "";
  exitPresenterFullscreen();
  window.setTimeout(exitPresenterFullscreen, 180);
}

function exitPresenterFullscreen() {
  if (document.fullscreenElement === elements.presenter && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function movePresenter(direction) {
  presenterIndex = Math.min(state.slides.length - 1, Math.max(0, presenterIndex + direction));
  renderPresenter();
}

function renderPresenter() {
  elements.presenterCounter.textContent = `${presenterIndex + 1} / ${state.slides.length}`;
  elements.presenterStage.innerHTML = renderSlideMarkup(
    state.slides[presenterIndex],
    presenterIndex,
    state.slides.length,
    state
  );
  elements.presentPrevButton.disabled = presenterIndex === 0;
  elements.presentNextButton.disabled = presenterIndex === state.slides.length - 1;
}

function exportDeck() {
  if (!state.slides.length) return;
  const html = buildDeckHtml(state);
  downloadFile(`${safeFileName(state.title || "presentation")}.html`, html, "text/html;charset=utf-8");
  setStatus("발표용 HTML 파일을 만들었습니다.");
}

function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function safeFileName(name) {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "presentation";
}

function renderSlideMarkup(slide, index, total, project) {
  const style = buildSlideStyle(slide);
  const layout = safeLayout(slide.layout);
  const caption = slide.caption ? `<p class="slide-caption">${bodyToHtml(slide.caption)}</p>` : "";
  const presenter = project.presenter ? escapeHtml(project.presenter) : "";
  const textMarkup = layout === "focus" ? "" : `
      <div class="slide-text">
        <span class="slide-number">${index + 1} / ${total}</span>
        <div class="slide-copy">
          <h2 class="slide-title">${escapeHtml(slide.title || `사진 ${index + 1}`)}</h2>
          ${caption}
        </div>
        <footer class="slide-footer">
          <span>${escapeHtml(project.title || "발표")}</span>
          <span>${presenter}</span>
        </footer>
      </div>`;

  return `
    <article class="slide layout-${layout}" style="${style}">
      <div class="photo-stage">
        ${renderPhotoSet(slide)}
      </div>
      ${textMarkup}
    </article>
  `;
}

function renderPhotoSet(slide) {
  const arrangement = safeArrangement(slide.arrangement);
  const fit = safeFit(slide.fit);
  const photos = slide.images
    .map((image, index) => `
      <figure class="photo-card">
        <img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || `${slide.title} ${index + 1}`)}">
      </figure>
    `)
    .join("");
  return `<div class="photo-set arrange-${arrangement} fit-${fit}" data-count="${slide.images.length}">${photos}</div>`;
}

function buildSlideStyle(slide) {
  const accent = normalizeAccent(slide.accent);
  const firstImage = slide.images[0];
  return `--accent-rgb: ${accent.r}, ${accent.g}, ${accent.b}; --photo: url("${cssUrl(firstImage.src)}");`;
}

function cssUrl(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "");
}

function bodyToHtml(text) {
  return escapeHtml(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("<br>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function setAutosaveIndicator(message) {
  elements.autosaveIndicator.textContent = message;
}

function setStatus(message, options = {}) {
  window.clearTimeout(statusTimer);
  elements.status.textContent = message;
  if (options.temporary) {
    statusTimer = window.setTimeout(() => {
      if (elements.status.textContent === message) elements.status.textContent = "";
    }, 2200);
  }
}

function buildDeckHtml(project) {
  const title = escapeHtml(project.title || "학생 발표");
  const slides = project.slides
    .map((slide, index) => {
      const markup = renderSlideMarkup(slide, index, project.slides.length, project);
      return markup.replace("<article", `<article id="slide-${index + 1}"`);
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${getDeckCss()}</style>
</head>
<body>
  <main class="deck-viewport" aria-live="polite">
    ${slides}
  </main>
  <nav class="deck-bar" aria-label="발표 조작">
    <strong id="deckCounter">1 / ${project.slides.length}</strong>
    <div class="deck-actions">
      <button id="printDeck" type="button">PDF</button>
      <button id="prevDeck" type="button">이전</button>
      <button id="nextDeck" type="button">다음</button>
    </div>
  </nav>
  <script>${getDeckScript()}</script>
</body>
</html>`;
}

function getDeckCss() {
  return `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  color: #1f2328;
  background: #0c0d10;
  font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif;
}

button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.deck-viewport {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 14px 14px 76px;
}

.deck-viewport .slide {
  display: none;
  width: min(100%, calc((100vh - 106px) * 16 / 9));
  height: auto;
  aspect-ratio: 16 / 9;
}

.deck-viewport .slide.is-active {
  display: grid;
}

.deck-viewport .slide.layout-focus.is-active {
  display: grid;
}

.deck-bar {
  position: fixed;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(12, 13, 16, 0.88);
}

.deck-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.slide {
  --accent-rgb: 15, 118, 110;
  --slide-ink: #17201f;
  position: relative;
  grid-template-columns: minmax(0, 1fr) 286px;
  gap: 24px;
  padding: 38px;
  overflow: hidden;
  color: var(--slide-ink);
  background:
    radial-gradient(circle at 18% 12%, rgba(var(--accent-rgb), 0.26), transparent 34%),
    linear-gradient(135deg, rgba(var(--accent-rgb), 0.13), #fffdfa 52%, rgba(255, 255, 255, 0.84));
  border: 1px solid rgba(31, 35, 40, 0.14);
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.slide::after {
  content: "";
  position: absolute;
  inset: auto 0 0 auto;
  width: 42%;
  height: 9px;
  background: linear-gradient(90deg, rgba(var(--accent-rgb), 0.92), rgba(var(--accent-rgb), 0));
}

.photo-stage {
  position: relative;
  min-height: 0;
  align-self: stretch;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(var(--accent-rgb), 0.12);
  box-shadow: 0 22px 42px rgba(31, 35, 40, 0.18);
}

.photo-stage::before {
  content: "";
  position: absolute;
  inset: -28px;
  background-image: var(--photo);
  background-size: cover;
  background-position: center;
  filter: blur(22px) saturate(0.9);
  opacity: 0.26;
}

.photo-set {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 14px;
}

.photo-card {
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 12px 24px rgba(31, 35, 40, 0.12);
}

.photo-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.fit-cover .photo-card img {
  object-fit: cover;
}

.fit-contain .photo-card img {
  object-fit: contain;
}

.photo-set[data-count="1"],
.arrange-auto[data-count="1"] {
  padding: 0;
}

.arrange-auto[data-count="2"],
.arrange-auto[data-count="4"] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.arrange-auto[data-count="3"] {
  grid-template-columns: 1.15fr 0.85fr;
}

.arrange-auto[data-count="3"] .photo-card:first-child,
.arrange-hero .photo-card:first-child {
  grid-row: span 2;
}

.arrange-auto[data-count="5"],
.arrange-auto[data-count="6"],
.arrange-auto[data-count="7"],
.arrange-auto[data-count="8"],
.arrange-auto[data-count="9"],
.arrange-auto[data-count="10"],
.arrange-auto[data-count="11"],
.arrange-auto[data-count="12"],
.arrange-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.arrange-auto[data-count="13"],
.arrange-auto[data-count="14"],
.arrange-auto[data-count="15"],
.arrange-auto[data-count="16"] {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.arrange-hero {
  grid-template-columns: 1.35fr 1fr;
}

.arrange-hero .photo-card:first-child {
  grid-column: 1;
}

.arrange-row {
  grid-auto-flow: column;
  grid-auto-columns: minmax(120px, 1fr);
  grid-template-columns: none;
}

.arrange-column {
  grid-template-columns: 1fr;
}

.slide-text {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 18px;
  min-width: 0;
}

.slide-number {
  width: fit-content;
  padding: 7px 10px;
  border-radius: 999px;
  color: rgb(var(--accent-rgb));
  background: rgba(var(--accent-rgb), 0.12);
  font-size: 0.86rem;
  font-weight: 900;
}

.slide-copy {
  display: grid;
  align-content: center;
  gap: 16px;
  min-width: 0;
}

.slide-title {
  margin: 0;
  font-size: 2.35rem;
  line-height: 1.12;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.slide-caption {
  margin: 0;
  color: #3f454c;
  font-size: 1.14rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.slide-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #59606b;
  font-size: 0.86rem;
  font-weight: 850;
}

.layout-focus {
  display: grid;
  grid-template-columns: 1fr;
  padding: 30px;
}

.layout-focus .photo-stage {
  min-height: 0;
}

.layout-grid {
  grid-template-columns: minmax(0, 1fr) 260px;
}

.layout-split {
  grid-template-columns: minmax(0, 0.92fr) minmax(250px, 0.58fr);
}

.layout-split .slide-text {
  padding: 8px 0;
}

.layout-caption,
.layout-strip {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) auto;
}

.layout-caption .slide-text,
.layout-strip .slide-text {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 12px 0 0;
}

.layout-caption .slide-copy,
.layout-strip .slide-copy {
  gap: 4px;
}

.layout-caption .slide-title,
.layout-strip .slide-title {
  font-size: 1.74rem;
}

.layout-caption .slide-caption,
.layout-strip .slide-caption {
  font-size: 0.98rem;
}

.layout-strip .photo-set {
  grid-auto-flow: column;
  grid-auto-columns: minmax(160px, 1fr);
  grid-template-columns: none;
  overflow: hidden;
}

.layout-strip .photo-set .photo-card:first-child,
.arrange-row .photo-card:first-child,
.arrange-column .photo-card:first-child {
  grid-row: auto;
}

@media (max-width: 760px) {
  .deck-viewport {
    justify-content: start;
    overflow-x: auto;
  }

  .deck-viewport .slide {
    min-width: 560px;
  }

  .deck-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media print {
  @page {
    size: 16in 9in;
    margin: 0;
  }

  body {
    background: #ffffff;
  }

  .deck-bar {
    display: none;
  }

  .deck-viewport {
    display: block;
    min-height: auto;
    padding: 0;
  }

  .deck-viewport .slide,
  .deck-viewport .slide.is-active {
    display: grid;
    width: 100vw;
    height: 100vh;
    min-width: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }

}
`;
}

function getDeckScript() {
  return `
(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const counter = document.getElementById("deckCounter");
  const prevButton = document.getElementById("prevDeck");
  const nextButton = document.getElementById("nextDeck");
  const printButton = document.getElementById("printDeck");
  let index = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));

  function show(nextIndex) {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    counter.textContent = (index + 1) + " / " + slides.length;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
    if (location.hash !== "#" + (index + 1)) {
      history.replaceState(null, "", "#" + (index + 1));
    }
  }

  prevButton.addEventListener("click", () => show(index - 1));
  nextButton.addEventListener("click", () => show(index + 1));
  printButton.addEventListener("click", () => window.print());

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      show(index + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      show(index - 1);
    }
  });

  window.addEventListener("hashchange", () => {
    const hashIndex = Number(location.hash.slice(1)) - 1;
    if (Number.isFinite(hashIndex)) show(hashIndex);
  });

  show(index);
})();
`;
}
