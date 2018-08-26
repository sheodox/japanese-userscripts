// ==UserScript==
// @name         Yahoo Search Jisho Redirect
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Redirects yahoo searches to jisho searches for easy lookups from MCBookViewer
// @author       You
// @match        https://dic.yahoo.co.jp/search/?ei=UTF-8&p=*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const terms = (location.search.match(/p=(.*)/)[1]).replace('&stype=prefix&fr=dic', '');
    location.replace('https://jisho.org/search/' + terms.trim());
})();
