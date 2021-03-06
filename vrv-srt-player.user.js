// ==UserScript==
// @name         VRV SRT Player
// @namespace    http://tampermonkey.net/
// @version      0.0.16
// @description  Display SRT format subtitles on VRV
// @author       sheodox
// @match        https://static.vrv.co/vilos/player.html
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

const showOnTopStyles = {
        position: 'absolute',
        zIndex: '1000000000'
    },
    centeredStyles = Object.assign({
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    }, showOnTopStyles);


(function() {
    'use strict';

    let sr;

    /**
     * Runs when a new video plays. Prompts for the SRT file and kicks off the subtitling process.
     */
    function promptSRT() {
        //storing the last used SRT file for easy debugging
        const lastSRTKey = 'sr-last-srt';
        //remove everything for the previous subrenderer
        console.log(`\n\nNEW VIDEO\n\n`);
        if (sr) {
            sr.destroy();
        }
        let ta = document.createElement('textarea');
        ta.setAttribute('placeholder', 'paste SRT file contents here');

        //check if an SRT file has been pasted in (polling so both Ctrl+V and "Paste" from context menu are caught).
        function pollForSRT() {
            let srt = ta.value;
            //if you hit 'l' it should load the last used srt
            if (srt === 'l') {
                ta.value = GM_getValue(lastSRTKey);
            }
            else if (srt.length) {
                GM_setValue(lastSRTKey, srt);
                sr = new SubRenderer(ta.value);
                ta.remove();
                return;
            }
            setTimeout(pollForSRT, 50);
        }
        pollForSRT();

        Object.assign(ta.style, centeredStyles);
        document.body.appendChild(ta);
        ta.focus();
    }
    
    //poll for video changes
    let lastSrc = '';
    setInterval(() => {
        //query the video each time, i think the whole element gets removed and replaced
        const curSrc = document.querySelector('video').getAttribute('src');
        if (curSrc && curSrc !== lastSrc) {
            lastSrc = curSrc;
            promptSRT();
        }
    }, 50);
})();

class SubRenderer {
    constructor(srt) {
        this.srt = new SRT(srt);
        if (!this.srt.subs.length) {
            alert('Error parsing subtitles! Please notify sheodox with the video and subs used so I can fix this.');
            return;
        }
        this.video = document.querySelector('video');
        this.videoController = new VideoController(this.video);
        this.alignmentKey = 'last-used-alignment';
        
        this.DOM = {};

        this.initSubElement();
        this.initSubAlignPrompt();
        this.initTray();
        
        console.log(`SubRenderer for ${this.video.src} initialized`);
        this.frame();
    }

