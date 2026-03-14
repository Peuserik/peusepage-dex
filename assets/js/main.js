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
  crtDesktop: requireElement("crt-desktop"),
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
  darkMode: false,
  activePopup: null,
  crtDesktopVisible: false,
};

const getLanguage = () => state.config.languages[state.languageIndex];

const getThemeLabel = (theme, langCode) => {
  if (!theme.labels || typeof theme.labels !== "object") {
    return theme.id;
  }
  return theme.labels[langCode] || theme.labels.en || theme.id;
};

const setDarkMode = (enabled) => {
  state.darkMode = enabled;
  document.body.dataset.mode = enabled ? "night" : "day";
};

const applyTheme = () => {
  const language = getLanguage();
  const theme = state.config.themes[state.themeIndex];
  dom.crtScreen.dataset.theme = theme.id;
  dom.themeButton.textContent = `${language.controls.theme}: ${getThemeLabel(theme, language.code)}`;
};

const applyControlLabels = () => {
  const language = getLanguage();
  const modeText = state.darkMode ? language.controls.night : language.controls.day;
  dom.darkmodeButton.textContent = `${language.controls.mode}: ${modeText}`;
  dom.darkmodeButton.setAttribute("aria-pressed", state.darkMode ? "true" : "false");
  dom.languageButton.textContent = `${language.controls.language}: ${language.label}`;
  applyTheme();
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

const renderApplicationsPopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.applications.description));

  const grid = createElement("ul", "app-grid");
  language.popups.applications.apps.forEach((app) => {
    const item = createElement("li", "app-item");
    const symbol = createElement("span", "app-symbol", app.symbol);
    const textWrap = createElement("div");
    const name = createElement("p", "app-name", app.name);
    const tag = createElement("p", "app-tag", app.tag);
    textWrap.append(name, tag);
    item.append(symbol, textWrap);
    grid.appendChild(item);
  });
  container.appendChild(grid);
};

const renderCertificatePopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.certificate.summary));
  container.appendChild(createElement("p", "", language.popups.certificate.monitorHint));

  const linksTitle = createElement("h3", "", language.popups.certificate.linksTitle);
  container.appendChild(linksTitle);
  const linkList = createElement("ul", "link-list");

  state.config.contactLinks.forEach((link) => {
    const item = createElement("li");
    const anchor = createElement("a");
    anchor.href = link.url;
    anchor.target = link.url.startsWith("mailto:") ? "_self" : "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = link.label;
    item.appendChild(anchor);
    linkList.appendChild(item);
  });

  container.appendChild(linkList);
};

const renderHobbiesPopup = (container, language) => {
  container.appendChild(createElement("p", "", language.popups.hobbies.intro));
  const list = createElement("ul");
  language.popups.hobbies.items.forEach((entry) => {
    list.appendChild(createElement("li", "", entry));
  });
  container.appendChild(list);
};

const renderTasksPopup = (container, language) => {
  const latestHeading = createElement("h3", "", language.popups.tasks.latestTitle);
  container.appendChild(latestHeading);
  const latestList = createElement("ul");
  language.popups.tasks.latestEvents.forEach((entry) => {
    latestList.appendChild(createElement("li", "", entry));
  });
  container.appendChild(latestList);

  const currentHeading = createElement("h3", "", language.popups.tasks.currentTitle);
  container.appendChild(currentHeading);
  const currentList = createElement("ul");
  language.popups.tasks.currentWork.forEach((entry) => {
    currentList.appendChild(createElement("li", "", entry));
  });
  container.appendChild(currentList);
};

const renderPopupBody = (container, popupKey, language) => {
  container.replaceChildren();

  if (popupKey === "applications") {
    renderApplicationsPopup(container, language);
    return;
  }
  if (popupKey === "certificate") {
    renderCertificatePopup(container, language);
    return;
  }
  if (popupKey === "hobbies") {
    renderHobbiesPopup(container, language);
    return;
  }
  if (popupKey === "tasks") {
    renderTasksPopup(container, language);
  }
};

const closePopup = () => {
  if (state.activePopup) {
    state.activePopup.remove();
    state.activePopup = null;
  }
};

const openPopup = (popupKey) => {
  const language = getLanguage();
  closePopup();

  const fragment = dom.popupTemplate.content.cloneNode(true);
  const overlay = fragment.querySelector(".popup-overlay");
  const windowElement = fragment.querySelector(".popup-window");
  const title = fragment.querySelector(".popup-title");
  const closeButton = fragment.querySelector(".popup-close");
  const body = fragment.querySelector(".popup-body");

  title.textContent = language.popups[popupKey].title;
  renderPopupBody(body, popupKey, language);

  closeButton.addEventListener("click", () => closePopup());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePopup();
    }
  });

  windowElement.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  dom.popupLayer.appendChild(overlay);
  state.activePopup = overlay;
  state.activePopup.dataset.popupKey = popupKey;
};

const refreshOpenPopupLanguage = () => {
  if (!state.activePopup) {
    return;
  }

  const popupKey = state.activePopup.dataset.popupKey;
  const language = getLanguage();
  const title = state.activePopup.querySelector(".popup-title");
  const body = state.activePopup.querySelector(".popup-body");
  if (!title || !body || !popupKey) {
    return;
  }

  title.textContent = language.popups[popupKey].title;
  renderPopupBody(body, popupKey, language);
};

const revealDesktopOnCrt = () => {
  state.crtDesktopVisible = true;
  dom.crtScreen.classList.add("desktop-visible");
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
  applyControlLabels();
  refreshOpenPopupLanguage();
};

const setupControlEvents = () => {
  dom.darkmodeButton.addEventListener("click", () => {
    setDarkMode(!state.darkMode);
    applyControlLabels();
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
  const openApplications = () => openPopup("applications");
  dom.computerAction.addEventListener("click", openApplications);
  dom.keyboardAction.addEventListener("click", openApplications);
  dom.mouseAction.addEventListener("click", openApplications);

  dom.certificateAction.addEventListener("click", () => {
    revealDesktopOnCrt();
    openPopup("certificate");
  });

  dom.windowAction.addEventListener("click", () => {
    openPopup("hobbies");
  });

  dom.pinboardAction.addEventListener("click", () => {
    openPopup("tasks");
  });

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
  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    throw new Error("content/main.json requires a non-empty languages array.");
  }
  if (!Array.isArray(config.themes) || config.themes.length === 0) {
    throw new Error("content/main.json requires a non-empty themes array.");
  }
  if (!Array.isArray(config.contactLinks) || config.contactLinks.length === 0) {
    throw new Error("content/main.json requires contactLinks.");
  }
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
    setDarkMode(false);
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
