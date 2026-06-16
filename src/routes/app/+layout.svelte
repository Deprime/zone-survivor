<script lang="ts">
	import { page } from '$app/state';
	import { Toaster, toast } from 'svelte-sonner';

	let { children, data } = $props();

	const links = [
		{ href: '/app/game', label: 'Игра' },
		{ href: '/app/merchant', label: 'Торговец' },
		{ href: '/app/inventory', label: 'Инвентарь' },
		{ href: '/app/journal', label: 'Журнал' },
		{ href: '/app/leaderboard', label: 'Рейтинг' },
		{ href: '/app/profile', label: 'Профиль' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	let menuOpen = $state(false);

	// Тосты по результатам действий игрока: form.notices приходит из form-action'ов.
	let lastForm: unknown = null;
	$effect(() => {
		const form = page.form as { notices?: string[] } | null;
		if (form && form !== lastForm) {
			lastForm = form;
			if (Array.isArray(form.notices)) {
				for (const message of form.notices) toast(message);
			}
		}
	});
</script>

<Toaster duration={10000} position="top-center" richColors theme="dark" />

{#snippet navLink(href: string, label: string)}
	<a
		{href}
		onclick={() => (menuOpen = false)}
		class="block border-2 px-2 py-1 uppercase no-underline transition-colors
			{isActive(href) ? 'border-amber bg-amber text-bg' : 'text-muted hover:text-fg border-transparent'}"
		aria-current={isActive(href) ? 'page' : undefined}
	>
		{label}
	</a>
{/snippet}

<div class="flex min-h-screen flex-col">
	<header class="border-border bg-bg/90 border-b-2 backdrop-blur">
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2">
			<!-- бренд + меню + токены -->
			<div class="flex items-center gap-3">
				<a
					href="/app/game"
					class="text-amber font-pixel text-xs tracking-widest uppercase no-underline"
				>
					ZL
				</a>

				<!-- desktop nav -->
				<nav class="hidden gap-2 text-sm sm:flex">
					{#each links as link (link.href)}
						{@render navLink(link.href, link.label)}
					{/each}
				</nav>

				<!-- токены рядом с меню -->
				<span
					class="text-cyan border-border flex items-center gap-1 border-2 px-2 py-0.5 text-xs font-bold whitespace-nowrap tabular-nums"
					title="Токены"
				>
					🪙 {data.user.tokens}
				</span>
			</div>

			<div class="flex items-center gap-2">
				<form method="POST" action="/logout" class="hidden sm:block">
					<button
						type="submit"
						class="text-muted hover:text-danger border-border border-2 px-2 py-1 text-xs uppercase transition-colors"
					>
						Выход
					</button>
				</form>

				<!-- mobile toggle -->
				<button
					type="button"
					onclick={() => (menuOpen = !menuOpen)}
					class="text-amber border-border flex items-center justify-center border-2 p-1 sm:hidden"
					aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
					aria-expanded={menuOpen}
					aria-controls="app-menu"
				>
					<svg
						width="20"
						height="20"
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
			</div>
		</div>

		<!-- mobile menu -->
		{#if menuOpen}
			<nav id="app-menu" class="flex flex-col gap-1 px-4 pb-3 text-sm sm:hidden">
				{#each links as link (link.href)}
					{@render navLink(link.href, link.label)}
				{/each}
				<form method="POST" action="/logout" class="mt-1">
					<button
						type="submit"
						class="text-danger border-border w-full border-2 px-2 py-1 text-left text-xs uppercase"
					>
						Выход
					</button>
				</form>
			</nav>
		{/if}
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
		{@render children()}
	</main>
</div>
