# ZombieLand survivor

Сайт браузерной игры **ZombieLand survivor**.

Стек: **SvelteKit 2** + **Svelte 5**, **Tailwind CSS v4**, **TypeScript**, **ESLint** + **Prettier**.
Контент-страницы (правила, оферта) написаны в **Markdown** и рендерятся через **mdsvex**.
Публичная часть рендерится на сервере (**SSR**) через `@sveltejs/adapter-node`.
Оформление: тёмная **8-bit** тема. Шрифты (Google Fonts): **JetBrains Mono** для текста и **Press Start 2P** для заголовков и кнопок (латиница; кириллица падает на JetBrains Mono).

## Страницы

- `/` — главная
- `/rules` — правила игры
- `/agreement` — пользовательское соглашение (публичная оферта)

## Установка

```bash
bun install
cp .env.example .env   # затем впишите свои значения
```

## Переменные окружения

Публичные переменные (доступны в браузере, префикс `PUBLIC_`):

- `PUBLIC_SITE_URL` — базовый публичный URL сайта без слэша в конце (например, `https://zombieland-survivor.ru`). Используется для `canonical` и Open Graph / Twitter тегов на главной.
- `PUBLIC_SEASON_START`, `PUBLIC_TELEGRAM_URL` — см. выше.

Приватные переменные (только сервер, без префикса; доступны через `$env/dynamic/private`):

- `DATABASE_URL` — строка подключения к MySQL (`mysql://user:password@host:port/database`).
- `REDIS_URL` — строка подключения к Redis (`redis://[:password@]host:port[/db]`).

- `PUBLIC_SEASON_START` — дата и время старта первого сезона в формате ISO 8601 (например, `2026-07-01T12:00:00+03:00`). Используется блоком обратного отсчёта на главной.
- `PUBLIC_TELEGRAM_URL` — ссылка на сообщество в Telegram (кнопка на главной).

Файл `.env` не коммитится; шаблон — в `.env.example`.

## Команды

```bash
bun run dev       # запуск дев-сервера
bun run build     # production-сборка (adapter-node -> ./build)
bun run preview   # предпросмотр сборки
bun run start     # запуск собранного SSR-сервера: node build/index.js
bun run check     # проверка типов (svelte-check)
bun run lint      # prettier --check + eslint
bun run format    # автоформатирование (prettier --write)

# база данных (Drizzle ORM + MySQL)
bun run db:generate  # сгенерировать SQL-миграции из схемы
bun run db:migrate   # применить миграции
bun run db:push      # синхронизировать схему с БД напрямую (для разработки)
bun run db:studio    # веб-интерфейс Drizzle Studio
```

## Бэкенд (MySQL + Redis + Drizzle)

- ORM — **Drizzle** (`drizzle-orm` + `drizzle-kit`), драйвер MySQL — `mysql2`.
- Redis-клиент — `ioredis`.
- Серверные модули лежат в `src/lib/server/` (импортируются только на сервере):
  - `db/schema.ts` — описание таблиц (старт: `players`);
  - `db/index.ts` — пул MySQL и экземпляр Drizzle (`db`);
  - `redis.ts` — клиент Redis (`redis`).
- Конфиг миграций — `drizzle.config.ts` (схема + `DATABASE_URL` из `.env`).

Быстрый старт: создайте БД `zombieland` в MySQL, заполните `DATABASE_URL`/`REDIS_URL` в `.env`,
затем `bun run db:push` (или `db:generate` + `db:migrate`).

## Авторизация (Telegram OAuth)

Регистрация и вход — только через Telegram Login Widget.

- Переменные: `TELEGRAM_BOT_TOKEN` (приватный, проверка подписи) и `PUBLIC_TELEGRAM_BOT_USERNAME` (username бота для виджета). В @BotFather у бота нужно задать домен (`/setdomain`), равный `PUBLIC_SITE_URL`.
- Поток: `/login` → виджет Telegram → `GET /auth/telegram/callback` проверяет подпись, создаёт/находит пользователя, кладёт сессию в Redis и ставит cookie `session`. Выход — `POST /logout`.
- Сессии живут в Redis (`session:<token>`), пользователь подгружается в `event.locals.user` в `hooks.server.ts`.
- Рефералы: переход по `?ref=<uuid>` сохраняется в cookie `ref`; при первичной регистрации `parent_id` проставляется по владельцу этого `uuid`.

