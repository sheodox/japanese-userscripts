// ==UserScript==
// @name         Memrise Editor Enhancements
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Some convenience improvements for editing Memrise courses.
// @author       sheodox
// @match        https://www.memrise.com/course/*/edit/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';
    const $styles = $(`
    <style>
    #control-panel {
        position: fixed;
        right: 0;
        top: 0;
        z-index: 10000000;
        padding: 1rem;
        background: #434c59;
        color: white;
    }
    #control-panel label {
        display: inline-block;
        margin: 0 2px;
    }
    #control-panel input[type=checkbox] {
        margin: 0;
    }
    #control-panel input {
        color: black;
    }
    </style>`),
        $toolbar = $(`<div id="control-panel"></div>`).appendTo('body'),
        $searchStyles = $('<style></style>').appendTo('body');

    //search results hider
    $('<input id=showSearchResults type=checkbox>')
        .on('change', function() {
            GM_setValue('showSearchResults', this.checked);
            correctSearchVisibility();
        })
        .appendTo($toolbar)
        .prop('checked', GM_getValue('showSearchResults'));

    function correctSearchVisibility() {
        const show = GM_getValue('showSearchResults');
        $searchStyles.text(
            show ? '' :
                `tbody.searching { display: none !important; }`
        );
    }
    correctSearchVisibility();

    $('<label for=showSearchResults>Show search</label>').appendTo($toolbar);
    $styles.appendTo('body');

    $toolbar.append('<br>');

    //auto-populate
    $('<label for=source-autofill>Source Autofill</label>')
        .appendTo($toolbar);
    $('<input id=source-autofill />')
        .val(GM_getValue('sourceAutofill') || '')
        .on('change', function() {
            GM_setValue('sourceAutofill', this.value);
        })
        .appendTo($toolbar);

    function autofill($source) {
        if (!$source.val()) {
            $source.val(GM_getValue('sourceAutofill') || '');
        }
    }
    $('body')
        .on('focus', 'tbody.adding td input', function() {
            autofill($(this).parents('tr').find('td[data-key=5] input'));
        });
})();
