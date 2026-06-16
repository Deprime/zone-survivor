export interface NavLink {
	href: string;
	label: string;
}

export const navLinks: NavLink[] = [
	{ href: '/', label: 'Главная' },
	{ href: '/rules', label: 'Правила' },
	{ href: '/agreement', label: 'Оферта' }
];

export const siteName = 'ZombieLand survivor';
