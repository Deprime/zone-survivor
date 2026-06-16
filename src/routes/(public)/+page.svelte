<script lang="ts">
	import { PUBLIC_TELEGRAM_URL, PUBLIC_SITE_URL } from '$env/static/public';
	import Countdown from '$lib/components/Countdown.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	// import Logo from '$lib/components/ui/Logo.svelte'; // резервный вариант логотипа
	import LogoChrome from '$lib/components/ui/LogoChrome.svelte';
	import { MAX_REFERRALS, TOKENS_PER_REFERRAL, REFERRAL_REWARD } from '$lib/constants/referral';
	// import { REVIVAL_PRICES_RUB, MAX_REVIVALS, CURRENCY } from '$lib/constants/pricing';
	// const revivalPrices = REVIVAL_PRICES_RUB.map((price) => `${price} ${CURRENCY}`).join(' / ');

	// SEO / Open Graph
	const siteUrl = (PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
	const pageUrl = `${siteUrl}/`;
	const ogImage = `${siteUrl}/og-image.png`;
	const seoTitle = 'ZombieLand survivor — нажми «Я жив» или умри';
	const seoDescription =
		'Браузерная 8-bit игра на выживание. Каждые 24 часа жми «Я жив», копи токены, отбивайся от зомби и доживи до конца сезона — топ-5 получают призы.';

	// Структурированные данные (JSON-LD) для поисковиков
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'VideoGame',
		name: 'ZombieLand survivor',
		url: pageUrl,
		image: ogImage,
		description: seoDescription,
		genre: ['Survival', 'Strategy'],
		gamePlatform: 'Web browser',
		applicationCategory: 'GameApplication',
		operatingSystem: 'Web browser',
		inLanguage: 'ru',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'RUB',
			availability: 'https://schema.org/InStock'
		}
	};

	const steps = [
		{
			n: '01',
			icon: '🔘',
			title: 'Жми «Я жив»',
			text: 'Каждые 24 часа подтверждай, что персонаж жив. Кнопка оживает через 12 часов после последнего нажатия.'
		},
		{
			n: '02',
			icon: '🪙',
			title: 'Токен и ход',
			text: 'За нажатие — +1 токен и шаг в случайную клетку мира. Там тебя ждёт случайное событие.'
		},
		{
			n: '03',
			icon: '🪦',
			title: 'Доживи до конца',
			text: 'Пропустил 24 часа — персонаж гибнет, на клетке встаёт надгробие. Сезон длится месяц.'
		}
	];

	const mechanics = [
		{
			icon: '🪙',
			title: 'Токены',
			text: 'Игровые очки за нажатия и события. Не занимают инвентарь и решают твоё место в рейтинге.'
		},
		{
			icon: '🗺️',
			title: 'События на клетках',
			text: 'Ящики с токенами, чужие могилы, патроны, антидоты и лут на продажу торговцу.'
		},
		{
			icon: '🧟',
			title: 'Зомби',
			text: 'Со второй недели кусают и заражают. 3 хода найти антидот — или пуля в магазине решит вопрос.'
		},
		{
			icon: '🎒',
			title: 'Инвентарь',
			text: '4 клетки на старте и пистолет с пустым магазином. Место можно расширить.'
		},
		{
			icon: '🛒',
			title: 'Торговец',
			text: 'В конце недели: купить патроны и антидоты за токены, продать накопленный лут.'
		},
		{
			icon: '⚰️',
			title: 'Могилы',
			text: 'Нашёл чужую могилу — забери 50% токенов павшего. Своё надгробие можно подписать.'
		}
	];
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="keywords" content="ZombieLand survivor, браузерная игра, зомби, выживание, 8-bit, онлайн игра, сезон, токены" />
	<link rel="canonical" href={pageUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ZombieLand survivor" />
	<meta property="og:locale" content="ru_RU" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="ZombieLand survivor — 8-bit игра на выживание" />

	<!-- Twitter / X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content="ZombieLand survivor — 8-bit игра на выживание" />

	<!-- JSON-LD structured data -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<!-- HERO -->
<Card element="section" class="mb-8 px-5 py-8 text-center sm:mb-12 sm:px-12 sm:py-14">
	<p class="text-muted mb-3 text-xs tracking-[0.3em] uppercase">8-bit survival game</p>
	<h1 class="sr-only">ZombieLand survivor</h1>
	<LogoChrome class="mx-auto mb-6" />
	<p class="text-fg mx-auto mb-2 max-w-xl text-base sm:text-lg">
		Каждые 24 часа жми кнопку <span class="text-amber">«Я жив»</span>.<br> Пропустил = погиб 🪦
	</p>
	<p class="text-muted mx-auto mb-8 max-w-xl text-sm">
		Копи токены, исследуй мир, отбивайся от зомби и доживи до конца сезона, чтобы попасть в топ и получить призы!
	</p>
	<Button href="/rules">Как играть</Button>
</Card>

<!-- COUNTDOWN -->
<Card element="section" class="mb-8 px-4 py-6 text-center sm:mb-12 sm:px-10">
	<p class="text-muted mb-4 text-xs tracking-[0.3em] uppercase">До старта первого сезона</p>
	<Countdown />
</Card>

<!-- CORE LOOP -->
<section class="mb-8 sm:mb-12">
	<h2 class="mb-6 text-center text-lg sm:text-2xl">Игровой цикл</h2>
	<div class="grid gap-6 sm:grid-cols-3">
		{#each steps as step (step.n)}
			<Card element="article" class="px-4 py-3 sm:p-5">
				<div class="mb-2 flex items-center justify-between relative w-full">
					<div class="flex items-center gap-2">
						<span class="text-3xl" aria-hidden="true">{step.icon}</span>
						<h3 class="text-sm uppercase sm:text-sm">{step.title}</h3>
					</div>
					<span class="text-amber text-base font-extrabold absolute -top-4 -right-3">{step.n}</span>
				</div>
				<p class="text-muted text-sm leading-relaxed">{step.text}</p>
			</Card>
		{/each}
	</div>
</section>

<!-- MECHANICS -->
<section class="mb-8 sm:mb-12">
	<h2 class="mb-6 text-center text-lg sm:text-2xl">Что внутри</h2>
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each mechanics as item (item.title)}
			<Card element="article" class="px-4 py-3 sm:px-5 sm:py-4">
				<div class="flex items-center gap-2">
					<span class="mb-3 block text-3xl" aria-hidden="true">{item.icon}</span>
					<h3 class="text-amber mb-2 text-sm">{item.title}</h3>
				</div>
				<p class="text-muted text-sm leading-relaxed">{item.text}</p>
			</Card>
		{/each}
	</div>
</section>

<!-- SEASON / LEADERBOARD -->
<Card element="section" class="mb-8 px-5 py-7 text-center sm:mb-12 sm:px-10">
	<div class="mb-3 text-4xl" aria-hidden="true">🏆</div>
	<h2 class="mb-3 text-lg sm:text-2xl">Финал сезона</h2>
	<p class="text-fg mx-auto mb-6 max-w-2xl text-sm leading-relaxed sm:text-base">
		Сезон длится месяц. Все, кто дожил до конца, попадают в лидерчарт и сортируются по количеству
		токенов. <span class="text-amber">Топ-5 игроков получают призы.</span>
	</p>

	<div class="mx-auto grid max-w-2xl gap-4 text-left sm:grid-cols-2">
		<div
			class="border-amber bg-amber/5 flex items-center gap-4 border-2 p-4 shadow-[0_0_18px_rgba(255,138,31,0.25)]"
		>
			<span class="text-4xl" aria-hidden="true">📱</span>
			<div>
				<div class="text-amber text-xs font-bold tracking-widest uppercase">🥇 1 место</div>
				<div class="text-fg mt-1 text-base font-bold">iPhone 17R</div>
			</div>
		</div>

		<div
			class="border-cyan bg-cyan/5 flex items-center gap-4 border-2 p-4 shadow-[0_0_18px_rgba(52,200,192,0.2)]"
		>
			<span class="text-4xl" aria-hidden="true">🎧</span>
			<div>
				<div class="text-cyan text-xs font-bold tracking-widest uppercase">🏅 2–5 место</div>
				<div class="text-fg mt-1 text-base font-bold">AirPods</div>
			</div>
		</div>
	</div>
</Card>

<!-- REFERRAL -->
<Card element="section" class="mb-8 px-5 py-7 text-center sm:mb-12 sm:px-10">
	<div class="mb-3 text-4xl" aria-hidden="true">😎</div>
	<h2 class="mb-3 text-lg sm:text-xl">Зови друзей</h2>
	<p class="text-fg mx-auto mb-6 max-w-2xl text-sm leading-relaxed sm:text-base">
		Приглашай по своей реферальной ссылке до <span class="text-amber">{MAX_REFERRALS} друзей</span>.
		Каждый присоединившийся друг приносит тебе
		<span class="text-amber">+{TOKENS_PER_REFERRAL} токен</span>.
	</p>
	<div
		class="border-amber bg-amber/5 mx-auto flex max-w-md items-center gap-4 border-2 p-4 text-left shadow-[0_0_18px_rgba(255,138,31,0.25)]"
	>
		<span class="text-4xl" aria-hidden="true">✝️</span>
		<div>
			<div class="text-amber text-xs font-bold tracking-widest uppercase">
				{MAX_REFERRALS} друзей — награда
			</div>
			<div class="text-fg mt-1 text-base font-bold">{REFERRAL_REWARD.name}</div>
			<div class="text-muted mt-1 text-xs">{REFERRAL_REWARD.description}</div>
		</div>
	</div>
</Card>

<!-- DEATH / REVIVE -->
<Card element="section" class="mb-8 p-5 sm:mb-12 sm:p-7">
	<div class="flex flex-col items-center">
		<div class="mb-3 text-3xl" aria-hidden="true">💀</div>
		<h2 class="mb-3 text-lg sm:text-xl text-center">Смерть даёт второй шанс</h2>
	</div>
	<p class="text-muted text-sm leading-relaxed">
		В течение 24 часов после гибели можно оставить прощальную надпись на надгробии — или воскресить
		персонажа при помощи специальных возможностей!
	</p>
</Card>

<!-- TELEGRAM -->
<Card element="section" class="mb-8 px-5 py-7 text-center sm:mb-12 sm:px-10 sm:py-10">
	<div class="mb-3 text-4xl" aria-hidden="true">📣</div>
	<h2 class="mb-3 text-lg sm:text-xl">Залетай в сообщество</h2>
	<p class="text-muted mx-auto mb-8 max-w-xl text-sm">
		Новости сезонов, анонсы наград, обсуждения тактик и встречи на могилах. Не пропусти старт —
		подпишись на наш Telegram.
	</p>
	<Button href={PUBLIC_TELEGRAM_URL} variant="solid" target="_blank" rel="noopener noreferrer">
		Подписаться
	</Button>
</Card>

<!-- FINAL CTA -->
<section class="text-center">
	<p class="text-muted mb-4 text-sm">Готов проверить, как долго протянешь?</p>
	<Button href="/rules">Начать выживание</Button>
</section>
