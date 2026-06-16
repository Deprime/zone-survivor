<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import ExpandInventoryButton from '$lib/components/shared/ExpandInventoryButton.svelte';
	import ItemIcon from '$lib/components/shared/ItemIcon.svelte';

	let { data } = $props();

	// Клеток не меньше размера инвентаря и не меньше числа предметов.
	const totalCells = $derived(Math.max(data.user.inventorySize, data.items.length));
	const cells = $derived(Array.from({ length: totalCells }, (_, i) => data.items[i] ?? null));
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
				class="border-border bg-bg text-muted flex aspect-square items-center justify-center border-2 text-2xl"
				title={item?.itemKey ?? 'Пустая клетка'}
				aria-label={item?.itemKey ?? 'Пустая клетка'}
			>
				{#if item}
					<ItemIcon itemKey={item.itemKey} size={48} class="h-3/4 w-3/4" />
				{:else}
					·
				{/if}
			</div>
		{/each}
	</div>

	{#if data.items.some((it) => it.itemKey === 'resurrection_cross')}
		<p class="text-amber mt-6 text-xs">
			✝️ Крест воскрешения — уникальный предмет за 10 рефералов: один раз воскрешает после гибели.
		</p>
	{/if}

	<!-- Кнопка расширения появляется, только если есть доступные расширения. -->
	<ExpandInventoryButton currentSize={data.user.inventorySize} class="mt-6" />
</Card>
