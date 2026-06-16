<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import { GRAVE_INSCRIPTION_MAX, MAP_SIZE, MAP_VIEW_RADIUS } from '$lib/constants/game';

	let { data, form } = $props();

	let submitting = $state(false);

	// Живое время (тик раз в секунду) для обратного отсчёта и «оживления» кнопки.
	let nowMs = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (nowMs = Date.now()), 1000);
		return () => clearInterval(id);
	});
	const nowSec = $derived(Math.floor(nowMs / 1000));

	const status = $derived(
		data.user.diedAt !== null || nowSec >= data.alive.diesAt
			? 'dead'
			: nowSec < data.alive.nextActiveAt
				? 'cooldown'
				: 'ready'
	);

	const toReady = $derived(Math.max(0, data.alive.nextActiveAt - nowSec));
	const toDeath = $derived(Math.max(0, data.alive.diesAt - nowSec));

	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (s: number) =>
		`${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

	// --- мини-карта ---
	const R = MAP_VIEW_RADIUS;
	const graveSet = $derived(new Set(data.graves.map((g) => `${g.x},${g.y}`)));
	const grid = $derived(
		Array.from({ length: 2 * R + 1 }, (_, ri) => {
			const wy = data.pos.y - R + ri;
			return Array.from({ length: 2 * R + 1 }, (_, ci) => {
				const wx = data.pos.x - R + ci;
				return {
					out: wx < 0 || wy < 0 || wx >= MAP_SIZE || wy >= MAP_SIZE,
					isPlayer: wx === data.pos.x && wy === data.pos.y,
					hasGrave: graveSet.has(`${wx},${wy}`)
				};
			});
		})
	);

	// --- описание события после хода ---
	type EventLike = { type: string; amount?: number; itemId?: string };
	const ITEM_LABEL: Record<string, string> = {
		ammo: 'патрон',
		antidote: 'антидот',
		loot: 'лут'
	};
	function eventText(e: EventLike): string {
		switch (e.type) {
			case 'tokens':
				return `Ящик с токенами: +${e.amount} 🪙`;
			case 'grave':
				return `Разграблена могила: +${e.amount} 🪙`;
			case 'item':
				return `Найден предмет: ${ITEM_LABEL[e.itemId ?? ''] ?? e.itemId}`;
			case 'item_lost':
				return `Найден ${ITEM_LABEL[e.itemId ?? ''] ?? e.itemId}, но инвентарь полон`;
			default:
				return 'Клетка пуста';
		}
	}

	type ThreatLike = { type: string; movesLeft?: number };
	function threatText(t: ThreatLike): string | null {
		switch (t.type) {
			case 'zombie_killed':
				return '🧟 Зомби! Ты отстрелялся патроном — без последствий.';
			case 'zombie_bite':
				return `🧟 Зомби укусил! Ты заражён — найди антидот за ${t.movesLeft} хода.`;
			case 'infection_cured':
				return '💉 Антидот применён — заражение вылечено.';
			case 'infection_progress':
				return `☣️ Заражение прогрессирует. До гибели: ${t.movesLeft} хода.`;
			case 'infection_death':
				return '☠️ Антидот не найден — персонаж умер от заражения.';
			default:
				return null;
		}
	}
</script>

<svelte:head>
	<title>Игра — ZombieLand survivor</title>
</svelte:head>

<Card element="section" class="px-5 py-8 text-center sm:px-10">
	<p class="text-muted mb-2 text-xs tracking-[0.3em] uppercase">
		Статус: {status === 'dead' ? 'погиб' : 'жив'} · клетка {data.pos.x},{data.pos.y}
	</p>
	<h1 class="mb-6 text-xl sm:text-2xl">Зона выживания</h1>

	<div class="mb-8 flex justify-center gap-8 text-sm">
		<div>
			<div class="text-cyan text-2xl font-extrabold tabular-nums">{data.user.tokens}</div>
			<div class="text-muted text-xs uppercase">токены</div>
		</div>
		<div>
			<div class="text-amber text-2xl font-extrabold tabular-nums">{data.user.inventorySize}</div>
			<div class="text-muted text-xs uppercase">инвентарь</div>
		</div>
	</div>

	{#if status !== 'dead' && data.user.biteMovesLeft != null}
		<div class="border-danger text-danger mx-auto mb-6 max-w-sm border-2 px-4 py-3 text-sm">
			☣️ Ты заражён укусом зомби! Найди антидот за <span class="font-bold tabular-nums"
				>{data.user.biteMovesLeft}</span
			> хода, иначе гибель.
		</div>
	{/if}

	<!-- мини-карта -->
	<div
		class="mx-auto mb-8 inline-grid gap-1"
		style="grid-template-columns: repeat({2 * R + 1}, minmax(0, 1fr))"
		aria-label="Мини-карта вокруг персонажа"
	>
		{#each grid as row}
			{#each row as cell}
				<div
					class="flex h-7 w-7 items-center justify-center border text-sm
						{cell.out
						? 'border-border bg-border/40 text-muted'
						: cell.isPlayer
							? 'border-amber text-amber'
							: cell.hasGrave
								? 'border-border text-fg'
								: 'border-border text-muted'}"
				>
					{cell.out ? '' : cell.isPlayer ? '☻' : cell.hasGrave ? '🪦' : '·'}
				</div>
			{/each}
		{/each}
	</div>

	{#if status === 'dead'}
		<div class="border-danger mx-auto max-w-md border-2 px-4 py-6">
			<div class="mb-2 text-4xl" aria-hidden="true">🪦</div>
			<p class="text-danger text-lg font-bold uppercase">Персонаж погиб</p>

			{#if data.death && nowSec < data.death.windowEndsAt}
				<p class="text-muted mt-2 text-xs">
					Окно действий ещё открыто:
					<span class="text-cyan tabular-nums"
						>{fmt(Math.max(0, data.death.windowEndsAt - nowSec))}</span
					>
				</p>

				<!-- надпись на надгробии -->
				<form method="POST" action="?/inscribe" use:enhance class="mt-5 text-left">
					<label class="text-muted mb-1 block text-xs uppercase" for="inscription">
						Надпись на надгробии
					</label>
					<textarea
						id="inscription"
						name="text"
						rows="2"
						maxlength={GRAVE_INSCRIPTION_MAX}
						class="border-border bg-bg text-fg w-full border-2 px-2 py-1 text-sm"
						placeholder="Последние слова…">{data.death.inscription ?? ''}</textarea
					>
					<div class="mt-2 flex items-center gap-3">
						<button type="submit" class="pixel-btn pixel-btn--outline pixel-btn--sm">
							Сохранить
						</button>
						{#if form && 'inscribed' in form}
							<span class="text-cyan text-xs">Сохранено</span>
						{/if}
					</div>
				</form>

				<!-- воскрешение -->
				<div class="mt-6 flex flex-col items-center gap-3">
					{#if data.death.hasCross}
						<form method="POST" action="?/reviveCross" use:enhance>
							<button type="submit" class="pixel-btn pixel-btn--solid pixel-btn--md">
								✝️ Воскресить (Крест)
							</button>
						</form>
					{/if}
					{#if data.death.nextPrice != null}
						<a
							href="/app/pay?for=revival&amount={data.death.nextPrice}"
							class="pixel-btn pixel-btn--outline pixel-btn--sm"
						>
							Платно: {data.death.nextPrice} ₽
						</a>
					{:else}
						<p class="text-muted text-xs">Лимит платных воскрешений исчерпан.</p>
					{/if}
				</div>
			{:else}
				<p class="text-muted mt-2 text-xs">Окно для воскрешения и надписи истекло.</p>
				{#if data.death?.inscription}
					<p class="text-fg mt-3 text-sm italic">«{data.death.inscription}»</p>
				{/if}
			{/if}
		</div>
	{:else}
		<form
			method="POST"
			action="?/press"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<button
				type="submit"
				class="pixel-btn pixel-btn--solid pixel-btn--lg disabled:cursor-not-allowed disabled:opacity-40"
				disabled={status !== 'ready' || submitting}
			>
				Я жив
			</button>
		</form>

		<div class="text-muted mt-6 text-xs">
			{#if status === 'cooldown'}
				<p>Кнопка активируется через <span class="text-cyan tabular-nums">{fmt(toReady)}</span></p>
			{:else}
				<p class="text-amber">Кнопка активна — жми!</p>
			{/if}
			<p class="mt-1">
				Персонаж погибнет через <span class="text-danger tabular-nums">{fmt(toDeath)}</span>
			</p>
		</div>

		{#if form && 'event' in form}
			<p class="border-border text-fg mx-auto mt-4 max-w-sm border-2 px-3 py-2 text-xs">
				Ход на {form.x},{form.y}: {eventText(form.event)}
			</p>
			{#if threatText(form.threat)}
				<p class="border-danger text-danger mx-auto mt-2 max-w-sm border-2 px-3 py-2 text-xs">
					{threatText(form.threat)}
				</p>
			{/if}
		{:else if form && 'reason' in form && form.reason === 'cooldown'}
			<p class="text-danger mt-4 text-xs">Ещё рано — кнопка на кулдауне.</p>
		{:else if form && 'reason' in form && form.reason === 'expired'}
			<p class="text-danger mt-4 text-xs">Слишком поздно — персонаж погиб.</p>
		{/if}
	{/if}
</Card>
