<script lang="ts">
	import { page } from '$app/state';

	let { children, data } = $props();

	const links = [
		{ href: '/app/game', label: 'Игра' },
		{ href: '/app/merchant', label: 'Торговец' },
		{ href: '/app/inventory', label: 'Инвентарь' },
		{ href: '/app/leaderboard', label: 'Рейтинг' },
		{ href: '/app/profile', label: 'Профиль' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-border bg-bg/90 border-b-2 backdrop-blur">
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2">
			<a
				href="/app/game"
				class="text-amber font-pixel text-xs tracking-widest uppercase no-underline"
			>
				ZL
			</a>

			<nav class="flex flex-wrap justify-center gap-1 text-xs uppercase sm:gap-2 sm:text-sm">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="border-2 px-2 py-1 no-underline transition-colors
							{isActive(link.href)
							? 'border-amber bg-amber text-bg'
							: 'text-muted hover:text-fg border-transparent'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-3">
				<span class="text-cyan hidden text-xs sm:inline" title="Токены">
					🪙 {data.user.tokens}
				</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="text-muted hover:text-danger border-border border-2 px-2 py-1 text-xs uppercase transition-colors"
					>
						Выход
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
		{@render children()}
	</main>
</div>
