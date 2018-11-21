// ==UserScript==
// @name         Read Selection
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Use speech synthesis to read the highlighted text
// @author       sheodox
// @match        *://*/*
// @grant        none
// @run-at       context-menu
// ==/UserScript==

(function () {
    let vr;
    if (!vr && !speechSynthesis.onvoiceschanged) {
        vr = new Promise(resolve => {
            speechSynthesis.onvoiceschanged = () => {
                console.log('voices changed');
                resolve();
            };
        });
    }
    else if (speechSynthesis.onvoiceschanged) {
        //something else is already waiting for onvoiceschanged, assume it's another userscript like jisho-shortcuts and just assume they're ready by now
        vr = Promise.resolve();
    }

    function say(text) {
        vr.then(() => {
            const jp = speechSynthesis.getVoices().find(voice => {
                return voice.lang === 'ja-JP';
            });
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = jp;
            speechSynthesis.speak(utterance);
        })
    }

    say(getSelection().toString());
}());
