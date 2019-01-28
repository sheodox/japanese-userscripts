// ==UserScript==
// @name         VRV SRT Player
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Display SRT format subtitles on VRV
// @author       You
// @match        https://static.vrv.co/vilos/player.html
// @grant        none
// ==/UserScript==

const showOnTopStyles = {
    position: 'absolute',
    zIndex: '1000000000'
};


(function() {
    'use strict';

    const ta = document.createElement('textarea');
    
    ta.addEventListener('keyup', () => {
        if (ta.value.length) {
            new SubRenderer(ta.value);
            ta.remove();
        }
    });
    Object.assign(ta.style, showOnTopStyles);
    document.body.appendChild(ta);
    console.log(ta);
})();

class SubRenderer {
    constructor(srt) {
        this.srt = new SRT(srt);
        this.video = document.querySelector('video');
        
        this.subEl = document.createElement('pre');
        Object.assign(this.subEl.style, {
            fontSize: '1.5rem',
            textAlign: 'center',
            color: 'white',
            width: '100vw',
            background: 'rgba(0, 0, 0, 0.3)',
            cursor: 'pointer'
        }, showOnTopStyles);
        document.body.appendChild(this.subEl);
        
        this.subEl.addEventListener('click', () => {
            window.open(`https://jisho.org/search/${encodeURIComponent(this.currentSub)}`);
        });
        
        this.startOffsetBtn = document.createElement('button');
        this.startOffsetBtn.textContent = 'Click when the first line is said';
        Object.assign(this.startOffsetBtn.style, showOnTopStyles);
        
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
        this.currentSub = text;

        requestAnimationFrame(() => {
            this.frame();
        });
    }
}

class SRT {
    constructor(srt, firstSubTime) {
        this.firstSubTime = firstSubTime;
        this.parse(srt);
    }
    parse(srt) {
        const subs = srt.split('\n\n');
        this.subs = subs.reduce((done, sub) => {
            sub = sub.trim();
            try {
                const [startStr, endStr] = sub.match(/^([\d:\.\-> ]*)/)[0].split(/\-\->/);
                let text = sub.split('\n').slice(1).join('\n');
                
                text = text.replace(/<\/?c.Japanese>/g, '');

                done.push({
                    start: this.toMS(startStr),
                    end: this.toMS(endStr),
                    text
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
