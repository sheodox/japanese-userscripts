# Japanese Userscripts

This repo is a collection of userscripts for [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) I've made for helping studying Japanese.

## [jisho-shortcuts.user.js](https://github.com/sheodox/japanese-userscripts/raw/master/jisho-shortcuts.user.js)

Several shortcut keys for Jisho.org searches (while not typing in the search bar):

* **s** - select search field text
* **c** - copy search field text
* **w** - search on Goo dictionary
* **r** - play/synth audio for first result
* **q** - read entire search text
* **g** - google the word

## [memrise-add-wizard.user.js](https://github.com/sheodox/japanese-userscripts/raw/master/memrise-add-wizard.user.js)

A wizard of sorts for easily adding words to a course. Press **Alt + W** while focusing an input in the 'add' row and paste the context sentence in the dialog, then select the word you wish to study. Then enter a definition by selecting pieces of the Jisho/Goo definitions (selecting text will automatically add it to the definition). Hit submit and it'll fill out all the textboxes. It looks like [this.](https://streamable.com/0qvah)

It assumes your course is set up with these columns:

1. Common Japanese
1. Definition
1. Kana
1. Context Sentence

You can click the speaker button to hear the pronunciation and you can choose which spelling to use for the common spelling.

## [memrise-editor-enhancements.user.js](https://github.com/sheodox/japanese-userscripts/raw/master/memrise-editor-enhancements.user.js)

Add a small panel on the top right of the edit page. There's a checkbox for toggling display of the word suggestion search results that appear when filling out fields for a new word. There is also an autofill for a context sentence source for the fifth column to match the context sentence in the course described above. Useful for when adding many words from the same source.

## [yahoo-search-jisho-redirect.user.js](https://github.com/sheodox/japanese-userscripts/raw/master/yahoo-search-jisho-redirect.user.js)

Redirects Yahoo dictionary searches to Jisho searches. Useful with the other userscripts above, especially for ebook readers without a copy function. An entire sentence containing an unknown word can be selected and searched so you can use Jisho and the shortcuts in the Jisho Shortcuts userscript. Hitting 'c' with that installed will copy the context sentence to be easily pasted into the Memrise Add Wizard.

## Context menu scripts

There are three individual scripts here that do similar things to some of the Jisho hotkeys, but appear in your context menu and on all websites.

* [Goo dictionary search](https://github.com/sheodox/japanese-userscripts/raw/master/context-goo-search.user.js)
* [Jisho search](https://github.com/sheodox/japanese-userscripts/raw/master/context-jisho-search.user.js)
* [Read selection](https://github.com/sheodox/japanese-userscripts/raw/master/context-read-selection.user.js)

