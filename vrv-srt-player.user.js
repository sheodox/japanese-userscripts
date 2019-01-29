// ==UserScript==
// @name         VRV SRT Player
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @description  Display SRT format subtitles on VRV
// @author       sheodox
// @match        https://static.vrv.co/vilos/player.html
// @grant        none
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
    
    function promptSRT() {
        //remove everything for the previous subrenderer
        console.log(`\n\nNEW VIDEO\n\n`);
        if (sr) {
            sr.destroy();
        }
        let ta = document.createElement('textarea');
        ta.setAttribute('placeholder', 'paste SRT file contents here');

        ta.addEventListener('keyup', () => {
            if (ta.value.length) {
                sr = new SubRenderer(ta.value);
                ta.remove();
            }
        });
        Object.assign(ta.style, centeredStyles);
        document.body.appendChild(ta);
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
        this.video = document.querySelector('video');
        
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
            <button class="realign">Realign subs</button>
            <h2>Subtitle History</h2>
            <ul class="recent-subs" style="list-style: none;"></ul>
            
            <style>
                .SR-tray {
                    width: 3vw;
                    background: rgba(255, 255, 255, 0.1);
                }
                .SR-tray > * {
                    visibility: hidden;
                }
                .SR-tray:hover {
                    width: 25vw;
                    background: rgba(0, 0, 0, 0.4);
                }
                .SR-tray:hover > * {
                    visibility: visible;
                }
                .SR-tray * {
                    color: white;
                }
                .SR-tray h1 {
                    font-size: 2rem;
                    border-bottom: 1px solid #00f9ac;
                    background: rgba(0, 0, 0, 0.7);
                    margin: 0;
                }
                .SR-tray button {
                    background: #303138;
                    border: 1px solid #586c79;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    line-height: 1;
                }
                .SR-tray button:hover {
                    background: #4a4b56;
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
            </style>
        `;
        
        inTray('button.realign').addEventListener('click', () => this.realign());
        this.DOM.recentSubs = inTray('.recent-subs');
    }

    /**
     * Create the button that's used to align the sub times.
     */
    initSubAlignPrompt() {
        this.createTopLevelElement('startOffsetBtn', 'button', {
            fontSize: '2rem',
            ...centeredStyles
        });
        //use when a button is clicked to get the difference between the time things are actually said and the specified time in the SRT
        this.DOM.startOffsetBtn.textContent = 'Click when the first line is said: ';
        //not in this.DOM because it's contained by something else, not necessary to clean up individually
        const firstLine = document.createElement('pre');
        firstLine.textContent = this.srt.subs[0].text;
        this.DOM.startOffsetBtn.appendChild(firstLine);
        
        this.aligned = false;
        this.DOM.startOffsetBtn.addEventListener('click', () => {
            this.DOM.startOffsetBtn.remove();
            this.realign();
        });
        this.subOffset = 0;
    }
    realign() {
        this.subOffset = this.video.currentTime * 1000 - this.srt.subs[0].start - 400; //assume decent reaction time
        this.aligned = true;
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
            textShadow: 'black 1px 1px 0px, black 1px -1px 0px, black -1px 1px 0px, black -1px -1px 0px, black 1px 0px 0px, black 0px 1px 0px, black -1px 0px 0px, black 0px -1px 0px, black 1px 1px 1px'
        });

        this.DOM.subEl.setAttribute('title', 'Click to search this line on Jisho\nRight click to search the previous line');

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.resumeOnReturn) {
                this.video.play();
                this.resumeOnReturn = false;
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
        if (!this.video.paused) {
            this.video.pause();
            this.resumeOnReturn = true;
        }
    };


    frame() {
        if (!this.dead) {
            requestAnimationFrame(() => {
                this.frame();
            });
        }
        
        //don't show subs until we know we're going to show the correct ones
        if (this.aligned) {
            const text = this.srt.getSub(this.video.currentTime * 1000 - this.subOffset);
            this.DOM.subEl.textContent = text;
            //if it's a different line, and the currently displayed line isn't just a blank line, cache it as the previous line
            if (this.currentSub !== text) {
                //only cache the previous sub if it's worth caching
                if (this.currentSub) {
                    this.previousSub = this.currentSub;
                }
                this.insertSubIntoHistory(text);
            }
            this.currentSub = text;
        }
    }
    insertSubIntoHistory(text) {
        if (!text) return;
        
        const li = document.createElement('li');
        li.textContent = text;
        
        this.DOM.recentSubs.insertBefore(li, this.DOM.recentSubs.firstChild);
        
        setTimeout(() => {
            li.style.transform = 'scaleY(1)';
        }, 1);
        
        li.addEventListener('click', () => this.define(text));
        
        if (this.DOM.recentSubs.children.length > 10) {
            this.DOM.recentSubs.lastChild.remove();
        }
    }
}

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
                const [startStr, endStr] = lines[0].match(/^([\d:\.\-> ]*)/)[0].split(/\-\->/);
                shift();

                done.push({
                    start: this.toMS(startStr),
                    end: this.toMS(endStr),
                    text: lines.join('\n').replace(/<\/?c.Japanese>/g, '')
                });
            } catch(e){}
            return done;
        }, []);
    }
    getSub(ms) {
        const currentSub = this.subs.find(sub => {
            return sub.start <= ms && sub.end >= ms;
        });
        
        return currentSub ? currentSub.text : '';
    }
    toMS(timeStr) {
        const [hr, min, sec] = timeStr.trim().split(':');
        return sec * 1000 + min * 1000 * 60 + hr * 1000 * 60 * 60;
    }
}
