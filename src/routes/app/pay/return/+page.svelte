<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	const FINAL = ['confirmed', 'canceled', 'chargebacked'];
	// svelte-ignore state_referenced_locally
	let status = $state(data.payment?.status ?? 'unknown');

	onMount(() => {
		if (!data.payment || FINAL.includes(status)) return;

		let tries = 0;
		const iv = setInterval(async () => {
			tries++;
			try {
				const res = await fetch(`/api/payments/${data.payment!.id}/status`);
				if (res.ok) status = (await res.json()).status;
			} catch {
				/* сеть моргнула — попробуем снова */
			}
			if (FINAL.includes(status) || tries >= 40) clearInterval(iv); // ~2 минуты
		}, 3000);

		return () => clearInterval(iv);
	});

	const purposeLabel = $derived(
		data.payment?.purpose === 'revival' ? 'воскрешение персонажа' : 'расширение инвентаря'
	);
</script>

<svelte:head>
	<title>Оплата — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="mx-auto max-w-md px-6 py-10 text-center sm:px-10">
	{#if !data.payment}
		<div class="mb-3 text-4xl" aria-hidden="true">❓</div>
		<h1 class="mb-3 text-xl">Платёж не найден</h1>
		<a href="/app/game" class="pixel-btn pixel-btn--outline pixel-btn--md mt-4 inline-block"
			>В игру</a
		>
	{:else if status === 'confirmed'}
		<div class="mb-3 text-4xl" aria-hidden="true">✅</div>
		<h1 class="text-amber mb-3 text-xl sm:text-2xl">Оплата прошла!</h1>
		<p class="text-muted mb-8 text-sm">Выдано: {purposeLabel}. Состояние уже обновлено.</p>
		<div class="flex justify-center gap-3">
			<a href="/app/game" class="pixel-btn pixel-btn--solid pixel-btn--md">В игру</a>
			{#if data.payment.purpose === 'inventory'}
				<a href="/app/inventory" class="pixel-btn pixel-btn--outline pixel-btn--md">Инвентарь</a>
			{/if}
		</div>
	{:else if status === 'canceled' || status === 'chargebacked'}
		<div class="mb-3 text-4xl" aria-hidden="true">⚠️</div>
		<h1 class="text-danger mb-3 text-xl">Оплата не прошла</h1>
		<p class="text-muted mb-8 text-sm">Платёж не был завершён. Можно попробовать снова.</p>
		<a href="/app/game" class="pixel-btn pixel-btn--outline pixel-btn--md inline-block">В игру</a>
	{:else}
		<div class="mb-3 text-4xl" aria-hidden="true">⏳</div>
		<h1 class="mb-3 text-xl">Проверяем оплату…</h1>
		<p class="text-muted text-sm">
			Это занимает несколько секунд. Не закрывай страницу — как только платёж подтвердится, покупка
			применится автоматически.
		</p>
	{/if}
</Card>
