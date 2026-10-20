<script lang="ts">
  let { form } = $props();

  let showPassword = $state(false);

  let errors = $state({
    nim: '',
    password: '',
  });

  function handleSubmit(event: SubmitEvent) {
    const formElement = event.currentTarget as HTMLFormElement;
    const data = new FormData(formElement);

    const nim = String(data.get('nim') ?? '').trim();
    const password = String(data.get('password') ?? '');

    errors = {
      nim: nim ? '' : 'NIM wajib diisi.',
      password: password ? '' : 'Kata sandi wajib diisi.',
    };

    if (errors.nim || errors.password) {
      event.preventDefault();

      // Fokuskan input pertama yang belum diisi.
      if (errors.nim) {
        document.getElementById('nim')?.focus();
      } else {
        document.getElementById('password')?.focus();
      }

      return;
    }
  }

  function clearError(field: 'nim' | 'password') {
    if (errors[field]) {
      errors[field] = '';
    }
  }
</script>

<svelte:head>
  <title>Login — Pemketang</title>
  <meta
    name="description"
    content="Portal pemilihan Ketua Angkatan 63 SIKRABTEK."
  />
  <meta name="theme-color" content="#242044" />
</svelte:head>

<main
  class="flex flex-1 items-center bg-[#242044] text-[#fbf9ff]"
>
  <div
    class="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-2 md:gap-12 lg:gap-24 lg:px-12 lg:py-16"
  >
    <!-- Hero -->
    <section class="hidden min-w-0 md:block md:py-8">
      <h1
        class="m-0 text-5xl leading-[1.08] font-bold tracking-[-0.055em] lg:text-7xl"
      >
        Saatnya
        <br />
        <span class="text-[#c5b8d6]">
          menentukan.
        </span>
      </h1>

      <p
        class="mt-6 max-w-md text-sm leading-7 text-[#b8b5c5] lg:text-base"
      >
        Kenali pilihan lo, tentukan siapa yang paling tepat,
        dan ikut menentukan langkah Angkatan 63 ke depan.
      </p>

    </section>

    <!-- Login -->
    <section
      class="mx-auto w-full max-w-105 min-w-0 md:justify-self-end"
    >
      <div class="mb-8 sm:mb-9">
        <h2
          class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Masuk
        </h2>

        <p class="mt-3 text-sm leading-6 text-[#b8b5c5]">
          Login untuk melanjutkan ke pemilihan Ketua Angkatan 63.
        </p>
      </div>

      <!-- Server error -->
      {#if form?.error}
        <div
          class="mb-6 flex items-start gap-3 rounded-lg border border-[#e2725b]/30 bg-[#e2725b]/10 px-4 py-3.5 text-sm leading-6 text-[#f2b5a8]"
          role="alert"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="1.6"
            />
            <path
              d="M12 8v4m0 4h.01"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>

          <p>{form.error}</p>
        </div>
      {/if}

      <form
        method="POST"
        class="space-y-5"
        novalidate
        onsubmit={handleSubmit}
      >
        <!-- NIM -->
        <div>
          <label
            for="nim"
            class="mb-2.5 block text-sm font-medium text-[#e0dbea]"
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
            aria-invalid={!!errors.nim}
            aria-describedby={errors.nim ? 'nim-error' : undefined}
            oninput={() => clearError('nim')}
            class={`h-12 w-full rounded-lg border bg-[#1d1a37] px-3.5 text-base text-white outline-none transition-colors placeholder:text-[#77738e] focus:ring-2 focus:ring-[#c5b8d6]/15 ${
              errors.nim
                ? 'border-[#e2725b] focus:border-[#e2725b]'
                : 'border-white/15 focus:border-[#c5b8d6]'
            }`}
          />

          {#if errors.nim}
            <p
              id="nim-error"
              class="mt-2 flex items-center gap-2 text-sm leading-5 text-[#f2a99a]"
              role="alert"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                class="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M10 6.5v4m0 2.5h.01"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>

              {errors.nim}
            </p>
          {/if}
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="mb-2.5 block text-sm font-medium text-[#e0dbea]"
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
              aria-invalid={!!errors.password}
              aria-describedby={errors.password
                ? 'password-error'
                : undefined}
              oninput={() => clearError('password')}
              class={`h-12 w-full rounded-lg border bg-[#1d1a37] py-0 pl-3.5 pr-12 text-base text-white outline-none transition-colors placeholder:text-[#77738e] focus:ring-2 focus:ring-[#c5b8d6]/15 ${
                errors.password
                  ? 'border-[#e2725b] focus:border-[#e2725b]'
                  : 'border-white/15 focus:border-[#c5b8d6]'
              }`}
            />

            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword
                ? 'Sembunyikan kata sandi'
                : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
              class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-[#b8b5c5] transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#c5b8d6]"
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

          {#if errors.password}
            <p
              id="password-error"
              class="mt-2 flex items-center gap-2 text-sm leading-5 text-[#f2a99a]"
              role="alert"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                class="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M10 6.5v4m0 2.5h.01"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>

              {errors.password}
            </p>
          {/if}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="mt-2 flex h-12 w-full items-center justify-center rounded-lg bg-[#c5b8d6] px-4 text-sm font-semibold text-[#242044] transition-colors hover:bg-[#d8cde5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5b8d6] active:bg-[#b5a6ca]"
        >
          Masuk ke pemilihan

          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="ml-2 h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M5 12h14m-6-6l6 6-6 6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </form>

      <!-- Security note -->
      <div
        class="mt-7 flex items-start gap-3 border-t border-white/10 pt-5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          class="mt-0.5 h-5 w-5 shrink-0 text-[#85859f]"
          aria-hidden="true"
        >
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="2"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M8 10V7a4 4 0 018 0v3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>

        <p class="text-xs leading-5 text-[#85859f]">
          Gunakan akun lo sendiri dan jangan bagikan kata sandi
          kepada orang lain. Data login lo harus tetap aman.
        </p>
      </div>
    </section>
  </div>
</main>