<script lang="ts">
	import { page } from '$app/state';
	import { navLinks, siteName } from '$lib/constants/app';

	let { children, data } = $props();

	const year = new Date().getFullYear();

	let menuOpen = $state(false);

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	const authHref = $derived(data.user ? '/app/game' : '/login');
	const authLabel = $derived(data.user ? 'Кабинет' : 'Вход');
</script>

{#snippet navItem(href: string, label: string)}
	{@const active = isActive(href)}
	<li>
		<a
			{href}
			onclick={() => (menuOpen = false)}
			class="block border-2 px-3 py-2 uppercase no-underline transition-colors sm:py-1
				{active
				? 'border-amber bg-amber text-bg'
				: 'text-muted hover:border-border hover:text-fg border-transparent'}"
			aria-current={active ? 'page' : undefined}
		>
			{label}
		</a>
	</li>
{/snippet}

<div class="flex min-h-screen flex-col">
	<header class="border-border bg-bg/90 border-b-2 backdrop-blur">
		<nav class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-2">
			<a
				href="/"
				class="text-amber font-pixel text-xs font-extrabold tracking-widest uppercase no-underline sm:text-base"
			>
				&gt;{siteName}
			</a>

			<!-- desktop nav + auth -->
			<div class="hidden items-center gap-4 text-sm sm:flex">
				<ul class="flex sm:gap-4">
					{#each navLinks as link (link.href)}
						{@render navItem(link.href, link.label)}
					{/each}
				</ul>
				<a
					href={authHref}
					class="border-cyan text-cyan hover:bg-cyan hover:text-bg border-2 px-3 py-1 uppercase no-underline transition-colors"
				>
					{authLabel}
				</a>
			</div>

			<!-- mobile toggle -->
			<button
				type="button"
				onclick={() => (menuOpen = !menuOpen)}
				class="text-amber border-border flex items-center justify-center border-2 p-1 sm:hidden"
				aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					aria-hidden="true"
				>
					{#if menuOpen}
						<path d="M6 6 L18 18 M18 6 L6 18" />
					{:else}
						<path d="M3 6h18 M3 12h18 M3 18h18" />
					{/if}
				</svg>
			</button>
		</nav>

		<!-- mobile menu -->
		{#if menuOpen}
			<ul id="mobile-menu" class="flex flex-col gap-2 px-4 pb-4 text-sm sm:hidden">
				{#each navLinks as link (link.href)}
					{@render navItem(link.href, link.label)}
				{/each}
				<li>
					<a
						href={authHref}
						onclick={() => (menuOpen = false)}
						class="border-cyan text-cyan block border-2 px-3 py-2 uppercase no-underline"
					>
						{authLabel}
					</a>
				</li>
			</ul>
		{/if}
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
		{@render children()}
	</main>

	<footer class="border-border text-muted border-t-2 px-4 py-6 text-center text-xs">
		<p>
			© {year} {siteName}. Все права защищены.
		</p>
		<p class="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
			<a href="/rules">Правила</a>
			<a href="/agreement">Публичная оферта</a>
		</p>
	</footer>
</div>
