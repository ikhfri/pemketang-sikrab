
<script setup lang="ts">
import { onMounted } from "vue";

interface Group {
  name: string;
  color: string;
}

const groups: Group[] = [
  { name: "Noctis", color: "#9564D9" },
  { name: "Valor", color: "#E83F69" },
  { name: "Melankara", color: "#3979D7" },
  { name: "Resolve", color: "#FF7950" },
  { name: "Bingbong", color: "#986C79" },
  { name: "Rubora", color: "#F23A9E" },
  { name: "Tranquil", color: "#E2D4F2" },
  { name: "Aversa", color: "#44D78E" },
  { name: "Euphoria", color: "#F7BD43" },
  { name: "Aspire", color: "#40A7EF" },
];

onMounted(() => {
  document.title = "Pemilihan Ketua Angkatan 63";

  const updateMeta = (name: string, content: string) => {
    let meta = document.querySelector<HTMLMetaElement>(
      `meta[name="${name}"]`,
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }

    meta.content = content;
  };

  updateMeta(
    "description",
    "Beda warna, satu suara. Saatnya ikut menentukan pemimpin Angkatan 63.",
  );

  updateMeta("theme-color", "#242044");
});
</script>

<template>

<main
  class="landing-page relative isolate flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#242044] text-[#fbf9ff]"
>
<!-- Background -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,rgb(99_73_145/17%)_0%,transparent_39%),radial-gradient(ellipse_at_10%_100%,rgb(91_68_132/13%)_0%,transparent_38%)]"
    />

    <div
      class="pointer-events-none absolute -top-40 right-[10%] -z-10 aspect-square w-72 rounded-full bg-[#9564d9] opacity-10 blur-[90px] sm:w-90"
    />

    <div
      class="pointer-events-none absolute -bottom-48 left-[25%] -z-10 aspect-square w-72 rounded-full bg-[#3979d7] opacity-10 blur-[90px] sm:w-90"
    />

    <section class="landing-layout mx-auto grid h-full min-h-0 w-full max-w-310 grid-cols-1 items-center px-4 sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-5 md:px-8 lg:gap-12 lg:px-12">
      <!-- Introduction -->
     
<div class="landing-intro flex min-w-0 flex-col items-start justify-center">
  <div class="w-full max-w-127.5">

    <h1
      class="m-0 text-[clamp(2.75rem,5.2vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.055em] text-[#fbf9ff]"
    >
      The Next Chapter Of
      <br />
      <span class="text-[#c9b5ff]">TEK 63 </span>
    </h1>

    <p
      class="landing-description mt-5 max-w-md text-sm leading-7 text-[#b8b2cc] sm:mt-6 sm:text-[15px]"
    >
      Setiap angkatan punya ceritanya sendiri. Sekarang, saatnya
      menentukan siapa yang akan membawa Angkatan 63 di buku cerita Teknologi Rekayasa Komputer IPB University
    </p>

    <RouterLink
      to="/login"
      class="group mt-7 inline-flex min-h-12 items-center justify-center gap-4 rounded-xl bg-[#c9b5ff] px-5 text-[13px] font-bold text-[#242044] no-underline transition-colors duration-200 hover:bg-[#d9caff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-8 sm:gap-5 sm:px-6"
    >
      <span>Mulai Vote Sekarang</span>

      <span
        class="text-lg leading-none transition-transform duration-200 group-hover:translate-x-1"
        aria-hidden="true"
      >
        →
      </span>
    </RouterLink>

  </div>
