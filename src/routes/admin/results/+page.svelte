
<script lang="ts">
  let { data } = $props();

  let countdown = $state(10);
  let showResults = $state(false);

  const PIE_RADIUS = 58;
  const PIE_CENTER = 70;

  const pieColors = [
    '#9564d9',
    '#e83f69',
    '#3979d7',
    '#ff7950',
    '#986c79',
    '#f23a9e',
    '#e2d4f2',
    '#44d78e',
    '#f7bd43',
    '#40a7ef'
  ];

  $effect(() => {
    if (showResults) return;

    countdown = 10;

    const interval = setInterval(() => {
      countdown -= 1;

      if (countdown <= 0) {
        showResults = true;
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  function getPercentage(voteCount: number) {
    if (data.totalVotes === 0) return 0;
    return (voteCount / data.totalVotes) * 100;
  }

  function getRoundedPercentage(voteCount: number) {
    return Math.round(getPercentage(voteCount));
  }

  let sortedResults = $derived(
    [...data.results].sort((a, b) => b.voteCount - a.voteCount)
  );

  let selectedCandidate = $derived(
    sortedResults.length > 0 ? sortedResults[0] : null
  );

  function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  function createPieSlice(startAngle: number, endAngle: number) {
    if (endAngle - startAngle >= 359.999) {
      return [
        `M ${PIE_CENTER} ${PIE_CENTER - PIE_RADIUS}`,
        `A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER} ${PIE_CENTER + PIE_RADIUS}`,
        `A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER} ${PIE_CENTER - PIE_RADIUS}`,
        'Z'
      ].join(' ');
    }

    const start = polarToCartesian(
      PIE_CENTER,
      PIE_CENTER,
      PIE_RADIUS,
      endAngle
    );

    const end = polarToCartesian(
      PIE_CENTER,
      PIE_CENTER,
      PIE_RADIUS,
      startAngle
    );

    const angle = endAngle - startAngle;
    const largeArcFlag = angle > 180 ? 1 : 0;

    return [
      `M ${PIE_CENTER} ${PIE_CENTER}`,
      `L ${start.x} ${start.y}`,
      `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  }

  let pieSlices = $derived.by(() => {
    if (data.totalVotes === 0 || sortedResults.length === 0) {
      return [];
    }

    let currentAngle = 0;

    return sortedResults
      .map((candidate, index) => {
        const percentage =
          (candidate.voteCount / data.totalVotes) * 100;

        const startAngle = currentAngle;
        const endAngle = currentAngle + percentage * 3.6;

        currentAngle = endAngle;

        return {
          candidate,
          index,
          percentage,
          path: createPieSlice(startAngle, endAngle),
          color: pieColors[index % pieColors.length]
        };
      })
      .filter((slice) => slice.percentage > 0);
  });
</script>

<svelte:head>
  <title>Hasil Pemilihan — SIKRABTEK 63</title>
  <meta
    name="description"
    content="Pengumuman kandidat terpilih dan distribusi suara Pemilihan Ketua Angkatan 63."
  />
  <meta name="theme-color" content="#242044" />
</svelte:head>

<div class="min-h-screen bg-[#242044] text-white">
  {#if !showResults}
    <main
      class="flex min-h-screen flex-col items-center justify-center px-5 text-center"
      aria-live="polite"
    >


      <span
        class="mt-5 text-[200px] font-semibold tracking-tight tabular-nums sm:text-[400px]"
      >
        {countdown}
      </span>


    </main>
  {:else}
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

        <a
          href="/admin"
          class="shrink-0 rounded-md px-3 py-2 text-sm text-[#c7c2df] transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#c5b8d6]"
        >
          Kembali
        </a>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      {#if selectedCandidate}
        <!-- Pengumuman kandidat terpilih -->
        <section class="text-center">
          <h1
            class="mx-auto mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-7xl"
          >
            Selamat kepada
          </h1>
          <div
            class="mx-auto mt-9 max-w-2xl rounded-2xl border border-white/10 bg-[#2d284b] p-4 sm:mt-12 sm:p-8"
          >
            <div class="grid grid-cols-2 gap-4 sm:gap-8">
              <div class="min-w-0">
                <div
                  class="mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-xl bg-[#242044]"
                >
                  {#if selectedCandidate.ketuaPhotoUrl}
                    <img
                      src={selectedCandidate.ketuaPhotoUrl}
                      alt={selectedCandidate.ketuaName}
                      class="h-full w-full object-cover"
                    />
                  {:else}
                    <div
                      class="flex h-full items-center justify-center px-3 text-center text-xs text-[#85859f]"
                    >
                      Foto tidak tersedia
                    </div>
                  {/if}
                </div>

                <p
                  class="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a39dbf] sm:text-xs"
                >
                  Ketua
                </p>

                <h2
                  class="mt-1 break-words text-sm leading-5 font-semibold sm:text-xl sm:leading-7"
                >
                  {selectedCandidate.ketuaName}
                </h2>
              </div>

              <div class="min-w-0">
                <div
                  class="mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-xl bg-[#242044]"
                >
                  {#if selectedCandidate.wakilPhotoUrl}
                    <img
                      src={selectedCandidate.wakilPhotoUrl}
                      alt={selectedCandidate.wakilName}
                      class="h-full w-full object-cover"
                    />
                  {:else}
                    <div
                      class="flex h-full items-center justify-center px-3 text-center text-xs text-[#85859f]"
                    >
                      Foto tidak tersedia
                    </div>
                  {/if}
                </div>

                <p
                  class="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a39dbf] sm:text-xs"
                >
                  Wakil Ketua
                </p>

                <h2
                  class="mt-1 break-words text-sm leading-5 font-semibold sm:text-xl sm:leading-7"
                >
                  {selectedCandidate.wakilName}
                </h2>
              </div>
            </div>

            <div class="mt-7 border-t border-white/10 pt-6 sm:mt-9">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-3xl font-semibold tabular-nums sm:text-4xl">
                    {getRoundedPercentage(selectedCandidate.voteCount)}%
                  </p>
                  <p class="mt-1 text-xs text-[#a39dbf]">
                    Perolehan suara
                  </p>
                </div>

                <div class="border-l border-white/10">
                  <p class="text-3xl font-semibold tabular-nums sm:text-4xl">
                    {selectedCandidate.voteCount}
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
            {#if data.totalVotes > 0 && pieSlices.length > 0}
              <div class="relative mx-auto aspect-square w-full max-w-[300px]">
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

                  {#each pieSlices as slice (slice.candidate.id)}
                    <path
                      d={slice.path}
                      fill={slice.color}
                      stroke="#2d284b"
                      stroke-width="1"
                    />
                  {/each}
                </svg>

                <div
                  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                >
                  <p
                    class="text-4xl font-semibold tracking-tight tabular-nums"
                  >
                    {data.totalVotes}
                  </p>

                  <p
                    class="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a39dbf]"
                  >
                    Total suara
                  </p>
                </div>
              </div>

              <!-- Legenda pie -->
              <div class="mx-auto mt-8 max-w-2xl divide-y divide-white/[0.07]">
                {#each pieSlices as slice (slice.candidate.id)}
                  <div class="flex items-center gap-3 py-4">
                    <span
                      class="h-3 w-3 shrink-0 rounded-sm"
                      style={`background-color: ${slice.color}`}
                    ></span>

                    <div class="min-w-0 flex-1">
                      <p class="break-words text-sm font-medium leading-5">
                        {slice.candidate.ketuaName}
                        <span class="text-[#a39dbf]">&</span>
                        {slice.candidate.wakilName}
                      </p>

                      <p class="mt-1 text-xs text-[#a39dbf]">
                        {slice.candidate.voteCount} suara
                      </p>
                    </div>

                    <p
                      class="shrink-0 text-sm font-semibold tabular-nums"
                      style={`color: ${slice.color}`}
                    >
                      {getRoundedPercentage(slice.candidate.voteCount)}%
                    </p>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="py-12 text-center text-sm text-[#a39dbf]">
                Belum ada suara yang tercatat.
              </p>
            {/if}
          </div>
        </section>

        <p class="mx-auto mt-8 max-w-lg text-center text-xs leading-5 text-[#85859f]">
          Hasil ditampilkan berdasarkan jumlah suara yang tercatat di dalam
          sistem.
        </p>
      {:else}
        <section class="py-20 text-center">
          <h1 class="text-2xl font-semibold">
            Belum ada hasil pemilihan
          </h1>

          <p class="mt-3 text-sm leading-6 text-[#a39dbf]">
            Belum ada pasangan calon atau suara yang tercatat di dalam sistem.
          </p>

          <a
            href="/admin"
            class="mt-6 inline-flex rounded-md bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#242044] transition hover:bg-[#d8cde5]"
          >
            Kembali ke admin
          </a>
        </section>
      {/if}
    </main>
  {/if}
</div>
