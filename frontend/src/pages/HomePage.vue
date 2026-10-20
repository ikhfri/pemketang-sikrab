
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
    class="relative isolate flex min-h-[calc(100svh-64px)] items-center justify-center overflow-hidden bg-[#242044] px-4 py-8 font-['DM_Sans',sans-serif] text-[#fbf9ff] bg-[radial-gradient(ellipse_at_75%_45%,rgb(99_73_145/17%)_0%,transparent_39%),radial-gradient(ellipse_at_10%_100%,rgb(91_68_132/13%)_0%,transparent_38%)] md:min-h-[calc(100svh-80px)] md:px-12 md:py-11 lg:px-24"
  >
    <!-- Ambient Background Glows -->
    <div
      class="pointer-events-none absolute -top-60 right-[10%] -z-10 aspect-square w-90 rounded-full bg-[#9564d9] opacity-12 blur-[100px]"
    ></div>

    <div
      class="pointer-events-none absolute -bottom-72 left-[25%] -z-10 aspect-square w-90 rounded-full bg-[#3979d7] opacity-12 blur-[100px]"
    ></div>

    <section
      class="mx-auto grid w-full max-w-130 grid-cols-1 items-center gap-7 md:max-w-310 md:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)] md:gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-20"
    >
      <!-- LEFT: INTRODUCTION -->
      <div class="flex min-w-0 flex-col items-start py-0 md:py-3">
        <div class="w-full max-w-127.5">
          <h1
            class="m-0 text-[42px] font-extrabold leading-[1.06] tracking-[-0.075em] text-[#fbf9ff] sm:text-5xl md:text-6xl lg:text-[74px]"
          >
            Beda warna.
            <br />
            <span class="text-[#c9b5ff]">Satu suara.</span>
          </h1>

          <p
            class="my-5 max-w-107.5 text-[13px] font-normal leading-[1.8] text-[#b8b2cc] md:my-7 md:text-[14px] md:leading-[1.95]"
          >
            Sepuluh kelompok, banyak cerita, satu angkatan. Sekarang waktunya
            menentukan siapa yang bakal membawa Angkatan 63 melangkah lebih jauh.
          </p>

          <RouterLink
            to="/login"
            class="group inline-flex min-h-12.5 items-center justify-center gap-5 rounded-[14px] border border-white/12 bg-[#c9b5ff] pl-5 pr-4 text-xs font-extrabold text-[#242044] no-underline transition-all duration-200 hover:-translate-y-1 hover:bg-[#d9caff] hover:shadow-[0_12px_35px_rgb(201_181_255/20%)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white md:min-h-13.5 md:gap-7 md:pl-6 md:pr-5 md:text-[13px]"
          >
            <span>Mulai Vote Sekarang</span>

            <span
              class="grid h-6.75 w-6.75 place-items-center rounded-[9px] bg-[#242044]/10 text-lg transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            >
              ↗
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- RIGHT: ANIMATED GROUP ORBIT -->
      <div
        class="relative mx-auto flex w-full min-w-0 max-w-105 flex-col items-center justify-center md:max-w-none"
        role="img"
        aria-label="Sepuluh kelompok Angkatan 63 mengorbit logo angkatan"
      >
        <div
          class="relative isolate aspect-square w-full max-w-97.5 md:max-w-142.5"
        >
          <!-- Decorative Rings -->
          <div
            class="pointer-events-none absolute inset-[8%] rounded-full border border-[#c9b5ff]/12"
          ></div>

          <div
            class="pointer-events-none absolute inset-[21%] rounded-full border border-dashed border-[#c9b5ff]/18"
          ></div>

          <!-- Twinkling Sparks -->
          <span
            class="spark pointer-events-none absolute left-[22%] top-[20%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)]"
          ></span>

          <span
            class="spark pointer-events-none absolute left-[12%] top-[72%] z-10 h-0.75 w-0.75 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.8s]"
          ></span>

          <span
            class="spark pointer-events-none absolute right-[12%] top-[27%] z-10 h-0.75 w-0.75 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:1.3s]"
          ></span>

          <span
            class="spark pointer-events-none absolute bottom-[15%] right-[20%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.5s]"
          ></span>

          <!-- Orbiting Group Balls -->
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
                  <div
                    class="orbit-upright pointer-events-auto flex w-max items-center gap-1.5 transition-transform duration-300 hover:scale-110 md:gap-2"
                  >
                    <!-- Bola Kelompok -->
                    <span
                      class="orbit-ball relative aspect-square w-4 flex-none rounded-full border-2 border-[#242044] sm:w-4.5 md:w-6 md:border-[3px]"
                    ></span>

                    <!-- Label Nama Kelompok -->
                    <span
                      class="orbit-label max-w-19.5 truncate rounded-full px-2 py-1 text-[8px] font-extrabold tracking-[0.01em] shadow-[0_5px_18px_rgb(10_7_29/25%)] backdrop-blur-xs sm:max-w-23 sm:text-[9px] md:max-w-29 md:px-2.5 md:py-1.5 md:text-[11px]"
                    >
                      {{ group.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Center Emblem -->
          <div
            class="absolute left-1/2 top-1/2 z-20 grid aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#c9b5ff]/25 bg-[radial-gradient(circle_at_35%_25%,rgb(117_92_170/55%),transparent_57%),linear-gradient(145deg,#39315d_0%,#282244_75%)] shadow-[0_0_0_9px_rgb(201_181_255/3%),0_0_0_20px_rgb(201_181_255/2%),0_18px_70px_rgb(8_5_24/40%),inset_0_1px_0_rgb(255_255_255/10%)] md:w-[37%]"
          >
            <div
              class="absolute inset-[-12%] -z-10 rounded-full bg-[#9564d9]/20 blur-[26px]"
            ></div>

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
body {
  margin: 0;
  min-height: 100%;
  background-color: #242044;
}

/* Posisi sudut awal bola pada cincin orbit */
.orbit-wrapper {
  transform: rotate(var(--angle));
}

/* Putaran orbit */
.orbit-spinner {
  animation: spin var(--duration) linear infinite;
  will-change: transform;
}

.orbit-spinner.reverse {
  animation-direction: reverse;
}

/* Posisi item di tepi atas lingkaran */
.orbit-pos {
  transform: translate(-50%, -50%);
}

/* Menjaga label tetap menghadap ke atas */
.orbit-counter {
  animation: spin var(--duration) linear infinite reverse;
  will-change: transform;
}

.orbit-counter.reverse {
  animation-direction: normal;
}

/* Kompensasi sudut awal */
.orbit-upright {
  transform: rotate(calc(-1 * var(--angle)));
}

/* Warna bola mengikuti warna kelompok */
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

/* Kapsul nama kelompok */
.orbit-label {
  border: 1px solid
    color-mix(in srgb, var(--group-color) 40%, transparent);

  background-color: rgb(43 37 73 / 92%);
  color: var(--group-color);
}

/* Efek bintang */
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

/* Hormati preferensi pengguna yang mengurangi animasi */
@media (prefers-reduced-motion: reduce) {
  .orbit-spinner,
  .orbit-counter,
  .spark {
    animation-play-state: paused;
  }
}
</style>
