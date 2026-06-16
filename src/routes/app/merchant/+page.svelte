<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import ExpandInventoryButton from '$lib/components/shared/ExpandInventoryButton.svelte';
	import ItemIcon from '$lib/components/shared/ItemIcon.svelte';
	import { MAX_INVENTORY_SIZE } from '$lib/constants/pricing';

	let { data, form } = $props();

	const ITEM_NAME: Record<string, string> = {
		ammo: 'Патрон',
		antidote: 'Антидот',
		loot: 'Лут'
	};

	const reasonText: Record<string, string> = {
		closed: 'Лавка закрыта.',
		dead: 'Персонаж мёртв.',
		no_tokens: 'Недостаточно токенов.',
		no_space: 'Инвентарь полон.',
		no_item: 'Нечего продавать.'
	};
</script>

<svelte:head>
	<title>Торговец — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-8 sm:px-10">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-xl sm:text-2xl">Лавка торговца</h1>
		<span class="text-cyan text-sm tabular-nums" title="Токены">🪙 {data.merchant.tokens}</span>
	</div>

	{#if !data.merchant.open}
		<p class="border-border text-muted mb-6 border-2 px-3 py-2 text-sm">
			Торговец работает только в конце недели (сб–вс). Загляни позже.
		</p>
	{/if}

	{#if form && 'reason' in form}
		<p class="text-danger mb-4 text-xs">{reasonText[form.reason] ?? 'Не удалось.'}</p>
	{/if}

	<!-- ПОКУПКА -->
	<h2 class="text-amber mb-3 text-sm uppercase">Купить</h2>
	<div class="mb-8 grid gap-3 sm:grid-cols-2">
		{#each data.merchant.buy as item (item.id)}
			<div class="border-border flex items-center justify-between border-2 px-3 py-2">
				<span class="text-fg flex items-center gap-2 text-sm">
					<ItemIcon itemKey={item.id} size={28} />
					{ITEM_NAME[item.id] ?? item.id}
				</span>
				<form method="POST" action="?/buy" use:enhance>
					<input type="hidden" name="itemId" value={item.id} />
					<button
						type="submit"
						disabled={!data.merchant.open || data.merchant.tokens < item.price}
						class="pixel-btn pixel-btn--outline pixel-btn--sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						{item.price} 🪙
					</button>
				</form>
			</div>
		{/each}
	</div>

	<!-- ПРОДАЖА -->
	<h2 class="text-amber mb-3 text-sm uppercase">Продать</h2>
	<div class="mb-8 grid gap-3 sm:grid-cols-2">
		{#each data.merchant.sell as item (item.id)}
			<div class="border-border flex items-center justify-between border-2 px-3 py-2">
				<span class="text-fg flex items-center gap-2 text-sm">
					<ItemIcon itemKey={item.id} size={28} />
					{ITEM_NAME[item.id] ?? item.id}
					<span class="text-muted">× {item.count}</span>
				</span>
				<form method="POST" action="?/sell" use:enhance>
					<input type="hidden" name="itemId" value={item.id} />
					<button
						type="submit"
						disabled={!data.merchant.open || item.count < 1}
						class="pixel-btn pixel-btn--outline pixel-btn--sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						+{item.price} 🪙
					</button>
				</form>
			</div>
		{/each}
	</div>

	<!-- ПЛАТНАЯ УСЛУГА -->
	<h2 class="text-amber mb-3 text-sm uppercase">Платные услуги</h2>
	{#if data.merchant.inventorySize < MAX_INVENTORY_SIZE}
		<ExpandInventoryButton currentSize={data.merchant.inventorySize} />
	{:else}
		<p class="border-border text-muted border-2 px-3 py-2 text-sm">
			🎒 Инвентарь расширен до максимума ({MAX_INVENTORY_SIZE} клеток).
		</p>
	{/if}
</Card>
