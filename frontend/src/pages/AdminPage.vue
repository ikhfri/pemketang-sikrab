<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { useRouter } from "vue-router";

import { api, apiRequest } from "../services/api";

interface Candidate {

  id: string;

  ketuaName: string;

  ketuaPhotoUrl: string | null;

  wakilName: string;

  wakilPhotoUrl: string | null;

  vision: string | null;

  mission: string | null;

}

interface Voter {

  id: string;

  name: string | null;

  kelompok?: string | null;

  nim?: string | null;

  hasVoted: boolean;

}

interface VotingSettings {

  isConfigured?: boolean;

  isOpen?: boolean;

  status?: "NOT_CONFIGURED" | "UPCOMING" | "OPEN" | "CLOSED" | string;

  openAt?: string | Date | null;

  closeAt?: string | Date | null;

  openAtInput?: string;

  closeAtInput?: string;

}

interface DashboardResponse {

  user?: { id?: string; name?: string | null; role?: string };

  candidates?: Candidate[];

  totalVoters?: number;

  totalUsers?: number;

  totalCandidates?: number;

  participationRate?: number;

  totalVotes?: number;

  votedCount?: number;

  notVotedCount?: number;

  voters?: Voter[];

  voting?: VotingSettings;

}

interface CandidatePayload {

  ketuaName: string;

  ketuaPhotoUrl: string | null;

  wakilName: string;

  wakilPhotoUrl: string | null;

  vision: string | null;

  mission: string | null;

}

const router = useRouter();

const user = ref<DashboardResponse["user"]>();

const candidates = ref<Candidate[]>([]);

const voters = ref<Voter[]>([]);

const totalVoters = ref(0);

const totalVotes = ref(0);

const votedCount = ref(0);

const notVotedCount = ref(0);

const voting = ref<VotingSettings>({

  isConfigured: false,

  isOpen: false,

  status: "NOT_CONFIGURED",

  openAt: null,

  closeAt: null,

  openAtInput: "",

  closeAtInput: "",

});

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const notice = ref("");

const importFileInput = ref<HTMLInputElement | null>(null);
const importFile = ref<File | null>(null);
const importPreview = ref<{
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  valid_preview: Array<{ row: number; nim: string; name: string; kelompok: string }>;
  errors: Array<{ row: number; nim?: string; errors: string[] }>;
  note?: string;
} | null>(null);
const importingUsers = ref(false);
const importMode = ref<"append" | "replace">("append");

const voterSearch = ref("");

const voterFilter = ref<"all" | "voted" | "not-voted">("all");

const resetVoteVoterId = ref<string | null>(null);

const showCreateForm = ref(false);

const editingCandidateId = ref<string | null>(null);

const deleteCandidateId = ref<string | null>(null);

const openAt = ref("");

const closeAt = ref("");

const emptyCandidateForm = (): CandidatePayload => ({

  ketuaName: "",

  ketuaPhotoUrl: null,

  wakilName: "",

  wakilPhotoUrl: null,

  vision: "",

  mission: "",

});

const candidateForm = ref<CandidatePayload>(emptyCandidateForm());

const clockNow = ref(Date.now());

let statusTimer: ReturnType<typeof setInterval> | undefined;

const votingProgress = computed(() =>

  totalVoters.value > 0

    ? Math.round((votedCount.value / totalVoters.value) * 100)

    : 0,

);

const filteredVoters = computed(() => {

  const query = voterSearch.value.trim().toLowerCase();

  return voters.value.filter((voter) => {

    const matchesSearch = [

      voter.name ?? "",

      voter.kelompok ?? "",

      voter.nim ?? voter.id,

    ].some((value) => value.toLowerCase().includes(query));

    const matchesFilter =

      voterFilter.value === "all" ||

      (voterFilter.value === "voted" && voter.hasVoted) ||

      (voterFilter.value === "not-voted" && !voter.hasVoted);

    return matchesSearch && matchesFilter;

  });

});

const votingStatus = computed(() => {

  if (!voting.value.openAt || !voting.value.closeAt) {

    return {

      key: "setup",

      label: "Belum dikonfigurasi",

      description: "Atur jadwal voting terlebih dahulu.",

      badge: "border-slate-400/20 bg-slate-400/10 text-slate-300",

      dot: "bg-slate-400",

    };

  }

  const now = new Date();

  const start = new Date(voting.value.openAt);

  const end = new Date(voting.value.closeAt);

  if (now >= start && now < end) {

    return {

      key: "open",

      label: "Voting sedang dibuka",

      description: "Pemilih saat ini dapat memberikan suara.",

      badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",

      dot: "bg-emerald-300",

    };

  }

  if (now < start) {

    return {

      key: "upcoming",

      label: "Voting belum dibuka",

      description: "Voting akan dimulai sesuai jadwal.",

      badge: "border-violet-300/20 bg-violet-300/10 text-violet-200",

      dot: "bg-violet-300",

    };

  }

  return {

    key: "closed",

    label: "Voting sudah ditutup",

    description: "Periode voting telah berakhir.",

    badge: "border-rose-300/20 bg-rose-300/10 text-rose-200",

    dot: "bg-rose-300",

  };

});

