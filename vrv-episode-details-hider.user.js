// ==UserScript==
// @name         VRV Episode Details Hider
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       sheodox
// @match        https://vrv.co/watch/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	const style = document.createElement('style'),
		// if we change the markup of the title to censor things then for whatever reason the title won't
		// change text when going between episodes. so we need to get tricky with a couple linear gradients,
		// the first one to roughly attempt to mask over everything after the episode number (shorter titles
		// might expose part of the title. a better solution would adjust this based on the number of digits
		// in the episode number), the second gradient masks everything beyond the first line for wrapped titles
		exposedTitleWidth = '75px',
		exposedTitleHeight = '30px';
	style.textContent = `
		.description, h2.title {
			color: white !important;
			opacity: 0.2 !important;
		}
		.description {
			background: white !important;
		}
		h2.title {
			background: linear-gradient(to right, transparent 0, transparent ${exposedTitleWidth}, white ${exposedTitleWidth}), linear-gradient(to bottom, transparent 0, transparent ${exposedTitleHeight}, white ${exposedTitleHeight}, white)
		}
		
		.description:hover, h2.title:hover {
			background: transparent !important;
			opacity: 1 !important;
		}
	`;
	document.head.appendChild(style);
})();