// ==UserScript==
// @name         Jisho Shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  Hotkeys for some actions on jisho.org
// @author       sheodox
// @match        https://jisho.org/*
// @grant        none
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
    const $keyInfo = $('<div style="display:inline-block;" />');
    $('h1.logo').css('display', 'inline-block').parent().append($keyInfo);
    [
        `s - select search field text`,
        `c - copy search field text`,
        `w - search on Goo dictionary`,
        `r - play/synth audio for first result`,
        `q - read entire search text`,
        `g - google the word`
    ].forEach(key => {
        const $key = $('<p />')
            .css({
                fontSize: '8pt',
                lineHeight: '12px',
                margin: 0,
                color: 'gray'
            })
            .text(key);
        $keyInfo.append($key);
    });
    
    function handle(code) {
        const searchField = document.querySelector('#keyword'),
            firstResultContainer = document.querySelector('.concept_light'),
            firstResult = firstResultContainer.querySelector('.concept_light-representation .text').textContent.trim();
        
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
            case 82: //r
                //play sound
                const audio = firstResultContainer.querySelector('a[data-id^=audio]');
                audio ? audio.click() : say(firstResult);
                break;
            case 71: //g
                //google the word
                window.open(`https://www.google.com/search?q=${firstResult}`);
                break;
            case 81: //q
                //read the whole search text
                say(searchField.value);
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