function initials(name: string | null | undefined) {

  return (name ?? "A")

    .trim()

    .split(/\s+/)

    .filter(Boolean)

    .map((word) => word[0])

    .join("")

    .slice(0, 2)

    .toUpperCase();

}

function formatDateTimeLocal(value: string | Date | null | undefined) {

  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {

    return value;

  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

}

function formatDate(value: string | Date | null | undefined) {

  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())

    ? "-"

    : date.toLocaleString("id-ID", {

        dateStyle: "medium",

        timeStyle: "short",

      });

}

function setFeedbackError(error: unknown, fallback: string) {

  errorMessage.value =

    error instanceof Error ? error.message : fallback;

}

async function loadDashboard() {

  loading.value = true;

  errorMessage.value = "";

  try {

    const result = (await api.adminDashboard()) as DashboardResponse;

    user.value = result.user;

    candidates.value = result.candidates ?? [];

    voters.value = result.voters ?? [];

    totalVoters.value = result.totalVoters ?? result.totalUsers ?? 0;

    totalVotes.value = result.totalVotes ?? result.votedCount ?? 0;

    votedCount.value =

      result.votedCount ??

      (result.participationRate != null

        ? Math.round((result.participationRate / 100) * totalVoters.value)

        : totalVotes.value);

    notVotedCount.value =

      result.notVotedCount ?? Math.max(totalVoters.value - votedCount.value, 0);

    voting.value = {

      isConfigured: result.voting?.isConfigured ?? false,

      isOpen: result.voting?.isOpen ?? false,

      status: result.voting?.status ?? "NOT_CONFIGURED",

      openAt: result.voting?.openAt ?? null,

      closeAt: result.voting?.closeAt ?? null,

      openAtInput:

        result.voting?.openAtInput ??

        formatDateTimeLocal(result.voting?.openAt),

      closeAtInput:

        result.voting?.closeAtInput ??

        formatDateTimeLocal(result.voting?.closeAt),

    };

    openAt.value = voting.value.openAtInput ?? "";

    closeAt.value = voting.value.closeAtInput ?? "";

  } catch (error) {

    setFeedbackError(error, "Gagal memuat dashboard admin.");

  } finally {

    loading.value = false;

  }

}

function resetCandidateForm() {

  candidateForm.value = emptyCandidateForm();

  editingCandidateId.value = null;

  deleteCandidateId.value = null;

  showCreateForm.value = false;

}

function startCreate() {

  resetCandidateForm();

  showCreateForm.value = true;

}

function startEdit(candidate: Candidate) {

  deleteCandidateId.value = null;

  showCreateForm.value = false;

  editingCandidateId.value = candidate.id;

  candidateForm.value = {

    ketuaName: candidate.ketuaName,

    ketuaPhotoUrl: candidate.ketuaPhotoUrl ?? null,

    wakilName: candidate.wakilName,

    wakilPhotoUrl: candidate.wakilPhotoUrl ?? null,

    vision: candidate.vision ?? "",

    mission: candidate.mission ?? "",

  };

}

function cancelEdit() {

  editingCandidateId.value = null;

  candidateForm.value = emptyCandidateForm();

}

function startDelete(id: string) {

  editingCandidateId.value = null;

  showCreateForm.value = false;

  deleteCandidateId.value = id;

}

function cancelDelete() {

  deleteCandidateId.value = null;

}

async function saveCandidate() {

  errorMessage.value = "";

  notice.value = "";

  const ketuaName = candidateForm.value.ketuaName.trim();

  const wakilName = candidateForm.value.wakilName.trim();

  if (!ketuaName || !wakilName) {

    errorMessage.value = "Nama ketua dan wakil wajib diisi.";

    return;

  }

  saving.value = true;

  try {

    const payload: CandidatePayload = {

      ketuaName,

      ketuaPhotoUrl: candidateForm.value.ketuaPhotoUrl?.trim() || null,

      wakilName,

      wakilPhotoUrl: candidateForm.value.wakilPhotoUrl?.trim() || null,

      vision: candidateForm.value.vision?.trim() || null,

      mission: candidateForm.value.mission?.trim() || null,

    };

    if (editingCandidateId.value) {

      await api.updateCandidate(editingCandidateId.value, payload);

      notice.value = "Pasangan calon berhasil diperbarui.";

    } else {

      await api.createCandidate(payload);

      notice.value = "Pasangan calon berhasil ditambahkan.";

    }

    resetCandidateForm();

    await loadDashboard();

  } catch (error) {

    setFeedbackError(error, "Gagal menyimpan pasangan calon.");

  } finally {

    saving.value = false;

  }

}

async function deleteCandidate(id: string) {

  const confirmed = window.confirm(

    "Yakin ingin menghapus pasangan calon ini? Pasangan yang sudah memiliki suara seharusnya ditolak oleh backend.",

  );

  if (!confirmed) return;

  errorMessage.value = "";

  notice.value = "";

  saving.value = true;

  try {

    await api.deleteCandidate(id);

    notice.value = "Pasangan calon berhasil dihapus.";

    deleteCandidateId.value = null;

    await loadDashboard();

  } catch (error) {

    setFeedbackError(error, "Gagal menghapus pasangan calon.");

  } finally {

    saving.value = false;

  }

}

