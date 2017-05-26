// ==UserScript==
// @name         Memrise Add Wizard
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Wizard for adding words to a course
// @author       sheodox
// @match        https://www.memrise.com/course/*/edit/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    const $styles = $(`
    <style>
    .control-panel {
        position: fixed;
        z-index: 10000000;
        padding: 0.5rem 3rem 3rem 3rem;
        background: #434c59;
        color: white !important;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        max-height: 80%;
    }
    .control-panel .control-panel-content {
        overflow: auto;
    }
    .control-panel h2 {
        color: white !important;
    }
    .control-panel label {
        display: inline-block;
        margin: 0 2px;
    }
    .control-panel input {
        background-color: #23282f;
        border: none;
    }
    .control-panel .columns {
        clear: both;
    }
    .control-panel .columns .one-half {
        width: 400px;
    }
    .control-panel .columns > :first-child {
        float: left;
    }
    .control-panel .columns > :last-child {
        margin-left: 2rem;
        float: right;
    }
    .control-panel textarea#working-definition {
        resize: both;
        width: 100%;
        height: 150px;
        margin-bottom: 1rem;
    }
    .control-panel #submit-definition {
        float: right;
    }
    .control-panel #goo-definition > ol {
        list-style: none;
    }
    .control-panel .supplemental_info {
        display: block;
        font-size: 75%;
    }
    .control-panel .control-panel-close {
        position: absolute;
        right: 0;
        top: 0;
    }
    .control-panel button {
        padding: 0.65rem 1.2rem;
        background: #38414c;
        border: none;
        border-radius: 0;
        color: white;
        box-shadow: none;
    }
    .control-panel button:hover {
        background: #556172;
    }
    </style>`).appendTo('head');

    function createDialog(title) {
        const $dlg = $(`
        <div class="control-panel">
            <h2></h2>
            <button class="control-panel-close">Ｘ</button>
            <div class="control-panel-content"></div>
        </div>
        `).appendTo('body');
        $dlg.find('h2').text(title);
        $dlg.find('.control-panel-close').on('click', () => {
            $dlg.remove();
        });
        return [$dlg.find('.control-panel-content'), function() { $dlg.remove(); }];
    }

    let $row,
        wordFields;
    function showWizard() {
        wordFields = {};
        getContext()
            .then(getWord)
            .then(lookupWord)
            .then(commit);
    }

    //grab the necessary piece of the document before parsing with jQuery to avoid CSRF issues
    function parseAndSelect(html, selector) {
        let tmp = document.implementation.createHTMLDocument();
        tmp.body.innerHTML = html;
        //get rid of some problem elements
        ['img', 'script', 'svg'].forEach(function(tag) {
            const nodes = tmp.querySelectorAll(tag);
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].remove();
            }
        });

        const $page = $($.parseHTML(tmp.querySelector(selector).outerHTML));

        $page.find('a').each(function() {
            const href = this.getAttribute('href');
            this.setAttribute('target', '_blank');
        });
        return $page;
    }
    function getContext() {
        return new Promise(res => {
            const [$dialog, close] = createDialog("Context Sentence");
            $dialog.append(`
            <label for="context-sentence">Paste context sentence:</label>
            <input id="context-sentence">
            `);
            $dialog.find('#context-sentence')
                .focus()
                .on('paste', function(e) {
                    wordFields.context = e.originalEvent.clipboardData.getData('text');
                    close();
                    res();
                });
        });
    }

    function searchGoo(encoded) {
        return new Promise((resolve, reject) => {
            get(`https://dictionary.goo.ne.jp/srch/all/${encoded}/m1u/`)
                .then(result => {
                    const firstWordUrl = parseAndSelect(result, '#NR-main a').attr('href');
                    //make sure it's a goo link, could otherwise be a twitter link
                    if (firstWordUrl.indexOf('/') === 0) {
                        get(`https://dictionary.goo.ne.jp${firstWordUrl}`)
                            .then(resolve, reject);
                    }
                    else {
                        reject('Word not found.');
                    }
                });
        });
    }

    function getWord() {
        return new Promise(res => {
            const [$dialog, close] = createDialog('Select The Word');
            $dialog.append(`
                <p>Please select the word you want to study.</p>
                <p id="context-sentence"></p>
            `);
            $dialog.find('#context-sentence')
                .text(wordFields.context)
                .on('mouseup', function() {
                    wordFields.common = window.getSelection().toString();
                    res();
                    close();
                });
        });
    }

    function get(url) {
        return new Promise((res, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    res(response.responseText);
                }
            });
        });
    }

    function lookupWord() {
        return new Promise(res => {
            const [$dialog, close] = createDialog('Definition Lookup'),
                encoded = encodeURIComponent(wordFields.common);
            get(`http://jisho.org/search/${encoded}`)
                .then(html => {
                    const $jishoInfo = parseAndSelect(html, '.concept_light');
                    //try to parse accurate kana
                    const $furigana = $jishoInfo.find('.furigana').find('span'), //each character is represented by a span, empty span means it's not above a kanji
                        common = $jishoInfo.find('.concept_light-representation .text').text().trim();

                    wordFields.kana = [].reduce.call(common, function(done, next, index) {
                        const correspondingFurigana = $furigana.eq(index).text().trim();
                        return done + (correspondingFurigana ? correspondingFurigana : next);
                    }, '');
                    wordFields.common = common;

                    $jishoInfo.find('.sentences').remove();
                    $dialog.find('#word-info').text(`${wordFields.common} - ${wordFields.kana}`);
                    $dialog.find('#jisho-definition').html($jishoInfo.find('.meanings-wrapper').html());

                    searchGoo(encodeURIComponent(common))
                        .then(html => {
                            const $gooInfo = parseAndSelect(html, '#NR-main'),
                                $explanation = $gooInfo.find('.explanation');
                            $explanation.find('a').each(function() {
                                const href = this.getAttribute('href');
                                if (href.indexOf('/') === 0) {
                                    this.setAttribute('href', 'https://dictionary.goo.ne.jp/' + href);
                                }
                                else {
                                    this.removeAttribute('href');
                                }
                            });

                            $dialog.find('#goo-word').text($gooInfo.find('.header.ttl-a.ttl-a-jn').text());
                            $dialog.find('#goo-definition').html($explanation.html());
                        })
                        .catch(error => {
                            $dialog.find('#goo-definition').text(error);
                        })
                });

            $dialog.append(`
            <button id="read-word">🔊</button>
            <span id="word-info"></span>
            <br>
            <label for="working-definition">Definition:</label>
            <br>
            <textarea id="working-definition"></textarea>
            <br>
            <button id="submit-definition">Definition Complete!</button>
            <br>
            <div class="columns" id="definition-selection">
                <div class="column one-half">
                    <p>Jisho</p>
                    <div id="jisho-definition"></div>
                </div>
                <div class="column one-half goo">
                    <p>Goo - <span id="goo-word"></span></p>
                    <div id="goo-definition"></div>
                </div>
            </div>
            `);

            $dialog.find('#read-word').on('click', function() {
                const utterance = new SpeechSynthesisUtterance(wordFields.kana);
                utterance.voice = speechSynthesis.getVoices()
                        .find(voice => {return voice.lang === 'ja-JP'});
                speechSynthesis.speak(utterance);
            });

            const $definition = $('#working-definition');
            $dialog.find('#definition-selection')
                .on('mouseup', function() {
                    const selection = window.getSelection().toString(),
                        def = $definition.val().trim() + ' ' + selection.trim();
                    $definition.val(def);
                    wordFields.definition = def;
                });

            $dialog.find('#submit-definition').on('click', function() {
                res();
                close();
            });
        });
    }

    function commit() {
        function setInput(columnNumber, val) {
            $row.find(`td[data-key="${columnNumber}"] input`).val(val);
        }
        setInput('1', wordFields.common);
        setInput('2', wordFields.definition);
        setInput('3', wordFields.kana);
        setInput('4', wordFields.context);
        $row.find('input:first').focus();
    }

    //listen for Alt + W on an input to show the wizard
    $('body')
        .on('keydown', 'tbody.adding td input', function(e) {
            if (e.which === 87 && e.altKey) {
                $row = $(this).parents('tr');
                showWizard();
            }
        });
})();