<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import TelegramLoginButton from '$lib/components/TelegramLoginButton.svelte';
</script>

<svelte:head>
	<title>Вход — ZombieLand survivor</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Card element="section" class="mx-auto max-w-md px-6 py-10 text-center sm:px-10">
	<div class="mb-3 text-4xl" aria-hidden="true">🧟</div>
	<h1 class="mb-3 text-xl sm:text-2xl">Вход в игру</h1>
	<p class="text-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
		Регистрация и вход — через Telegram. Нажми кнопку ниже и подтверди авторизацию в Telegram.
	</p>

	<TelegramLoginButton />

	<p class="text-muted mt-8 text-xs leading-relaxed">
		Продолжая, ты соглашаешься с <a href="/agreement">офертой</a> и <a href="/rules">правилами</a>.
	</p>
</Card>
