# Деплой ZombieLand survivor на Railway

Прод-домен: **https://zsurvive.fun**

## 0. Перед деплоем (локально)

```bash
bun install
bun run check        # типы
bun run lint         # prettier + eslint
bun run build        # убедиться, что сборка проходит

# Сгенерировать миграции из схемы и закоммитить (важно — см. раздел 4)
bun run db:generate
git add drizzle/ && git commit -m "db migrations"
git push
```

## 1. Сервисы Railway

В одном проекте Railway создать:

1. **App** — из GitHub-репозитория (Nixpacks подхватит `bun.lock` → bun, `railway.json` уже настроен: pre-deploy миграции + `bun ./build/index.js`).
2. **MySQL** — плагин Railway.
3. **Redis** — плагин Railway.

## 2. Переменные окружения (App → Variables)

> Переменные с префиксом `PUBLIC_` вшиваются в сборку, поэтому должны существовать **до билда**. Их изменение требует **redeploy**, а не просто рестарт.

Публичные:

| Переменная                     | Значение                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| `PUBLIC_SITE_URL`              | `https://zsurvive.fun`                                      |
| `PUBLIC_SEASON_START`          | дата старта сезона, ISO (напр. `2026-07-01T12:00:00+03:00`) |
| `PUBLIC_TELEGRAM_URL`          | ссылка на сообщество                                        |
| `PUBLIC_TELEGRAM_BOT_USERNAME` | username бота без `@`                                       |

Приватные:

| Переменная                | Значение                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| `ORIGIN`                  | `https://zsurvive.fun` (нужно adapter-node для form-actions за прокси) |
| `DATABASE_URL`            | `${{ MySQL.MYSQL_URL }}` (ссылка на переменную сервиса MySQL)          |
| `REDIS_URL`               | `${{ Redis.REDIS_URL }}`                                               |
| `TELEGRAM_BOT_TOKEN`      | токен от @BotFather                                                    |
| `TELEGRAM_CHANNEL_ID`     | `@канал` или `-100…`                                                   |
| `TELEGRAM_WEBHOOK_SECRET` | длинная случайная строка                                               |
| `CRON_SECRET`             | длинная случайная строка                                               |
| `PLATEGA_BASE_URL`        | `https://app.platega.io`                                               |
| `PLATEGA_MERCHANT_ID`     | ваш MerchantId                                                         |
| `PLATEGA_SECRET`          | ваш API-ключ                                                           |
| `PLATEGA_METHOD`          | `2` (СБП QR)                                                           |
| `HAWK_TOKEN`              | Integration Token проекта Hawk (логгер ошибок); пусто — выключено      |

> Точные имена переменных у плагинов проверьте в их вкладке Variables (`MYSQL_URL`, `REDIS_URL`). При необходимости подставьте фактические.

## 3. Домен

App → Settings → Networking → Custom Domain → добавить `zsurvive.fun`.
Railway покажет CNAME-цель — прописать её в DNS у регистратора. SSL (Let's Encrypt) выпустится автоматически. После активации убедиться, что `PUBLIC_SITE_URL` и `ORIGIN` = `https://zsurvive.fun`.

## 4. Миграции БД

`railway.json` запускает pre-deploy `bun run db:deploy` (применяет миграции из `./drizzle` через `drizzle-orm`). **Миграции должны быть сгенерированы и закоммичены** (см. раздел 0) — иначе таблицы не создадутся. На последующих изменениях схемы: `bun run db:generate` → commit → push.

## 5. Telegram

1. **Login Widget**: в @BotFather → `/setdomain` → `zsurvive.fun` (иначе вход не заработает).
2. **Webhook**: после первого успешного деплоя запустить разово (Railway → App → шелл/one-off command, env уже подставлен):
   ```bash
   bun run bot:set-webhook
   ```
   Использует `PUBLIC_SITE_URL` + `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET`.
3. **Канал дайджеста**: добавить бота **админом** канала из `TELEGRAM_CHANNEL_ID`.
4. Личные уведомления приходят только тем, кто нажал **Start** у бота (кнопка «Подключить бота» в профиле).

## 6. Platega

ЛК Platega → Настройки → Callback URLs → добавить:

```
https://zsurvive.fun/api/payments/platega/callback
```

(callback требует публичный HTTPS — на Railway это выполняется).

## 7. После деплоя — проверка

- Открыть https://zsurvive.fun — главная, правила, оферта.
- Войти через Telegram → попасть в `/app/game`.
- Нажать Start у бота → проверить, что приходит подтверждение.
- Проверить кнопку «Я жив», торговца, рейтинг.
- Тестовый платёж (расширение инвентаря) → оплата СБП → возврат → статус confirmed → +1 ячейка.

## Заметки

- In-process джобы (sweep, лидерчарт, сезоны, дайджест) и BullMQ-воркер используют Redis-локи, поэтому несколько реплик безопасны. Для старта достаточно **1 реплики**.
- Внешние cron-эндпоинты (`/api/cron/sweep`, `/api/cron/death-digest`) защищены `CRON_SECRET` — можно дёргать из Railway Cron при желании, но in-process джобы уже всё делают сами.
