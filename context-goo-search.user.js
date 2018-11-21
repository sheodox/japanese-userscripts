// ==UserScript==
// @name         Goo 辞書 Search
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Search Goo 辞書 for the selected text.
// @author       sheodox
// @match        *://*/*
// @grant        GM_openInTab
// @run-at       context-menu
// ==/UserScript==

(function () {
    GM_openInTab('http://dictionary.goo.ne.jp/srch/all/' + encodeURIComponent(getSelection().toString()) + '/m0u/', {
        active: true,
        insert: true,
        setParent: true
    })
}());
