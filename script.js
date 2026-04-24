// Edit your profile here only.
const PROFILE = {
  nickname: "Floppx.",
  bio: "Yo, my names Floppx and im a starting developer. Im trying to improve everyday so if you have any tips/recomendations dm me anywhere. Also thanks for every support :P",
  avatar: "./assets/pfp.jpg",
  background: "./assets/video.mp4", // supports gif/jpg/png/webp
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

const COUNTER_NAMESPACE = "sergi-personal-site";
const VIEW_KEY = "views";
const LIKE_KEY = "likes";
const LIKE_LOCAL_FLAG = "liked_once";

if (nicknameEl) nicknameEl.textContent = PROFILE.nickname;
if (bioEl) bioEl.textContent = PROFILE.bio;
if (avatarEl) avatarEl.src = PROFILE.avatar;
if (bgEl) bgEl.style.backgroundImage = `url("${PROFILE.background}")`;
if (music) {
  music.src = PROFILE.music;
  music.volume = PROFILE.musicVolume;
}

const baseTitle = document.title;
const year = new Date().getFullYear();
document.title = `${baseTitle} - ${year}`;

if (music) {
  const startMusic = async () => {
    try {
      await music.play();
    } catch (error) {
      // Autoplay can be blocked; retry after first user interaction.
    }
  };

  startMusic();
  window.addEventListener("click", startMusic, { once: true });
}

const setNumber = (element, value) => {
  if (element) {
    element.textContent = String(value);
  }
};

const updateCounter = async (key, hit) => {
  const url = `https://api.countapi.xyz/${hit ? "hit" : "get"}/${COUNTER_NAMESPACE}/${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Counter request failed");
  const data = await response.json();
  return data.value ?? 0;
};

const loadCounters = async () => {
  try {
    const viewCount = await updateCounter(VIEW_KEY, true);
    setNumber(viewCountEl, viewCount);
  } catch (error) {
    setNumber(viewCountEl, 0);
  }

  try {
    const likes = await updateCounter(LIKE_KEY, false);
    setNumber(likeCountEl, likes);
  } catch (error) {
    setNumber(likeCountEl, 0);
  }
};

loadCounters();

if (likeBtn) {
  const alreadyLiked = localStorage.getItem(LIKE_LOCAL_FLAG) === "true";
  if (alreadyLiked) {
    likeBtn.disabled = true;
    likeBtn.textContent = "Thanks for your support";
  }

  likeBtn.addEventListener("click", async () => {
    if (localStorage.getItem(LIKE_LOCAL_FLAG) === "true") return;
    try {
      const likes = await updateCounter(LIKE_KEY, true);
      setNumber(likeCountEl, likes);
      localStorage.setItem(LIKE_LOCAL_FLAG, "true");
      likeBtn.disabled = true;
      likeBtn.textContent = "Thanks for your support";
    } catch (error) {
      likeBtn.textContent = "Try Again";
    }
  });
}
