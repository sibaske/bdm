const CONFIG = {
  revealText:
    "желаю всего самого наилучешго, чтоб мечты сбывались и всегда было к чему стремиться.\nспасибо спасибо тебе за всё ❤️",
  photo: {
    enabled: false,
    src: "assets/photo-mama.jpg",
    alt: "Портрет мамы",
  },
  music: {
    enabled: false,
    src: "assets/music.mp3",
    volume: 0.35,
  },
};

const ui = {
  revealBtn: document.getElementById("revealBtn"),
  revealMessage: document.getElementById("revealMessage"),
  musicBtn: document.getElementById("musicBtn"),
  bgMusic: document.getElementById("bgMusic"),
  burstLayer: document.getElementById("burstLayer"),
  photoFrame: document.getElementById("photoFrame"),
  momPhoto: document.getElementById("momPhoto"),
  heartCanvas: document.getElementById("heartCanvas"),
};

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const HEART_GLYPHS = ["❤", "♥", "♡"];
const SPARK_GLYPHS = ["✦", "✧"];
const BURST_COLORS = ["#ff5fa2", "#ffd3e6", "#ffffff", "#ff8fbf", "#ffc2d9"];

function prefersLessMotion() {
  return motionQuery.matches || navigator.connection?.saveData === true;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function init() {
  initRevealMessage();
  initRevealButton();
  initGlobalClickBurst();
  initPhoto();
  initMusic();
  initParticles();
  initHeartCanvas();
  startAmbientHearts();
}

function initRevealMessage() {
  ui.revealMessage.textContent = CONFIG.revealText;
}

function initRevealButton() {
  ui.revealBtn.addEventListener("click", () => {
    if (ui.revealMessage.hidden) {
      ui.revealMessage.hidden = false;
      requestAnimationFrame(() => {
        ui.revealMessage.classList.add("is-visible");
      });
    }

    const rect = ui.revealBtn.getBoundingClientRect();
    spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
      hearts: 18,
      pieces: 26,
      force: 1.15,
    });
  });
}

function initGlobalClickBurst() {
  document.addEventListener("pointerdown", (event) => {
    if (prefersLessMotion()) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("#revealBtn") || event.target.closest("#musicBtn")) return;

    spawnBurst(event.clientX, event.clientY, {
      hearts: 7,
      pieces: 10,
      force: 0.55,
    });
  });
}

function initPhoto() {
  if (!CONFIG.photo.enabled || !CONFIG.photo.src) {
    return;
  }

  ui.photoFrame.classList.remove("is-hidden");
  ui.momPhoto.alt = CONFIG.photo.alt || "";
  ui.momPhoto.src = CONFIG.photo.src;

  ui.momPhoto.addEventListener(
    "error",
    () => {
      ui.photoFrame.classList.add("is-hidden");
      console.warn("Не удалось загрузить фото. Проверь путь CONFIG.photo.src.");
    },
    { once: true },
  );
}

function initMusic() {
  if (!CONFIG.music.enabled || !CONFIG.music.src) {
    return;
  }

  ui.bgMusic.src = CONFIG.music.src;
  ui.bgMusic.volume = CONFIG.music.volume;
  ui.musicBtn.classList.remove("is-hidden");

  ui.bgMusic.addEventListener(
    "error",
    () => {
      ui.musicBtn.classList.add("is-hidden");
      console.warn("Не удалось загрузить музыку. Проверь путь CONFIG.music.src.");
    },
    { once: true },
  );

  ui.musicBtn.addEventListener("click", async () => {
    if (ui.bgMusic.paused) {
      try {
        await ui.bgMusic.play();
        ui.musicBtn.textContent = "Выключить музыку";
        ui.musicBtn.setAttribute("aria-pressed", "true");

        const rect = ui.musicBtn.getBoundingClientRect();
        spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
          hearts: 10,
          pieces: 12,
          force: 0.7,
        });
      } catch (error) {
        console.warn("Браузер не дал запустить звук автоматически:", error);
        ui.musicBtn.textContent = "Нажми ещё раз для музыки";
        ui.musicBtn.setAttribute("aria-pressed", "false");
      }
    } else {
      ui.bgMusic.pause();
      ui.musicBtn.textContent = "Включить музыку";
      ui.musicBtn.setAttribute("aria-pressed", "false");
    }
  });
}

