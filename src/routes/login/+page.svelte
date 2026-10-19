<script lang="ts">
  let { form } = $props();
  let showPassword = $state(false);
</script>

<svelte:head>
  <title>Login - Pemketang</title>
  <meta
    name="description"
    content="Portal pemilihan Ketua Angkatan 63 SIKRABTEK."
  />
</svelte:head>

<main class="flex flex-1 items-center bg-[#242044] text-[#fbf9ff]">
  <div
    class="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 sm:py-14 md:grid-cols-2 md:gap-12 lg:gap-24 lg:px-12 lg:py-16"
  >
    <!-- Hero -->
    <section class="min-w-0 md:py-8">
      <p class="mb-6 text-xs font-semibold tracking-wide text-[#c5b8d6]">
        PEMILIHAN KETUA ANGKATAN 63
      </p>

      <h1
        class="m-0 text-5xl leading-[1.05] font-bold tracking-[-0.06em] sm:text-6xl lg:text-7xl"
      >
        Saatnya<br />
        <span class="text-[#c5b8d6]">menentukan.</span>
      </h1>

      <p class="mt-6 max-w-md text-sm leading-7 text-[#b8b5c5] sm:text-base">
        Kenali pilihan lo, tentukan siapa yang paling tepat, dan ikut
        menentukan langkah Angkatan 63 ke depan.
      </p>

      <p
        class="mt-10 max-w-md border-t border-white/10 pt-5 text-xs leading-6 text-[#85859f]"
      >
        Satu suara dari lo ikut menentukan arah angkatan kita.
      </p>
    </section>

    <!-- Login -->
    <section
      class="w-full min-w-0 md:max-w-[400px] md:justify-self-end"
    >
      <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
        Halo, Angkatan 63.
      </h2>

      <p class="mt-2 mb-7 text-sm leading-6 text-[#b8b5c5]">
        Login dulu buat lanjut ke halaman pemilihan.
      </p>

      {#if form?.error}
        <div
          class="mb-5 rounded-lg border border-[#e2725b]/30 bg-[#e2725b]/10 px-4 py-3 text-sm leading-6 text-[#f2b5a8]"
          role="alert"
        >
          {form.error}
        </div>
      {/if}

      <form method="POST" class="space-y-5">
        <!-- NIM -->
        <div>
          <label
            for="nim"
            class="mb-2 block text-sm font-medium text-[#e0dbea]"
          >
            NIM
          </label>

          <input
            id="nim"
            name="nim"
            type="text"
            placeholder="Masukkan NIM lo"
            value={form?.nim ?? ''}
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            required
            class="h-12 w-full rounded-lg border border-white/10 bg-[#1d1a37] px-4 text-sm text-white outline-none transition-colors placeholder:text-[#77738e] hover:border-white/20 focus:border-[#c5b8d6] focus:ring-2 focus:ring-[#c5b8d6]/10"
          />
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="mb-2 block text-sm font-medium text-[#e0dbea]"
          >
            Kata Sandi
          </label>

          <div class="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi lo"
              autocomplete="current-password"
              required
              class="h-12 w-full rounded-lg border border-white/10 bg-[#1d1a37] py-0 pl-4 pr-12 text-sm text-white outline-none transition-colors placeholder:text-[#77738e] hover:border-white/20 focus:border-[#c5b8d6] focus:ring-2 focus:ring-[#c5b8d6]/10"
            />

            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword
                ? 'Sembunyikan kata sandi'
                : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
              class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-[#85859f] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#c5b8d6]"
            >
              {#if showPassword}
                <!-- Eye off -->
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  class="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5.1 0 8.5 5 9 7-.2.8-1.3 2.8-3.3 4.5M6.2 6.3C3.8 8 2.4 10.7 3 12c.5 1.3 3.9 7 9 7 1.2 0 2.3-.3 3.3-.8"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {:else}
                <!-- Eye -->
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  class="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                    stroke="currentColor"
                    stroke-width="1.6"
                  />
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="group mt-2 flex h-12 w-full items-center justify-between rounded-lg bg-[#c5b8d6] px-4 text-sm font-bold text-[#242044] transition-colors hover:bg-[#d8cde5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5b8d6] active:bg-[#b5a6ca]"
        >
          <span>Masuk ke pemilihan</span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </form>

      <p class="mt-5 text-xs leading-6 text-[#85859f]">
        Gunakan akun lo sendiri dan pastikan informasi login sudah benar.
      </p>
    </section>
  </div>
</main>
