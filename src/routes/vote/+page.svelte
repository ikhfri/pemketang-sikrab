<script lang="ts">
  let { data, form } = $props();

  let selectedCandidateId = $state<string | null>(null);
  let showVoteModal = $state(false);
  let showAlreadyVotedPopup = $state(false);

  const selectedCandidate = $derived(
    data.candidates.find(
      (candidate) => candidate.id === selectedCandidateId
    )
  );

  const greeting = $derived.by(() => {
    const hour = new Date().getHours();

    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";

    return "Selamat malam";
  });

  $effect(() => {
    if (form?.code === "ALREADY_VOTED") {
      showVoteModal = false;
      showAlreadyVotedPopup = true;
    }
  });

  function selectCandidate(candidateId: string) {
    selectedCandidateId = candidateId;
    showVoteModal = true;
  }

  function closeVoteModal() {
    showVoteModal = false;
  }

  function closeAlreadyVotedPopup() {
    showAlreadyVotedPopup = false;
  }
</script>

<svelte:head>
  <title>Pemilihan Ketua Angkatan — SIKRABTEK</title>
  <meta
    name="description"
    content="Pemilihan ketua dan wakil ketua Angkatan 63."
  />
</svelte:head>

<main class="min-h-screen bg-[#242044] text-[#fbf9ff]">
  <section class="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <header class="mb-10">
      <div class="mb-8">
        <p class="text-sm text-white/60">
          {greeting},
        </p>

        <p class="mt-1 text-lg font-semibold">
          {data.user?.name || "Pemilih"}
        </p>
      </div>


      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
        Pemilihan Ketua Angkatan
      </h1>

      <p class="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
        Pilih pasangan ketua dan wakil ketua angkatan yang menurut lo paling tepat.
      </p>
    </header>

    <!-- Error message -->
    {#if form?.error && form?.code !== "ALREADY_VOTED"}
      <div
        role="alert"
        class="mb-6 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
      >
        {form.error}
      </div>
    {/if}

    <!-- Candidate list -->
    {#if data.candidates.length === 0}
      <p class="rounded-lg border border-white/15 p-6 text-sm text-white/70">
        Belum ada pasangan kandidat yang tersedia.
      </p>
    {:else}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        {#each data.candidates as candidate, index (candidate.id)}
          <article
            class="overflow-hidden rounded-xl border border-white/15 bg-white/[0.04]"
          >
            <div class="border-b border-white/10 px-5 py-4">
              <p class="text-sm text-white/60">
                Pasangan {index + 1}
              </p>
            </div>

            <!-- Candidate photos and names -->
            <div class="grid grid-cols-2 gap-4 p-5">
              <div class="min-w-0">
                {#if candidate.ketuaPhotoUrl}
                  <img
                    src={candidate.ketuaPhotoUrl}
                    alt={candidate.ketuaName}
                    class="aspect-[3/4] w-full rounded-lg bg-white/10 object-cover"
                    loading="lazy"
                  />
                {:else}
                  <div
                    class="flex aspect-[3/4] items-center justify-center rounded-lg bg-white/10 px-2 text-center text-sm text-white/40"
                  >
                    Foto belum tersedia
                  </div>
                {/if}

                <h2 class="mt-3 break-words font-semibold">
                  {candidate.ketuaName}
                </h2>

                <p class="mt-1 text-xs text-white/50">
                  Calon Ketua
                </p>
              </div>

              <div class="min-w-0">
                {#if candidate.wakilPhotoUrl}
                  <img
                    src={candidate.wakilPhotoUrl}
                    alt={candidate.wakilName}
                    class="aspect-[3/4] w-full rounded-lg bg-white/10 object-cover"
                    loading="lazy"
                  />
                {:else}
                  <div
                    class="flex aspect-[3/4] items-center justify-center rounded-lg bg-white/10 px-2 text-center text-sm text-white/40"
                  >
                    Foto belum tersedia
                  </div>
                {/if}

                <h2 class="mt-3 break-words font-semibold">
                  {candidate.wakilName}
                </h2>

                <p class="mt-1 text-xs text-white/50">
                  Calon Wakil Ketua
                </p>
              </div>
            </div>

            <!-- Vision and mission -->
            <div class="space-y-5 px-5 pb-5">
              <div>
                <h3 class="mb-2 text-sm font-semibold">
                  Visi
                </h3>

                <p class="whitespace-pre-line break-words text-sm leading-6 text-white/70">
                  {candidate.vision || "Belum ada visi yang ditampilkan."}
                </p>
              </div>

              <div>
                <h3 class="mb-2 text-sm font-semibold">
                  Misi
                </h3>

                <p class="whitespace-pre-line break-words text-sm leading-6 text-white/70">
                  {candidate.mission || "Belum ada misi yang ditampilkan."}
                </p>
              </div>

              <button
                type="button"
                onclick={() => selectCandidate(candidate.id)}
                class="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Pilih pasangan ini
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</main>

<!-- Vote confirmation modal -->
{#if showVoteModal && selectedCandidate}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        closeVoteModal();
      }
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-modal-title"
      class="w-full max-w-md rounded-xl border border-white/15 bg-[#242044] p-6 shadow-xl"
    >
      <h2 id="vote-modal-title" class="text-xl font-semibold">
        Konfirmasi pilihan
      </h2>

      <p class="mt-3 text-sm leading-6 text-white/70">
        Lo memilih pasangan {selectedCandidate.ketuaName} dan
        {selectedCandidate.wakilName}. Pastikan pilihan lo sudah benar
        sebelum melanjutkan.
      </p>

      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onclick={closeVoteModal}
          class="rounded-lg border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/5"
        >
          Batal
        </button>

        <form method="POST" action="?/vote">
          <input
            type="hidden"
            name="candidateId"
            value={selectedCandidate.id}
          />

          <button
            type="submit"
            class="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white/90"
          >
            Ya, pilih pasangan ini
          </button>
        </form>
      </div>
    </section>
  </div>
{/if}

<!-- Already voted modal -->
{#if showAlreadyVotedPopup}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
  >
    <section
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="already-voted-title"
      class="w-full max-w-md rounded-xl border border-white/15 bg-[#242044] p-6 shadow-xl"
    >
      <h2 id="already-voted-title" class="text-xl font-semibold">
        Suara sudah tercatat
      </h2>

      <p class="mt-3 text-sm leading-6 text-white/70">
        Akun lo sudah menggunakan hak pilih. Setiap pemilih hanya dapat
        memberikan satu suara.
      </p>

      <button
        type="button"
        onclick={closeAlreadyVotedPopup}
        class="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white/90"
      >
        Mengerti
      </button>
    </section>
  </div>
{/if}
