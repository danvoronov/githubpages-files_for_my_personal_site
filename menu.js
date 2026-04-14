const colorMap = {
	'm': 'd12e4b',
	'na': '5b0b1f',
	'n': '61c282',
	'u': '2f557c',
	'a': '9158ad',
	'b': '5f58ad',
	'r': 'cf7b02',
	'c': '657475'
};

const menuItems = [
	{ id: 0, group: 'm', radius: 350 },
	{ id: 2, group: 'na', radius: 96, url: 'startups/' },
	{ id: 1, group: 'na', radius: 92, url: 'educator/' },
	{ id: 3, group: 'r', radius: 75, url: 'studied/' },
	{ id: 4, group: 'a', radius: 65, url: 'art/' },
	{ id: 5, group: 'n', radius: 45, url: 'now/' },
	{ id: 6, group: 'b', radius: 60, url: 'articles/' },
	{ id: 7, group: 'u', radius: 58, url: 'updates/' },
	{ id: 8, group: 'c', radius: 7 },
	{ id: 9, group: 'c', radius: 7 },
	{ id: 10, group: 'c', radius: 6 },
	{ id: 21, group: 'c', radius: 15, url: 'https://danvoronov.notion.site/Portfolio-Dan-Voronov-161bb25a23f14cddbc3a00242592762b?pvs=74' },
	{ id: 22, group: 'c', radius: 15, url: 'https://www.linkedin.com/in/danvoronov/' }
];

const menuLabels = {
	en: {
		0: 'DanVóronov',
		1: '🗣 Speaker\n& Tutor',
		2: '🔨 Startups\n& Projects',
		3: '📚 Studied',
		4: '🧪 ART',
		5: '⏳ Now',
		6: '📝 Articles',
		7: '✳️ Updates',
		8: '',
		9: '',
		10: '',
		21: 'Portfolio',
		22: 'LinkedIn'
	},
	uk: {
		0: 'Дан Вóронов',
		1: '🗣 Спікер\nі тьютор',
		2: '🔨 Стартапи\nта проєкти',
		3: '📚 Вивчене',
		4: '🧪 Мистецтво',
		5: '⏳ Зараз',
		6: '📝 Статті',
		7: '✳️ Оновлення',
		8: '',
		9: '',
		10: '',
		21: 'Портфоліо',
		22: 'LinkedIn'
	}
};

function buildMenu(locale) {
	const labels = menuLabels[locale];
	return menuItems.map(function(item) {
		return Object.assign({}, item, { txt: labels[item.id] || '' });
	});
}

const mainMenu = buildMenu('en');
const mainMenu_uk = buildMenu('uk');

if (typeof window !== 'undefined') {
	window.mainMenu = mainMenu;
	window.mainMenu_uk = mainMenu_uk;
}
