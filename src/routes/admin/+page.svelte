<script lang="ts">
	let { data, form } = $props();

	type Candidate = {
		id: string;

		ketuaName: string;

		wakilName: string;

		ketuaPhotoUrl?: string | null;

		wakilPhotoUrl?: string | null;

		vision: string;

		mission: string;
	};

	let showCreateForm = $state(false);

	let editingCandidateId = $state<string | null>(null);

	let deleteCandidateId = $state<string | null>(null);

	let voterSearch = $state('');

	let voterFilter = $state('all');

	let filteredVoters = $derived(
		(data.voters ?? []).filter(
			(voter: {
				id: string;
				name: string | null;
				kelompok?: string | null;
				nim?: string | null;
				hasVoted: boolean;
			}) => {
				const query = voterSearch.trim().toLowerCase();
				const matchesSearch =
					(voter.name ?? '').toLowerCase().includes(query) ||
					(voter.kelompok ?? '').toLowerCase().includes(query) ||
					(voter.nim ?? voter.id).toLowerCase().includes(query);

				const matchesFilter =
					voterFilter === 'all' ||
					(voterFilter === 'voted' && voter.hasVoted) ||
					(voterFilter === 'not-voted' && !voter.hasVoted);

				return matchesSearch && matchesFilter;
			}
		)
	);

	let votingProgress = $derived(
		data.totalVoters > 0 ? Math.round(((data.votedCount ?? 0) / data.totalVoters) * 100) : 0
	);

	function formatDateTimeLocal(date: string | Date | null | undefined) {
		if (!date) return '';

		const d = new Date(date);

		if (Number.isNaN(d.getTime())) return '';

		const year = d.getFullYear();

		const month = String(d.getMonth() + 1).padStart(2, '0');

		const day = String(d.getDate()).padStart(2, '0');

		const hours = String(d.getHours()).padStart(2, '0');

		const minutes = String(d.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function formatDate(date: string | Date | null | undefined) {
		if (!date) return '-';

		const d = new Date(date);

		if (Number.isNaN(d.getTime())) return '-';

		return d.toLocaleString('id-ID', {
			dateStyle: 'medium',

			timeStyle: 'short'
		});
	}

	function getVotingStatus() {
		if (!data.voting.openAt || !data.voting.closeAt) {
			return {
				key: 'not-configured',

				label: 'Belum dikonfigurasi',

				description: 'Admin belum menentukan waktu voting.',

				badgeClass: 'bg-[#34365F] text-[#c0bfd0]',

				dotClass: 'bg-[#6F6D7E]'
			};
		}

		const now = new Date();

		const openAt = new Date(data.voting.openAt);

		const closeAt = new Date(data.voting.closeAt);

		if (now >= openAt && now <= closeAt) {
			return {
				key: 'open',

				label: 'Voting sedang dibuka',

				description: 'Pemilih saat ini dapat memberikan suara.',

				badgeClass: 'bg-[#91B8C8]/10 text-[#91B8C8]',

				dotClass: 'bg-[#91B8C8]'
			};
		}

		if (now < openAt) {
			return {
				key: 'upcoming',

				label: 'Voting belum dibuka',

				description: 'Voting belum memasuki waktu yang ditentukan.',

				badgeClass: 'bg-[#c5b8d6]/10 text-[#C5B8D6]',

				dotClass: 'bg-[#c5b8d6]'
			};
		}

		return {
			key: 'closed',

			label: 'Voting sudah ditutup',

			description: 'Waktu voting telah berakhir.',

			badgeClass: 'bg-[#D58A78]/10 text-[#D58A78]',

			dotClass: 'bg-[#D58A78]'
		};
	}

	let votingStatus = $derived(getVotingStatus());

	function startEdit(candidate: Candidate) {
		editingCandidateId = candidate.id;

		deleteCandidateId = null;
	}

	function cancelEdit() {
		editingCandidateId = null;
	}

	function startDelete(candidateId: string) {
		deleteCandidateId = candidateId;

		editingCandidateId = null;
	}

	function cancelDelete() {
		deleteCandidateId = null;
	}
</script>

<svelte:head>
	<title>Admin Dashboard — SIKRABTEK 63</title>

	<meta
		name="description"
		content="Dashboard admin untuk mengelola voting angkatan SIKRABTEK 63."
	/>
</svelte:head>

<div class="min-h-screen bg-[#0b1020] text-[#f4f2fb] selection:bg-[#c5b8d6]/30">
	<!-- HEADER -->

	<header class="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0b1020]/85 backdrop-blur-2xl">
		<div
			class="mx-auto flex h-[76px] max-w-[1380px] items-center justify-between px-4 sm:px-6 lg:px-10"
		>
			<div class="flex items-center gap-3">
				<img
					src="/images/logo.jpg"
					alt="SIKRABTEK 63"
					class="h-10 w-10 rounded-xl border border-white/10 object-cover shadow-lg"
				/>

				<div>
					<p class="text-sm font-semibold tracking-tight text-[#f4f2fb]">SIKRABTEK 63</p>

					<p class="text-xs text-[#9294ad]">Admin Panel</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="hidden text-right sm:block">
					<p class="text-sm font-medium text-[#f4f2fb]">
						{data.user?.name ?? 'Administrator'}
					</p>

					<p class="text-xs text-[#9294ad]">Administrator</p>
				</div>

				<div
					class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1D2345] text-xs font-semibold text-[#C5B8D6]"
				>
					{(data.user?.name ?? 'A')

						.split(' ')

						.map((word: string) => word[0])

						.join('')

						.slice(0, 2)

						.toUpperCase()}
				</div>

				<form method="POST" action="/logout">
					<button
						type="submit"
						class="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c0bfd0] transition hover:border-[#c5b8d6]/60 hover:bg-white/[0.07] hover:text-[#f4f2fb] sm:block"
					>
						Keluar
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-[1380px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
		<!-- PAGE HEADER -->

		<section
			class="relative mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[radial-gradient(ellipse_at_top_right,\_rgba(138,127,166,0.16),\_transparent_42%),linear-gradient(135deg,#171c37_0%,#11162c_65%,#151a31_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-8"
		>
			<div class="flex flex-col justify-between gap-5 md:flex-row md:items-end">
				<div>
					<p class="mb-2 text-xs font-semibold tracking-[0.18em] text-[#c5b8d6] uppercase">
						Administration
					</p>

					<h1 class="text-2xl font-semibold tracking-tight text-[#f4f2fb] sm:text-3xl">
						Dashboard Voting
					</h1>

					<p class="mt-2 max-w-2xl text-sm leading-6 text-[#c0bfd0]">
						Kelola jadwal voting dan pasangan calon Ketua & Wakil Angkatan dari satu tempat.
					</p>
				</div>

				<a
					href="/admin/results"
					class="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-[#1D2345] px-4 py-2.5 text-sm font-medium text-[#f4f2fb] transition hover:border-[#c5b8d6]/60 hover:bg-white/[0.08]"
				>
					<svg
						xmlns="http\://www\.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<path d="M3 3v18h18" />

						<path d="m7 16 4-5 3 3 5-7" />
					</svg>

					Lihat Hasil Voting
				</a>
			</div>
		</section>

		<!-- FLASH MESSAGE -->

		{#if form?.success}
			<div
				class="mb-6 flex items-start gap-3 rounded-xl border border-[#91B8C8]/30 bg-[#91B8C8]/10 px-4 py-3"
			>
				<div
					class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#91B8C8]/20 text-[#91B8C8]"
				>
					<svg
						xmlns="http\://www\.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path d="m5 12 4 4L19 6" />
					</svg>
				</div>

				<p class="text-sm text-[#91B8C8]">
					{form.success}
				</p>
			</div>
		{/if}

		{#if form?.error}
			<div
				class="mb-6 flex items-start gap-3 rounded-xl border border-[#D58A78]/30 bg-[#D58A78]/10 px-4 py-3"
			>
				<div
					class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D58A78]/20 text-[#D58A78]"
				>
					<svg
						xmlns="http\://www\.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path d="M12 8v4" />

						<path d="M12 16h.01" />

						<circle cx="12" cy="12" r="9" />
					</svg>
				</div>

				<p class="text-sm text-[#D58A78]">
					{form.error}
				</p>
			</div>
		{/if}

		<!-- STATISTICS -->

		<section class="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<!-- TOTAL VOTERS -->

			<div
				class="rounded-2xl border border-white/[0.075] bg-[#141a31] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)] transition-colors hover:border-white/[0.12] sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm text-[#c0bfd0]">Total Pemilih</p>

						<p class="mt-2 text-3xl font-semibold tracking-tight text-[#f4f2fb]">
							{data.totalVoters}
						</p>

						<p class="mt-1 text-xs text-[#9294ad]">Jumlah pemilih terdaftar</p>
					</div>

					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c5b8d6]/10 text-[#d9cdec]"
					>
						<svg
							xmlns="http\://www\.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.7"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

							<circle cx="9" cy="7" r="4" />

							<path d="M22 21v-2a4 4 0 0 0-3-3.87" />

							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					</div>
				</div>
			</div>

			<!-- PARTICIPATION -->

			<div
				class="rounded-2xl border border-white/[0.075] bg-[#141a31] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)] transition-colors hover:border-white/[0.12] sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<p class="text-sm text-[#c0bfd0]">Partisipasi</p>

						<p class="mt-2 text-3xl font-semibold tracking-tight text-[#f4f2fb]">
							{votingProgress}%
						</p>

						<p class="mt-1 text-xs text-[#9294ad]">
							{data.votedCount ?? 0} dari {data.totalVoters ?? 0} pemilih
						</p>
					</div>

					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#91B8C8]/10 text-[#91B8C8]"
					>
						<svg
							xmlns="http\://www\.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
						>
							<path d="M4 19V5" />

							<path d="M4 19h16" />

							<path d="m7 15 4-4 3 3 5-7" />
						</svg>
					</div>
				</div>

				<div
					class="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
					role="progressbar"
					aria-label="Partisipasi voting"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={votingProgress}
				>
					<div
						class="h-full rounded-full bg-[#91B8C8] transition-[width] duration-500"
						style={`width: ${votingProgress}%`}
					></div>
				</div>
			</div>

			<!-- VOTING STATUS -->

			<div
				class="rounded-2xl border border-white/[0.075] bg-[#141a31] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.12)] transition-colors hover:border-white/[0.12] sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm text-[#c0bfd0]">Status Voting</p>

						<div class="mt-2 flex items-center gap-2">
							<span class={`h-2 w-2 rounded-full ${votingStatus.dotClass}`}></span>

							<p class="text-lg font-semibold text-[#f4f2fb]">
								{votingStatus.label}
							</p>
						</div>

						<p class="mt-1 text-xs text-[#9294ad]">
							{votingStatus.description}
						</p>
					</div>

					<div class={`rounded-lg px-3 py-2 text-xs font-medium ${votingStatus.badgeClass}`}>
						{votingStatus.key === 'open'
							? 'LIVE'
							: votingStatus.key === 'upcoming'
								? 'UPCOMING'
								: votingStatus.key === 'closed'
									? 'CLOSED'
									: 'SETUP'}
					</div>
				</div>
			</div>
		</section>

		<!-- VOTER LIST -->

		<section
			class="mb-6 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#141a31] shadow-[0_14px_36px_rgba(0,0,0,0.12)]"
		>
			<div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h2 class="text-base font-semibold text-[#f4f2fb]">Daftar Pemilih</h2>

						<p class="mt-1 text-sm text-[#9294ad]">
							Pantau siapa yang sudah dan belum memberikan suara.
						</p>
					</div>

					<div class="flex flex-wrap gap-2 text-xs">
						<span class="rounded-lg bg-[#91B8C8]/10 px-3 py-2 text-[#91B8C8]"
							>Sudah vote: {data.votedCount ?? 0}</span
						>

						<span class="rounded-lg bg-[#D58A78]/10 px-3 py-2 text-[#D58A78]"
							>Belum vote: {data.notVotedCount ?? 0}</span
						>
					</div>
				</div>
			</div>

			<div class="grid gap-3 border-b border-white/[0.08] p-4 sm:grid-cols-[1fr_200px] sm:p-5">
				<label class="block">
					<span class="mb-2 block text-xs font-medium text-[#c0bfd0]"
						>Cari nama, kelompok, atau ID</span
					>

					<input
						type="search"
						bind:value={voterSearch}
						placeholder="Nama pemilih / kelompok / ID..."
						class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] outline-none placeholder:text-[#9294ad] focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
					/>
				</label>

				<label class="block">
					<span class="mb-2 block text-xs font-medium text-[#c0bfd0]">Filter status</span>

					<select
						bind:value={voterFilter}
						class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] outline-none focus:border-[#c5b8d6]/70"
					>
						<option value="all">Semua pemilih</option>

						<option value="voted">Sudah vote</option>

						<option value="not-voted">Belum vote</option>
					</select>
				</label>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full min-w-[760px] text-left text-sm">
					<thead class="bg-[#10162a] text-[11px] tracking-[0.12em] text-[#8c8da6] uppercase">
						<tr>
							<th class="px-5 py-3 font-medium">Pemilih</th>

							<th class="px-5 py-3 font-medium">Kelompok</th>
							<th class="px-5 py-3 font-medium">ID / NIM</th>

							<th class="px-5 py-3 font-medium">Status</th>
						</tr>
					</thead>

					<tbody class="divide-y divide-white/[0.06]">
						{#each filteredVoters as voter (voter.id)}
							<tr class="transition-colors hover:bg-white/[0.035]">
								<td class="px-5 py-3.5 font-medium text-[#f4f2fb]"
									>{voter.name ?? 'Nama belum diatur'}</td
								>

								<td class="px-5 py-3.5">
									{#if voter.kelompok}
										<span
											class="inline-flex items-center rounded-lg border border-[#C5B8D6]/20 bg-[#C5B8D6]/10 px-2.5 py-1.5 text-xs font-medium text-[#D9CDEC]"
										>
											{voter.kelompok}
										</span>
									{:else}
										<span class="text-xs text-[#777b96]">Belum diatur</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 font-mono text-xs text-[#9294ad]">{voter.nim ?? voter.id}</td
								>

								<td class="px-5 py-3.5">
									{#if voter.hasVoted}
										<span
											class="inline-flex rounded-full bg-[#91B8C8]/10 px-2.5 py-1 text-xs font-medium text-[#91B8C8]"
											>Sudah vote</span
										>
									{:else}
										<span
											class="inline-flex rounded-full bg-[#D58A78]/10 px-2.5 py-1 text-xs font-medium text-[#D58A78]"
											>Belum vote</span
										>
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-5 py-10 text-center text-sm text-[#9294ad]">
									{#if data.voters?.length}
										Tidak ada pemilih yang cocok dengan pencarian.
									{:else}
										Belum ada data pemilih.
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="border-t border-white/[0.08] px-5 py-3 text-xs text-[#9294ad]">
				Menampilkan {filteredVoters.length} dari {data.voters?.length ?? 0} pemilih.
			</div>
		</section>

		<!-- VOTING SETTINGS -->

		<section
			class="mb-6 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#141a31] shadow-[0_14px_36px_rgba(0,0,0,0.12)]"
		>
			<div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">
				<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
					<div>
						<h2 class="text-base font-semibold text-[#f4f2fb]">Pengaturan Voting</h2>

						<p class="mt-1 text-sm text-[#9294ad]">Tentukan kapan voting dibuka dan ditutup.</p>
					</div>

					<div class={`w-fit rounded-lg px-3 py-2 text-xs font-medium ${votingStatus.badgeClass}`}>
						<span class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${votingStatus.dotClass}"
						></span>

						{votingStatus.label}
					</div>
				</div>
			</div>

			<form
				method="POST"
				action="?/updateVoting"
				class="p-5 transition-colors hover:bg-white/[0.015] sm:p-6"
			>
				<div class="grid gap-5 md:grid-cols-2">
					<!-- OPEN AT -->

					<div>
						<label for="openAt" class="mb-2 block text-sm font-medium text-[#f4f2fb]">
							Voting dibuka
						</label>

						<input
							id="openAt"
							name="openAt"
							type="datetime-local"
							value={formatDateTimeLocal(data.voting.openAt)}
							class="w-full border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#9294ad] focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
						/>

						<p class="mt-2 text-xs text-[#9294ad]">
							Pemilih dapat mulai memberikan suara pada waktu ini.
						</p>
					</div>

					<!-- CLOSE AT -->

					<div>
						<label for="closeAt" class="mb-2 block text-sm font-medium text-[#f4f2fb]">
							Voting ditutup
						</label>

						<input
							id="closeAt"
							name="closeAt"
							type="datetime-local"
							value={formatDateTimeLocal(data.voting.closeAt)}
							class="w-full border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#9294ad] focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
						/>

						<p class="mt-2 text-xs text-[#9294ad]">
							Setelah waktu ini, voting tidak dapat dilakukan lagi.
						</p>
					</div>
				</div>

				{#if data.voting.openAt && data.voting.closeAt}
					<div class="mt-5 border border-white/10 bg-[#0e1428] px-4 py-3">
						<p class="text-xs font-medium tracking-wide text-[#9294ad] uppercase">
							Jadwal saat ini
						</p>

						<p class="mt-1 text-sm text-[#c0bfd0]">
							{formatDate(data.voting.openAt)}

							<span class="mx-2 text-[#9294ad]">→</span>

							{formatDate(data.voting.closeAt)}
						</p>
					</div>
				{/if}

				<div class="mt-5 flex justify-end">
					<button
						type="submit"
						class="inline-flex items-center gap-2 rounded-xl bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#11152b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F7F5FA] hover:shadow-lg"
					>
						<svg
							xmlns="http\://www\.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
						>
							<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />

							<path d="M17 21v-8H7v8" />

							<path d="M7 3v5h8" />
						</svg>

						Simpan Pengaturan Voting
					</button>
				</div>
			</form>
		</section>

		<!-- CANDIDATE MANAGEMENT -->

		<section
			class="overflow-hidden rounded-2xl border border-white/[0.075] bg-[#141a31] shadow-[0_14px_36px_rgba(0,0,0,0.12)]"
		>
			<!-- SECTION HEADER -->

			<div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h2 class="text-base font-semibold text-[#f4f2fb]">Kelola Pasangan Calon</h2>

						<p class="mt-1 text-sm text-[#9294ad]">
							Tambahkan dan kelola pasangan calon Ketua & Wakil Angkatan.
						</p>
					</div>

					<button
						type="button"
						onclick={() => {
							showCreateForm = !showCreateForm;

							editingCandidateId = null;

							deleteCandidateId = null;
						}}
						class="inline-flex w-fit items-center gap-2 rounded-xl bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#11152b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F7F5FA] hover:shadow-lg"
					>
						{#if showCreateForm}
							<svg
								xmlns="http\://www\.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M18 6 6 18" />

								<path d="m6 6 12 12" />
							</svg>

							Tutup Form
						{:else}
							<svg
								xmlns="http\://www\.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 5v14" />

								<path d="M5 12h14" />
							</svg>

							Tambah Calon
						{/if}
					</button>
				</div>
			</div>

			<!-- CREATE FORM -->

			{#if showCreateForm}
				<div class="border-b border-white/[0.08] bg-[#12162d] px-5 py-5 sm:px-6">
					<div class="mb-5">
						<p class="text-sm font-semibold text-[#f4f2fb]">Tambah Pasangan Calon</p>

						<p class="mt-1 text-xs text-[#9294ad]">
							Isi informasi pasangan calon yang akan ditampilkan pada halaman voting.
						</p>
					</div>

					<form method="POST" action="?/createCandidate">
						<div class="grid gap-5 lg:grid-cols-2">
							<!-- KETUA -->

							<div class="rounded-xl border border-white/[0.08] bg-[#141a31] p-4">
								<div class="mb-4">
									<p class="text-sm font-semibold text-[#f4f2fb]">Ketua</p>

									<p class="mt-1 text-xs text-[#9294ad]">Informasi calon ketua.</p>
								</div>

								<div class="space-y-4">
									<div>
										<label for="ketuaName" class="mb-2 block text-xs font-medium text-[#c0bfd0]">
											Nama
										</label>

										<input
											id="ketuaName"
											name="ketuaName"
											type="text"
											required
											placeholder="Nama calon ketua"
											class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
										/>
									</div>

									<div>
										<label
											for="ketuaPhotoUrl"
											class="mb-2 block text-xs font-medium text-[#c0bfd0]"
										>
											URL Foto
										</label>

										<input
											id="ketuaPhotoUrl"
											name="ketuaPhotoUrl"
											type="url"
											placeholder="https\://..."
											class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
										/>
									</div>
								</div>
							</div>

							<!-- WAKIL -->

							<div class="rounded-xl border border-white/[0.08] bg-[#141a31] p-4">
								<div class="mb-4">
									<p class="text-sm font-semibold text-[#f4f2fb]">Wakil</p>

									<p class="mt-1 text-xs text-[#9294ad]">Informasi calon wakil.</p>
								</div>

								<div class="space-y-4">
									<div>
										<label for="wakilName" class="mb-2 block text-xs font-medium text-[#c0bfd0]">
											Nama
										</label>

										<input
											id="wakilName"
											name="wakilName"
											type="text"
											required
											placeholder="Nama calon wakil"
											class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
										/>
									</div>

									<div>
										<label
											for="wakilPhotoUrl"
											class="mb-2 block text-xs font-medium text-[#c0bfd0]"
										>
											URL Foto
										</label>

										<input
											id="wakilPhotoUrl"
											name="wakilPhotoUrl"
											type="url"
											placeholder="https\://..."
											class="w-full rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
										/>
									</div>
								</div>
							</div>

							<!-- VISION -->

							<div>
								<label for="vision" class="mb-2 block text-xs font-medium text-[#c0bfd0]">
									Visi
								</label>

								<textarea
									id="vision"
									name="vision"
									rows="5"
									required
									placeholder="Tuliskan visi pasangan calon..."
									class="w-full resize-y rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm leading-6 text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
								></textarea>
							</div>

							<!-- MISSION -->

							<div>
								<label for="mission" class="mb-2 block text-xs font-medium text-[#c0bfd0]">
									Misi
								</label>

								<textarea
									id="mission"
									name="mission"
									rows="5"
									required
									placeholder="Tuliskan misi pasangan calon..."
									class="w-full resize-y rounded-xl border border-white/10 bg-[#0e1428] px-3.5 py-3 text-sm leading-6 text-[#f4f2fb] transition outline-none placeholder:text-[#777b96] focus:border-[#C5B8D6]/70 focus:ring-4 focus:ring-[#C5B8D6]/10"
								></textarea>
							</div>
						</div>

						<div class="mt-5 flex justify-end">
							<button
								type="submit"
								class="inline-flex items-center gap-2 rounded-xl bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#11152b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F7F5FA] hover:shadow-lg"
							>
								<svg
									xmlns="http\://www\.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 5v14" />

									<path d="M5 12h14" />
								</svg>

								Tambahkan Pasangan
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- CANDIDATE LIST -->

			<div class="divide-y divide-white/[0.08]">
				{#if data.candidates?.length}
					{#each data.candidates as candidate, index (candidate.id)}
						<article class="p-5 transition-colors hover:bg-white/[0.015] sm:p-6">
							{#if editingCandidateId === candidate.id}
								<!-- EDIT FORM -->

								<form method="POST" action="?/updateCandidate">
									<input type="hidden" name="id" value={candidate.id} />

									<div class="mb-5 flex items-center justify-between gap-4">
										<div>
											<p class="text-sm font-semibold text-[#f4f2fb]">
												Edit Pasangan #{index + 1}
											</p>

											<p class="mt-1 text-xs text-[#9294ad]">Perbarui informasi pasangan calon.</p>
										</div>

										<button
											type="button"
											onclick={cancelEdit}
											class="text-sm text-[#c0bfd0] transition hover:text-[#f4f2fb]"
										>
											Batal
										</button>
									</div>

									<div class="grid gap-5 lg:grid-cols-2">
										<!-- KETUA -->

										<div class="rounded-xl border border-white/[0.08] bg-[#12162d] p-4">
											<p class="mb-4 text-sm font-semibold text-[#f4f2fb]">Ketua</p>

											<div class="space-y-4">
												<div>
													<label
														for={`edit-ketua-${candidate.id}`}
														class="mb-2 block text-xs font-medium text-[#c0bfd0]"
													>
														Nama
													</label>

													<input
														id={`edit-ketua-${candidate.id}`}
														name="ketuaName"
														type="text"
														required
														value={candidate.ketuaName}
														class="w-full border border-white/10 bg-[#0e1428] px-3 py-2.5 text-sm text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
													/>
												</div>

												<div>
													<label
														for={`edit-ketua-photo-${candidate.id}`}
														class="mb-2 block text-xs font-medium text-[#c0bfd0]"
													>
														URL Foto
													</label>

													<input
														id={`edit-ketua-photo-${candidate.id}`}
														name="ketuaPhotoUrl"
														type="url"
														value={candidate.ketuaPhotoUrl ?? ''}
														class="w-full border border-white/10 bg-[#0e1428] px-3 py-2.5 text-sm text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
													/>
												</div>
											</div>
										</div>

										<!-- WAKIL -->

										<div class="rounded-xl border border-white/[0.08] bg-[#12162d] p-4">
											<p class="mb-4 text-sm font-semibold text-[#f4f2fb]">Wakil</p>

											<div class="space-y-4">
												<div>
													<label
														for={`edit-wakil-${candidate.id}`}
														class="mb-2 block text-xs font-medium text-[#c0bfd0]"
													>
														Nama
													</label>

													<input
														id={`edit-wakil-${candidate.id}`}
														name="wakilName"
														type="text"
														required
														value={candidate.wakilName}
														class="w-full border border-white/10 bg-[#0e1428] px-3 py-2.5 text-sm text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
													/>
												</div>

												<div>
													<label
														for={`edit-wakil-photo-${candidate.id}`}
														class="mb-2 block text-xs font-medium text-[#c0bfd0]"
													>
														URL Foto
													</label>

													<input
														id={`edit-wakil-photo-${candidate.id}`}
														name="wakilPhotoUrl"
														type="url"
														value={candidate.wakilPhotoUrl ?? ''}
														class="w-full border border-white/10 bg-[#0e1428] px-3 py-2.5 text-sm text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
													/>
												</div>
											</div>
										</div>

										<!-- VISION -->

										<div>
											<label
												for={`edit-vision-${candidate.id}`}
												class="mb-2 block text-xs font-medium text-[#c0bfd0]"
											>
												Visi
											</label>

											<textarea
												id={`edit-vision-${candidate.id}`}
												name="vision"
												rows="6"
												required
												class="w-full resize-y border border-white/10 bg-[#0e1428] px-3 py-3 text-sm leading-6 text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
												>{candidate.vision}</textarea
											>
										</div>

										<!-- MISSION -->

										<div>
											<label
												for={`edit-mission-${candidate.id}`}
												class="mb-2 block text-xs font-medium text-[#c0bfd0]"
											>
												Misi
											</label>

											<textarea
												id={`edit-mission-${candidate.id}`}
												name="mission"
												rows="6"
												required
												class="w-full resize-y border border-white/10 bg-[#0e1428] px-3 py-3 text-sm leading-6 text-[#f4f2fb] transition outline-none focus:border-[#c5b8d6]/70 focus:ring-2 focus:ring-[#c5b8d6]/15"
												>{candidate.mission}</textarea
											>
										</div>
									</div>

									<div class="mt-5 flex justify-end gap-3">
										<button
											type="button"
											onclick={cancelEdit}
											class="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#c0bfd0] transition hover:bg-[#0e1428] hover:text-[#f4f2fb]"
										>
											Batal
										</button>

										<button
											type="submit"
											class="rounded-xl bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#11152b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F7F5FA] hover:shadow-lg"
										>
											Simpan Perubahan
										</button>
									</div>
								</form>
							{:else}
								<!-- CANDIDATE DISPLAY -->

								<div class="flex flex-col gap-5">
									<div class="flex flex-col justify-between gap-5 lg:flex-row">
										<div class="flex min-w-0 items-center gap-4">
											<div
												class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8A7FA6]/10 text-xs font-semibold text-[#C5B8D6]"
											>
												#{index + 1}
											</div>

											<div class="min-w-0">
												<p class="text-xs tracking-wide text-[#9294ad] uppercase">Pasangan Calon</p>

												<h3 class="mt-1 text-lg font-semibold text-[#f4f2fb]">
													{candidate.ketuaName}

													<span class="mx-1 text-[#9294ad]">&</span>

													{candidate.wakilName}
												</h3>
											</div>
										</div>

										<div class="flex shrink-0 gap-2">
											<button
												type="button"
												onclick={() => startEdit(candidate)}
												class="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-sm font-medium text-[#c0bfd0] transition hover:border-[#c5b8d6]/60 hover:bg-[#0e1428] hover:text-[#f4f2fb]"
											>
												<svg
													xmlns="http\://www\.w3.org/2000/svg"
													class="h-4 w-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.8"
												>
													<path d="M12 20h9" />

													<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
												</svg>

												Edit
											</button>

											<button
												type="button"
												onclick={() => startDelete(candidate.id)}
												class="inline-flex items-center gap-2 border border-[#D58A78]/30 px-3 py-2 text-sm font-medium text-[#D58A78] transition hover:bg-[#D58A78]/10"
											>
												<svg
													xmlns="http\://www\.w3.org/2000/svg"
													class="h-4 w-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.8"
												>
													<path d="M3 6h18" />

													<path d="M8 6V4h8v2" />

													<path d="M19 6l-1 14H6L5 6" />

													<path d="M10 11v5" />

													<path d="M14 11v5" />
												</svg>

												Hapus
											</button>
										</div>
									</div>

									<!-- DELETE CONFIRMATION -->

									{#if deleteCandidateId === candidate.id}
										<div class="border border-[#D58A78]/30 bg-[#D58A78]/10 p-4">
											<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
												<div>
													<p class="text-sm font-semibold text-[#f4f2fb]">
														Hapus pasangan calon ini?
													</p>

													<p class="mt-1 text-xs leading-5 text-[#c0bfd0]">
														Tindakan ini akan menghapus pasangan calon dari daftar.
													</p>
												</div>

												<div class="flex gap-2">
													<button
														type="button"
														onclick={cancelDelete}
														class="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-[#c0bfd0] transition hover:bg-[#0e1428] hover:text-[#f4f2fb]"
													>
														Batal
													</button>

													<form method="POST" action="?/deleteCandidate">
														<input type="hidden" name="id" value={candidate.id} />

														<button
															type="submit"
															class="rounded-lg bg-[#D58A78] px-3 py-2 text-sm font-semibold text-[#11152b] transition hover:bg-[#E59B8A]"
														>
															Ya, Hapus
														</button>
													</form>
												</div>
											</div>
										</div>
									{/if}

									<!-- PEOPLE -->

									<div class="grid gap-3 md:grid-cols-2">
										<!-- KETUA -->

										<div
											class="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#12162d] p-3"
										>
											{#if candidate.ketuaPhotoUrl}
												<img
													src={candidate.ketuaPhotoUrl}
													alt={candidate.ketuaName}
													class="h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
												/>
											{:else}
												<div
													class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0e1428] text-sm font-semibold text-[#C5B8D6]"
												>
													{candidate.ketuaName?.charAt(0)?.toUpperCase()}
												</div>
											{/if}

											<div class="min-w-0">
												<p class="text-[11px] tracking-wide text-[#9294ad] uppercase">Ketua</p>

												<p class="mt-1 truncate text-sm font-medium text-[#f4f2fb]">
													{candidate.ketuaName}
												</p>
											</div>
										</div>

										<!-- WAKIL -->

										<div
											class="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#12162d] p-3"
										>
											{#if candidate.wakilPhotoUrl}
												<img
													src={candidate.wakilPhotoUrl}
													alt={candidate.wakilName}
													class="h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
												/>
											{:else}
												<div
													class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0e1428] text-sm font-semibold text-[#C5B8D6]"
												>
													{candidate.wakilName?.charAt(0)?.toUpperCase()}
												</div>
											{/if}

											<div class="min-w-0">
												<p class="text-[11px] tracking-wide text-[#9294ad] uppercase">Wakil</p>

												<p class="mt-1 truncate text-sm font-medium text-[#f4f2fb]">
													{candidate.wakilName}
												</p>
											</div>
										</div>
									</div>

									<!-- VISION / MISSION -->

									<div class="grid gap-4 md:grid-cols-2">
										<div>
											<p class="mb-2 text-xs font-semibold tracking-wide text-[#c5b8d6] uppercase">
												Visi
											</p>

											<div class="border-l-2 border-[#8A7FA6] pl-3">
												<p class="text-sm leading-6 whitespace-pre-line text-[#c0bfd0]">
													{candidate.vision}
												</p>
											</div>
										</div>

										<div>
											<p class="mb-2 text-xs font-semibold tracking-wide text-[#c5b8d6] uppercase">
												Misi
											</p>

											<div class="border-l-2 border-[#8A7FA6] pl-3">
												<p class="text-sm leading-6 whitespace-pre-line text-[#c0bfd0]">
													{candidate.mission}
												</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</article>
					{/each}
				{:else}
					<!-- EMPTY STATE -->

					<div class="px-6 py-16 text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0e1428] text-[#9294ad]"
						>
							<svg
								xmlns="http\://www\.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"
							>
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

								<circle cx="9" cy="7" r="4" />

								<path d="M22 21v-2a4 4 0 0 0-3-3.87" />

								<path d="M16 3.13a4 4 0 0 1 0 7.75" />
							</svg>
						</div>

						<h3 class="mt-4 text-sm font-semibold text-[#f4f2fb]">Belum ada pasangan calon</h3>

						<p class="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#9294ad]">
							Tambahkan pasangan calon terlebih dahulu agar dapat ditampilkan pada halaman voting.
						</p>

						<button
							type="button"
							onclick={() => {
								showCreateForm = true;

								editingCandidateId = null;

								deleteCandidateId = null;
							}}
							class="mt-5 rounded-xl bg-[#c5b8d6] px-4 py-2.5 text-sm font-semibold text-[#11152b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F7F5FA] hover:shadow-lg"
						>
							Tambah Pasangan Calon
						</button>
					</div>
				{/if}
			</div>
		</section>

		<!-- FOOTER -->

		<footer class="py-8 text-center">
			<p class="text-xs text-[#9294ad]">SIKRABTEK 63 · Admin Dashboard</p>
		</footer>
	</main>
</div>
