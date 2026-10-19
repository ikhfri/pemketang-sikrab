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
  <meta name="theme-color" content="#242044" />
</svelte:head>

<main class="flex flex-1 items-center bg-[#242044] text-[#fbf9ff]">
  <div
    class="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-8 sm:px-8 sm:py-12 md:grid-cols-2 md:gap-12 lg:gap-24 lg:px-12 lg:py-16"
  >
    <!-- Hero: hidden on mobile -->
    <section class="hidden min-w-0 md:block md:py-8">
      <p class="mb-5 text-xs font-medium tracking-widest text-[#c5b8d6]">
        PEMILIHAN KETUA ANGKATAN 63
      </p>

      <h1
        class="m-0 text-5xl leading-[1.05] font-bold tracking-[-0.06em] lg:text-7xl"
      >
        Saatnya<br />
        <span class="text-[#c5b8d6]">menentukan.</span>
      </h1>

      <p class="mt-6 max-w-md text-sm leading-7 text-[#b8b5c5] lg:text-base">
        Kenali pilihan lo, tentukan siapa yang paling tepat, dan ikut
        menentukan langkah Angkatan 63 ke depan.
      </p>
    </section>

    <!-- Login -->
    <section class="mx-auto w-full max-w-[400px] min-w-0 md:justify-self-end">
      <!-- Simple mobile identity -->
      <div class="mb-9 md:mb-8">
        <p class="text-xs font-semibold tracking-widest text-[#c5b8d6]">
          SIKRABTEK
        </p>

        <h1 class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Masuk
        </h1>

        <p class="mt-2 text-sm leading-6 text-[#b8b5c5]">
          Login untuk melanjutkan ke pemilihan Ketua Angkatan 63.
        </p>
      </div>

      {#if form?.error}
        <div
          class="mb-5 rounded-md border border-[#e2725b]/40 bg-[#e2725b]/10 px-3 py-3 text-sm text-[#f2b5a8]"
          role="alert"
        >
          {form.error}
        </div>
      {/if}

      <form method="POST" class="space-y-5">
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
            placeholder="Masukkan NIM"
            value={form?.nim ?? ''}
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            required
            class="h-12 w-full rounded-md border border-white/15 bg-[#1d1a37] px-3.5 text-base text-white outline-none placeholder:text-[#77738e] focus:border-[#c5b8d6]"
          />
        </div>

        <div>
          <label
            for="password"
            class="mb-2 block text-sm font-medium text-[#e0dbea]"
          >
            Kata sandi
          </label>

          <div class="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi"
              autocomplete="current-password"
              required
              class="h-12 w-full rounded-md border border-white/15 bg-[#1d1a37] py-0 pl-3.5 pr-12 text-base text-white outline-none placeholder:text-[#77738e] focus:border-[#c5b8d6]"
            />

            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword
                ? 'Sembunyikan kata sandi'
                : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
              class="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#b8b5c5] hover:text-white focus-visible:outline-2 focus-visible:outline-[#c5b8d6]"
            >
              {#if showPassword}
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

        <button
          type="submit"
          class="mt-2 flex h-12 w-full items-center justify-center rounded-md bg-[#c5b8d6] px-4 text-sm font-semibold text-[#242044] transition-colors hover:bg-[#d8cde5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5b8d6] active:bg-[#b5a6ca]"
        >
          Masuk ke pemilihan
        </button>
      </form>

      <p class="mt-6 text-xs leading-5 text-[#85859f]">
        Gunakan akun lo sendiri. Jangan bagikan kata sandi ke orang lain.
      </p>
    </section>
  </div>
</main>