    /**
     * Create elements for the tray on the side.
     */
    initTray() {
        const tray = this.createTopLevelElement('tray', 'section', {
                zIndex: '100000000000', //higher than everything else
                position: 'absolute',
                right: '0',
                height: '90%',
            }),
            inTray = sel => tray.querySelector(sel);
        tray.className = 'SR-tray'; //sr = subtitle renderer
        tray.innerHTML = `
            <h1>SubRenderer</h1>
            <button id="sr-settings-open">Settings</button>
            <div id="sr-settings" class="sr-hidden">
                <button class="realign" title="Click when the first subtitled line is said to align the timestamps on the SRT file to the actual video time.">Realign subs</button>
                <br>
                <input id="show-subs" type="checkbox" checked>
                <label for="show-subs">Show subs over video</label>
                <br>
                <input id="pause-on-tray" type="checkbox" checked>
                <label for="pause-on-tray">Pause when tray is open</label>
            </div>
            <h2 id="sub-history-heading">Subtitle History</h2>
            <ul class="recent-subs" style="list-style: none;"></ul>
            
            <style>
            
                :root {
                    --tray-br: 3px;
                }
                .SR-tray {
                    margin-top: 0.5rem;
                    width: 2vw;
                    background: rgba(255, 255, 255, 0.1);
                    overflow: auto;
                }
                .SR-tray > * {
                    visibility: hidden;
                }
                .SR-tray:hover {
                    width: 25vw;
                    background: rgb(33, 39, 55);
                    border-radius: var(--tray-br);
                }
                .SR-tray:hover > * {
                    visibility: visible;
                }
                .SR-tray * {
                    color: white;
                }
                .SR-tray h1 {
                    font-size: 2rem;
                    background: rgb(27, 26, 38);
                    padding: 0.5rem 0;
                    border-radius: 3px;
                    margin: 0 0 0.5rem 0;
                    border-bottom: 2px solid #f47521;
                }
                .SR-tray h2 {
                    margin-bottom: 0;
                    text-decoration: underline;
                }
                .SR-tray button, .SR-button {
                    background: #fd0;
                    border: none;
                    cursor: pointer;
                    padding: 10px;
                    line-height: 1;
                    font-weight: bold;
                    color: black;
                    text-transform: uppercase;
                }
                .SR-tray button:hover, .SR-button:hover {
                    background: #ffea6d;
                }

                .recent-subs {
                    padding-top: 0;
                    margin-top: 0;
                }

                .recent-subs li {
                    transform: scaleY(0);
                    transform-origin: top;
                    transition: transform 0.5s ease;
                    color: white;
                    font-size: 1.4rem;
                }
                .recent-subs li:hover {
                    color: #11caf4;
                    cursor: pointer;
                }
                .recent-subs li:not(:first-of-type)::before {
                  content: ' ';
                  position: relative;
                  background: #f47521;
                  height: 0.1rem;
                  width: 3.2rem;
                  display: block;
                  margin: 0 auto;
                  border-radius: 4px;
                }
                #SR-sub-track p {
                    margin: 0;
                    padding: 0;
                    text-shadow: black 1px 1px 0, black 1px -1px 0, black -1px 1px 0, black -1px -1px 0, black 1px 0 0, black 0 1px 0, black -1px 0 0, black 0 -1px 0, black 1px 1px 1px;
                }
                #sr-settings-open {
                    position: absolute;
                    right: 0;
                    top: 0;
                }
                .sr-hidden {
                    display: none;
                }

            
</style>
        `;
        
        inTray('button.realign').addEventListener('click', () => this.realign());
        this.DOM.settingsOpen = inTray('#sr-settings-open');
        this.DOM.settingsPanel = inTray('#sr-settings');
        this.DOM.recentSubs = inTray('.recent-subs');
        this.DOM.showSubs = inTray('#show-subs');
        this.DOM.pauseOnTray = inTray('#pause-on-tray');

        this.DOM.settingsOpen.addEventListener('click', () => {
            this.DOM.settingsPanel.classList.toggle('sr-hidden');
        });

        tray.addEventListener('mouseenter', () => {
            if (this.DOM.pauseOnTray.checked) {
                this.videoController.addPauser('tray');
            }
        });
        tray.addEventListener('mouseleave', () => {
            this.videoController.removePauser('tray');
        });
    }

