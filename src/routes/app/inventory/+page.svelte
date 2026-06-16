<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	// Презентационные иконки (до подключения локализации).
	const ICONS: Record<string, string> = {
		ammo: '🔫',
		antidote: '💉',
		loot: '📦',
		resurrection_cross: '✝️'
	};

	// Клеток не меньше размера инвентаря и не меньше числа предметов.
	const totalCells = $derived(Math.max(data.user.inventorySize, data.items.length));
	const cells = $derived(
		Array.from({ length: totalCells }, (_, i) => data.items[i] ?? null)
	);
</script>

<svelte:head>
	<title>Инвентарь — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-8 sm:px-10">
	<h1 class="mb-2 text-xl sm:text-2xl">Инвентарь</h1>
	<p class="text-muted mb-6 text-sm">
		Занято {data.items.length} из {data.user.inventorySize} клеток. Токены не занимают место.
	</p>

	<div class="grid grid-cols-4 gap-3 sm:grid-cols-6">
		{#each cells as item, i (i)}
			<div
				class="border-border bg-bg flex aspect-square items-center justify-center border-2 text-2xl
					{item ? 'text-fg' : 'text-muted'}"
				title={item?.itemKey ?? 'Пустая клетка'}
				aria-label={item?.itemKey ?? 'Пустая клетка'}
			>
				{item ? (ICONS[item.itemKey] ?? '❔') : '·'}
			</div>
		{/each}
	</div>

	{#if data.items.some((it) => it.itemKey === 'resurrection_cross')}
		<p class="text-amber mt-6 text-xs">
			✝️ Крест воскрешения — уникальный предмет за 10 рефералов: один раз воскрешает после гибели.
		</p>
	{/if}
</Card>
