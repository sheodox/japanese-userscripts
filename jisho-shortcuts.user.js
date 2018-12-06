// ==UserScript==
// @name         Jisho Shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.2.4
// @description  Hotkeys for some actions on jisho.org
// @author       sheodox
// @match        https://jisho.org/*
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';
    
    let jpVoice;
    const voiceReady = new Promise(resolve => {
        speechSynthesis.onvoiceschanged = () => {
            jpVoice = speechSynthesis.getVoices().find(voice => {
                return voice.lang === 'ja-JP';
            });
            resolve();
        };
    });
    function say(text) {
        voiceReady.then(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = jpVoice;
                speechSynthesis.speak(utterance);
            }
        )
    }

    //say what each key does
    const keys = { s: 83, c: 67, w: 87, r: 82, g: 71, q: 81 };
    const $keyInfo = $('<div />').css({
        whiteSpace: 'nowrap',
        verticalAlign: 'top',
        display: 'inline-block'
    });
    function makeHeaderButton(buttonHTML, key) {
        const button = document.createElement('button');
        button.innerHTML = buttonHTML;
        button.addEventListener('click', () => {
            handle(keys[key]);
        });
        Object.assign(button.style, {
            padding: '5px',
            marginRight: '5px',
            backgroundColor: 'rgb(186, 189, 175)',
            borderRadius: '3px',
            fontSize: '11px'
        });
        $keyInfo.append(button);
    }
    makeHeaderButton(`<u>S</u>elect search`, 's');
    makeHeaderButton(`<u>C</u>opy search`, 'c');
    makeHeaderButton(`Search first <u>w</u>ord on Goo`, 'w');
    makeHeaderButton(`<u>R</u>ead first word`, 'r');
    makeHeaderButton(`Read full <u>q</u>uote`, 'q');
    makeHeaderButton(`<u>G</u>oogle first word`, 'g');
    
    $('h1.logo').css({
        display: 'inline-block'
    }).parent().css({
        width: '50vw'
    }).append($keyInfo);
    
    function handle(code) {
        const searchField = document.querySelector('#keyword'),
            firstResultContainer = document.querySelector('.concept_light'),
            firstResult = firstResultContainer.querySelector('.concept_light-representation .text').textContent.trim();
        
        switch (code) {
            case keys.s: //s
                searchField.focus();
                searchField.select();
                break;
            case keys.c: //c
                //copy
                searchField.select();
                document.execCommand('copy');
                break;
            case keys.w: //w
                //open search for first word on dictionary.goo.ne.jp
                openTab('http://dictionary.goo.ne.jp/srch/all/' + encodeURIComponent(firstResult) + '/m0u/');
                break;
            case keys.r: //r
                //play sound
                const audio = firstResultContainer.querySelector('a[data-id^=audio]');
                audio ? audio.click() : say(firstResult);
                break;
            case keys.g: //g
                //google the word
                openTab(`https://www.google.com/search?q=${firstResult}`);
                break;
            case keys.q: //q
                //read the whole search text
                say(searchField.value);
                break;
            default:
                return false;
        }
        return true;
    }
    
    function openTab(url) {
        GM_openInTab(url, {
            active: true,
            insert: true,
            setParent: true
        })
    }

    document.body.addEventListener('keydown', e => {
        if (e.target.tagName.toLowerCase() !== 'input') {
            if (handle(e.which)) {
                e.preventDefault();
            }
        }
    });
})();
