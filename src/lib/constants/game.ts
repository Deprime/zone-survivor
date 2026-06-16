/**
 * Тайминги игровой механики ZombieLand survivor.
 * Используются и на сервере (логика нажатия), и на клиенте (обратный отсчёт).
 */

/** Через сколько секунд после нажатия кнопка «Я жив» снова станет активной (12 часов). */
export const COOLDOWN_SECONDS = 12 * 60 * 60;

/** Через сколько секунд без нажатия персонаж погибает (24 часа). */
export const LIFESPAN_SECONDS = 24 * 60 * 60;

/** Сколько токенов начисляется за одно нажатие «Я жив». */
export const TOKENS_PER_PRESS = 1;

/** Период фоновой задачи sweep (фиксация смертей), в секундах. */
export const SWEEP_INTERVAL_SECONDS = 5 * 60;

/** Размер мира: карта MAP_SIZE × MAP_SIZE, координаты 0..MAP_SIZE-1. */
export const MAP_SIZE = 128;

/** Стартовая клетка новых игроков — центр карты. */
export const MAP_START = Math.floor(MAP_SIZE / 2);

/** Радиус видимой мини-карты вокруг игрока: окно (2R+1) × (2R+1). */
export const MAP_VIEW_RADIUS = 4;

/** Шанс найти ящик с токенами при входе на клетку, %. */
export const TOKEN_BOX_CHANCE = 15;
export const TOKEN_BOX_MIN = 2;
export const TOKEN_BOX_MAX = 6;

/** Доля токенов павшего, которую забирает нашедший могилу. */
export const GRAVE_LOOT_RATIO = 0.5;

/** Сколько ходов даётся на поиск/применение антидота после укуса зомби. */
export const ZOMBIE_GRACE_MOVES = 3;

/** С какой недели сезона начинают появляться зомби (1-based). */
export const ZOMBIE_FROM_SEASON_WEEK = 2;

/** Окно после гибели, в течение которого можно воскреснуть или оставить надпись (24 часа). */
export const RESURRECTION_WINDOW_SECONDS = 24 * 60 * 60;

/** Максимальная длина надписи на надгробии. */
export const GRAVE_INSCRIPTION_MAX = 140;

/** Дни недели (ISO: Пн=1..Вс=7), когда работает лавка торговца — конец недели. */
export const MERCHANT_OPEN_ISO_DAYS = [6, 7];

/** Сколько игроков показывать в лидерчарте. */
export const LEADERBOARD_SIZE = 20;

/** Сколько верхних мест получают призы. */
export const LEADERBOARD_PRIZE_TOP = 5;

/** Период обновления снимка лидерчарта (1 час, в секундах). */
export const LEADERBOARD_TTL_SECONDS = 60 * 60;

/** Длительность сезона (≈ месяц), в днях. */
export const SEASON_DURATION_DAYS = 30;

/** Период проверки завершения сезона, в секундах. */
export const SEASON_WATCH_INTERVAL_SECONDS = 5 * 60;

/** Призы по местам в финальном лидерчарте сезона. */
export const SEASON_PRIZES: Record<number, string> = {
	1: 'iPhone 17R',
	2: 'AirPods',
	3: 'AirPods',
	4: 'AirPods',
	5: 'AirPods'
};

/** Час (UTC), после которого раз в сутки шлётся дайджест павших в канал. */
export const DEATH_DIGEST_HOUR_UTC = 20;

/** Максимум имён в одном дайджесте (остальные сворачиваются в «…и ещё N»). */
export const DEATH_DIGEST_MAX_ENTRIES = 50;

/** За сколько секунд до гибели слать предупреждающее уведомление. */
export const DEATH_WARNING_BEFORE_SECONDS = 3 * 60 * 60;
