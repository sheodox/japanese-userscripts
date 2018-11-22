// ==UserScript==
// @name         Jisho Search
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Search Jisho for the selected text.
// @author       sheodox
// @match        *://*/*
// @grant        GM_openInTab
// @run-at       context-menu
// ==/UserScript==

(function () {
    GM_openInTab(`https://jisho.org/search/${encodeURIComponent(getSelection().toString() || prompt('search for what?'))}`, {
        active: true,
        insert: true,
        setParent: true
    })
}());

