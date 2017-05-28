# Japanese Userscripts

This repo is a collection of userscripts for [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) I've made for helping studying Japanese.

## jisho-shortcuts.user.js

Several shortcut keys for Jisho.org searches (while not typing in the search bar):

* **w** - look up the current first result on [Goo 辞書](https://dictionary.goo.ne.jp/)
* **s** - focus and select text in the search text box
* **c** - copy the text in the search box

## memrise-add-wizard.user.js

A wizard of sorts for easily adding words to a course. Press **Alt + W** while focusing an input in the 'add' row and paste the context sentence in the dialog, then select the word you wish to study. Then enter a definition by selecting pieces of the Jisho/Goo definitions (selecting text will automatically add it to the definition). Hit submit and it'll fill out all the textboxes.

It assumes your course is set up with these columns:

1. Common Japanese
1. Definition
1. Kana
1. Context Sentence

You can click the speaker button to hear the pronunciation and you can choose which spelling to use for the common spelling.

## memrise-editor-enhancements.user.js

Add a small panel on the top right of the edit page. There's a checkbox for toggling display of the word suggestion search results that appear when filling out fields for a new word. There is also an autofill for a context sentence source for the fifth column to match the context sentence in the course described above. Useful for when adding many words from the same source.

## yahoo-search-jisho-redirect.user.js

Redirects Yahoo dictionary searches to Jisho searches. Useful with the other userscripts above, especially for ebook readers without a copy function. An entire sentence containing an unknown word can be selected and searched so you can use Jisho and the shortcuts in the Jisho Shortcuts userscript. Hitting 'c' with that installed will copy the context sentence to be easily pasted into the Memrise Add Wizard.