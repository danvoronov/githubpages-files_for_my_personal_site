const colorMap = {
	'm':'d12e4b',
	'na':'5b0b1f',
	'n':'61c282',
	'a':'9158ad',
	'b':'5f58ad',
	'r':'cf7b02',
	'c':'657475'
}

const mainMenu = [
	{id: 0, txt: 'DanVóronov', group: 'm', radius: 340},
	{id: 2, txt: '⚙️ Startups & Projects', group: 'na', radius: 120, url: 'startups/'},
	{id: 1, txt: '🗣 Speaker & Tutor', group: 'na', radius: 110, url: 'educator/'},
	{id: 3, txt: '⏳ Now', group: 'n', radius: 45, url: 'now/'},
	{id: 4, txt: '🎭 ART', group: 'a', radius: 65, url: 'art/'},
	{id: 5, txt:  '📝 Articles', group: 'b', radius: 60, url: 'articles/'},
	{id: 10, txt: '📚 Studied', group: 'r', radius: 75, url: 'studied/'},
	{id: 21, txt: '🔗 Portfolio', group: 'c', radius: 15, url: 'https://danvoronov.notion.site/Portfolio-Dan-Voronov-161bb25a23f14cddbc3a00242592762b?pvs=74'},
	{id: 22, txt: '🔗 LinkedIN', group: 'c', radius: 15, url: 'https://www.linkedin.com/in/danvoronov/'},
]

// Ukrainian localization of menu labels
const mainMenu_uk = [
	{id: 0, txt: 'Дан Вóронов', group: 'm', radius: 340},
	{id: 2, txt: '⚙️ Стартапи та проєкти', group: 'na', radius: 120, url: 'startups/'},
	{id: 1, txt: '🗣 Спікер і тьютор', group: 'na', radius: 110, url: 'educator/'},
	{id: 3, txt: '⏳ Зараз', group: 'n', radius: 45, url: 'now/'},
	{id: 4, txt: '🎭 Мистецтво', group: 'a', radius: 65, url: 'art/'},
	{id: 5, txt:  '📝 Статті', group: 'b', radius: 60, url: 'articles/'},
	{id: 10, txt: '📚 Вивчене', group: 'r', radius: 75, url: 'studied/'},
	{id: 21, txt: '🔗 Портфоліо', group: 'c', radius: 15, url: 'https://danvoronov.notion.site/Portfolio-Dan-Voronov-161bb25a23f14cddbc3a00242592762b?pvs=74'},
	{id: 22, txt: '🔗 LinkedIn', group: 'c', radius: 15, url: 'https://www.linkedin.com/in/danvoronov/'},
]

// Expose to window for inline scripts
if (typeof window !== 'undefined') {
	window.mainMenu = mainMenu;
	window.mainMenu_uk = mainMenu_uk;
}