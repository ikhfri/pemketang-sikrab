
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { api } from "../services/api";
import type { Candidate } from "../types";

const countdown = ref(10);
const showResults = ref(false);
const results = ref<Candidate[]>([]);
const totalVotes = ref(0);
const loading = ref(true);
const errorMessage = ref("");

const PIE_RADIUS = 58;
const PIE_CENTER = 70;

const pieColors = [
  "#9564d9",
  "#e83f69",
  "#3979d7",
  "#ff7950",
  "#986c79",
  "#f23a9e",
  "#e2d4f2",
  "#44d78e",
  "#f7bd43",
  "#40a7ef",
];

let timer: ReturnType<typeof setInterval> | undefined;

const sortedResults = computed(() =>
  [...results.value].sort(
    (a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0),
  ),
);

const winner = computed(() => sortedResults.value[0] ?? null);

function getPercentage(voteCount: number) {
  if (totalVotes.value === 0) return 0;
  return (voteCount / totalVotes.value) * 100;
}

function getRoundedPercentage(voteCount: number) {
  return Math.round(getPercentage(voteCount));
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function createPieSlice(startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.999) {
    return [
      `M ${PIE_CENTER} ${PIE_CENTER - PIE_RADIUS}`,
      `A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER} ${PIE_CENTER + PIE_RADIUS}`,
      `A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER} ${PIE_CENTER - PIE_RADIUS}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(
    PIE_CENTER,
    PIE_CENTER,
    PIE_RADIUS,
    endAngle,
  );

  const end = polarToCartesian(
    PIE_CENTER,
    PIE_CENTER,
    PIE_RADIUS,
    startAngle,
  );

  const angle = endAngle - startAngle;
  const largeArcFlag = angle > 180 ? 1 : 0;

  return [
    `M ${PIE_CENTER} ${PIE_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

const pieSlices = computed(() => {
  if (totalVotes.value === 0 || sortedResults.value.length === 0) {
    return [];
  }

  let currentAngle = 0;

  return sortedResults.value
    .map((candidate, index) => {
      const voteCount = candidate.voteCount ?? 0;
      const percentage = (voteCount / totalVotes.value) * 100;

      const startAngle = currentAngle;
      const endAngle = currentAngle + percentage * 3.6;

      currentAngle = endAngle;

      return {
        candidate,
        index,
        percentage,
        path: createPieSlice(startAngle, endAngle),
        color: pieColors[index % pieColors.length],
      };
    })
    .filter((slice) => slice.percentage > 0);
});

onMounted(async () => {
  document.title = "Hasil Pemilihan — SIKRABTEK 63";

  try {
    const data = await api.results();

    results.value = data.results ?? [];
    totalVotes.value = data.totalVotes ?? 0;
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Gagal memuat hasil pemilihan.";
  } finally {
    loading.value = false;
  }

  timer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0;
      showResults.value = true;

      if (timer) clearInterval(timer);
    } else {
      countdown.value -= 1;
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="min-h-screen bg-[#242044] text-white">
    <!-- Countdown -->
    <main
      v-if="!showResults"
      class="flex min-h-screen flex-col items-center justify-center px-5 text-center"
      aria-live="polite"
    >
      <img
        src="/images/logo.jpg"
        alt="SIKRABTEK 63"
        class="h-16 w-16 rounded-2xl object-cover"
      />

      <p
        class="mt-6 text-xs font-semibold uppercase tracking-[.25em] text-[#c5b8d6]"
      >
        Hasil pemilihan
      </p>

      <span
        class="mt-5 text-[200px] leading-none font-semibold tracking-tight tabular-nums sm:text-[400px]"
      >
        {{ countdown }}
      </span>


    </main>

    <!-- Hasil pemilihan -->
    <template v-else>
      <header class="border-b border-white/10">
        <div
          class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
        >
          <div class="flex min-w-0 items-center gap-3">
            <img
              src="/images/logo.jpg"
              alt="SIKRABTEK 63"
              class="h-9 w-9 shrink-0 rounded-lg object-cover"
            />

            <div class="min-w-0">
              <p class="text-sm font-semibold">SIKRABTEK 63</p>
            </div>
          </div>

          <RouterLink
            to="/admin"
            class="shrink-0 rounded-md px-3 py-2 text-sm text-[#c7c2df] transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#c5b8d6]"
          >
            Kembali
          </RouterLink>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-6 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"
        >
          {{ errorMessage }}
        </div>

        <p v-if="loading" class="text-center text-sm text-white/55">
          Memuat hasil...
        </p>

        <template v-else>
          <!-- Pengumuman kandidat terpilih -->
          <section v-if="winner" class="text-center">
            <h1
              class="mx-auto mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-7xl"
            >
              Selamat kepada
            </h1>

            <div
              class="mx-auto mt-9 max-w-2xl rounded-2xl border border-white/10 bg-[#2d284b] p-4 sm:mt-12 sm:p-8"
            >
              <div class="grid grid-cols-2 gap-4 sm:gap-8">
                <!-- Ketua -->
                <div class="min-w-0">
                  <div
                    class="mx-auto aspect-[4/5] w-full max-w-55 overflow-hidden rounded-xl bg-[#242044]"
                  >
                    <img
                      v-if="winner.ketuaPhotoUrl"
                      :src="winner.ketuaPhotoUrl"
                      :alt="winner.ketuaName"
                      class="h-full w-full object-cover"
                    />

                    <div
                      v-else
                      class="flex h-full items-center justify-center px-3 text-center text-xs text-[#85859f]"
                    >
                      Foto tidak tersedia
                    </div>
                  </div>

                  <p
                    class="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a39dbf] sm:text-xs"
                  >
                    Ketua
                  </p>

                  <h2
                    class="mt-1 break-words text-sm leading-5 font-semibold sm:text-xl sm:leading-7"
                  >
                    {{ winner.ketuaName }}
                  </h2>
                </div>

                <!-- Wakil Ketua -->
                <div class="min-w-0">
                  <div
                    class="mx-auto aspect-[4/5] w-full max-w-55 overflow-hidden rounded-xl bg-[#242044]"
                  >
                    <img
                      v-if="winner.wakilPhotoUrl"
                      :src="winner.wakilPhotoUrl"
                      :alt="winner.wakilName"
                      class="h-full w-full object-cover"
                    />

                    <div
                      v-else
                      class="flex h-full items-center justify-center px-3 text-center text-xs text-[#85859f]"
                    >
                      Foto tidak tersedia
                    </div>
                  </div>

                  <p
                    class="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a39dbf] sm:text-xs"
                  >
                    Wakil Ketua
                  </p>

                  <h2
                    class="mt-1 break-words text-sm leading-5 font-semibold sm:text-xl sm:leading-7"
                  >
                    {{ winner.wakilName }}
                  </h2>
                </div>
              </div>

              <!-- Statistik pemenang -->
              <div class="mt-7 border-t border-white/10 pt-6 sm:mt-9">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      class="text-3xl font-semibold tabular-nums sm:text-4xl"
                    >
                      {{ getRoundedPercentage(winner.voteCount ?? 0) }}%
                    </p>

                    <p class="mt-1 text-xs text-[#a39dbf]">
                      Perolehan suara
                    </p>
                  </div>

                  <div class="border-l border-white/10">
                    <p
                      class="text-3xl font-semibold tabular-nums sm:text-4xl"
                    >
                      {{ winner.voteCount ?? 0 }}
                    </p>

                    <p class="mt-1 text-xs text-[#a39dbf]">
                      Total suara
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Distribusi suara -->
          <section class="mt-12 sm:mt-16">
            <div class="text-center">
              <h2 class="text-xl font-semibold sm:text-2xl">
                Distribusi Suara
              </h2>

              <p class="mt-2 text-sm leading-6 text-[#a39dbf]">
                Perbandingan perolehan suara seluruh pasangan calon.
              </p>
            </div>

            <div
              class="mt-7 rounded-2xl border border-white/10 bg-[#2d284b] p-5 sm:mt-9 sm:p-8"
            >
              <template v-if="totalVotes > 0 && pieSlices.length > 0">
                <!-- Diagram pie SVG -->
                <div class="relative mx-auto aspect-square w-full max-w-75">
                  <svg
                    viewBox="0 0 140 140"
                    class="h-full w-full"
                    role="img"
                    aria-label="Diagram pie distribusi suara"
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r="58"
                      fill="#343052"
                    />

                    <path
                      v-for="slice in pieSlices"
                      :key="slice.candidate.id"
                      :d="slice.path"
                      :fill="slice.color"
                      stroke="#2d284b"
                      stroke-width="1"
                    />
                  </svg>

                  <div
                    class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <p
                      class="text-4xl font-semibold tracking-tight tabular-nums"
                    >
                      {{ totalVotes }}
                    </p>

                    <p
                      class="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a39dbf]"
                    >
                      Total suara
                    </p>
                  </div>
                </div>

                <!-- Legenda pie -->
                <div
                  class="mx-auto mt-8 max-w-2xl divide-y divide-white/[0.07]"
                >
                  <div
                    v-for="slice in pieSlices"
                    :key="slice.candidate.id"
                    class="flex items-center gap-3 py-4"
                  >
                    <span
                      class="h-3 w-3 shrink-0 rounded-sm"
                      :style="{ backgroundColor: slice.color }"
                    />

                    <div class="min-w-0 flex-1">
                      <p class="break-words text-sm font-medium leading-5">
                        {{ slice.candidate.ketuaName }}
                        <span class="text-[#a39dbf]">&amp;</span>
                        {{ slice.candidate.wakilName }}
                      </p>

                      <p class="mt-1 text-xs text-[#a39dbf]">
                        {{ slice.candidate.voteCount ?? 0 }} suara
                      </p>
                    </div>

                    <p
                      class="shrink-0 text-sm font-semibold tabular-nums"
                      :style="{ color: slice.color }"
                    >
                      {{
                        getRoundedPercentage(
                          slice.candidate.voteCount ?? 0,
                        )
                      }}%
                    </p>
                  </div>
                </div>
              </template>

              <p
                v-else
                class="py-12 text-center text-sm text-[#a39dbf]"
              >
                Belum ada suara yang tercatat.
              </p>
            </div>
          </section>

          <p
            class="mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-[#85859f]"
          >
            Hasil ditampilkan berdasarkan jumlah suara yang tercatat di dalam
            sistem.
          </p>

          <!-- Tidak ada kandidat -->
          <section v-if="!winner" class="py-20 text-center">
            <h1 class="text-2xl font-semibold">
              Belum ada hasil pemilihan
            </h1>

            <p class="mt-3 text-sm leading-6 text-[#a39dbf]">
              Belum ada pasangan calon atau suara yang tercatat di dalam sistem.
            </p>

            <RouterLink
              to="/admin"
              class="mt-6 inline-flex rounded-md bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#242044] transition hover:bg-[#d8cde5]"
            >
              Kembali ke admin
            </RouterLink>
          </section>
        </template>

        <footer
          class="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/35"
        >
          SIKRABTEK 63 · TITIK NOL
        </footer>
      </main>
    </template>
  </div>
</template>
