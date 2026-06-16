<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	// Цвет акцента слева по типу события.
	const accent: Record<string, string> = {
		game: 'border-l-cyan',
		merchant: 'border-l-amber',
		revival: 'border-l-cyan',
		death: 'border-l-danger'
	};

	const fmt = (d: Date | string) => {
		const date = d instanceof Date ? d : new Date(d);
		return new Intl.DateTimeFormat('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};
</script>

<svelte:head>
	<title>Журнал — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-6 sm:px-8">
	<h1 class="mb-1 text-xl sm:text-2xl">Журнал событий</h1>
	<p class="text-muted mb-6 text-xs">Последние 100 действий и событий твоего персонажа.</p>

	{#if data.events.length === 0}
		<p class="text-muted text-sm">Пока ничего не произошло. Нажми «Я жив» и начни ход.</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.events as e (e.createdAt + e.message)}
				<li
					class="border-border flex items-start gap-3 border border-l-4 px-3 py-2 text-sm
						{accent[e.type] ?? 'border-l-border'}"
				>
					<span class="text-muted shrink-0 text-xs tabular-nums">{fmt(e.createdAt)}</span>
					<span class="text-fg">{e.message}</span>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