async function initParticles() {
  if (prefersLessMotion()) return;
  if (!window.tsParticles || !window.loadSlim) return;

  try {
    await loadSlim(tsParticles);

    let shapeTypes = ["circle"];

    if (window.loadHeartShape) {
      await loadHeartShape(tsParticles);
      shapeTypes = ["circle", "heart"];
    }

    await tsParticles.load({
      id: "tsparticles",
      options: {
        fullScreen: {
          enable: false,
        },
        background: {
          color: "transparent",
        },
        fpsLimit: 60,
        detectRetina: true,
        pauseOnBlur: true,
        pauseOnOutsideViewport: true,
        particles: {
          number: {
            value: window.innerWidth < 768 ? 26 : 42,
            density: {
              enable: true,
              area: 900,
            },
          },
          color: {
            value: BURST_COLORS,
          },
          shape: {
            type: shapeTypes,
          },
          size: {
            value: {
              min: 1,
              max: 4,
            },
          },
          opacity: {
            value: {
              min: 0.18,
              max: 0.65,
            },
          },
          links: {
            enable: true,
            distance: 130,
            color: "#ff7ab2",
            opacity: 0.12,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.6,
            outModes: {
              default: "out",
            },
          },
        },
        interactivity: {
          detectsOn: "window",
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.22,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.warn("Не удалось запустить tsParticles:", error);
  }
}

function initHeartCanvas() {
  if (prefersLessMotion()) return;
  if (!ui.heartCanvas?.getContext) return;

  const ctx = ui.heartCanvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let frameId = 0;
  let points = [];
  let running = true;

  function heartPoint(t, scale, centerX, centerY) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    return {
      x: centerX + x * scale,
      y: centerY - y * scale,
    };
  }

  function rebuild() {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ui.heartCanvas.width = Math.round(width * dpr);
    ui.heartCanvas.height = Math.round(height * dpr);
    ui.heartCanvas.style.width = `${width}px`;
    ui.heartCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = width / 2;
    const centerY = Math.max(height * 0.34, 190);
    const scale = Math.min(width, height) * (width < 768 ? 0.012 : 0.015);
    const count = width < 768 ? 90 : 140;

    points = Array.from({ length: count }, (_, index) => {
      const t = (Math.PI * 2 * index) / count;
      const pos = heartPoint(t, scale, centerX, centerY);

      return {
        baseX: pos.x,
        baseY: pos.y,
        orbit: random(2, width < 768 ? 7 : 11),
        size: random(1.4, width < 768 ? 3.5 : 4.2),
        alpha: random(0.35, 0.95),
        phase: random(0, Math.PI * 2),
      };
    });
  }

  function render(time) {
    if (!running) return;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = Math.max(height * 0.34, 190);
    const pulse = 1 + Math.sin(time * 0.0018) * 0.018;

    const glow = ctx.createRadialGradient(
      centerX,
      centerY,
      12,
      centerX,
      centerY,
      Math.min(width, height) * 0.16,
    );
    glow.addColorStop(0, "rgba(255, 95, 162, 0.10)");
    glow.addColorStop(1, "rgba(255, 95, 162, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(width, height) * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 95, 162, 0.55)";

    for (const point of points) {
      const alpha = Math.max(0.18, point.alpha + Math.sin(time * 0.002 + point.phase) * 0.12);
      const x = centerX + (point.baseX - centerX) * pulse + Math.cos(time * 0.0016 + point.phase) * point.orbit;
      const y = centerY + (point.baseY - centerY) * pulse + Math.sin(time * 0.0018 + point.phase) * point.orbit;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 120, 182, ${alpha})`;
      ctx.arc(x, y, point.size, 0, Math.PI * 2);
      ctx.fill();
    }

    frameId = requestAnimationFrame(render);
  }

  rebuild();
  frameId = requestAnimationFrame(render);
  window.addEventListener("resize", rebuild, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frameId);
      return;
    }

    if (!running) {
      running = true;
      frameId = requestAnimationFrame(render);
    }
  });
}

function startAmbientHearts() {
  if (prefersLessMotion()) return;

  const delay = window.innerWidth < 768 ? 1700 : 1300;

  window.setInterval(() => {
    spawnAmbientHeart(random(16, window.innerWidth - 16), window.innerHeight + 28);
  }, delay);
}

function spawnAmbientHeart(x, y) {
  const heart = document.createElement("span");
  heart.className = "ambient-heart";
  heart.textContent = Math.random() > 0.18 ? pick(HEART_GLYPHS) : pick(SPARK_GLYPHS);
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  heart.style.fontSize = `${random(12, 28)}px`;
  heart.style.opacity = String(random(0.55, 0.95));
  heart.style.setProperty("--dx", `${random(-80, 80)}px`);
  heart.style.setProperty("--dy", `${random(-window.innerHeight * 1.15, -window.innerHeight * 0.7)}px`);
  heart.style.setProperty("--rot", `${random(-35, 35)}deg`);
  heart.style.setProperty("--duration", `${random(4500, 7500)}ms`);
  heart.addEventListener("animationend", () => heart.remove(), { once: true });
  ui.burstLayer.appendChild(heart);
}

function spawnBurst(x, y, options = {}) {
  if (prefersLessMotion()) return;

  const hearts = options.hearts ?? 10;
  const pieces = options.pieces ?? 12;
  const force = options.force ?? 1;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < hearts; index += 1) {
    const heart = document.createElement("span");
    heart.className = "burst-heart";
    heart.textContent = Math.random() > 0.22 ? pick(HEART_GLYPHS) : pick(SPARK_GLYPHS);
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = `${random(14, 30) * force}px`;
    heart.style.setProperty("--dx", `${random(-160, 160) * force}px`);
    heart.style.setProperty("--dy", `${random(-220, 150) * force}px`);
    heart.style.setProperty("--rot", `${random(-220, 220)}deg`);
    heart.style.setProperty("--duration", `${random(700, 1150)}ms`);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
    fragment.appendChild(heart);
  }

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("span");
    piece.className = "burst-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = pick(BURST_COLORS);
    piece.style.setProperty("--w", `${random(6, 12)}px`);
    piece.style.setProperty("--h", `${random(14, 22)}px`);
    piece.style.setProperty("--dx", `${random(-180, 180) * force}px`);
    piece.style.setProperty("--dy", `${random(-240, 170) * force}px`);
    piece.style.setProperty("--rot", `${random(-260, 260)}deg`);
    piece.style.setProperty("--duration", `${random(700, 1100)}ms`);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
    fragment.appendChild(piece);
  }

  ui.burstLayer.appendChild(fragment);
}

init();