    /**
     * Create the button that's used to align the sub times.
     */
    initSubAlignPrompt() {
        const lastAlignment = GM_getValue(this.alignmentKey),
            createButton = () => {
                const b = document.createElement('button');
                b.classList.add('SR-button');
                return b;
            };
        
        this.createTopLevelElement('alignmentSetContainer', 'div', {
            fontSize: '2rem',
            ...centeredStyles
        });
        const setAlignmentBtn = createButton();
        //use when a button is clicked to get the difference between the time things are actually said and the specified time in the SRT
        setAlignmentBtn.textContent = 'Click when the first line is said: ';
        //not in this.DOM because it's contained by something else, not necessary to clean up individually
        const firstLine = document.createElement('pre');
        firstLine.textContent = this.srt.subs[0].text;
        setAlignmentBtn.appendChild(firstLine);
        this.DOM.alignmentSetContainer.appendChild(setAlignmentBtn);
        
        if (typeof lastAlignment === 'number') {
            this.DOM.alignmentSetContainer.appendChild(document.createElement('br'));
            const lastAlignmentBtn = createButton();
            lastAlignmentBtn.textContent = `Use the last alignment (first line at ${(lastAlignment / 1000).toFixed(1)} seconds)`;
            this.DOM.alignmentSetContainer.appendChild(lastAlignmentBtn);
            lastAlignmentBtn.addEventListener('click', () => {
                this.DOM.alignmentSetContainer.remove();
                this.realign(lastAlignment);
            })
        }
        
        this.aligned = false;
        setAlignmentBtn.addEventListener('click', () => {
            this.DOM.alignmentSetContainer.remove();
            this.realign();
        });
        this.subOffset = 0;
    }
    realign(alignment) {
        this.subOffset = alignment || this.video.currentTime * 1000 - this.srt.subs[0].start - 400; //assume decent reaction time
        this.aligned = true;
        GM_setValue(this.alignmentKey, this.subOffset)
    }

    /**
     * Create the element that displays the current subtitle.
     */
    initSubElement() {
        this.createTopLevelElement('subEl', 'pre', {
            fontSize: '1.5rem',
            textAlign: 'center',
            color: 'white',
            width: '100vw',
            cursor: 'pointer',
        });
        
        this.DOM.subEl.id = 'SR-sub-track';

        this.DOM.subEl.setAttribute('title', 'Click to search this line on Jisho\nRight click to search the previous line');

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.videoController.removePauser('define');
            }
        });

        this.DOM.subEl.addEventListener('click', () => {
            this.define(this.currentSub);
        });
        this.DOM.subEl.addEventListener('contextmenu', e => {
            this.define(this.previousSub);
            e.preventDefault();
        });
    }
    
    createTopLevelElement(name, tag, styles={}) {
        const el = document.createElement(tag);
        if (this.DOM[name]) {
            throw new Error(`element with name ${name} already exists. change one of them so SubRenderer destroy functions.`);
        }
        this.DOM[name] = el;
        Object.assign(el.style, {}, styles, showOnTopStyles);
        document.body.appendChild(el);
        return el;
    }
    
    destroy() {
        this.dead = true;
        Object.keys(this.DOM).forEach(elName => {
            const el = this.DOM[elName];
            if (el) {
                el.remove();
            }
        });
    }
    
    define(sub) {
        window.open(`https://jisho.org/search/${encodeURIComponent(sub)}`);
        this.videoController.addPauser('define');
    };


    /**
     * Display subtitles for the current video time (called on every frame the browser paints).
     */
    frame() {
        if (!this.dead) {
            requestAnimationFrame(() => {
                this.frame();
            });
        }
       
        let line = 0;
        /**
         * Show a line of subtitle text.
         * @param text
         * @param fontScale
         */
        const createLine = (text, fontScale) => {
            //reuse existing element if one exists, otherwise create a new 'p' element for this line of text.
            let el = this.DOM.subEl.children[line];
            if (!el) {
                el = document.createElement('p');
                this.DOM.subEl.appendChild(el);
            }
            el.textContent = text;
            //SRT gives us a font size in percentage, sometimes it's real small so make sure it's no less than 0.5rem
            el.style.fontSize = `${0.5 + 3 * fontScale}rem`;
            line++;
        };
        /**
         * For any additional subtitle line elements, empty the text.
         */
        const flushRemainingLines = () => {
            for (let i = line; i < this.DOM.subEl.children.length; i++) {
                this.DOM.subEl.children[i].textContent = '';
            }
        };
        
        //don't show subs until we know we're going to show the correct ones
        if (this.aligned) {
            const subs = this.srt.getSubs(this.video.currentTime * 1000 - this.subOffset);
            //clear old subs if nothing is showing
            if (!subs.length || !this.DOM.showSubs.checked) {
                this.DOM.subEl.innerHTML = '';
            }
            else {
                subs.forEach(sub => {
                   createLine(sub.text, sub.line); 
                });
                flushRemainingLines();
            }
            //if it's a different line, and the currently displayed line isn't just a blank line, cache it as the previous line
            let newestSub = subs[subs.length - 1];
            newestSub = newestSub ? newestSub.text : '';
            if (newestSub && newestSub !== this.currentSub) {
                //only cache the previous sub if it's worth caching
                if (this.currentSub) {
                    this.previousSub = this.currentSub;
                }
                
                this.insertSubIntoHistory(newestSub);
            }
            this.currentSub = newestSub;
        }
    }
    insertSubIntoHistory(text) {
        if (!text) return;
        
        const li = document.createElement('li');
        li.textContent = text;
        
        this.DOM.recentSubs.appendChild(li);
        li.style.maxHeight = getComputedStyle(li).height;
        
        setTimeout(() => {
            li.style.transform = 'scaleY(1)';
        }, 1);
        
        li.addEventListener('click', () => {
            this.define(text)
        });
        
        if (this.DOM.recentSubs.children.length > 10) {
            this.DOM.recentSubs.firstChild.remove();
        }
    }
}