</div>


      <!-- Animated group orbit -->
      <div
        class="landing-orbit relative mx-auto flex h-full min-h-0 w-full min-w-0 items-center justify-center"
        role="img"
        aria-label="Sepuluh kelompok Angkatan 63 mengorbit logo angkatan"
      >
        <div class="orbit-canvas relative isolate aspect-square w-full">
          <!-- Decorative rings -->
          <div class="pointer-events-none absolute inset-[8%] rounded-full border border-[#c9b5ff]/12" />
          <div class="pointer-events-none absolute inset-[21%] rounded-full border border-dashed border-[#c9b5ff]/18" />

          <!-- Twinkling sparks -->
          <span class="spark pointer-events-none absolute left-[22%] top-[20%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)]" />

          <span class="spark pointer-events-none absolute left-[12%] top-[72%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.8s]" />

          <span class="spark pointer-events-none absolute right-[12%] top-[27%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:1.3s]" />

          <span class="spark pointer-events-none absolute bottom-[15%] right-[20%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.5s]" />

          <!-- Orbiting groups -->
          <div
            v-for="(group, index) in groups"
            :key="group.name"
            class="orbit-wrapper pointer-events-none absolute z-30 rounded-full"
            :class="index % 2 === 1 ? 'inset-[21%]' : 'inset-[8%]'"
            :style="{
              '--angle': `${Math.floor(index / 2) * 72 + (index % 2 === 1 ? 36 : 0)}deg`,
              '--group-color': group.color,
              '--duration': index % 2 === 1 ? '26s' : '34s',
            }"
          >
            <div
              class="orbit-spinner h-full w-full rounded-full"
              :class="{ reverse: index % 2 === 1 }"
            >
              <div class="orbit-pos absolute left-1/2 top-0">
                <div
                  class="orbit-counter"
                  :class="{ reverse: index % 2 === 1 }"
                >
                  <div class="orbit-upright pointer-events-auto flex w-max items-center gap-1.5 transition-transform duration-300 hover:scale-110 sm:gap-2">
                    <span class="orbit-ball relative aspect-square w-3.5 flex-none rounded-full border-2 border-[#242044] sm:w-4 md:w-5 md:border-[3px]" />

                    <span class="orbit-label max-w-17 truncate rounded-full px-1.5 py-1 text-[8px] font-extrabold tracking-[0.01em] shadow-[0_5px_18px_rgb(10_7_29/25%)] sm:max-w-23 sm:px-2 sm:text-[9px] md:max-w-27 md:py-1.5 md:text-[10px]">
                      {{ group.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Center emblem -->
          <div class="absolute left-1/2 top-1/2 z-20 grid aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#c9b5ff]/25 bg-[radial-gradient(circle_at_35%_25%,rgb(117_92_170/55%),transparent_57%),linear-gradient(145deg,#39315d_0%,#282244_75%)] shadow-[0_0_0_9px_rgb(201_181_255/3%),0_0_0_20px_rgb(201_181_255/2%),0_18px_70px_rgb(8_5_24/40%),inset_0_1px_0_rgb(255_255_255/10%)] md:w-[37%]">
            <div class="absolute inset-[-12%] -z-10 rounded-full bg-[#9564d9]/20 blur-[26px]" />

            <img
              src="/images/logo.jpg"
              alt="Logo Angkatan 63"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style>
html,
body,
#app {
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
}

body {
  background-color: #242044;
}

* {
  box-sizing: border-box;
}

/*
 * Halaman mengisi ruang yang diberikan layout utama.
 * Header dan footer dikelola oleh layout, bukan halaman ini.
 */
.landing-page {
  min-height: 0;
  height: 100%;
  isolation: isolate;
}

.landing-layout {
  grid-template-rows: auto minmax(0, 1fr);
}

.landing-intro {
  min-height: 0;
  padding-top: clamp(0.5rem, 2vh, 1.5rem);
  padding-bottom: clamp(0.5rem, 2vh, 1.5rem);
}

.landing-description {
  margin-top: clamp(0.65rem, 2vh, 1.5rem);
  margin-bottom: clamp(0.8rem, 2.5vh, 1.75rem);
}

.landing-orbit {
  min-height: 0;
  overflow: visible;
}

.orbit-canvas {
  max-height: 100%;
  max-width: min(100%, 570px);
  flex-shrink: 0;
}

/* Initial orbit positions */
.orbit-wrapper {
  transform: rotate(var(--angle));
}

/* Orbit animation */
.orbit-spinner {
  animation: spin var(--duration) linear infinite;
  will-change: transform;
}

.orbit-spinner.reverse {
  animation-direction: reverse;
}

.orbit-pos {
  transform: translate(-50%, -50%);
}

/* Keep labels upright while orbiting */
.orbit-counter {
  animation: spin var(--duration) linear infinite reverse;
  will-change: transform;
}

.orbit-counter.reverse {
  animation-direction: normal;
}

.orbit-upright {
  transform: rotate(calc(-1 * var(--angle)));
}

/* Group ball colors */
.orbit-ball {
  background: radial-gradient(
    circle at 30% 25%,
    #ffffff 0%,
    var(--group-color) 32%,
    var(--group-color) 70%,
    color-mix(in srgb, var(--group-color), #242044 25%) 100%
  );

  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--group-color) 65%, transparent),
    0 0 18px color-mix(in srgb, var(--group-color) 35%, transparent);
}