Структура роутов:

- `(public)/` — маркетинг (главная, правила, оферта, `/login`) со своим layout-шапкой.
- `app/` — кабинет авторизованного пользователя со своим layout и гардом (`game`, `profile`, `inventory`); неавторизованных редиректит на `/login`.

Локально виджет Telegram требует реальный домен (совпадающий с `PUBLIC_SITE_URL` и доменом бота) — на `localhost` он не сработает, используйте туннель (например, cloudflared/ngrok).

## Фоновые задачи: sweep смертей

Персонаж погибает, если не нажимал «Я жив» 24 часа. Чтобы смерти фиксировались даже у неактивных игроков:

- **In-process планировщик** запускается автоматически при старте сервера (`hooks.server.ts` → `startDeathSweeper`), идёт раз в `SWEEP_INTERVAL_SECONDS` (5 мин) и помечает погибших. При нескольких инстансах проход делает только один (single-flight лок `sweep:lock` в Redis). Запрос идемпотентный (`WHERE died_at IS NULL`).
- **Внешний триггер**: `POST /api/cron/sweep` с `Authorization: Bearer <CRON_SECRET>` (или `?key=<CRON_SECRET>`) — для cron Railway / cron-job.org. Возвращает `{ "swept": n }`.

Переменная `CRON_SECRET` — секрет для эндпоинта (в `.env`). Sweep ставит надгробия на клетке гибели.

## Карта мира и события

Мир — общая сетка `MAP_SIZE × MAP_SIZE` (128×128), координаты игрока в `users.pos_x/pos_y` (старт — центр). Каждое нажатие «Я жив» двигает персонажа на одну клетку в случайную сторону (упор в границы) и бросает событие на новой клетке (модель «бросок при входе», `src/lib/server/game/world.ts`):

- чужая неразграбленная **могила** → +доля токенов павшего (`GRAVE_LOOT_RATIO`), могила помечается `looted`;
- **ящик с токенами** (`TOKEN_BOX_CHANCE`);
- **предмет** из `DROP` по его `dropChance` (если есть место в инвентаре, иначе теряется);
- иначе — пусто.

Надгробия (`graves`) создаются при гибели (`killUser`) на текущей клетке с токенами павшего. Страница `/app/game` показывает мини-карту `(2R+1)²` вокруг игрока, координаты и результат последнего хода.

Токены хранятся в `users.tokens` и **не занимают** инвентарь (вместимость считается только по `inventory_items`).

### Зомби и заражение (`src/lib/server/game/zombie.ts`)

Со 2-й недели сезона каждый игрок ровно раз в ISO-неделю гарантированно встречает зомби; день встречи смещён на вт/ср/чт (стабильно для пары игрок+неделя, с гарантией доставки до конца недели). При встрече:

- есть **патрон** (`ammo`) → зомби устранён, заражения нет (патрон списывается);
- иначе → **укус**: `users.bite_moves_left = 3`. Каждый следующий ход: если есть **антидот** — лечит (списывается), иначе счётчик убывает; на нуле — гибель от заражения.

Неделя последней встречи хранится в `users.zombie_week` (защита от повторов). Зомби активны от `ZOMBIE_FROM_SEASON_WEEK` (по `PUBLIC_SEASON_START`) — для локального теста поставьте дату сезона в прошлом.

### Гибель и воскрешение (`src/lib/server/game/resurrection.ts`)

Любая гибель (таймаут 24ч или заражение) обрабатывается одинаково через `killUser` и открывает окно `RESURRECTION_WINDOW_SECONDS` (24ч), пока оно открыто игрок может:

- оставить **надпись** на своём надгробии (`graves.inscription`);
- **воскреснуть бесплатно** «Крестом воскрешения» (списывает предмет, не тратит платные попытки);
- **платно** воскреснуть (200/300/500 ₽, до 3 раз) — цена показывается, само списание делает платёжный провайдер (`resurrectPaid` вызывать только после оплаты; интеграция оплаты — следующий шаг).

Воскрешение сбрасывает заражение, обновляет `active_at` (новый отсчёт) и удаляет надгробие.

### Лидерчарт (`src/lib/server/game/leaderboard.ts`)

