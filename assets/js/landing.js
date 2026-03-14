const requireElement = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element with id "${id}".`);
  }
  return element;
};

const dom = {
  screen: requireElement("screen"),
  certificateLabel: requireElement("certificate-label"),
  certificateName: requireElement("certificate-name"),
  certificateTitle: requireElement("certificate-title"),
  certificateSentence: requireElement("certificate-sentence"),
  welcomeText: requireElement("welcome-text"),
  enterHint: requireElement("enter-hint"),
  darkmodeButton: requireElement("darkmode-button"),
  themeButton: requireElement("theme-button"),
  languageButton: requireElement("language-button"),
  transitionLayer: requireElement("transition-layer"),
  transitionMessage: requireElement("transition-message"),
};

const state = {
  config: null,
  themeIndex: 0,
  languageIndex: 0,
  fontIndex: 0,
  transitioning: false,
  rotateTimer: null,
};

const validateConfig = (config) => {
  if (!config || typeof config !== "object") {
    throw new Error("Landing config must be a JSON object.");
  }
  if (!Array.isArray(config.themes) || config.themes.length === 0) {
    throw new Error("Landing config requires a non-empty themes array.");
  }
  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    throw new Error("Landing config requires a non-empty languages array.");
  }
  if (!Array.isArray(config.fonts) || config.fonts.length === 0) {
    throw new Error("Landing config requires a non-empty fonts array.");
  }
};

const setModeButtonLabel = () => {
  const labels = state.config.controls;
  const isDark = document.body.dataset.mode === "dark";
  dom.darkmodeButton.textContent = `${labels.darkModeLabel}: ${isDark ? labels.dark : labels.light}`;
  dom.darkmodeButton.setAttribute("aria-pressed", isDark ? "true" : "false");
};

const applyTheme = () => {
  const theme = state.config.themes[state.themeIndex];
  dom.screen.dataset.theme = theme.id;
  dom.themeButton.textContent = `${state.config.controls.themeLabel}: ${theme.label}`;
};

const applyLanguage = () => {
  const language = state.config.languages[state.languageIndex];
  const certificate = state.config.certificate;
  dom.certificateName.textContent = certificate.name;
  dom.certificateTitle.textContent = language.title;
  dom.certificateSentence.textContent = language.sentence;
  dom.welcomeText.textContent = language.welcome;
  dom.languageButton.textContent = `${state.config.controls.languageLabel}: ${language.label}`;
};

const applyFont = () => {
  const fontFamily = state.config.fonts[state.fontIndex];
  dom.welcomeText.style.fontFamily = fontFamily;
};

const cycleTheme = () => {
  state.themeIndex = (state.themeIndex + 1) % state.config.themes.length;
  applyTheme();
};

const cycleLanguage = () => {
  state.languageIndex = (state.languageIndex + 1) % state.config.languages.length;
  applyLanguage();
};

const cycleWelcomeStyle = () => {
  state.fontIndex = (state.fontIndex + 1) % state.config.fonts.length;
  state.languageIndex = (state.languageIndex + 1) % state.config.languages.length;
  applyFont();
  applyLanguage();
};

const startTransition = () => {
  if (state.transitioning) {
    return;
  }

  state.transitioning = true;
  const durationMs = state.config.transition.durationMs;
  document.body.classList.add("is-transitioning");
  dom.transitionLayer.setAttribute("aria-hidden", "false");

  window.setTimeout(() => {
    const selectedTheme = state.config.themes[state.themeIndex];
    const selectedLanguage = state.config.languages[state.languageIndex];
    const mode = document.body.dataset.mode === "dark" ? "night" : "day";
    const params = new URLSearchParams({
      theme: selectedTheme.id,
      lang: selectedLanguage.code,
      mode,
    });
    const incoming = new URLSearchParams(window.location.search);
    const trace = incoming.get("trace");
    if (trace) {
      params.set("trace", trace);
    }
    window.location.href = `${state.config.meta.mainPage}?${params.toString()}`;
  }, durationMs);
};

const setupControls = () => {
  dom.darkmodeButton.addEventListener("click", () => {
    const isDark = document.body.dataset.mode === "dark";
    document.body.dataset.mode = isDark ? "light" : "dark";
    setModeButtonLabel();
  });

  dom.themeButton.addEventListener("click", () => {
    cycleTheme();
  });

  dom.languageButton.addEventListener("click", () => {
    cycleLanguage();
    state.fontIndex = (state.fontIndex + 1) % state.config.fonts.length;
    applyFont();
  });
};

const setupScreenEntry = () => {
  dom.screen.addEventListener("click", () => {
    startTransition();
  });

  dom.screen.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startTransition();
    }
  });
};

const startWelcomeLoop = () => {
  const interval = state.config.animation.welcomeIntervalMs;
  state.rotateTimer = window.setInterval(() => {
    cycleWelcomeStyle();
  }, interval);
};

const applyInitialState = () => {
  document.title = state.config.meta.title;
  dom.certificateLabel.textContent = state.config.certificate.label;
  dom.enterHint.textContent = state.config.meta.enterHint;
  dom.transitionMessage.textContent = state.config.transition.message;
  document.body.dataset.mode = "light";

  applyTheme();
  applyLanguage();
  applyFont();
  setModeButtonLabel();
};

const loadConfig = async () => {
  const response = await fetch("content/landing.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load content/landing.json (HTTP ${response.status}).`);
  }

  return response.json();
};

const init = async () => {
  try {
    state.config = await loadConfig();
    validateConfig(state.config);
    applyInitialState();
    setupControls();
    setupScreenEntry();
    startWelcomeLoop();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const fallback = document.createElement("main");
    fallback.style.padding = "24px";
    fallback.style.fontFamily = "sans-serif";
    fallback.style.color = "#fff";

    const heading = document.createElement("h1");
    heading.textContent = "Landing page failed to load";
    const text = document.createElement("p");
    text.textContent = message;
    fallback.append(heading, text);
    document.body.replaceChildren(fallback);

    throw error;
  }
};

init();
