<script lang="ts">
	let { data, form } = $props();
	type Candidate = {
		id: string;
		ketuaName: string;
		ketuaPhotoUrl: string | null;
		wakilName: string;
		wakilPhotoUrl: string | null;
		vision: string | null;
		mission: string | null;
	};
	let showCreateForm = $state(false),
		editingCandidateId = $state<string | null>(null),
		deleteCandidateId = $state<string | null>(null),
		voterSearch = $state(''),
		voterFilter = $state('all');
	let filteredVoters = $derived(
		(data.voters ?? []).filter(
			(v: {
				id: string;
				name: string | null;
				kelompok?: string | null;
				nim?: string | null;
				hasVoted: boolean;
			}) => {
				const q = voterSearch.trim().toLowerCase();
				const search =
					(v.name ?? '').toLowerCase().includes(q) ||
					(v.kelompok ?? '').toLowerCase().includes(q) ||
					(v.nim ?? v.id).toLowerCase().includes(q);
				const filter =
					voterFilter === 'all' ||
					(voterFilter === 'voted' && v.hasVoted) ||
					(voterFilter === 'not-voted' && !v.hasVoted);
				return search && filter;
			}
		)
	);
	let votingProgress = $derived(
		data.totalVoters > 0 ? Math.round(((data.votedCount ?? 0) / data.totalVoters) * 100) : 0
	);
	function formatDateTimeLocal(value: string | Date | null | undefined) {
		if (!value) return '';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
	}
	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '-';
		const d = new Date(value);
		return Number.isNaN(d.getTime())
			? '-'
			: d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
	}
	function getVotingStatus() {
		if (!data.voting.openAt || !data.voting.closeAt)
			return {
				key: 'setup',
				label: 'Belum dikonfigurasi',
				description: 'Atur jadwal voting terlebih dahulu.',
				badge: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
				dot: 'bg-slate-400'
			};
		const now = new Date(),
			start = new Date(data.voting.openAt),
			end = new Date(data.voting.closeAt);
		if (now >= start && now <= end)
			return {
				key: 'open',
				label: 'Voting sedang dibuka',
				description: 'Pemilih saat ini dapat memberikan suara.',
				badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
				dot: 'bg-emerald-300'
			};
		if (now < start)
			return {
				key: 'upcoming',
				label: 'Voting belum dibuka',
				description: 'Voting akan dimulai sesuai jadwal.',
				badge: 'border-violet-300/20 bg-violet-300/10 text-violet-200',
				dot: 'bg-violet-300'
			};
		return {
			key: 'closed',
			label: 'Voting sudah ditutup',
			description: 'Periode voting telah berakhir.',
			badge: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
			dot: 'bg-rose-300'
		};
	}
	let votingStatus = $derived(getVotingStatus());
	function startEdit(c: Candidate) {
		editingCandidateId = c.id;
		deleteCandidateId = null;
		showCreateForm = false;
	}
	function cancelEdit() {
		editingCandidateId = null;
	}
	function startDelete(id: string) {
		deleteCandidateId = id;
		editingCandidateId = null;
	}
	function cancelDelete() {
		deleteCandidateId = null;
	}
	function initials(name: string | null | undefined) {
		return (name ?? 'A')
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.map((w: string) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<svelte:head
	><title>Admin Dashboard — SIKRABTEK 63</title><meta
		name="description"
		content="Dashboard admin untuk mengelola voting angkatan SIKRABTEK 63."
	/><meta name="theme-color" content="#242044" /></svelte:head
>
<div class="min-h-screen bg-[#242044] text-[#f4f2fb] selection:bg-violet-300/30">
	<header class="sticky top-0 z-40 border-b border-white/[0.08] bg-[#242044]/90 backdrop-blur-xl">
		<div
			class="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
		>
			<a href="/admin" class="flex items-center gap-3"
				><img
					src="/images/logo.jpg"
					alt="SIKRABTEK 63"
					class="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
				/><span
					><span class="block text-sm font-semibold">SIKRABTEK 63</span><span
						class="mt-0.5 block text-xs text-[#b3a9ce]">Administration</span
					></span
				></a
			>
			<div class="flex items-center gap-3">
				<div class="hidden text-right sm:block">
					<p class="text-sm font-medium">{data.user?.name ?? 'Administrator'}</p>
					<p class="mt-0.5 text-xs text-[#b3a9ce]">Administrator</p>
				</div>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/15 bg-violet-200/10 text-xs font-semibold text-violet-100"
				>
					{initials(data.user?.name)}
				</div>
				<form method="POST" action="/logout">
					<button
						class="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c7c4d5] hover:bg-white/[0.05]"
						type="submit">Keluar</button
					>
				</form>
			</div>
		</div>
	</header>
	<main class="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
		<section class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
			<div>
				<p class="mb-3 text-xs font-semibold tracking-[0.2em] text-[#a78bfa] uppercase">
					Control center
				</p>
				<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard voting</h1>
				<p class="mt-3 max-w-2xl text-sm leading-6 text-[#c4bddb]">
					Pantau partisipasi, atur periode pemilihan, dan kelola pasangan calon dari satu tempat.
				</p>
			</div>
			<a
				href="/admin/results"
				class="w-fit rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
				>Lihat hasil voting ↗</a
			>
		</section>
		{#if form?.success}<div
				role="status"
				class="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200"
			>
				{form.success}
			</div>{/if}{#if form?.error}<div
				role="alert"
				class="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200"
			>
				{form.error}
			</div>{/if}
		<section class="mb-8 grid gap-4 md:grid-cols-3" aria-label="Ringkasan voting">
			<article class="rounded-2xl border border-white/[0.08] bg-[#2d284b] p-5 sm:p-6">
				<p class="text-sm text-[#c4bddb]">Total pemilih</p>
				<p class="mt-5 text-4xl font-semibold tabular-nums">{data.totalVoters ?? 0}</p>
				<p class="mt-2 text-xs text-[#a99fc5]">Pemilih terdaftar di sistem</p>
			</article>
			<article class="rounded-2xl border border-white/[0.08] bg-[#2d284b] p-5 sm:p-6">
				<div class="flex justify-between">
					<p class="text-sm text-[#c4bddb]">Sudah memilih</p>
					<span class="rounded-lg bg-emerald-300/10 px-2.5 py-1.5 text-xs text-emerald-200"
						>{votingProgress}%</span
					>
				</div>
				<p class="mt-5 text-4xl font-semibold tabular-nums">{data.votedCount ?? 0}</p>
				<div
					class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
					role="progressbar"
					aria-label="Partisipasi voting"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={votingProgress}
				>
					<div class="h-full rounded-full bg-[#ffd83d]" style={`width:${votingProgress}%`}></div>
				</div>
				<p class="mt-2 text-xs text-[#a99fc5]">{data.notVotedCount ?? 0} pemilih belum vote</p>
			</article>
			<article class="rounded-2xl border border-white/[0.08] bg-[#2d284b] p-5 sm:p-6">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<p class="text-sm text-[#c4bddb]">Status voting</p>
					<span
						class={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${votingStatus.badge}`}
						><span class={`h-1.5 w-1.5 rounded-full ${votingStatus.dot}`}
						></span>{votingStatus.key === 'open'
							? 'LIVE'
							: votingStatus.key === 'upcoming'
								? 'UPCOMING'
								: votingStatus.key === 'closed'
									? 'CLOSED'
									: 'SETUP'}</span
					>
				</div>
				<p class="mt-5 text-xl font-semibold">{votingStatus.label}</p>
				<p class="mt-2 text-xs leading-5 text-[#a99fc5]">{votingStatus.description}</p>
			</article>
		</section>
		<section class="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#2d284b]">
			<div
				class="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-6"
			>
				<div>
					<h2 class="font-semibold">Daftar pemilih</h2>
					<p class="mt-1 text-sm text-[#b3a9ce]">Cari pemilih dan periksa status partisipasinya.</p>
				</div>
				<div class="flex gap-2 text-xs">
					<span class="rounded-lg bg-emerald-300/10 px-3 py-2 text-emerald-200"
						>Sudah: {data.votedCount ?? 0}</span
					><span class="rounded-lg bg-rose-300/10 px-3 py-2 text-rose-200"
						>Belum: {data.notVotedCount ?? 0}</span
					>
				</div>
			</div>
			<div
				class="grid gap-3 border-b border-white/[0.07] p-4 sm:grid-cols-[minmax(0,1fr)_210px] sm:p-5"
			>
				<label
					><span class="mb-2 block text-xs text-[#c7c4d5]">Cari pemilih</span><input
						type="search"
						bind:value={voterSearch}
						placeholder="Nama, kelompok, atau ID/NIM..."
						class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none placeholder:text-[#8a7fa6] focus:border-[#a78bfa]"
					/></label
				><label
					><span class="mb-2 block text-xs text-[#c7c4d5]">Status partisipasi</span><select
						bind:value={voterFilter}
						class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]"
						><option value="all">Semua pemilih</option><option value="voted">Sudah vote</option
						><option value="not-voted">Belum vote</option></select
					></label
				>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[700px] text-left text-sm">
					<thead class="bg-white/[0.025] text-xs text-[#a99fc5]"
						><tr
							><th class="px-5 py-3.5 font-medium sm:px-6">Nama pemilih</th><th
								class="px-5 py-3.5 font-medium">Kelompok</th
							><th class="px-5 py-3.5 font-medium">ID / NIM</th><th class="px-5 py-3.5 font-medium"
								>Status</th
							></tr
						></thead
					><tbody class="divide-y divide-white/[0.06]"
						>{#each filteredVoters as voter (voter.id)}<tr class="hover:bg-white/[0.025]"
								><td class="px-5 py-4 font-medium sm:px-6">{voter.name ?? 'Nama belum diatur'}</td
								><td class="px-5 py-4"
									>{#if voter.kelompok}<span
											class="rounded-md bg-violet-200/[0.07] px-2.5 py-1 text-xs text-violet-100"
											>{voter.kelompok}</span
										>{:else}<span class="text-xs text-[#9b91b8]">Belum diatur</span>{/if}</td
								><td class="px-5 py-4 font-mono text-xs text-[#c4bddb]">{voter.nim ?? voter.id}</td
								><td class="px-5 py-4"
									>{#if voter.hasVoted}<span class="text-xs font-medium text-emerald-200"
											>● Sudah vote</span
										>{:else}<span class="text-xs font-medium text-rose-200">● Belum vote</span
										>{/if}</td
								></tr
							>{:else}<tr
								><td colspan="4" class="px-5 py-12 text-center text-sm text-[#b3a9ce]"
									>{#if data.voters?.length}Tidak ada pemilih yang cocok dengan pencarian.{:else}Belum
										ada data pemilih.{/if}</td
								></tr
							>{/each}</tbody
					>
				</table>
			</div>
			<div class="border-t border-white/[0.07] px-5 py-3.5 text-xs text-[#a99fc5]">
				Menampilkan <span class="text-[#d7d4e3]">{filteredVoters.length}</span> dari {data.voters
					?.length ?? 0} pemilih
			</div>
		</section>
		<section class="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#2d284b]">
			<div class="border-b border-white/[0.07] px-5 py-5 sm:px-6">
				<h2 class="font-semibold">Pengaturan voting</h2>
				<p class="mt-1 text-sm text-[#b3a9ce]">Tentukan waktu mulai dan berakhirnya pemilihan.</p>
			</div>
			<form method="POST" action="?/updateVoting" class="p-5 sm:p-6">
				<div class="grid gap-5 md:grid-cols-2">
					<label
						><span class="mb-2 block text-sm font-medium">Voting dibuka</span><input
							id="openAt"
							name="openAt"
							type="datetime-local"
							value={formatDateTimeLocal(data.voting.openAt)}
							class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]"
						/><span class="mt-2 block text-xs text-[#a99fc5]"
							>Pemilih dapat memberikan suara mulai waktu ini.</span
						></label
					><label
						><span class="mb-2 block text-sm font-medium">Voting ditutup</span><input
							id="closeAt"
							name="closeAt"
							type="datetime-local"
							value={formatDateTimeLocal(data.voting.closeAt)}
							class="w-full rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm outline-none focus:border-[#a78bfa]"
						/><span class="mt-2 block text-xs text-[#a99fc5]"
							>Setelah waktu ini, voting berakhir.</span
						></label
					>
				</div>
				{#if data.voting.openAt && data.voting.closeAt}<div
						class="mt-5 rounded-xl border border-white/[0.07] bg-[#242044] p-4"
					>
						<p class="text-xs text-[#a99fc5]">Jadwal saat ini</p>
						<p class="mt-2 text-sm text-[#d7d4e3]">
							{formatDate(data.voting.openAt)} → {formatDate(data.voting.closeAt)}
						</p>
					</div>{/if}
				<div class="mt-5 flex justify-end">
					<button
						type="submit"
						class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
						>Simpan jadwal</button
					>
				</div>
			</form>
		</section>
		<section class="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#2d284b]">
			<div
				class="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-6"
			>
				<div>
					<h2 class="font-semibold">Pasangan calon</h2>
					<p class="mt-1 text-sm text-[#b3a9ce]">
						Kelola identitas, foto, visi, dan misi setiap pasangan.
					</p>
				</div>
				<button
					type="button"
					onclick={() => {
						showCreateForm = !showCreateForm;
						editingCandidateId = null;
						deleteCandidateId = null;
					}}
					class="w-fit rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
					>{showCreateForm ? 'Tutup formulir' : '+ Tambah pasangan'}</button
				>
			</div>
			{#if showCreateForm}<div class="border-b border-white/[0.07] bg-[#343052] p-5 sm:p-6">
					<h3 class="mb-4 font-semibold">Tambah pasangan calon</h3>
					<form method="POST" action="?/createCandidate" class="space-y-5">
						<div class="grid gap-4 lg:grid-cols-2">
							<div class="rounded-xl border border-white/[0.07] p-4">
								<h4 class="mb-4 text-sm font-semibold text-violet-100">Calon ketua</h4>
								<label class="mb-4 block"
									><span class="mb-2 block text-xs text-[#c4bddb]">Nama</span><input
										name="ketuaName"
										required
										placeholder="Nama lengkap ketua"
										class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm outline-none focus:border-[#a78bfa]"
									/></label
								><label class="block"
									><span class="mb-2 block text-xs text-[#c4bddb]">URL foto</span><input
										name="ketuaPhotoUrl"
										type="url"
										placeholder="https://..."
										class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm outline-none focus:border-[#a78bfa]"
									/></label
								>
							</div>
							<div class="rounded-xl border border-white/[0.07] p-4">
								<h4 class="mb-4 text-sm font-semibold text-violet-100">Calon wakil</h4>
								<label class="mb-4 block"
									><span class="mb-2 block text-xs text-[#c4bddb]">Nama</span><input
										name="wakilName"
										required
										placeholder="Nama lengkap wakil"
										class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm outline-none focus:border-[#a78bfa]"
									/></label
								><label class="block"
									><span class="mb-2 block text-xs text-[#c4bddb]">URL foto</span><input
										name="wakilPhotoUrl"
										type="url"
										placeholder="https://..."
										class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm outline-none focus:border-[#a78bfa]"
									/></label
								>
							</div>
						</div>
						<div class="grid gap-4 lg:grid-cols-2">
							<label
								><span class="mb-2 block text-sm font-medium">Visi</span><textarea
									name="vision"
									required
									rows="5"
									placeholder="Tuliskan visi pasangan calon..."
									class="w-full resize-y rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#a78bfa]"
								></textarea></label
							><label
								><span class="mb-2 block text-sm font-medium">Misi</span><textarea
									name="mission"
									required
									rows="5"
									placeholder="Tuliskan misi pasangan calon..."
									class="w-full resize-y rounded-xl border border-white/10 bg-[#242044] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#a78bfa]"
								></textarea></label
							>
						</div>
						<div class="flex justify-end">
							<button
								type="submit"
								class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
								>Simpan pasangan</button
							>
						</div>
					</form>
				</div>{/if}
			{#if data.candidates?.length}<div class="divide-y divide-white/[0.07]">
					{#each data.candidates as candidate, index (candidate.id)}<article class="p-5 sm:p-6">
							{#if editingCandidateId === candidate.id}<form
									method="POST"
									action="?/updateCandidate"
									class="space-y-5"
								>
									<input type="hidden" name="id" value={candidate.id} />
									<div class="flex justify-between gap-3">
										<h3 class="font-semibold">Edit pasangan #{index + 1}</h3>
										<button type="button" onclick={cancelEdit} class="text-sm text-[#c7c4d5]"
											>Batal</button
										>
									</div>
									<div class="grid gap-4 lg:grid-cols-2">
										<div class="space-y-3 rounded-xl border border-white/[0.07] p-4">
											<h4 class="text-sm font-semibold text-violet-100">Ketua</h4>
											<input
												name="ketuaName"
												required
												value={candidate.ketuaName}
												class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm"
											/><input
												name="ketuaPhotoUrl"
												type="url"
												value={candidate.ketuaPhotoUrl ?? ''}
												placeholder="URL foto ketua"
												class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm"
											/>
										</div>
										<div class="space-y-3 rounded-xl border border-white/[0.07] p-4">
											<h4 class="text-sm font-semibold text-violet-100">Wakil</h4>
											<input
												name="wakilName"
												required
												value={candidate.wakilName}
												class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm"
											/><input
												name="wakilPhotoUrl"
												type="url"
												value={candidate.wakilPhotoUrl ?? ''}
												placeholder="URL foto wakil"
												class="w-full rounded-lg border border-white/10 bg-[#242044] px-3 py-2.5 text-sm"
											/>
										</div>
									</div>
									<div class="grid gap-4 md:grid-cols-2">
										<label
											><span class="mb-2 block text-sm">Visi</span><textarea
												name="vision"
												required
												rows="5"
												class="w-full rounded-xl border border-white/10 bg-[#242044] p-3 text-sm"
												>{candidate.vision ?? ''}</textarea
											></label
										><label
											><span class="mb-2 block text-sm">Misi</span><textarea
												name="mission"
												required
												rows="5"
												class="w-full rounded-xl border border-white/10 bg-[#242044] p-3 text-sm"
												>{candidate.mission ?? ''}</textarea
											></label
										>
									</div>
									<div class="flex justify-end">
										<button
											type="submit"
											class="rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
											>Simpan perubahan</button
										>
									</div>
								</form>{:else}<div class="space-y-5">
									<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
										<div class="flex items-center gap-3">
											<span
												class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-200/[0.07] text-sm font-semibold text-violet-100"
												>{String(index + 1).padStart(2, '0')}</span
											>
											<div>
												<p class="text-xs text-[#a99fc5]">Pasangan calon</p>
												<h3 class="mt-1 text-lg font-semibold">
													{candidate.ketuaName} <span class="text-[#a99fc5]">&</span>
													{candidate.wakilName}
												</h3>
											</div>
										</div>
										<div class="flex gap-2">
											<button
												type="button"
												onclick={() => startEdit(candidate)}
												class="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.05]"
												>Edit</button
											><button
												type="button"
												onclick={() => startDelete(candidate.id)}
												class="rounded-lg border border-rose-300/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-300/10"
												>Hapus</button
											>
										</div>
									</div>
									{#if deleteCandidateId === candidate.id}<div
											class="flex flex-col justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-4 sm:flex-row sm:items-center"
										>
											<p class="text-sm">Yakin ingin menghapus pasangan ini?</p>
											<div class="flex gap-2">
												<button
													type="button"
													onclick={cancelDelete}
													class="rounded-lg border border-white/10 px-3 py-2 text-sm">Batal</button
												>
												<form method="POST" action="?/deleteCandidate">
													<input type="hidden" name="id" value={candidate.id} /><button
														type="submit"
														class="rounded-lg bg-rose-300 px-3 py-2 text-sm font-semibold text-[#291319]"
														>Ya, hapus</button
													>
												</form>
											</div>
										</div>{/if}
									<div class="grid gap-3 md:grid-cols-2">
										{#each [{ name: candidate.ketuaName, photo: candidate.ketuaPhotoUrl, role: 'Ketua' }, { name: candidate.wakilName, photo: candidate.wakilPhotoUrl, role: 'Wakil ketua' }] as person (person.role)}<div
												class="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#343052] p-3.5"
											>
												{#if person.photo}<img
														src={person.photo}
														alt={person.name}
														class="h-16 w-16 rounded-lg object-cover"
													/>{:else}<div
														class="flex h-16 w-16 items-center justify-center rounded-lg bg-violet-200/10 font-semibold text-violet-100"
													>
														{initials(person.name)}
													</div>{/if}
												<div class="min-w-0">
													<p class="text-xs text-[#a99fc5]">{person.role}</p>
													<p class="mt-1 truncate text-sm font-medium">{person.name}</p>
												</div>
											</div>{/each}
									</div>
									<div class="grid gap-4 md:grid-cols-2">
										<div class="rounded-xl border border-white/[0.07] p-4">
											<p
												class="mb-2 text-xs font-semibold tracking-[0.12em] text-violet-200 uppercase"
											>
												Visi
											</p>
											<p class="text-sm leading-6 whitespace-pre-line text-[#c7c4d5]">
												{candidate.vision || 'Belum ada visi yang diisi.'}
											</p>
										</div>
										<div class="rounded-xl border border-white/[0.07] p-4">
											<p
												class="mb-2 text-xs font-semibold tracking-[0.12em] text-violet-200 uppercase"
											>
												Misi
											</p>
											<p class="text-sm leading-6 whitespace-pre-line text-[#c7c4d5]">
												{candidate.mission || 'Belum ada misi yang diisi.'}
											</p>
										</div>
									</div>
								</div>{/if}
						</article>{/each}
				</div>{:else}<div class="px-6 py-16 text-center">
					<div
						class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-xl text-violet-100"
					>
						+
					</div>
					<h3 class="mt-4 font-semibold">Belum ada pasangan calon</h3>
					<p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#b3a9ce]">
						Tambahkan pasangan calon untuk menyiapkan halaman pemilihan.
					</p>
					<button
						type="button"
						onclick={() => {
							showCreateForm = true;
							editingCandidateId = null;
							deleteCandidateId = null;
						}}
						class="mt-5 rounded-xl bg-[#a78bfa] px-4 py-3 text-sm font-semibold text-[#242044] hover:bg-white"
						>Tambah pasangan</button
					>
				</div>{/if}
		</section>
		<footer
			class="flex flex-col items-center justify-between gap-2 py-8 text-center sm:flex-row sm:text-left"
		>
			<p class="text-xs text-[#9b91b8]">© {new Date().getFullYear()} SIKRABTEK 63</p>
			<p class="text-xs text-[#9b91b8]">Admin dashboard · TITIK NOL</p>
		</footer>
	</main>
</div>