class VideoController {
    constructor(videoElement) {
        this.video = videoElement;
        this.reasons = [];
    }
    //adds a reason to pause the video, allowing multiple things to have a reason to pause the video without them fighting for control
    addPauser(reason) {
        this.reasons.push(reason);
        this._checkPause();
    }
    removePauser(reason) {
        const i = this.reasons.indexOf(reason);
        if (i !== -1) {
            this.reasons.splice(i, 1);
            this._checkPause();
        }
    }
    //if there's no reason the video should be paused, play it
    _checkPause() {
        if (this.reasons.length) {
            this.video.pause();
        }
        else {
            this.video.play();
        }
    }
}

/**
 * Parser for SRT files. Can return an array of subtitles and their styling at any point in time during a video.
 */
class SRT {
    constructor(srt) {
        this.parse(srt);
    }
    parse(srt) {
        //split subs up by the double line breaks
        const subs = srt.split('\n\n');
        this.subs = subs.reduce((done, sub) => {
            let lines = sub.trim().split('\n');

            /**
             * shift the array of lines for this sub entry, consider the current index 0 line processed
             */
            function shift() {
                lines.shift();
            }
            try {
                //sometimes subs come numbered with a number on the line above the start/end times, throw it away
                if (/^\d*$/.test(lines[0])) {
                    shift();
                }
                let [startStr, endStr] = lines[0]
                        //second decimal point could be a comma, make it a period
                        .replace(/,/g, '.')
                        .match(/^([\d:\.\-> ]*)/)
                        [0].split(/\-\->/),
                    styling = lines[0].match(/([a-zA-Z].*)/); //the rest of the line starting at the first alphabetical character
                styling = styling && styling.length ? styling[1] : ''; //might not have styling cues
                
                const getPercentCue = name => {
                        const match = styling.match(new RegExp(`${name}:([\\d\\.]*)%`));
                        if (match) {
                            return parseInt(match[1], 10) / 100;
                        }
                    },
                    //percentage of the total line area that is taken up by this subtitle
                    line = getPercentCue('line') || 1;
                shift();

                done.push({
                    start: this.toMS(startStr),
                    end: this.toMS(endStr),
                    text: lines.join('\n').replace(/<\/?c.Japanese>/g, ''),
                    line
                });
            } catch(e){}
            return done;
        }, []);
    }
    getSubs(ms) {
        return this.subs.filter(sub => {
            return sub.start <= ms && sub.end >= ms;
        });
    }
    toMS(timeStr) {
        const [hr, min, sec] = timeStr.trim().split(':');
        return sec * 1000 + min * 1000 * 60 + hr * 1000 * 60 * 60;
    }
}
