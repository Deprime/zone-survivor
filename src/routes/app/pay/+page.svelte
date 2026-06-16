<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { CURRENCY } from '$lib/constants/pricing';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Оплата — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="mx-auto max-w-md px-6 py-10 text-center sm:px-10">
	<div class="mb-3 text-4xl" aria-hidden="true">💳</div>
	<h1 class="mb-4 text-xl sm:text-2xl">Оплата</h1>

	{#if form?.error}
		<p class="text-danger mb-4 text-xs">{form.error}</p>
	{/if}

	{#if !data.purpose || !data.quote}
		<p class="text-muted mb-6 text-sm">Неизвестная покупка.</p>
		<a href="/app/game" class="pixel-btn pixel-btn--outline pixel-btn--md inline-block">В игру</a>
	{:else if !data.quote.eligible}
		<p class="text-muted mb-6 text-sm">{data.quote.reason}</p>
		<a href="/app/game" class="pixel-btn pixel-btn--outline pixel-btn--md inline-block">В игру</a>
	{:else}
		<p class="text-fg mb-1 text-sm">{data.quote.label}</p>
		<p class="text-amber mb-6 text-2xl font-extrabold">{data.quote.amount} {CURRENCY}</p>
		<form method="POST" action="?/start">
			<input type="hidden" name="purpose" value={data.purpose} />
			<button type="submit" class="pixel-btn pixel-btn--solid pixel-btn--lg">
				Оплатить через СБП
			</button>
		</form>
		<p class="text-muted mt-4 text-xs">
			Оплата по QR через СБП. После оплаты ты вернёшься на сайт, и мы проверим статус.
		</p>
	{/if}
</Card>
