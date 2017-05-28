// ==UserScript==
// @name         Jisho Shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Hotkeys for some actions on jisho.org
// @author       sheodox
// @match        http://jisho.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function handle(code) {
        const searchField = document.querySelector('#keyword'),
            firstResult = document.querySelector('.concept_light-representation .text').textContent.trim();
        switch (code) {
            case 83: //s
                searchField.focus();
                searchField.select();
                break;
            case 67: //c
                //copy
                searchField.select();
                document.execCommand('copy');
                break;
            case 87: //w
                //open search for first word on dictionary.goo.ne.jp
                window.open('http://dictionary.goo.ne.jp/srch/all/' + encodeURIComponent(firstResult) + '/m0u/');
                break;
            default:
                return false;
        }
        return true;
    }

    document.body.addEventListener('keydown', e => {
        if (e.target.tagName.toLowerCase() !== 'input') {
            if (handle(e.which)) {
                e.preventDefault();
            }
        }
    });
})();