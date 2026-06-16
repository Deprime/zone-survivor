<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = {
		/** HTML-тег обёртки (div по умолчанию, можно section/article и т.п.). */
		element?: string;
		/** Дополнительные классы (Tailwind), например отступы и выравнивание. */
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement>;

	// svelte-ignore custom_element_props_identifier
	let { element = 'div', class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element this={element} class="pixel-box {className}" {...rest}>
	{@render children()}
</svelte:element>
