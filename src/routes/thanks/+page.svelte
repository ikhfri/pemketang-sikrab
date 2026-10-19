<svelte:head>
  <title>Terima Kasih — SIKRABTEK 63</title>
  <meta
    name="description"
    content="Terima kasih telah menggunakan hak suara pada Voting SIKRABTEK 63."
  />
  <meta name="theme-color" content="#242044" />
</svelte:head>

<div class="min-h-screen bg-[#242044] text-[#fbf9ff] antialiased">
  <main
    class="mx-auto flex min-h-[calc(100svh-73px)] max-w-2xl items-center justify-center px-5 py-12 sm:px-8"
  >
    <section class="w-full text-center">
      <!-- Success icon -->
      <div
        class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#242044]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          class="h-8 w-8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m5 12 4 4L19 6"
          />
        </svg>
      </div>

      <p class="mt-7 text-xs font-semibold uppercase tracking-widest text-white/60">
        Voting berhasil
      </p>

      <h1 class="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        Suaramu sudah masuk.
      </h1>

      <p class="mx-auto mt-5 max-w-md text-sm leading-7 text-white/70 sm:text-base">
        Terima kasih sudah menggunakan hak suaramu dalam pemilihan Ketua
        dan Wakil Angkatan 63.
      </p>

      <!-- Voting information -->
      <div
        class="mx-auto mt-9 max-w-md rounded-xl border border-white/15 bg-white/[0.04] p-5 text-left sm:p-6"
      >
        <p class="text-sm font-semibold">
          Satu suara sudah cukup.
        </p>

        <p class="mt-2 text-sm leading-6 text-white/65">
          Suaramu telah dicatat. Kamu tidak dapat mengubah atau memberikan
          suara lagi dengan akun ini.
        </p>
      </div>

      <p class="mt-8 text-xs text-white/45">
        Kamu dapat menutup halaman ini.
      </p>

      <!-- Credit -->
      <footer class="mt-12 border-t border-white/10 pt-6">
        <a
          href="https://titiknol.site"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-3 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label="TITIK NOL — Independent Technology Collective"
        >
          <img
            src="/images/titiknol.png"
            alt="Logo TITIK NOL"
            class="h-9 w-9 object-contain"
            loading="lazy"
          />

          <span class="text-left">
            <span class="block text-[10px] text-white/45">
              Built with care by
            </span>
            <span class="mt-0.5 block text-sm font-semibold tracking-wide">
              TITIK NOL
            </span>
          </span>
        </a>
      </footer>
    </section>
  </main>
</div>
