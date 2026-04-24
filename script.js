// Edit your profile here only.
const PROFILE = {
  nickname: "Floppx.",
  bio: "Yo, my names Floppx and im a starting developer. Im trying to improve everyday so if you have any tips/recomendations dm me anywhere. Also thanks for every support :P.",
  avatar: "./assets/pfp.jpg",
  background: "./assets/bg.gif", // supports gif/jpg/png/webp
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

// Fill these from your Supabase project settings.
const SUPABASE_URL = "https://piebqfymfsdpclxtywng.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_PoCiVcFVc1XHpjs3aJnR-w_5VUIyHd9";

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

const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");

const supabaseRequest = async (path, body, timeoutMs = 8000) => {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const normalizedBase = SUPABASE_URL.replace(/\/+$/, "");
  const url = `${normalizedBase}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const getCounter = async (key) => {
  const data = await supabaseRequest(`/rest/v1/rpc/get_counter`, { key_name: key });
  if (typeof data !== "number") throw new Error("Bad counter payload");
  return data;
};

const incrementCounter = async (key) => {
  const data = await supabaseRequest(`/rest/v1/rpc/increment_counter`, { key_name: key });
  if (typeof data !== "number") throw new Error("Bad counter payload");
  return data;
};

const refreshCounters = async () => {
  try {
    const [views, likes] = await Promise.all([
      getCounter(VIEW_KEY),
      getCounter(LIKE_KEY)
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
    const views = shouldCountView ? await incrementCounter(VIEW_KEY) : await getCounter(VIEW_KEY);
    setNumber(viewCountEl, views);
    setStoredCount(VIEW_COUNT_LOCAL, views);
    if (shouldCountView) setFlag(VIEW_LOCAL_FLAG, true);
  } catch (error) {
    setNumber(viewCountEl, getStoredCount(VIEW_COUNT_LOCAL));
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
      const likes = await incrementCounter(LIKE_KEY);
      setNumber(likeCountEl, likes);
      setStoredCount(LIKE_COUNT_LOCAL, likes);
      setFlag(LIKE_LOCAL_FLAG, true);
      likeBtn.textContent = "Thanks!";
    } catch (error) {
      likeBtn.disabled = false;
      likeBtn.textContent = "Try Again";
    }
  });
};

const init = async () => {
  setNumber(viewCountEl, getStoredCount(VIEW_COUNT_LOCAL));
  setNumber(likeCountEl, getStoredCount(LIKE_COUNT_LOCAL));
  if (!isSupabaseConfigured()) {
    if (likeBtn) likeBtn.textContent = "Setup Supabase";
    return;
  }
  await Promise.all([registerViewOnce(), refreshCounters()]);
  setupLikeButton();
  setInterval(refreshCounters, COUNTER_REFRESH_MS);
  window.addEventListener("focus", refreshCounters);
};

init();
