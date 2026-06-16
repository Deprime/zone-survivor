<script lang="ts">
	import { PUBLIC_TELEGRAM_BOT_USERNAME } from '$env/static/public';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const botUrl = `https://t.me/${PUBLIC_TELEGRAM_BOT_USERNAME}?start=connect`;

	const benefits = [
		{ icon: '🟢', text: 'Напомнит, когда снова активна кнопка «Я жив» — не пропустишь ход.' },
		{ icon: '⚠️', text: 'Предупредит, когда до гибели остаётся мало времени.' },
		{ icon: '🧟', text: 'Сообщит об укусе зомби, чтобы ты успел найти антидот.' },
		{ icon: '☠️', text: 'Уведомит о гибели и окне для воскрешения.' }
	];
</script>

<Card element="section" class="px-5 py-6 sm:px-8">
	<div class="mb-2 flex items-center gap-2">
		<span class="text-2xl" aria-hidden="true">🤖</span>
		<h2 class="text-base sm:text-lg">Подключи бота</h2>
	</div>
	<p class="text-muted mb-4 text-sm">
		Бот — твой ассистент по выживанию. Он бережёт персонажа, пока ты занят делами:
	</p>

	<ul class="mb-6 space-y-2 text-sm">
		{#each benefits as b (b.icon)}
			<li class="text-fg flex gap-2">
				<span aria-hidden="true">{b.icon}</span>
				<span>{b.text}</span>
			</li>
		{/each}
	</ul>

	<Button href={botUrl} variant="solid" size="md" target="_blank" rel="noopener noreferrer">
		Подключить бота
	</Button>
	<p class="text-muted mt-3 text-xs">
		Достаточно нажать «Start» в Telegram — после этого уведомления начнут приходить.
	</p>
</Card>
