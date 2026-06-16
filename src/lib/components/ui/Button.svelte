<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'outline' | 'solid';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		/** Цветовое оформление: outline — амбер-контур, solid — заливной cyan. */
		variant?: Variant;
		/** Размер кнопки и текста. */
		size?: Size;
		/** Если задан href — рендерится как ссылка <a>, иначе как <button>. */
		href?: string;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAnchorAttributes & HTMLButtonAttributes, 'class'>;

	let {
		variant = 'outline',
		size = 'md',
		href,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const classes = `pixel-btn pixel-btn--${variant} pixel-btn--${size} ${className}`;
</script>

{#if href}
	<a {href} class={classes} {...rest}>
		{@render children()}
	</a>
{:else}
	<button class={classes} {...rest}>
		{@render children()}
	</button>
{/if}
