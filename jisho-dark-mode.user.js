// ==UserScript==
// @name         Jisho Dark Mode
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  try to take over the world!
// @author       sheodox
// @match        https://jisho.org/*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const styleTxt = `
body {
    filter: invert(1);
    background: #42474c;
}
header {
    /* weird black background on header */
    background: none !important;
}
/* hide okurigana */
.japanese_word__furigana-invisible {
    color: transparent;
}
/* counteract filtering on tags */
.concept_light-tag {
    filter: invert(1);
}
/* make search text stand out better */
#keyword {
    color: black;
}
`;

    const style = document.createElement('style');
    style.textContent = styleTxt;
    document.head.appendChild(style);
})();
