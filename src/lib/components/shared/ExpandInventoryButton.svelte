<script lang="ts">
	import { CURRENCY, getInventoryExpandPrice, MAX_INVENTORY_SIZE } from '$lib/constants/pricing';

	let {
		currentSize,
		class: className = ''
	}: { currentSize: number; class?: string } = $props();

	// Цена следующего расширения (null — достигнут максимум).
	const price = $derived(getInventoryExpandPrice(currentSize));
</script>

{#if price !== null}
	<div class="border-cyan flex items-center justify-between gap-3 border-2 px-3 py-2 {className}">
		<span class="text-fg text-sm">
			🎒 Расширить инвентарь (+1 клетка)
			<span class="text-muted whitespace-nowrap">сейчас {currentSize}/{MAX_INVENTORY_SIZE}</span>
		</span>
		<a
			href="/app/pay?for=inventory"
			class="pixel-btn pixel-btn--solid pixel-btn--sm whitespace-nowrap"
		>
			{price} {CURRENCY}
		</a>
	</div>
{/if}
