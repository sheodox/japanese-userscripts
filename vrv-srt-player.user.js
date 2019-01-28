// ==UserScript==
// @name         VRV SRT Player
// @namespace    http://tampermonkey.net/
// @version      0.0.4
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

    const ta = document.createElement('textarea');
    ta.setAttribute('placeholder', 'paste SRT file contents here');
    
    ta.addEventListener('keyup', () => {
        if (ta.value.length) {
            new SubRenderer(ta.value);
            ta.remove();
        }
    });
    Object.assign(ta.style, centeredStyles);
    document.body.appendChild(ta);
    console.log(ta);
})();

class SubRenderer {
    constructor(srt) {
        this.srt = new SRT(srt);
        this.video = document.querySelector('video');
        
        this.subEl = document.createElement('pre');
        this.subEl.setAttribute('title', 'Click to search this line on Jisho\nRight click to search the previous line');
        Object.assign(this.subEl.style, {
            fontSize: '1.5rem',
            textAlign: 'center',
            color: 'white',
            width: '100vw',
            background: 'rgba(0, 0, 0, 0.3)',
            cursor: 'pointer'
        }, showOnTopStyles);
        document.body.appendChild(this.subEl);
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.resumeOnReturn) {
                this.video.play();
                this.resumeOnReturn = false;
            }
        });
        
        const define = sub => {
            window.open(`https://jisho.org/search/${encodeURIComponent(sub)}`);
            if (!this.video.paused) {
                this.video.pause();
                this.resumeOnReturn = true;
            }
        };
        
        this.subEl.addEventListener('click', () => {
            define(this.currentSub);
        });
        this.subEl.addEventListener('contextmenu', e => {
            define(this.previousSub);
            e.preventDefault();
        });
        
        //use when a button is clicked to get the difference between the time things are actually said and the specified time in the SRT
        this.startOffsetBtn = document.createElement('button');
        this.startOffsetBtn.textContent = 'Click when the first line is said: ';
        const firstLine = document.createElement('pre');
        firstLine.textContent = this.srt.subs[0].text;
        this.startOffsetBtn.appendChild(firstLine);
        
        Object.assign(this.startOffsetBtn.style, {
            fontSize: '2rem',
        }, centeredStyles);
        
        this.startOffsetBtn.addEventListener('click', () => {
            this.subOffset = this.video.currentTime * 1000 - this.srt.subs[0].start - 400; //assume decent reaction time
            this.startOffsetBtn.remove();
        });
        this.subOffset = 0;
        document.body.appendChild(this.startOffsetBtn);
        
        console.log(this.srt.subs);
        
        this.frame();
    }
    
    frame() {
        const text = this.srt.getSub(this.video.currentTime * 1000 - this.subOffset);
        this.subEl.textContent = text;
        //if it's a different line, and the currently displayed line isn't just a blank line, cache it as the previous line
        if (this.currentSub !== text && this.currentSub) {
            this.previousSub = this.currentSub;
        }
        this.currentSub = text;

        requestAnimationFrame(() => {
            this.frame();
        });
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
