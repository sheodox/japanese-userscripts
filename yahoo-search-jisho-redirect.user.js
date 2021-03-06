// ==UserScript==
// @name         Yahoo Search Jisho Redirect
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  Redirects yahoo searches to jisho searches for easy lookups from MCBookViewer
// @author       You
// @match        *://dic.yahoo.co.jp/search/?ei=UTF-8&p=*
// @match        *://dic.yahoo.co.jp/search?ei=UTF-8&p=*
// @match        *://dic.yahoo.co.jp/close/?ei=UTF-8&p=*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const terms = (location.search.match(/p=(.*)/)[1]).replace('&stype=prefix&fr=dic', '');
    location.replace('https://jisho.org/search/' + encodeURIComponent(trim(decodeURIComponent(terms))));
})();

function trim(phrase) {
    const remove = regex => {
        phrase = phrase.replace(regex, '');
    };
    phrase = phrase.trim();

    //dangling punctuation/symbols from the previous sentence
    remove(/^[。、！]/);
    //dangling commas
    remove(/[、]$/);

    //if they look up something in english don't count that as a word to review (they can look up the result if they really want it to show up)
    remove(/^[\w\d\s]*$/);


    //remove messy copying (extra punctuation for other sentences), and remove quotes when they're not necessary for the quote.
    //we don't want to remove quotes if it's something like "「うるさいだまれ」って言った" because it changes the meaning.
    [   ['「', '」'],
        ['『', '』'],
        ['【', '】'],
    ].forEach(([open, close]) => {
        const leadingOpen = new RegExp('^' + open),
            leadingClose = new RegExp('^' + close),
            trailingClose = new RegExp(close + '$'),
            trailingOpen = new RegExp(open + '$');

        //starts with an opening quote but doesn't have any closing quotes, assume only part of a quote was selected, no need to keep in quotes
        if (leadingOpen.test(phrase) && !phrase.includes(close)) {
            remove(leadingOpen);
        }
        //same with closing quote
        if (trailingClose.test(phrase) && !phrase.includes(open)) {
            remove(trailingClose);
        }

        //a full quote with quote marks was included and nothing outside it, just remove the quote, it's unnecessary
        if (leadingOpen.test(phrase) && trailingClose.test(phrase)) {
            remove(leadingOpen);
            remove(trailingClose);
        }

        //remove any quotes for quotes that weren't included in the phrase
        remove(trailingOpen);
        remove(leadingClose);
    });

    return phrase;
}
