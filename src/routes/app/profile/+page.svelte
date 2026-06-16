<script lang="ts">
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import Card from '$lib/components/ui/Card.svelte';
	import ConnectBot from '$lib/components/ConnectBot.svelte';

	let { data } = $props();

	const refLink = $derived(`${PUBLIC_SITE_URL}?ref=${data.user.uuid}`);
</script>

<svelte:head>
	<title>Профиль — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-8 sm:px-10">
	<h1 class="mb-6 text-xl sm:text-2xl">Профиль</h1>

	<dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
		<div class="flex justify-between border-border border-b pb-2">
			<dt class="text-muted uppercase">Имя</dt>
			<dd class="text-fg">{data.user.username ?? '—'}</dd>
		</div>
		<div class="flex justify-between border-border border-b pb-2">
			<dt class="text-muted uppercase">Токены</dt>
			<dd class="text-cyan font-bold">{data.user.tokens}</dd>
		</div>
		<div class="flex justify-between border-border border-b pb-2">
			<dt class="text-muted uppercase">Инвентарь</dt>
			<dd class="text-fg">{data.user.inventorySize} клеток</dd>
		</div>
		<div class="flex justify-between border-border border-b pb-2">
			<dt class="text-muted uppercase">Статус</dt>
			<dd class="text-fg">{data.user.diedAt === null ? 'жив' : 'погиб'}</dd>
		</div>
	</dl>

	<div class="mt-8">
		<h2 class="text-amber mb-2 text-sm uppercase">Реферальная ссылка</h2>
		<p class="text-muted mb-3 text-xs">
			Приглашай друзей — за каждого +1 токен, за 10 друзей «Крест воскрешения».
		</p>
		<code
			class="text-cyan border-border bg-bg block overflow-x-auto border-2 px-3 py-2 text-xs"
		>
			{refLink}
		</code>
	</div>
</Card>

<div class="mt-6">
	<ConnectBot />
</div>
