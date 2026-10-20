<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Candidate, User } from "../types";
import { api } from "../services/api";

const router = useRouter();
const candidates = ref<Candidate[]>([]);
const user = ref<User | null>(null);
const selectedCandidateId = ref<string | null>(null);
const showVoteModal = ref(false);
const showAlreadyVotedPopup = ref(false);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const selectedCandidate = computed(() => candidates.value.find((candidate) => candidate.id === selectedCandidateId.value));
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
});

onMounted(async () => {
  try {
    const [me, candidateResponse] = await Promise.all([api.me(), api.candidates()]);
    user.value = me.user;
    candidates.value = candidateResponse.candidates ?? [];
    if (user.value?.role === "ADMIN") await router.replace("/admin");
    if (user.value?.hasVoted) showAlreadyVotedPopup.value = true;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Gagal memuat data pemilihan.";
  } finally {
    loading.value = false;
  }
});

function selectCandidate(id: string) {
  if (submitting.value) return;
  selectedCandidateId.value = id;
  showVoteModal.value = true;
}

async function confirmVote() {
  if (!selectedCandidate.value || submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await api.vote(selectedCandidate.value.id);
    await router.replace("/thanks");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suara gagal dikirim.";
    if (/already_voted|sudah memilih|suara sudah/i.test(message)) {
      showVoteModal.value = false;
      showAlreadyVotedPopup.value = true;
    } else {
      errorMessage.value = message;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-[calc(100svh-136px)] bg-[#242044] text-[#fbf9ff]">
    <section class="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <header class="mb-10">
        <div class="mb-8">
          <p class="text-sm text-white/60">{{ greeting }},</p>
          <p class="mt-1 text-lg font-semibold">{{ user?.name || "Pemilih" }}</p>
        </div>
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Pemilihan Ketua Angkatan</h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Pilih pasangan ketua dan wakil ketua angkatan yang menurut lo paling tepat.</p>
      </header>

      <div v-if="errorMessage" role="alert" class="mb-6 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{{ errorMessage }}</div>
      <div v-if="successMessage" role="status" class="mb-6 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{{ successMessage }}</div>
      <div v-if="loading" class="rounded-xl border border-white/10 p-8 text-sm text-white/60">Memuat pasangan kandidat...</div>
      <div v-else-if="candidates.length === 0" class="rounded-lg border border-white/15 p-6 text-sm text-white/70">Belum ada pasangan kandidat yang tersedia.</div>
      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article v-for="(candidate, index) in candidates" :key="candidate.id" class="overflow-hidden rounded-xl border border-white/15 bg-white/[0.04]">
          <div class="border-b border-white/10 px-5 py-4"><p class="text-sm text-white/60">Pasangan {{ index + 1 }}</p></div>
          <div class="grid grid-cols-2 gap-4 p-5">
            <div class="min-w-0">
              <img v-if="candidate.ketuaPhotoUrl" :src="candidate.ketuaPhotoUrl" :alt="`Foto ${candidate.ketuaName}`" class="aspect-[3/4] w-full rounded-lg bg-white/10 object-cover" loading="lazy" />
              <div v-else class="flex aspect-[3/4] items-center justify-center rounded-lg bg-white/10 px-2 text-center text-sm text-white/40">Foto belum tersedia</div>
              <h2 class="mt-3 break-words font-semibold">{{ candidate.ketuaName }}</h2><p class="mt-1 text-xs text-white/50">Calon Ketua</p>
            </div>
            <div class="min-w-0">
              <img v-if="candidate.wakilPhotoUrl" :src="candidate.wakilPhotoUrl" :alt="`Foto ${candidate.wakilName}`" class="aspect-[3/4] w-full rounded-lg bg-white/10 object-cover" loading="lazy" />
              <div v-else class="flex aspect-[3/4] items-center justify-center rounded-lg bg-white/10 px-2 text-center text-sm text-white/40">Foto belum tersedia</div>
              <h2 class="mt-3 break-words font-semibold">{{ candidate.wakilName }}</h2><p class="mt-1 text-xs text-white/50">Calon Wakil Ketua</p>
            </div>
          </div>
          <div class="space-y-5 px-5 pb-5">
            <div><h3 class="mb-2 text-sm font-semibold">Visi</h3><p class="whitespace-pre-line break-words text-sm leading-6 text-white/70">{{ candidate.vision || "Belum ada visi yang ditampilkan." }}</p></div>
            <div><h3 class="mb-2 text-sm font-semibold">Misi</h3><p class="whitespace-pre-line break-words text-sm leading-6 text-white/70">{{ candidate.mission || "Belum ada misi yang ditampilkan." }}</p></div>
            <button type="button" :disabled="submitting" class="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60" @click="selectCandidate(candidate.id)">Pilih pasangan ini</button>
          </div>
        </article>
      </div>
    </section>
  </main>

  <div v-if="showVoteModal && selectedCandidate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" @click.self="!submitting && (showVoteModal = false)">
    <section role="dialog" aria-modal="true" aria-labelledby="vote-modal-title" class="w-full max-w-md rounded-xl border border-white/15 bg-[#242044] p-6 shadow-xl">
      <h2 id="vote-modal-title" class="text-xl font-semibold">Konfirmasi pilihan</h2>
      <p class="mt-3 text-sm leading-6 text-white/70">Lo memilih pasangan {{ selectedCandidate.ketuaName }} dan {{ selectedCandidate.wakilName }}. Pastikan pilihan lo sudah benar sebelum melanjutkan.</p>
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" :disabled="submitting" class="rounded-lg border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/5 disabled:opacity-60" @click="showVoteModal = false">Batal</button>
        <button type="button" :disabled="submitting" class="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60" @click="confirmVote">{{ submitting ? "Memproses suara..." : "Ya, pilih pasangan ini" }}</button>
      </div>
    </section>
  </div>

  <div v-if="showAlreadyVotedPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
    <section role="alertdialog" aria-modal="true" aria-labelledby="already-voted-title" class="w-full max-w-md rounded-xl border border-white/15 bg-[#242044] p-6 shadow-xl">
      <h2 id="already-voted-title" class="text-xl font-semibold">Suara sudah tercatat</h2>
      <p class="mt-3 text-sm leading-6 text-white/70">Akun lo sudah menggunakan hak pilih. Setiap pemilih hanya dapat memberikan satu suara.</p>
      <button type="button" class="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white/90" @click="showAlreadyVotedPopup = false">Mengerti</button>
    </section>
  </div>
</template>
