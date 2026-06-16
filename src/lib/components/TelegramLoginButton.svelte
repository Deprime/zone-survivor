<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_TELEGRAM_BOT_USERNAME, PUBLIC_SITE_URL } from '$env/static/public';

	let container: HTMLDivElement;

	onMount(() => {
		// Telegram Login Widget подключается отдельным скриптом с data-атрибутами.
		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.async = true;
		script.setAttribute('data-telegram-login', PUBLIC_TELEGRAM_BOT_USERNAME);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-radius', '4');
		script.setAttribute('data-auth-url', `${PUBLIC_SITE_URL}/auth/telegram/callback`);
		script.setAttribute('data-request-access', 'write');
		container.appendChild(script);
	});
</script>

<div bind:this={container} class="flex justify-center"></div>
