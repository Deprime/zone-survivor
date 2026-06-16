<script lang="ts">
	import { PUBLIC_SEASON_START } from '$env/static/public';

	const target = new Date(PUBLIC_SEASON_START).getTime();
	const valid = !Number.isNaN(target);

	let now = $state(Date.now());

	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	const diff = $derived(Math.max(0, target - now));
	const started = $derived(valid && diff === 0);

	const pad = (n: number) => String(n).padStart(2, '0');

	const units = $derived([
		{ label: 'дней', value: pad(Math.floor(diff / 86_400_000)) },
		{ label: 'часов', value: pad(Math.floor((diff % 86_400_000) / 3_600_000)) },
		{ label: 'минут', value: pad(Math.floor((diff % 3_600_000) / 60_000)) },
		{ label: 'секунд', value: pad(Math.floor((diff % 60_000) / 1000)) }
	]);
</script>

{#if !valid}
	<p class="text-muted text-sm">Дата старта сезона ещё не назначена.</p>
{:else if started}
	<p class="text-amber text-2xl font-extrabold uppercase">Сезон начался!</p>
{:else}
	<div class="flex justify-center gap-3 sm:gap-4">
		{#each units as unit (unit.label)}
			<div class="flex flex-col items-center">
				<span
					class="border-border bg-bg text-cyan min-w-[3.5rem] border-2 px-2 py-2 text-3xl font-extrabold tabular-nums sm:min-w-[4.5rem] sm:text-4xl"
				>
					{unit.value}
				</span>
				<span class="text-muted mt-2 text-[0.65rem] tracking-widest uppercase">{unit.label}</span>
			</div>
		{/each}
	</div>
{/if}
