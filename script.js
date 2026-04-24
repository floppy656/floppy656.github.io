// Edit your profile here only.
const PROFILE = {
  nickname: "Floppx.",
  bio: "Yo, my names Floppx and im a starting developer. Im trying to improve everyday so if you have any tips/recomendations dm me anywhere. Also thanks for every support :P.",
  avatar: "./assets/pfp.jpg",
  background: "./assets/bg.gif", // supports gif/jpg/png/webp/mp4 background image file
  music: "./assets/music.mp3",
  musicVolume: 0.25 // 0.0 to 1.0
};

const nicknameEl = document.getElementById("nickname");
const bioEl = document.getElementById("bio");
const avatarEl = document.querySelector(".avatar");
const bgEl = document.querySelector(".bg-media");
const music = document.getElementById("bgMusic");
const likeBtn = document.getElementById("likeBtn");
const likeCountEl = document.getElementById("likeCount");
const viewCountEl = document.getElementById("viewCount");

const COUNTER_NAMESPACE = "floppy656-personal-site-v2";
const VIEW_KEY = "views";
const LIKE_KEY = "likes";
const LIKE_LOCAL_FLAG = "liked_once";
const VIEW_LOCAL_FLAG = "viewed_once";
const LIKE_COUNT_LOCAL = "like_count_local";
const VIEW_COUNT_LOCAL = "view_count_local";
const COUNTER_REFRESH_MS = 3000;

const memoryStore = {};

if (nicknameEl) nicknameEl.textContent = PROFILE.nickname;
if (bioEl) bioEl.textContent = PROFILE.bio;
if (avatarEl) avatarEl.src = PROFILE.avatar;
if (bgEl) bgEl.style.backgroundImage = `url("${PROFILE.background}")`;
if (music) {
  music.src = PROFILE.music;
  music.volume = PROFILE.musicVolume;
}

const baseTitle = document.title;
document.title = `${baseTitle} - ${new Date().getFullYear()}`;

if (music) {
  const startMusic = async () => {
    try {
      await music.play();
    } catch (error) {
      // Browser blocked autoplay; click fallback below.
    }
  };
  startMusic();
  window.addEventListener("click", startMusic, { once: true });
}

const setNumber = (el, value) => {
  if (el) el.textContent = String(value);
};

const getCurrentCount = (el) => {
  if (!el) return 0;
  const parsed = Number.parseInt(el.textContent || "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getStoredCount = (key) => {
  try {
    const parsed = Number.parseInt(localStorage.getItem(key) || "0", 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    const fallback = Number.parseInt(memoryStore[key] || "0", 10);
    return Number.isNaN(fallback) ? 0 : fallback;
  }
};

const setStoredCount = (key, value) => {
  const clean = String(Math.max(0, Number.parseInt(String(value), 10) || 0));
  try {
    localStorage.setItem(key, clean);
  } catch (error) {
    memoryStore[key] = clean;
  }
};

const getFlag = (key) => {
  try {
    return localStorage.getItem(key) === "true";
  } catch (error) {
    return memoryStore[key] === true;
  }
};

const setFlag = (key, value) => {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch (error) {
    memoryStore[key] = value;
  }
};

const fetchJsonWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const counterRequest = async (key, hit) => {
  const route = hit ? "hit" : "get";
  const url = `https://api.countapi.xyz/${route}/${COUNTER_NAMESPACE}/${key}`;
  const data = await fetchJsonWithTimeout(url);
  if (typeof data.value !== "number") throw new Error("Bad counter payload");
  return data.value;
};

const counterRequestWithRetry = async (key, hit, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await counterRequest(key, hit);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const refreshCounters = async () => {
  try {
    const [views, likes] = await Promise.all([
      counterRequestWithRetry(VIEW_KEY, false),
      counterRequestWithRetry(LIKE_KEY, false)
    ]);
    setNumber(viewCountEl, views);
    setNumber(likeCountEl, likes);
    setStoredCount(VIEW_COUNT_LOCAL, views);
    setStoredCount(LIKE_COUNT_LOCAL, likes);
  } catch (error) {
    setNumber(viewCountEl, getStoredCount(VIEW_COUNT_LOCAL));
    setNumber(likeCountEl, getStoredCount(LIKE_COUNT_LOCAL));
  }
};

const registerViewOnce = async () => {
  try {
    const shouldCountView = !getFlag(VIEW_LOCAL_FLAG);
    const views = await counterRequestWithRetry(VIEW_KEY, shouldCountView);
    setNumber(viewCountEl, views);
    setStoredCount(VIEW_COUNT_LOCAL, views);
    if (shouldCountView) setFlag(VIEW_LOCAL_FLAG, true);
  } catch (error) {
    const localViews = getStoredCount(VIEW_COUNT_LOCAL);
    const adjustedViews = !getFlag(VIEW_LOCAL_FLAG) ? localViews + 1 : localViews;
    setNumber(viewCountEl, adjustedViews);
    setStoredCount(VIEW_COUNT_LOCAL, adjustedViews);
    if (!getFlag(VIEW_LOCAL_FLAG)) setFlag(VIEW_LOCAL_FLAG, true);
  }
};

const setupLikeButton = async () => {
  if (!likeBtn) return;

  if (getFlag(LIKE_LOCAL_FLAG)) {
    likeBtn.disabled = true;
    likeBtn.textContent = "Thanks!";
    return;
  }

  likeBtn.addEventListener("click", async () => {
    if (getFlag(LIKE_LOCAL_FLAG)) return;
    likeBtn.disabled = true;
    likeBtn.textContent = "Sending...";

    try {
      const likes = await counterRequest(LIKE_KEY, true);
      setNumber(likeCountEl, likes);
      setStoredCount(LIKE_COUNT_LOCAL, likes);
      setFlag(LIKE_LOCAL_FLAG, true);
      likeBtn.textContent = "Thanks!";
    } catch (error) {
      // Fallback: still accept the like locally so user experience never breaks.
      const currentLikes = getCurrentCount(likeCountEl);
      const localLikes = currentLikes + 1;
      setNumber(likeCountEl, localLikes);
      setStoredCount(LIKE_COUNT_LOCAL, localLikes);
      setFlag(LIKE_LOCAL_FLAG, true);
      likeBtn.textContent = "Thanks!";
    }
  });
};

const init = async () => {
  setNumber(viewCountEl, getStoredCount(VIEW_COUNT_LOCAL));
  setNumber(likeCountEl, getStoredCount(LIKE_COUNT_LOCAL));
  await Promise.all([registerViewOnce(), refreshCounters()]);
  setupLikeButton();
  setInterval(refreshCounters, COUNTER_REFRESH_MS);
  window.addEventListener("focus", refreshCounters);
};

init();
