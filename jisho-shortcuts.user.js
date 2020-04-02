// ==UserScript==
// @name         Jisho Shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.2.7
// @description  Hotkeys for some actions on jisho.org
// @author       sheodox
// @match        https://jisho.org/*
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    let jpVoice;
    const voiceReady = new Promise(resolve => {
        function checkVoices() {
            jpVoice = speechSynthesis.getVoices().find(voice => {
                return voice.lang === 'ja-JP' || voice.lang === 'ja';
            });

            if (jpVoice) {
                resolve();
            }
        }
        speechSynthesis.onvoiceschanged = checkVoices; //chrome
        checkVoices(); //firefox
    });

    const say = (text) => {
        if (!text) {
            return;
        }
        speechSynthesis.cancel();
        voiceReady.then(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = jpVoice;
                speechSynthesis.speak(utterance);
            }
        )
    };

    const autoReadWordsKey = 'auto-read-words';
    let lastWord = firstResultText(),
        autoReadWords = GM_getValue(autoReadWordsKey, true);

    if(autoReadWords) {
        sayFirstWord();
    }
    // read out the words as they change, like when the user clicks through the different words in a sentence
    setInterval(() => {
        const newWord = firstResultText();
        if (newWord !== lastWord && autoReadWords) {
            lastWord = newWord;
            sayFirstWord();
        }
    }, 20);

    //susc = shortcut user script
    const $keyInfo = $(`
        <div id="susc-container">
            <style>
                #susc-container {
                    position: fixed;
                    top: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    z-index: 10000; 
                }
                #susc-container > * {
                    margin-bottom: 0.3rem;
                }
            </style>
        </div>
    `);
    function makeHeaderButton(buttonHTML, key) {
        const button = document.createElement('button');
        button.innerHTML = buttonHTML;
        button.addEventListener('click', () => {
            handle(key);
        });
        Object.assign(button.style, {
            padding: '5px',
            marginRight: '5px',
            backgroundColor: 'rgb(238, 238, 238)',
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
    //inside a container to prevent the input and label from being on their own lines in the flex-direction column container
    const $autoRead = $(`
        <div>
            <input type="checkbox" id="auto-read-words" />
            <label for="auto-read-words">Auto read words</label>
        </div>
    `);
    $autoRead.find('input')
        .prop('checked', autoReadWords)
        .on('change', ({target}) => {
            autoReadWords = target.checked;
            GM_setValue(autoReadWordsKey, autoReadWords);
        });

    $keyInfo.append($autoRead).appendTo('body');

    function handle(code) {
        const searchField = document.querySelector('#keyword'),
            firstResult = firstResultText();

        switch (code) {
            case 's':
                searchField.focus();
                searchField.select();
                break;
            case 'c':
                //copy
                searchField.select();
                document.execCommand('copy');
                break;
            case 'w':
                //open search for first word on dictionary.goo.ne.jp
                openTab('http://dictionary.goo.ne.jp/srch/all/' + encodeURIComponent(firstResult) + '/m0u/');
                break;
            case 'r':
                //play sound
                sayFirstWord();
                break;
            case 'g':
                //google the word
                openTab(`https://www.google.com/search?q=${firstResult}`);
                break;
            case 'q':
                //read the whole search text
                say(searchField.value);
                break;
            case 'ArrowLeft':
                selectSiblingWord('prev');
                break;
            case 'ArrowRight':
                selectSiblingWord('next');
                break;
            default:
                return false;
        }
        return true;
    }

    function selectSiblingWord(dir) {
        // #zen_bar is the container for the entire sentence that was looked up, it contains 'ul li span a'
        $('#zen_bar a.current')
            .closest('li')
            [`${dir}Until`](null, ':has(a)')
            .eq(0)
            .find('a')
            .click();
    }

    function firstResultText() {
        const firstResultContainer = document.querySelector('.concept_light');
        //safety check in case there are no results
        if (firstResultContainer) {
            return firstResultContainer.querySelector('.concept_light-representation .text').textContent.trim();
        }
    }
    function firstResultDetails() {
        return search(firstResultText());
    }

    function openTab(url) {
        GM_openInTab(url, {
            active: true,
            insert: true,
            setParent: true
        })
    }

    document.body.addEventListener('keydown', async e => {
        if (e.target.tagName.toLowerCase() !== 'input') {
            if (handle(e.key)) {
                e.preventDefault();
            }
        }
    });

    async function sayFirstWord() {
        const $audio = $('.concept_light:first a[data-id^=audio]');
        if ($audio.length) {
            $audio.click();
        }
        else {
            const details = await firstResultDetails(),
                reading = details?.japanese?.[0].reading;
            //sometimes just telling speach synthesis to read the full kanji-ified uses the wrong reading
            say(reading);
        }
    }

    const cachedSearches = [];
    async function search(searchText) {
        if (!searchText) {
            return;
        }
        if (!cachedSearches[searchText]) {
            const result = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(searchText)}`).then(res => res.json());

            if (result.meta.status === 200) { //success
                cachedSearches[searchText] = result.data[0];
                return result.data[0];
            }
        }
        if (cachedSearches[searchText]) {
            return cachedSearches[searchText];
        }
    }

})();