Рейтинг — живые игроки по убыванию токенов (топ-`LEADERBOARD_SIZE`), призы у топ-`LEADERBOARD_PRIZE_TOP`. Снимок кэшируется в Redis (`leaderboard`) на час и **обновляется раз в час**: фоновым джобом `startLeaderboardRefresher` (single-flight через `leaderboard:lock`) и лениво при первом заходе после истечения кэша. Страница `/app/leaderboard` показывает таблицу и отсчёт до следующего обновления.

### Сезоны (`src/lib/server/game/season.ts`)

Таблица `seasons` (id = номер сезона, `starts_at`/`ends_at`, `status`), активен ровно один. Первый сезон создаётся автоматически из `PUBLIC_SEASON_START`, длительность — `SEASON_DURATION_DAYS` (≈месяц).

Джоб `startSeasonWatcher` (раз в 5 мин, лок `season:lock`) проверяет, истёк ли сезон, и при необходимости **финализирует** его:

- записывает топ-5 живых в `season_winners` с призами (`SEASON_PRIZES`: 1-е — iPhone 17R, 2–5 — AirPods);
- делает **полный сброс** игроков (токены, позиция, статус, инвентарь, заражение, воскрешения, размер инвентаря); аккаунты и рефералы сохраняются;
- стартует следующий сезон и сбрасывает кэш лидерчарта.

Гейт зомби «со 2-й недели» теперь считается от старта активного сезона. Страница `/app/leaderboard` показывает номер сезона, отсчёт до конца и победителей прошлого сезона.

Новые таблицы (`seasons`, `season_winners`) требуют миграции.

### Telegram-бот: дайджест павших

Раз в сутки бот постит в канал список погибших за последние 24ч с их эпитафиями (надписями на надгробиях).

- Клиент — `src/lib/server/telegram.ts` (`sendChannelMessage` через `ky` + Bot API, `parse_mode=HTML` с экранированием пользовательского текста).
- Сборка — `src/lib/server/game/digest.ts` (`buildDeathDigest`/`sendDeathDigest`): берёт `graves`, созданные за сутки (воскрешённые исключены — их могилы удалены), джойнит имена.
- Расписание — джоб `startDeathDigestJob` (ежечасная проверка; после `DEATH_DIGEST_HOUR_UTC` шлёт один раз в день, дедуп/single-flight через дневной ключ `digest:sent:<дата>`). Ручной/внешний триггер — `POST /api/cron/death-digest` с `CRON_SECRET`.

Переменная `TELEGRAM_CHANNEL_ID` (@username или `-100…`); бот должен быть **админом** канала. Если павших нет — сообщение не отправляется.

### Персональные уведомления (BullMQ)

Личные сообщения игрокам идут через очередь **BullMQ** на нашем Redis (`src/lib/server/notifications/`):

- продюсер `enqueueNotification` (ошибки очереди не ломают игровую логику);
- воркер `startNotificationWorker` (запускается из `hooks`): concurrency 5, limiter под лимит Telegram (25/с), ретраи с экспоненциальным backoff; на `403/400` (бот не запущен/нет чата) кидает `UnrecoverableError` — без бесполезных повторов.

События:

- **укус зомби** и **гибель** — мгновенно;
- **«кнопка снова активна»** (отложенно на +12ч) и **«скоро гибель»** (за `DEATH_WARNING_BEFORE_SECONDS` до конца) — отложенные задачи BullMQ; воркер проверяет актуальность по `active_at` и пропускает, если игрок уже нажал кнопку.

Важно: бот может писать в ЛС только тем, кто **нажал Start** у бота (ограничение Telegram). Очередь — на `bullmq` (нужен `bun install`).

### Webhook бота

Эндпоинт `POST /api/telegram/webhook` принимает апдейты Telegram, верифицируя заголовок `X-Telegram-Bot-Api-Secret-Token` против `TELEGRAM_WEBHOOK_SECRET`. Обработка — в `src/lib/server/bot.ts`:

- команда **`/start`**: если игрок зарегистрирован — фиксирует актуальный `chat_id` и подтверждает включение уведомлений; если нет — предлагает войти на сайте;
- **deep-link рефералов** `t.me/<bot>?start=ref_<uuid>`: до регистрации сохраняет реферала в Redis (`pendingref:<telegram_id>`), а OAuth-callback подхватывает его, если cookie `ref` нет.

