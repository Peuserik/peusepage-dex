const requireElement = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element with id "${id}".`);
  }
  return element;
};

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (typeof text === "string") {
    element.textContent = text;
  }
  return element;
};

const dom = {
  crtScreen: requireElement("crt-screen"),
  desktopFileName: requireElement("desktop-file-name"),
  certificateLabel: requireElement("certificate-label"),
  certificateName: requireElement("certificate-name"),
  certificateTitle: requireElement("certificate-title"),
  certificateSentence: requireElement("certificate-sentence"),
  pinboardTitle: requireElement("pinboard-title"),
  darkmodeButton: requireElement("darkmode-button"),
  themeButton: requireElement("theme-button"),
  languageButton: requireElement("language-button"),
  computerAction: requireElement("computer-action"),
  keyboardAction: requireElement("keyboard-action"),
  mouseAction: requireElement("mouse-action"),
  certificateAction: requireElement("certificate-action"),
  windowAction: requireElement("window-action"),
  pinboardAction: requireElement("pinboard-action"),
  popupLayer: requireElement("popup-layer"),
  popupTemplate: requireElement("popup-template"),
};

const state = {
  config: null,
  themeIndex: 0,
  languageIndex: 0,
  isNight: false,
  activePopup: null,
};

const getLanguage = () => state.config.languages[state.languageIndex];

const getThemeLabel = (theme, langCode) => {
  if (!theme.labels || typeof theme.labels !== "object") {
    return theme.id;
  }
  return theme.labels[langCode] || theme.labels.en || theme.id;
};

const getLinkLabel = (link, langCode) => {
  if (!link.labels || typeof link.labels !== "object") {
    return link.id || "Link";
  }
  return link.labels[langCode] || link.labels.en || link.id || "Link";
};

const closePopup = () => {
  if (state.activePopup) {
    state.activePopup.remove();
    state.activePopup = null;
  }
};

const setNightMode = (enabled) => {
  state.isNight = enabled;
  document.body.dataset.mode = enabled ? "night" : "day";
};

const applyTheme = () => {
  const language = getLanguage();
  const theme = state.config.themes[state.themeIndex];
  dom.crtScreen.dataset.theme = theme.id;
  dom.themeButton.textContent = `${language.controls.theme}: ${getThemeLabel(theme, language.code)}`;
};

const renderApplicationsPopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.applications.description));

  const grid = createElement("ul", "app-grid");
  language.popups.applications.apps.forEach((app) => {
    const item = createElement("li", "app-item");
    const symbol = createElement("span", "app-symbol", app.symbol);
    const wrap = createElement("div");
    wrap.append(createElement("p", "app-name", app.name), createElement("p", "app-tag", app.tag));
    item.append(symbol, wrap);
    grid.appendChild(item);
  });
  container.appendChild(grid);
};

const renderCertificatePopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.certificate.summary));
  container.appendChild(createElement("p", "", language.popups.certificate.monitorHint));
  container.appendChild(createElement("h3", "", language.popups.certificate.linksTitle));

  const links = createElement("ul", "link-list");
  state.config.contactLinks.forEach((link) => {
    const item = createElement("li");
    const anchor = createElement("a");
    anchor.href = link.url;
    anchor.target = link.url.startsWith("mailto:") ? "_self" : "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = getLinkLabel(link, language.code);
    item.appendChild(anchor);
    links.appendChild(item);
  });
  container.appendChild(links);
};

const renderHobbiesPopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.hobbies.intro));
  const list = createElement("ul");
  language.popups.hobbies.items.forEach((itemText) => {
    list.appendChild(createElement("li", "", itemText));
  });
  container.appendChild(list);
};

const renderTasksPopup = (container, language) => {
  container.appendChild(createElement("h3", "", language.popups.tasks.latestTitle));
  const latestList = createElement("ul");
  language.popups.tasks.latestEvents.forEach((itemText) => {
    latestList.appendChild(createElement("li", "", itemText));
  });
  container.appendChild(latestList);

  container.appendChild(createElement("h3", "", language.popups.tasks.currentTitle));
  const currentList = createElement("ul");
  language.popups.tasks.currentWork.forEach((itemText) => {
    currentList.appendChild(createElement("li", "", itemText));
  });
  container.appendChild(currentList);
};

const renderPopupBody = (container, key, language) => {
  container.replaceChildren();
  if (key === "applications") {
    renderApplicationsPopup(container, language);
    return;
  }
  if (key === "certificate") {
    renderCertificatePopup(container, language);
    return;
  }
  if (key === "hobbies") {
    renderHobbiesPopup(container, language);
    return;
  }
  if (key === "tasks") {
    renderTasksPopup(container, language);
  }
};

const openPopup = (key) => {
  const language = getLanguage();
  closePopup();

  const fragment = dom.popupTemplate.content.cloneNode(true);
  const overlay = fragment.querySelector(".popup-overlay");
  const popupWindow = fragment.querySelector(".popup-window");
  const title = fragment.querySelector(".popup-title");
  const closeButton = fragment.querySelector(".popup-close");
  const body = fragment.querySelector(".popup-body");

  if (!overlay || !popupWindow || !title || !closeButton || !body) {
    throw new Error("Popup template is missing required elements.");
  }

  title.textContent = language.popups[key].title;
  renderPopupBody(body, key, language);

  closeButton.addEventListener("click", () => closePopup());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePopup();
    }
  });
  popupWindow.addEventListener("click", (event) => event.stopPropagation());

  dom.popupLayer.appendChild(overlay);
  state.activePopup = overlay;
  state.activePopup.dataset.popupKey = key;
};

const refreshOpenPopupLanguage = () => {
  if (!state.activePopup) {
    return;
  }

  const key = state.activePopup.dataset.popupKey;
  if (!key) {
    return;
  }

  const language = getLanguage();
  const title = state.activePopup.querySelector(".popup-title");
  const body = state.activePopup.querySelector(".popup-body");
  if (!title || !body) {
    return;
  }

  title.textContent = language.popups[key].title;
  renderPopupBody(body, key, language);
};

const revealDesktopOnCertificate = () => {
  dom.crtScreen.classList.add("desktop-visible");
};

const updateActionLabels = () => {
  const language = getLanguage();
  dom.computerAction.setAttribute("aria-label", language.actionLabels.computer);
  dom.keyboardAction.setAttribute("aria-label", language.actionLabels.keyboard);
  dom.mouseAction.setAttribute("aria-label", language.actionLabels.mouse);
  dom.certificateAction.setAttribute("aria-label", language.actionLabels.certificate);
  dom.windowAction.setAttribute("aria-label", language.actionLabels.window);
  dom.pinboardAction.setAttribute("aria-label", language.actionLabels.pinboard);
};

const updateControlLabels = () => {
  const language = getLanguage();
  const modeText = state.isNight ? language.controls.night : language.controls.day;
  dom.darkmodeButton.textContent = `${language.controls.mode}: ${modeText}`;
  dom.darkmodeButton.setAttribute("aria-pressed", state.isNight ? "true" : "false");
  dom.languageButton.textContent = `${language.controls.language}: ${language.label}`;
  applyTheme();
};

const applyLanguage = () => {
  const language = getLanguage();
  document.documentElement.lang = language.code;
  document.title = language.pageTitle;

  dom.certificateLabel.textContent = language.certificate.label;
  dom.certificateName.textContent = state.config.certificate.name;
  dom.certificateTitle.textContent = language.certificate.title;
  dom.certificateSentence.textContent = language.certificate.sentence;
  dom.pinboardTitle.textContent = language.scene.pinboardTitle;
  dom.desktopFileName.textContent = language.popups.certificate.desktopFileLabel;

  updateActionLabels();
  updateControlLabels();
  refreshOpenPopupLanguage();
};

const setupControlEvents = () => {
  dom.darkmodeButton.addEventListener("click", () => {
    setNightMode(!state.isNight);
    updateControlLabels();
  });

  dom.themeButton.addEventListener("click", () => {
    state.themeIndex = (state.themeIndex + 1) % state.config.themes.length;
    applyTheme();
  });

  dom.languageButton.addEventListener("click", () => {
    state.languageIndex = (state.languageIndex + 1) % state.config.languages.length;
    applyLanguage();
  });
};

const setupActionEvents = () => {
  const openApps = () => openPopup("applications");
  dom.computerAction.addEventListener("click", openApps);
  dom.keyboardAction.addEventListener("click", openApps);
  dom.mouseAction.addEventListener("click", openApps);

  dom.certificateAction.addEventListener("click", () => {
    revealDesktopOnCertificate();
    openPopup("certificate");
  });

  dom.windowAction.addEventListener("click", () => openPopup("hobbies"));
  dom.pinboardAction.addEventListener("click", () => openPopup("tasks"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePopup();
    }
  });
};

const validateConfig = (config) => {
  if (!config || typeof config !== "object") {
    throw new Error("content/main.json must contain a JSON object.");
  }
  if (!Array.isArray(config.themes) || config.themes.length === 0) {
    throw new Error("content/main.json requires a non-empty themes array.");
  }
  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    throw new Error("content/main.json requires a non-empty languages array.");
  }
  if (!Array.isArray(config.contactLinks) || config.contactLinks.length === 0) {
    throw new Error("content/main.json requires contact links.");
  }
};

const applyInitialUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");
  const lang = params.get("lang");
  const mode = params.get("mode");

  if (theme) {
    const themeIndex = state.config.themes.findIndex((entry) => entry.id === theme);
    if (themeIndex >= 0) {
      state.themeIndex = themeIndex;
    }
  }

  if (lang) {
    const languageIndex = state.config.languages.findIndex((entry) => entry.code === lang);
    if (languageIndex >= 0) {
      state.languageIndex = languageIndex;
    }
  }

  setNightMode(mode === "night");
};

const loadConfig = async () => {
  const response = await fetch("content/main.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load content/main.json (HTTP ${response.status}).`);
  }
  return response.json();
};

const init = async () => {
  try {
    state.config = await loadConfig();
    validateConfig(state.config);
    applyInitialUrlState();
    setupControlEvents();
    setupActionEvents();
    applyLanguage();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const fallback = createElement("main");
    fallback.style.padding = "24px";
    fallback.style.color = "#fff";
    fallback.style.fontFamily = "sans-serif";
    fallback.append(createElement("h1", "", "Main page failed to load"), createElement("p", "", message));
    document.body.replaceChildren(fallback);
    throw error;
  }
};

init();
