// ==UserScript==
// @name         Jisho Radical Search By Kanji
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Highlight radicals contained by kanji you search for, to find the right radicals faster
// @author       sheodox
// @match        https://jisho.org/*
// @run-at		 document-end;
// @require		 https://cdn.jsdelivr.net/npm/vue/dist/vue.js
// ==/UserScript==

const parser = new DOMParser(),
	kanjiHighlightClass = 'radical-search-highlight',
	mountRoot = document.createElement('div'),
	style = document.createElement('style'),
	mountRootId = 'radical-search-mount-root';

style.textContent = `
.${kanjiHighlightClass} {
	color: black;
	background-color: #1cf2ca;
}
`;
document.head.appendChild(style);

mountRoot.id = mountRootId;

document.getElementById('radical_area').appendChild(mountRoot);

async function getRadicals(kanji) {
	//radical search doesn't seem to be exposed via the API. Web scraping time!
	const searchQuery = encodeURIComponent(`${kanji} #kanji`),
		html = await fetch(`https://jisho.org/search/${searchQuery}`).then(res => res.text()),
		doc = parser.parseFromString(html, 'text/html'),
		//get the text of all the "Parts: ..." links
		radicalLinks = doc
			.querySelectorAll('dl.dictionary_entry.on_yomi dd a')

	return [].map.call(radicalLinks, link => {
		return link.textContent;
	});
}

function highlightRadicals(radicals) {
	const radicalElements = document.querySelectorAll('#radical_area li.radical');

	radicalElements.forEach(radicalElement => {
		const hit = radicals.includes(radicalElement.textContent.trim())
		radicalElement.classList[hit ? 'add' : 'remove'](kanjiHighlightClass);
	});
}

mountRoot.innerHTML = `
<label for="radical-search-field">Search radicals by kanji</label>
<input type="text" id="radical-search-field" @keyup="search" v-model="kanji" autocomplete="off"/>
`;

let searchDebounce;
const app = new Vue({
	el: `#${mountRootId}`,
	data: {
		kanji: ''
	},
	methods: {
		search(e) {
			clearTimeout(searchDebounce);
			searchDebounce = setTimeout(async () => {
				if (!this.kanji) {
					return;
				}
				const radicals = await getRadicals(this.kanji);
				highlightRadicals(radicals);
			}, 500);
		}
	}
})

