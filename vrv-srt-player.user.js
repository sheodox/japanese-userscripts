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
        
        console.log(`SubRenderer for ${this.video.src} initialized`);
        this.frame();
    }

    /**
     * Create the button that's used to align the sub times.
     */
    initSubAlignPrompt() {
        this.createElement('startOffsetBtn', 'button', {
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
            this.subOffset = this.video.currentTime * 1000 - this.srt.subs[0].start - 400; //assume decent reaction time
            this.DOM.startOffsetBtn.remove();
            this.aligned = true;
        });
        this.subOffset = 0;
        document.body.appendChild(this.DOM.startOffsetBtn);

    }

    /**
     * Create the element that displays the current subtitle.
     */
    initSubElement() {
        this.createElement('subEl', 'pre', {
            fontSize: '1.5rem',
            textAlign: 'center',
            color: 'white',
            width: '100vw',
            background: 'rgba(0, 0, 0, 0.3)',
            cursor: 'pointer'
        });

        this.DOM.subEl.setAttribute('title', 'Click to search this line on Jisho\nRight click to search the previous line');
        document.body.appendChild(this.DOM.subEl);

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
    
    createElement(name, tag, styles={}) {
        const el = document.createElement(tag);
        if (this.DOM[name]) {
            throw new Error(`element with name ${name} already exists. change one of them so SubRenderer destroy functions.`);
        }
        this.DOM[name] = el;
        Object.assign(el.style, {}, styles, showOnTopStyles);
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
            if (this.currentSub !== text && this.currentSub) {
                this.previousSub = this.currentSub;
            }
            this.currentSub = text;
        }
    }
}

class SRT {
    constructor(srt, firstSubTime) {
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