Настройка вебхука (одноразово, после деплоя): задать `TELEGRAM_WEBHOOK_SECRET`, затем

```bash
bun run bot:set-webhook
```

(использует `PUBLIC_SITE_URL` + токен бота; домен должен быть публичным с HTTPS).

## Платежи (Platega, СБП QR)

Платные услуги — воскрешение (200/300/500 ₽) и расширение инвентаря (200/250/300/350 ₽, до 4 ячеек, всего до 8).

- Env: `PLATEGA_BASE_URL`, `PLATEGA_MERCHANT_ID`, `PLATEGA_SECRET`, `PLATEGA_METHOD` (2 = СБП QR).
- Таблица `payments` — источник правды по статусу (`pending/confirmed/canceled/chargebacked`).
- Поток: страница `/app/pay?for=revival|inventory` показывает цену (с проверкой права) → форма создаёт платёж (`payments.pending`) и `POST /transaction/process` к Platega → редирект на оплату.
- Возврат: `/app/pay/return?id=<id>` опрашивает `GET /api/payments/<id>/status` (раз в 3с, ~2 мин); как только статус `confirmed` — показывает успех и выдачу.
- **Callback** `POST /api/payments/platega/callback` (указать в ЛК Platega): верифицирует `X-MerchantId`/`X-Secret`, сверяет сумму, идемпотентно переводит `pending→confirmed` и выдаёт покупку (воскрешение/+1 ячейка). Всегда отвечает 200.

Важно: callback Platega работает **только на публичном HTTPS-домене** (localhost/приватные IP запрещены) — тестировать на деплое или через туннель. Нужна миграция таблицы `payments` (`bun run db:push`).

Новые поля/таблицы требуют миграции: `bun run db:generate` → `bun run db:push` (или `db:migrate`).

## Деплой на Railway (push-to-deploy)

1. Локально перед коммитом генерируем миграции: `bun run db:generate` — SQL-файлы появляются в `./drizzle`. Папку коммитим в репозиторий.
2. На Railway добавляем плагины **MySQL** и **Redis**, в переменных сервиса задаём
   `DATABASE_URL=${{ MySQL.MYSQL_URL }}` и `REDIS_URL=${{ Redis.REDIS_URL }}` (плюс `PUBLIC_*`).
3. `railway.json` уже настроен: на каждом деплое выполняется **pre-deploy** команда
   `bun run db:deploy` (применяет миграции через `scripts/migrate.ts`, без `drizzle-kit`),
   затем стартует сервер `node build/index.js`.

Pre-deploy выполняется один раз перед релизом и имеет доступ к БД — это надёжнее, чем гонять
миграции на старте каждого инстанса. На проде используем миграции, а не `db:push`.

## Структура

```
src/
  app.css            # точка сборки стилей (импортирует Tailwind + styles/*)
  styles/
    theme.css        # дизайн-токены (@theme: палитра, шрифты)
    base.css         # базовые стили документа (@layer base)
    components/
      card.css       # .pixel-box
      button.css     # .pixel-btn + variant/size
      prose.css      # .legal-body (markdown юр. страниц)
  app.html           # подключение JetBrains Mono
  lib/constants/app.ts      # навигация и имя сайта
  lib/constants/pricing.ts  # цены воскрешения
  lib/constants/referral.ts # параметры реферальной системы
  lib/components/ui/Card.svelte    # переиспользуемая рамка-карточка (.pixel-box)
  lib/components/ui/Button.svelte  # переиспользуемая кнопка (outline / solid)
  lib/components/Countdown.svelte  # таймер до старта сезона
  lib/layouts/legal.svelte  # обёртка-layout для markdown-страниц (mdsvex)
  routes/
    +layout.svelte   # шапка + футер
    +layout.ts       # ssr = true, prerender = false
    +page.svelte         # главная
    rules/+page.md         # правила (Markdown -> mdsvex)
    agreement/+page.md     # оферта (Markdown -> mdsvex)
static/
  favicon.svg
```

## Заметки

- Тексты оферты и правил — **черновые шаблоны**, замените на финальные перед запуском.
- Зависимости устанавливаются локально (`bun install`); каталог `node_modules` в репозиторий не коммитится.