async function resetVoterVote(voter: Voter) {

  if (!voter.hasVoted) {

    errorMessage.value = "Pemilih ini belum memberikan suara.";

    return;

  }

  const confirmed = window.confirm(

    `Reset suara milik ${voter.name ?? voter.nim ?? voter.id}? Suara saat ini akan dibatalkan dan pemilih dapat voting ulang.`,

  );

  if (!confirmed) return;

  errorMessage.value = "";

  notice.value = "";

  saving.value = true;

  resetVoteVoterId.value = voter.id;

  try {

    const response = await api.resetVoterVote(voter.id);

    await loadDashboard();

    notice.value = response.message ?? "Suara berhasil di-reset. Pemilih dapat voting ulang.";

  } catch (error) {

    setFeedbackError(error, "Gagal me-reset suara pemilih.");

  } finally {

    saving.value = false;

    resetVoteVoterId.value = null;

  }

}

function onImportFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  importFile.value = target.files?.[0] ?? null;
  importPreview.value = null;
  errorMessage.value = "";
  notice.value = "";
}

async function previewImportUsers() {
  if (!importFile.value) {
    errorMessage.value = "Pilih file Excel (.xlsx) terlebih dahulu.";
    return;
  }

  const form = new FormData();
  form.append("file", importFile.value);
  importingUsers.value = true;
  errorMessage.value = "";
  notice.value = "";

  try {
    importPreview.value = await apiRequest<typeof importPreview.value>(
      "/api/v1/admin/users/import/preview",
      { method: "POST", body: form },
    ) as NonNullable<typeof importPreview.value>;
    notice.value = "Preview selesai. Periksa baris valid dan error sebelum melanjutkan.";
  } catch (error) {
    setFeedbackError(error, "Gagal memvalidasi file Excel.");
  } finally {
    importingUsers.value = false;
  }
}

async function submitImportUsers() {
  if (!importFile.value) {
    errorMessage.value = "Pilih file Excel (.xlsx) terlebih dahulu.";
    return;
  }
  if (!importPreview.value) {
    errorMessage.value = "Lakukan preview terlebih dahulu.";
    return;
  }
  if (importPreview.value.valid_rows < 1 || importPreview.value.invalid_rows > 0) {
    errorMessage.value = "Perbaiki semua baris bermasalah dan jalankan preview ulang sebelum import.";
    return;
  }

  const preview = importPreview.value;
  const validRows = preview.valid_rows;
  const replace = importMode.value === "replace";
  const warning = replace
    ? `GANTI SELURUH DATA PEMILIH dengan ${validRows} baris dari Excel? Akun admin tetap ada. Operasi akan ditolak jika sudah ada suara masuk.`
    : `Import ${validRows} pemilih baru? NIM yang sudah terdaftar akan ditangani sesuai aturan backend.`;

  if (!window.confirm(warning)) return;

  const form = new FormData();
  form.append("file", importFile.value);
  importingUsers.value = true;
  errorMessage.value = "";
  notice.value = "";

  try {
    if (replace) {
      const response = await apiRequest<{ message?: string; imported?: number }>(
        "/api/v1/admin/users/import/replace",
        { method: "POST", body: form },
      );
      notice.value = response.message ?? `Berhasil mengganti data pemilih (${response.imported ?? validRows} akun).`;
    } else {
      // Endpoint impor biasa mengembalikan CSV kredensial awal, bukan JSON.
      const csv = await apiRequest<string>(
        "/api/v1/admin/users/import",
        { method: "POST", body: form },
      );
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kredensial-pemilih.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notice.value = "Import selesai. File kredensial CSV sudah diunduh; simpan dengan aman.";
    }
    importPreview.value = null;
    importFile.value = null;
    if (importFileInput.value) importFileInput.value.value = "";
    await loadDashboard();
  } catch (error) {
    setFeedbackError(
      error,
      replace
        ? "Gagal mengganti seluruh data pemilih."
        : "Gagal mengimpor data pemilih.",
    );
  } finally {
    importingUsers.value = false;
  }
}

async function saveSchedule() {

  errorMessage.value = "";

  notice.value = "";

  if (!openAt.value || !closeAt.value) {

    errorMessage.value = "Waktu buka dan waktu tutup voting wajib diisi.";

    return;

  }

  if (new Date(closeAt.value).getTime() <= new Date(openAt.value).getTime()) {

    errorMessage.value = "Waktu tutup voting harus setelah waktu buka.";

    return;

  }

  saving.value = true;

  try {

    await api.updateVoting(openAt.value, closeAt.value);

    notice.value = "Jadwal voting berhasil diperbarui.";

    await loadDashboard();

  } catch (error) {

    setFeedbackError(error, "Gagal memperbarui jadwal voting.");

  } finally {

    saving.value = false;

  }

}

async function logout() {

  errorMessage.value = "";

  try {

    await api.logout();

  } catch (error) {


    setFeedbackError(error, "Logout dari server gagal.");

    return;

  }

  await router.replace("/login");

}

onMounted(() => {

  void loadDashboard();



  statusTimer = setInterval(() => {

    clockNow.value = Date.now();

  }, 1000);

});

