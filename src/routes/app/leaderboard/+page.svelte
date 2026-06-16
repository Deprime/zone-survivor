<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	// Живое время для отсчётов.
	let nowMs = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (nowMs = Date.now()), 1000);
		return () => clearInterval(id);
	});
	const nowSec = $derived(Math.floor(nowMs / 1000));

	const nextUpdateAt = $derived(data.leaderboard.generatedAt + data.ttl);
	const toUpdate = $derived(Math.max(0, nextUpdateAt - nowSec));
	const toSeasonEnd = $derived(Math.max(0, data.season.endsAt - nowSec));

	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
	const fmtLong = (s: number) => {
		const d = Math.floor(s / 86400);
		const h = Math.floor((s % 86400) / 3600);
		const m = Math.floor((s % 3600) / 60);
		return `${d}д ${pad(h)}:${pad(m)}:${pad(s % 60)}`;
	};

	const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '');
</script>

<svelte:head>
	<title>Лидерчарт — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-8 sm:px-10">
	<div class="mb-1 flex items-center justify-between">
		<h1 class="text-xl sm:text-2xl">Сезон #{data.season.id}</h1>
		<span class="text-muted text-xs">
			обновление <span class="text-cyan tabular-nums">{fmt(toUpdate)}</span>
		</span>
	</div>
	<p class="text-muted mb-6 text-xs">
		До конца сезона: <span class="text-amber tabular-nums">{fmtLong(toSeasonEnd)}</span>. Призы —
		топ-{data.prizeTop} выживших.
	</p>

	{#if data.leaderboard.entries.length === 0}
		<p class="text-muted text-sm">Пока никого живого в рейтинге.</p>
	{:else}
		<ol class="space-y-2">
			{#each data.leaderboard.entries as entry (entry.rank)}
				<li
					class="flex items-center justify-between border-2 px-3 py-2 text-sm
						{entry.rank <= data.prizeTop ? 'border-amber' : 'border-border'}"
				>
					<span class="flex items-center gap-2">
						<span class="text-muted w-6 text-right tabular-nums">{entry.rank}</span>
						<span aria-hidden="true">{medal(entry.rank)}</span>
						<span class="text-fg">{entry.name}</span>
					</span>
					<span class="text-cyan font-bold tabular-nums">{entry.tokens} 🪙</span>
				</li>
			{/each}
		</ol>
	{/if}

	{#if data.winners}
		<h2 class="text-amber mt-10 mb-3 text-sm uppercase">
			Победители сезона #{data.winners.seasonId}
		</h2>
		<ol class="space-y-2">
			{#each data.winners.winners as w (w.rank)}
				<li class="border-border flex items-center justify-between border-2 px-3 py-2 text-sm">
					<span class="flex items-center gap-2">
						<span class="text-muted w-6 text-right tabular-nums">{w.rank}</span>
						<span aria-hidden="true">{medal(w.rank)}</span>
						<span class="text-fg">{w.name}</span>
					</span>
					<span class="text-cyan text-xs">🎁 {w.prize}</span>
				</li>
			{/each}
		</ol>
	{/if}
</Card>
