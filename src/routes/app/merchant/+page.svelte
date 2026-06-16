<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';

	let { data, form } = $props();

	const ITEM: Record<string, { icon: string; name: string }> = {
		ammo: { icon: '🔫', name: 'Патрон' },
		antidote: { icon: '💉', name: 'Антидот' },
		loot: { icon: '📦', name: 'Лут' }
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
				<span class="text-fg text-sm">
					<span aria-hidden="true">{ITEM[item.id]?.icon}</span>
					{ITEM[item.id]?.name ?? item.id}
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
				<span class="text-fg text-sm">
					<span aria-hidden="true">{ITEM[item.id]?.icon}</span>
					{ITEM[item.id]?.name ?? item.id}
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
	<div class="border-cyan flex items-center justify-between border-2 px-3 py-2">
		<span class="text-fg text-sm">
			🎒 Расширить инвентарь (+1 клетка)
			<span class="text-muted">сейчас {data.merchant.inventorySize}</span>
		</span>
		<a href="/app/pay?for=inventory" class="pixel-btn pixel-btn--solid pixel-btn--sm">Купить</a>
	</div>
</Card>
