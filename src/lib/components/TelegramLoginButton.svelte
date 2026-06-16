<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	let container: HTMLDivElement;

	// Username бота без ведущего @ и пробелов (частая причина «Username invalid»).
	const botUsername = (env.PUBLIC_TELEGRAM_BOT_USERNAME ?? '').trim().replace(/^@/, '');
	const siteUrl = (env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

	onMount(() => {
		if (!botUsername) return;

		// Telegram Login Widget подключается отдельным скриптом с data-атрибутами.
		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.async = true;
		script.setAttribute('data-telegram-login', botUsername);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-radius', '4');
		script.setAttribute('data-auth-url', `${siteUrl}/auth/telegram/callback`);
		script.setAttribute('data-request-access', 'write');
		container.appendChild(script);
	});
</script>

<div bind:this={container} class="flex justify-center">
	{#if !botUsername}
		<p class="text-danger text-xs">
			Бот не настроен: задайте переменную <code>PUBLIC_TELEGRAM_BOT_USERNAME</code>.
		</p>
	{/if}
</div>
