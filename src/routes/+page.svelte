<script lang="ts">
  const groups = [
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
</script>

<svelte:head>
  <title>Pemilihan Ketua Angkatan 63</title>
  <meta
    name="description"
    content="Beda warna, satu suara. Saatnya ikut menentukan pemimpin Angkatan 63."
  />
  <meta name="theme-color" content="#242044" />
</svelte:head>

<main
  class="relative isolate flex min-h-[calc(100svh-64px)] md:min-h-[calc(100svh-80px)] items-center justify-center overflow-hidden bg-[#242044] px-4 py-8 sm:px-7 md:px-12 lg:px-24 md:py-11 text-[#fbf9ff] font-['DM_Sans',sans-serif] bg-[radial-gradient(ellipse_at_75%_45%,rgb(99_73_145/17%)_0%,transparent_39%),radial-gradient(ellipse_at_10%_100%,rgb(91_68_132/13%)_0%,transparent_38%)]"
>
  <!-- Ambient Background Glows -->
  <div
    class="pointer-events-none absolute -top-60 right-[10%] -z-10 aspect-square w-90 rounded-full bg-[#9564d9] opacity-12 blur-[100px]"
  ></div>
  <div
    class="pointer-events-none absolute -bottom-72 left-[25%] -z-10 aspect-square w-90 rounded-full bg-[#3979d7] opacity-12 blur-[100px]"
  ></div>

  <section
    class="mx-auto grid w-full max-w-130 md:max-w-310 grid-cols-1 md:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] items-center gap-7 md:gap-8 lg:gap-20"
  >
    <!-- LEFT: INTRODUCTION -->
    <div class="flex min-w-0 flex-col items-start py-0 md:py-3">
      <!-- Brand Identity -->
   

      <!-- Main Copy -->
      <div class="w-full max-w-127.5">
       

        <h1
          class="m-0 text-[42px] sm:text-5xl md:text-6xl lg:text-[74px] font-extrabold leading-[1.06] tracking-[-0.075em] text-[#fbf9ff]"
        >
          Beda warna.<br />
          <span class="text-[#c9b5ff]">Satu suara.</span>
        </h1>

        <p
          class="my-5 md:my-7 max-w-107.5 text-[13px] md:text-[14px] font-normal leading-[1.8] md:leading-[1.95] text-[#b8b2cc]"
        >
          Sepuluh kelompok, banyak cerita, satu angkatan. Sekarang waktunya
          menentukan siapa yang bakal membawa Angkatan 63 melangkah lebih jauh.
        </p>

        <a
          href="/login"
          class="group inline-flex min-h-12.5 md:min-h-13.5 items-center justify-center gap-5 md:gap-7 rounded-[14px] border border-white/12 bg-[#c9b5ff] pl-5 pr-4 md:pl-6 md:pr-5 text-xs md:text-[13px] font-extrabold text-[#242044] no-underline transition-all duration-200 hover:-translate-y-1 hover:bg-[#d9caff] hover:shadow-[0_12px_35px_rgb(201_181_255/20%)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span>Mulai Vote Sekarang</span>
          <span
            class="grid h-6.75 w-6.75 place-items-center rounded-[9px] bg-[#242044]/10 text-lg transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>

   
      </div>

 
    </div>

    <!-- RIGHT: ANIMATED GROUP ORBIT -->
    <div
      class="relative mx-auto flex w-full max-w-105 md:max-w-none min-w-0 flex-col items-center justify-center"
      aria-label="Sepuluh kelompok Angkatan 63"
    >
  

      <div class="relative isolate aspect-square w-full max-w-97.5 md:max-w-142.5">
        <!-- Decorative Rings (Sesuai dengan jalur putar bola) -->
        <div
          class="pointer-events-none absolute inset-[8%] rounded-full border border-[#c9b5ff]/12"
        ></div>
        <div
          class="pointer-events-none absolute inset-[21%] rounded-full border border-dashed border-[#c9b5ff]/18"
        ></div>

        <!-- Twinkling Sparks -->
        <span
          class="spark pointer-events-none absolute top-[20%] left-[22%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)]"
        ></span>
        <span
          class="spark pointer-events-none absolute top-[72%] left-[12%] z-10 h-0.75 w-0.75 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.8s]"
        ></span>
        <span
          class="spark pointer-events-none absolute top-[27%] right-[12%] z-10 h-0.75 w-0.75 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:1.3s]"
        ></span>
        <span
          class="spark pointer-events-none absolute right-[20%] bottom-[15%] z-10 h-1 w-1 rounded-full bg-[#c9b5ff] shadow-[0_0_13px_rgb(201_181_255/65%)] [animation-delay:0.5s]"
        ></span>

        <!-- Orbiting Group Balls -->
        {#each groups as group, i (group.name)}
          {@const isInner = i % 2 === 1}
          {@const angle = Math.floor(i / 2) * 72 + (isInner ? 36 : 0)}
          <div
            class="orbit-wrapper pointer-events-none absolute z-30 rounded-full {isInner
              ? 'inset-[21%]'
              : 'inset-[8%]'}"
            style="--angle: {angle}deg; --group-color: {group.color}; --duration: {isInner
              ? '26s'
              : '34s'};"
          >
            <div class="orbit-spinner h-full w-full rounded-full" class:reverse={isInner}>
              <div class="orbit-pos absolute top-0 left-1/2">
                <div class="orbit-counter" class:reverse={isInner}>
                  <div
                    class="orbit-upright pointer-events-auto flex w-max items-center gap-1.5 md:gap-2 transition-transform duration-300 hover:scale-110"
                  >
                    <!-- Bola Kelompok -->
                    <span
                      class="orbit-ball relative aspect-square w-4 sm:w-4.5 md:w-6 flex-none rounded-full border-2 md:border-[3px] border-[#242044]"
                    ></span>
                    <!-- Label Nama Kelompok -->
                    <span
                      class="orbit-label max-w-19.5 sm:max-w-23 md:max-w-29 truncate rounded-full px-2 py-1 md:px-2.5 md:py-1.5 text-[8px] sm:text-[9px] md:text-[11px] font-extrabold tracking-[0.01em] shadow-[0_5px_18px_rgb(10_7_29/25%)] backdrop-blur-xs"
                    >
                      {group.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}

        <!-- Center Emblem (Bola 63) -->
        <div
          class=" absolute top-1/2 left-1/2 z-20 grid aspect-square w-[38%] md:w-[37%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#c9b5ff]/25 bg-[radial-gradient(circle_at_35%_25%,rgb(117_92_170/55%),transparent_57%),linear-gradient(145deg,#39315d_0%,#282244_75%)] shadow-[0_0_0_9px_rgb(201_181_255/3%),0_0_0_20px_rgb(201_181_255/2%),0_18px_70px_rgb(8_5_24/40%),inset_0_1px_0_rgb(255_255_255/10%)]"
        >
          <div
            class="absolute inset-[-12%] -z-10 rounded-full bg-[#9564d9]/20 blur-[26px]"
          ></div>
          <img src="/images/logo.jpg" alt="" class="w-full h-full object-cover rounded-full" />
        </div>
      </div>

      <div
        class="mt-1 flex items-center justify-center gap-3 text-[8px] md:text-[9px] font-bold tracking-[0.17em] text-[#8e86a9]"
      >

      </div>
    </div>
  </section>
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background-color: #242044;
  }

  /* 1. Atur posisi sudut awal masing-masing bola pada cincin orbit */
  .orbit-wrapper {
    transform: rotate(var(--angle));
  }

  /* 2. Putar seluruh lintasan 360 derajat mengelilingi bola 63 */
  .orbit-spinner {
    animation: spin var(--duration) linear infinite;
    will-change: transform;
  }

  .orbit-spinner.reverse {
    animation-direction: reverse;
  }

  /* 3. Posisikan item tepat di garis tepi atas lingkaran */
  .orbit-pos {
    transform: translate(-50%, -50%);
  }

  /* 4. Putar balik item agar selama mengorbit, teks tetap menghadap ke atas */
  .orbit-counter {
    animation: spin var(--duration) linear infinite reverse;
    will-change: transform;
  }

  .orbit-counter.reverse {
    animation-direction: normal;
  }

  /* 5. Kompensasi sudut awal agar label nama tidak miring */
  .orbit-upright {
    transform: rotate(calc(-1 * var(--angle)));
  }

  /* Styling dinamis warna bola & kapsul nama menggunakan CSS variables */
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
    border: 1px solid color-mix(in srgb, var(--group-color) 40%, transparent);
    background-color: rgb(43 37 73 / 92%);
    color: var(--group-color);
  }

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
</style>