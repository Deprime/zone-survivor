<script lang="ts">
	import { ITEM_LABEL } from '$lib/game-messages';

	let {
		itemKey,
		size = 32,
		alt,
		class: className = ''
	}: { itemKey: string; size?: number; alt?: string; class?: string } = $props();

	// Ключи, для которых есть картинка в /static/items. Остальные — заглушка «?».
	const KNOWN = new Set(['ammo', 'antidote', 'loot', 'resurrection_cross']);
	const src = $derived(`/items/${KNOWN.has(itemKey) ? itemKey : '_unknown'}.png`);
	const label = $derived(alt ?? ITEM_LABEL[itemKey] ?? itemKey);
</script>

<img
	{src}
	alt={label}
	title={label}
	width={size}
	height={size}
	loading="lazy"
	class="inline-block object-contain {className}"
	style="image-rendering: pixelated;"
/>