onBeforeUnmount(() => {

  if (statusTimer !== undefined) clearInterval(statusTimer);

});

</script>

<template>

  <div class="min-h-screen bg-[#242044] text-[#f4f2fb] selection:bg-violet-300/30">

    <header class="sticky top-0 z-40 border-b border-white/8 bg-[#242044]/90 backdrop-blur-xl">

      <div class="mx-auto flex min-h-18 max-w-360 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">

        <RouterLink to="/admin" class="flex items-center gap-3">

          <img src="/images/logo.jpg" alt="SIKRABTEK 63" class="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" />

          <span>

            <span class="block text-sm font-semibold">SIKRABTEK 63</span>

            <span class="mt-0.5 block text-xs text-[#b3a9ce]">Administration</span>

          </span>

        </RouterLink>

        <div class="flex items-center gap-3">

          <div class="hidden text-right sm:block">

            <p class="text-sm font-medium">{{ user?.name ?? "Administrator" }}</p>

            <p class="mt-0.5 text-xs text-[#b3a9ce]">Administrator</p>

          </div>

          <div class="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/15 bg-violet-200/10 text-xs font-semibold text-violet-100">

            {{ initials(user?.name) }}

          </div>

          <button

            type="button"

            class="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c7c4d5] hover:bg-white/5 disabled:opacity-50"

            @click="logout"

          >

            Keluar

          </button>

        </div>

      </div>

    </header>

    <main class="mx-auto max-w-360 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">

      <section class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>

          <p class="mb-3 text-xs font-semibold tracking-[0.2em] text-[#a78bfa] uppercase">

            IHSG 4 RIBU CUY, OTW PINDAH NEGARA

          </p>

          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard voting</h1>

          <p class="mt-3 max-w-2xl text-sm leading-6 text-[#c4bddb]">

            Pantau partisipasi, atur periode pemilihan, dan kelola pasangan calon dari satu tempat.

          </p>

        </div>

        <RouterLink

          to="/admin/results"

          class="w-fit rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"

        >

          Lihat hasil voting ↗

        </RouterLink>

      </section>

      <div v-if="errorMessage" role="alert" class="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">

        {{ errorMessage }}

      </div>

      <div v-if="notice" role="status" class="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">

        {{ notice }}

      </div>

      <div v-if="loading" class="rounded-2xl border border-white/8 bg-[#2d284b] p-8 text-sm text-[#c4bddb]">

        Memuat data dashboard...

      </div>

      <template v-else>

        <!-- Ringkasan -->

        <section class="mb-8 grid gap-4 md:grid-cols-3" aria-label="Ringkasan voting">

          <article class="rounded-2xl border border-white/8 bg-[#2d284b] p-5 sm:p-6">

            <p class="text-sm text-[#c4bddb]">Total pemilih</p>

            <p class="mt-5 text-4xl font-semibold tabular-nums">{{ totalVoters }}</p>

            <p class="mt-2 text-xs text-[#a99fc5]">Pemilih terdaftar di sistem</p>

          </article>

          <article class="rounded-2xl border border-white/8 bg-[#2d284b] p-5 sm:p-6">

            <div class="flex justify-between">

              <p class="text-sm text-[#c4bddb]">Sudah memilih</p>

              <span class="rounded-lg bg-emerald-300/10 px-2.5 py-1.5 text-xs text-emerald-200">{{ votingProgress }}%</span>

            </div>

            <p class="mt-5 text-4xl font-semibold tabular-nums">{{ votedCount }}</p>

            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label="Partisipasi voting" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="votingProgress">

              <div class="h-full rounded-full bg-[#ffd83d]" :style="{ width: `${votingProgress}%` }"></div>

            </div>

            <p class="mt-2 text-xs text-[#a99fc5]">{{ notVotedCount }} pemilih belum vote</p>

          </article>

          <article class="rounded-2xl border border-white/8 bg-[#2d284b] p-5 sm:p-6">

            <div class="flex flex-wrap items-center justify-between gap-2">

              <p class="text-sm text-[#c4bddb]">Status voting</p>

              <span :class="['inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs', votingStatus.badge]">

                <span :class="['h-1.5 w-1.5 rounded-full', votingStatus.dot]"></span>

                {{ votingStatus.key === "open" ? "LIVE" : votingStatus.key === "upcoming" ? "UPCOMING" : votingStatus.key === "closed" ? "CLOSED" : "SETUP" }}

              </span>

            </div>

            <p class="mt-5 text-xl font-semibold">{{ votingStatus.label }}</p>

            <p class="mt-2 text-xs leading-5 text-[#a99fc5]">{{ votingStatus.description }}</p>

          </article>

        </section>

        <!-- Impor data pemilih -->
        <section class="mb-8 overflow-hidden rounded-2xl border border-white/8 bg-[#2d284b]">
          <div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <h2 class="font-semibold">Impor data pemilih</h2>
            <p class="mt-1 text-sm text-[#b3a9ce]">Unggah file Excel (.xlsx), validasi, lalu impor data pemilih.</p>
          </div>
          <div class="space-y-5 p-5 sm:p-6">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="mb-2 block text-sm font-medium">File Excel</span>
                <input ref="importFileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  :disabled="importingUsers"
                  class="block w-full rounded-xl border border-white/10 bg-[#242044] px-3 py-3 text-sm text-[#c7c4d5] file:mr-3 file:rounded-lg file:border-0 file:bg-violet-300/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-violet-100"
                  @change="onImportFileChange" />
                <span v-if="importFile" class="mt-2 block break-all text-xs text-[#a99fc5]">Dipilih: {{ importFile.name }}</span>
              </label>
              <fieldset class="space-y-3">
                <legend class="mb-2 text-sm font-medium">Mode impor</legend>
                <label class="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3">
                  <input v-model="importMode" type="radio" value="append" class="mt-1 accent-violet-300" />
                  <span><span class="block text-sm font-medium">Tambah pemilih</span><span class="mt-1 block text-xs leading-5 text-[#a99fc5]">Data lama tetap dipertahankan.</span></span>
                </label>
                <label class="flex cursor-pointer gap-3 rounded-xl border border-amber-300/20 p-3">
                  <input v-model="importMode" type="radio" value="replace" class="mt-1 accent-amber-300" />
                  <span><span class="block text-sm font-medium text-amber-100">Ganti seluruh data pemilih</span><span class="mt-1 block text-xs leading-5 text-[#a99fc5]">Akun admin tetap ada. Backend wajib menolak penggantian saat voting terbuka atau suara sudah masuk.</span></span>
                </label>
              </fieldset>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" :disabled="!importFile || importingUsers"
                class="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                @click="previewImportUsers">{{ importingUsers ? "Memproses..." : "Validasi file" }}</button>
              <button type="button"
                :disabled="!importPreview || importingUsers || importPreview.valid_rows < 1 || importPreview.invalid_rows > 0"
                class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                @click="submitImportUsers">{{ importingUsers ? "Mengimpor..." : importMode === "replace" ? "Ganti data pemilih" : "Impor pemilih" }}</button>
            </div>
            <div v-if="importPreview" class="space-y-4 rounded-xl border border-white/[0.08] bg-[#242044] p-4">
              <div class="grid grid-cols-3 gap-3">
                <div><p class="text-xs text-[#a99fc5]">Total baris</p><p class="mt-1 text-xl font-semibold tabular-nums">{{ importPreview.total_rows }}</p></div>
                <div><p class="text-xs text-[#a99fc5]">Valid</p><p class="mt-1 text-xl font-semibold text-emerald-200 tabular-nums">{{ importPreview.valid_rows }}</p></div>
                <div><p class="text-xs text-[#a99fc5]">Bermasalah</p><p class="mt-1 text-xl font-semibold text-rose-200 tabular-nums">{{ importPreview.invalid_rows }}</p></div>
              </div>
              <p v-if="importPreview.note" class="text-xs leading-5 text-[#c7c4d5]">{{ importPreview.note }}</p>
              <div v-if="importPreview.errors.length" class="space-y-2">
                <h3 class="text-sm font-semibold text-rose-200">Baris yang perlu diperbaiki</h3>
                <ul class="max-h-48 space-y-2 overflow-y-auto text-xs text-rose-100">
                  <li v-for="(item, index) in importPreview.errors" :key="`${item.row}-${index}`" class="rounded-lg bg-rose-300/[0.06] p-3">
                    <span class="font-semibold">Baris {{ item.row }}</span><span v-if="item.nim"> · NIM {{ item.nim }}</span>
                    <ul class="mt-1 list-inside list-disc"><li v-for="(message, messageIndex) in item.errors" :key="messageIndex">{{ message }}</li></ul>
                  </li>
                </ul>
              </div>
              <div v-if="importPreview.valid_preview.length" class="space-y-2">
                <h3 class="text-sm font-semibold">Contoh data valid</h3>
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[460px] text-left text-xs">
                    <thead class="text-[#a99fc5]"><tr><th class="px-2 py-2">Baris</th><th class="px-2 py-2">NIM</th><th class="px-2 py-2">Nama</th><th class="px-2 py-2">Kelompok</th></tr></thead>
                    <tbody class="divide-y divide-white/5">
                      <tr v-for="item in importPreview.valid_preview" :key="`${item.row}-${item.nim}`">
                        <td class="px-2 py-2">{{ item.row }}</td><td class="px-2 py-2 font-mono">{{ item.nim }}</td><td class="px-2 py-2">{{ item.name }}</td><td class="px-2 py-2">{{ item.kelompok }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p v-if="importPreview.invalid_rows > 0" class="text-xs text-amber-100">Perbaiki semua baris bermasalah dan validasi ulang sebelum impor.</p>
            </div>
          </div>
        </section>

        <!-- Daftar pemilih -->

        <section class="mb-8 overflow-hidden rounded-2xl border border-white/8 bg-[#2d284b]">

          <div class="flex flex-col justify-between gap-3 border-b border-white/7 px-5 py-5 sm:flex-row sm:items-center sm:px-6">

            <div>

              <h2 class="font-semibold">Daftar pemilih</h2>

              <p class="mt-1 text-sm text-[#b3a9ce]">Cari pemilih dan periksa status partisipasinya.</p>

            </div>

            <div class="flex gap-2 text-xs">

              <span class="rounded-lg bg-emerald-300/10 px-3 py-2 text-emerald-200">Sudah: {{ votedCount }}</span>

              <span class="rounded-lg bg-rose-300/10 px-3 py-2 text-rose-200">Belum: {{ notVotedCount }}</span>

            </div>

          </div>

          <div class="grid gap-3 border-b border-white/[0.07] p-4 sm:grid-cols-[minmax(0,1fr)_210px] sm:p-5">

            <label>

              <span class="mb-2 block text-xs text-[#c7c4d5]">Cari pemilih</span>

              <input v-model="voterSearch" type="search" placeholder="Nama, kelompok, atau ID/NIM..." class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none placeholder:text-[#8a7fa6] focus:border-[#a78bfa]" />

            </label>

            <label>

              <span class="mb-2 block text-xs text-[#c7c4d5]">Status partisipasi</span>

              <select v-model="voterFilter" class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]">

                <option value="all">Semua pemilih</option>

                <option value="voted">Sudah vote</option>

                <option value="not-voted">Belum vote</option>

              </select>

            </label>

          </div>

          <div class="overflow-x-auto">

            <table class="w-full min-w-[900px] text-left text-sm">

              <thead class="bg-white/2.5 text-xs text-[#a99fc5]">

                <tr>

                  <th class="px-5 py-3.5 font-medium sm:px-6">Nama pemilih</th>

                  <th class="px-5 py-3.5 font-medium">Kelompok</th>

                  <th class="px-5 py-3.5 font-medium">ID / NIM</th>

                  <th class="px-5 py-3.5 font-medium">Status</th>

                  <th class="px-5 py-3.5 font-medium">Aksi</th>

                </tr>

              </thead>

              <tbody class="divide-y divide-white/6">

                <tr v-for="voter in filteredVoters" :key="voter.id" class="hover:bg-white/2.5">

                  <td class="px-5 py-4 font-medium sm:px-6">{{ voter.name ?? "Nama belum diatur" }}</td>

                  <td class="px-5 py-4">

                    <span v-if="voter.kelompok" class="rounded-md bg-violet-200/[0.07] px-2.5 py-1 text-xs text-violet-100">{{ voter.kelompok }}</span>

                    <span v-else class="text-xs text-[#9b91b8]">Belum diatur</span>

                  </td>

                  <td class="px-5 py-4 font-mono text-xs text-[#c4bddb]">{{ voter.nim ?? voter.id }}</td>

                  <td class="px-5 py-4">

                    <span v-if="voter.hasVoted" class="text-xs font-medium text-emerald-200">● Sudah vote</span>

                    <span v-else class="text-xs font-medium text-rose-200">● Belum vote</span>

                  </td>

                  <td class="px-5 py-4">

                    <button

                      v-if="voter.hasVoted"

                      type="button"

                      :disabled="saving"

                      class="rounded-lg border border-amber-300/25 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"

                      @click="resetVoterVote(voter)"

                    >

                      {{ saving && resetVoteVoterId === voter.id ? "Resetting..." : "Reset Suara" }}

                    </button>

                    <span v-else class="text-xs text-[#9b91b8]">Belum memilih</span>

                  </td>

                </tr>

                <tr v-if="filteredVoters.length === 0">

                  <td colspan="5" class="px-5 py-12 text-center text-sm text-[#b3a9ce]">

                    {{ voters.length ? "Tidak ada pemilih yang cocok dengan pencarian." : "Belum ada data pemilih." }}

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          <div class="border-t border-white/[0.07] px-5 py-3.5 text-xs text-[#a99fc5]">

            Menampilkan <span class="text-[#d7d4e3]">{{ filteredVoters.length }}</span> dari {{ voters.length }} pemilih

          </div>

        </section>

        <!-- Pengaturan voting -->

        <section class="mb-8 overflow-hidden rounded-2xl border border-white/8 bg-[#2d284b]">

          <div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">

            <h2 class="font-semibold">Pengaturan voting</h2>

            <p class="mt-1 text-sm text-[#b3a9ce]">Tentukan waktu mulai dan berakhirnya pemilihan.</p>

          </div>

          <form class="p-5 sm:p-6" @submit.prevent="saveSchedule">

            <div class="grid gap-5 md:grid-cols-2">

              <label>

                <span class="mb-2 block text-sm font-medium">Voting dibuka</span>

                <input v-model="openAt" type="datetime-local" required class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]" />

                <span class="mt-2 block text-xs text-[#a99fc5]">Pemilih dapat memberikan suara mulai waktu ini.</span>

              </label>

              <label>

                <span class="mb-2 block text-sm font-medium">Voting ditutup</span>

                <input v-model="closeAt" type="datetime-local" required class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]" />

                <span class="mt-2 block text-xs text-[#a99fc5]">Setelah waktu ini, voting berakhir.</span>

              </label>

            </div>

            <div v-if="voting.openAt && voting.closeAt" class="mt-5 rounded-xl border border-white/[0.07] bg-[#242044] p-4">

              <p class="text-xs text-[#a99fc5]">Jadwal saat ini</p>

              <p class="mt-2 text-sm text-[#d7d4e3]">{{ formatDate(voting.openAt) }} → {{ formatDate(voting.closeAt) }}</p>

            </div>

            <div class="mt-5 flex justify-end">

              <button type="submit" :disabled="saving" class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">

                {{ saving ? "Menyimpan..." : "Simpan jadwal" }}

              </button>

            </div>

          </form>

        </section>

        <!-- Pasangan calon -->

        <section class="overflow-hidden rounded-2xl border border-white/8 bg-[#2d284b]">

          <div class="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-6">

            <div>

              <h2 class="font-semibold">Pasangan calon</h2>

              <p class="mt-1 text-sm text-[#b3a9ce]">Kelola identitas, foto, visi, dan misi setiap pasangan.</p>

            </div>

            <button type="button" class="w-fit rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white" @click="showCreateForm ? resetCandidateForm() : startCreate()">

              {{ showCreateForm ? "Tutup formulir" : "+ Tambah pasangan" }}

            </button>

          </div>

          <div v-if="showCreateForm" class="border-b border-white/[0.07] bg-[#343052] p-5 sm:p-6">

            <h3 class="mb-4 font-semibold">Tambah pasangan calon</h3>

            <form class="space-y-5" @submit.prevent="saveCandidate">

              <div class="grid gap-4 lg:grid-cols-2">

                <div class="rounded-xl border border-white/[0.07] p-4">

                  <h4 class="mb-4 text-sm font-semibold text-violet-100">Calon ketua</h4>

                  <label class="mb-4 block">

                    <span class="mb-2 block text-xs text-[#c4bddb]">Nama</span>

                    <input v-model.trim="candidateForm.ketuaName" required placeholder="Nama lengkap ketua" class="admin-input" />

                  </label>

                  <label class="block">

                    <span class="mb-2 block text-xs text-[#c4bddb]">URL foto</span>

                    <input v-model="candidateForm.ketuaPhotoUrl" type="url" placeholder="https\://..." class="admin-input" />

                  </label>

                </div>

                <div class="rounded-xl border border-white/[0.07] p-4">

                  <h4 class="mb-4 text-sm font-semibold text-violet-100">Calon wakil</h4>

                  <label class="mb-4 block">

                    <span class="mb-2 block text-xs text-[#c4bddb]">Nama</span>

                    <input v-model.trim="candidateForm.wakilName" required placeholder="Nama lengkap wakil" class="admin-input" />

                  </label>

                  <label class="block">

                    <span class="mb-2 block text-xs text-[#c4bddb]">URL foto</span>

                    <input v-model="candidateForm.wakilPhotoUrl" type="url" placeholder="https\://..." class="admin-input" />

                  </label>

                </div>

              </div>

              <div class="grid gap-4 lg:grid-cols-2">

                <label>

                  <span class="mb-2 block text-sm font-medium">Visi</span>

                  <textarea v-model.trim="candidateForm.vision" required rows="5" placeholder="Tuliskan visi pasangan calon..." class="admin-input"></textarea>

                </label>

                <label>

                  <span class="mb-2 block text-sm font-medium">Misi</span>

                  <textarea v-model.trim="candidateForm.mission" required rows="5" placeholder="Tuliskan misi pasangan calon..." class="admin-input"></textarea>

                </label>

              </div>

              <div class="flex justify-end gap-2">

                <button type="button" class="rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5" @click="resetCandidateForm">Batal</button>

                <button type="submit" :disabled="saving" class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white disabled:opacity-60">{{ saving ? "Menyimpan..." : "Simpan pasangan" }}</button>

              </div>

            </form>

          </div>

          <div v-if="candidates.length" class="divide-y divide-white/[0.07]">

            <article v-for="(candidate, index) in candidates" :key="candidate.id" class="p-5 sm:p-6">

              <form v-if="editingCandidateId === candidate.id" class="space-y-5" @submit.prevent="saveCandidate">

                <input type="hidden" :value="candidate.id" />

                <div class="flex justify-between gap-3">

                  <h3 class="font-semibold">Edit pasangan #{{ index + 1 }}</h3>

                  <button type="button" class="text-sm text-[#c7c4d5]" @click="cancelEdit">Batal</button>

                </div>

                <div class="grid gap-4 lg:grid-cols-2">

                  <div class="space-y-3 rounded-xl border border-white/[0.07] p-4">

                    <h4 class="text-sm font-semibold text-violet-100">Ketua</h4>

                    <input v-model.trim="candidateForm.ketuaName" required class="admin-input" placeholder="Nama ketua" />

                    <input v-model="candidateForm.ketuaPhotoUrl" type="url" class="admin-input" placeholder="URL foto ketua" />

                  </div>

                  <div class="space-y-3 rounded-xl border border-white/[0.07] p-4">

                    <h4 class="text-sm font-semibold text-violet-100">Wakil</h4>

                    <input v-model.trim="candidateForm.wakilName" required class="admin-input" placeholder="Nama wakil" />

                    <input v-model="candidateForm.wakilPhotoUrl" type="url" class="admin-input" placeholder="URL foto wakil" />

                  </div>

                </div>

                <div class="grid gap-4 md:grid-cols-2">

                  <label><span class="mb-2 block text-sm">Visi</span><textarea v-model.trim="candidateForm.vision" required rows="5" class="admin-input"></textarea></label>

                  <label><span class="mb-2 block text-sm">Misi</span><textarea v-model.trim="candidateForm.mission" required rows="5" class="admin-input"></textarea></label>

                </div>

                <div class="flex justify-end">

                  <button type="submit" :disabled="saving" class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white disabled:opacity-60">{{ saving ? "Menyimpan..." : "Simpan perubahan" }}</button>

                </div>

              </form>

              <div v-else class="space-y-5">

                <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div class="flex items-center gap-3">

                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-200/[0.07] text-sm font-semibold text-violet-100">{{ String(index + 1).padStart(2, "0") }}</span>

                    <div>

                      <p class="text-xs text-[#a99fc5]">Pasangan calon</p>

                      <h3 class="mt-1 text-lg font-semibold">{{ candidate.ketuaName }} <span class="text-[#a99fc5]">&</span> {{ candidate.wakilName }}</h3>

                    </div>

                  </div>

                  <div class="flex gap-2">

                    <button type="button" class="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5" @click="startEdit(candidate)">Edit</button>

                    <button type="button" class="rounded-lg border border-rose-300/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-300/10" @click="startDelete(candidate.id)">Hapus</button>

                  </div>

                </div>

                <div v-if="deleteCandidateId === candidate.id" class="flex flex-col justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/6 p-4 sm:flex-row sm:items-center">

                  <p class="text-sm">Yakin ingin menghapus pasangan ini?</p>

                  <div class="flex gap-2">

                    <button type="button" class="rounded-lg border border-white/10 px-3 py-2 text-sm" @click="cancelDelete">Batal</button>

                    <button type="button" :disabled="saving" class="rounded-lg bg-rose-300 px-3 py-2 text-sm font-semibold text-[#291319] disabled:opacity-60" @click="deleteCandidate(candidate.id)">Ya, hapus</button>

                  </div>

                </div>

                <div class="grid gap-3 md:grid-cols-2">

                  <div v-for="person in [{ name: candidate.ketuaName, photo: candidate.ketuaPhotoUrl, role: 'Ketua' }, { name: candidate.wakilName, photo: candidate.wakilPhotoUrl, role: 'Wakil ketua' }]" :key="person.role" class="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#343052] p-3.5">

                    <img v-if="person.photo" :src="person.photo" :alt="person.name" class="h-16 w-16 rounded-lg object-cover" />

                    <div v-else class="flex h-16 w-16 items-center justify-center rounded-lg bg-violet-200/10 font-semibold text-violet-100">{{ initials(person.name) }}</div>

                    <div class="min-w-0">

                      <p class="text-xs text-[#a99fc5]">{{ person.role }}</p>

                      <p class="mt-1 truncate text-sm font-medium">{{ person.name }}</p>

                    </div>

                  </div>

                </div>

                <div class="grid gap-4 md:grid-cols-2">

                  <div class="rounded-xl border border-white/[0.07] p-4">

                    <p class="mb-2 text-xs font-semibold tracking-[0.12em] text-violet-200 uppercase">Visi</p>

                    <p class="text-sm leading-6 whitespace-pre-line text-[#c7c4d5]">{{ candidate.vision || "Belum ada visi yang diisi." }}</p>

                  </div>

                  <div class="rounded-xl border border-white/[0.07] p-4">

                    <p class="mb-2 text-xs font-semibold tracking-[0.12em] text-violet-200 uppercase">Misi</p>

                    <p class="text-sm leading-6 whitespace-pre-line text-[#c7c4d5]">{{ candidate.mission || "Belum ada misi yang diisi." }}</p>

                  </div>

                </div>

              </div>

            </article>

          </div>

          <div v-else class="px-6 py-16 text-center">

            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-xl text-violet-100">+</div>

            <h3 class="mt-4 font-semibold">Belum ada pasangan calon</h3>

            <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#b3a9ce]">Tambahkan pasangan calon untuk menyiapkan halaman pemilihan.</p>

            <button type="button" class="mt-5 rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white" @click="startCreate">Tambah pasangan</button>

          </div>

        </section>

        <footer class="flex flex-col items-center justify-between gap-2 py-8 text-center sm:flex-row sm:text-left">

          <p class="text-xs text-[#9b91b8]">© {{ new Date().getFullYear() }} SIKRABTEK 63</p>

          <p class="text-xs text-[#9b91b8]">Admin dashboard · TITIK NOL</p>

        </footer>

      </template>

    </main>

  </div>

</template>

<style scoped>

.admin-input {

  display: block;

  width: 100%;

  border: 1px solid rgb(255 255 255 / 10%);

  border-radius: 0.625rem;

  background: #242044;

  padding: 0.7rem 0.8rem;

  color: #f4f2fb;

  font-size: 0.875rem;

  outline: none;

}

.admin-input::placeholder {

  color: #8a7fa6;

}

.admin-input:focus {

  border-color: #a78bfa;

}

.admin-input:disabled {

  cursor: not-allowed;

  opacity: 0.6;

}

</style>