.orbit-label {
  border: 1px solid
    color-mix(in srgb, var(--group-color) 40%, transparent);
  background-color: rgb(43 37 73 / 92%);
  color: var(--group-color);
}

/* Twinkling sparks */
.spark {
  animation: twinkle 3s ease-in-out infinite alternate;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes twinkle {
  from {
    opacity: 0.3;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1.35);
  }
}

/*
 * Desktop: two columns, one viewport.
 * Orbit is constrained by the available height.
 */
@media (min-width: 768px) {
  .landing-layout {
    grid-template-rows: minmax(0, 1fr);
  }

  .landing-intro {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .orbit-canvas {
    width: min(100%, 68svh, 570px);
  }
}

/* Short desktop screens */
@media (min-width: 768px) and (max-height: 760px) {
  .landing-intro h1 {
    font-size: clamp(2rem, 7.5vh, 3.8rem);
  }

  .landing-description {
    font-size: 12px;
    line-height: 1.65;
    margin-top: 0.8rem;
    margin-bottom: 1rem;
  }

  .orbit-canvas {
    width: min(100%, 72svh, 470px);
  }
}

/* Mobile: intro above orbit, both constrained to the available space */
@media (max-width: 767px) {
  .landing-page {
    overflow: hidden;
  }

  .landing-layout {
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .landing-intro {
    padding-top: 0.4rem;
    padding-bottom: 0.5rem;
  }

  .landing-intro > div {
    max-width: 100%;
  }

  .landing-intro h1 {
    font-size: clamp(1.8rem, 7vw, 2.65rem);
  }

  .landing-description {
    max-width: 34rem;
    margin-top: 0.65rem;
    margin-bottom: 0.8rem;
    font-size: 12px;
    line-height: 1.6;
  }

  .landing-orbit {
    width: 100%;
    height: 100%;
  }

  .orbit-canvas {
    width: min(100%, 43svh, 390px);
  }
}

/* Extra-short phones */
@media (max-width: 767px) and (max-height: 700px) {
  .landing-layout {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }

  .landing-intro {
    padding-top: 0;
    padding-bottom: 0.25rem;
  }

  .landing-intro > div > p:first-child {
    margin-bottom: 0.3rem;
    font-size: 9px;
  }

  .landing-intro h1 {
    font-size: clamp(1.65rem, 6vh, 2.3rem);
  }

  .landing-description {
    margin-top: 0.4rem;
    margin-bottom: 0.5rem;
    font-size: 11px;
    line-height: 1.45;
  }

  .landing-intro a {
    min-height: 2.5rem;
  }

  .orbit-canvas {
    width: min(100%, 39svh, 300px);
  }
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .orbit-spinner,
  .orbit-counter,
  .spark {
    animation-play-state: paused;
  }

  .orbit-upright,
  .landing-page a {
    transition: none;
  }
}
</style>
