<script>
	import Card from '$lib/components/ui/Card.svelte';

	// Frontmatter from the markdown file is passed in as props.
	export let title = '';
	export let subtitle = '';
	export let description = '';
	export let updated = '';
</script>

<svelte:head>
	<title>{title} — ZombieLand survivor</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
</svelte:head>

<Card element="article" class="px-5 py-6 sm:px-9 sm:py-9">
	<header class="mb-6">
		<h1 class="text-xl sm:text-3xl">{title}</h1>
		{#if subtitle}
			<p class="text-muted mt-1 text-sm">{subtitle}</p>
		{/if}
		{#if updated}
			<p class="text-muted mt-2 text-xs">Редакция от {updated}</p>
		{/if}
	</header>

	<div class="legal-body">
		<slot />
	</div>
</Card>
