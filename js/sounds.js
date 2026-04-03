// ===== SOUND EFFECTS (Web Audio API) =====
var Sounds = (function () {
    var ctx = null;
    var muted = false;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function playTone(freq, duration, type, volume, delay) {
        if (muted) return;
        try {
            var c = getCtx();
            var osc = c.createOscillator();
            var gain = c.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.value = volume || 0.15;
            osc.connect(gain);
            gain.connect(c.destination);
            var start = c.currentTime + (delay || 0);
            osc.start(start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.stop(start + duration + 0.05);
        } catch (e) { /* ignore audio errors */ }
    }

    function playNoise(duration, volume) {
        if (muted) return;
        try {
            var c = getCtx();
            var bufferSize = c.sampleRate * duration;
            var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3;
            }
            var source = c.createBufferSource();
            source.buffer = buffer;
            var gain = c.createGain();
            gain.gain.value = volume || 0.05;
            var filter = c.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 3000;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(c.destination);
            source.start();
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        } catch (e) { /* ignore */ }
    }

    return {
        isMuted: function () { return muted; },

        toggleMute: function () {
            muted = !muted;
            return muted;
        },

        setMuted: function (val) {
            muted = val;
        },

        // Correct answer: ascending chime C-E-G
        correct: function () {
            playTone(523.25, 0.15, 'sine', 0.15, 0);      // C5
            playTone(659.25, 0.15, 'sine', 0.15, 0.1);     // E5
            playTone(783.99, 0.25, 'sine', 0.18, 0.2);     // G5
        },

        // Wrong answer: soft low tone (gentle)
        wrong: function () {
            playTone(220, 0.3, 'sine', 0.08, 0);           // A3 soft
            playTone(196, 0.3, 'sine', 0.06, 0.1);         // G3
        },

        // Button tap
        tap: function () {
            playTone(800, 0.05, 'square', 0.04, 0);
        },

        // Streak milestone: ascending fanfare
        streak: function () {
            playTone(523, 0.12, 'sine', 0.12, 0);
            playTone(587, 0.12, 'sine', 0.12, 0.1);
            playTone(659, 0.12, 'sine', 0.12, 0.2);
            playTone(698, 0.12, 'sine', 0.12, 0.3);
            playTone(784, 0.3, 'sine', 0.18, 0.4);
        },

        // Timer warning tick
        tick: function () {
            playTone(600, 0.04, 'square', 0.06, 0);
        },

        // Quiz complete celebration
        celebration: function () {
            playTone(523, 0.15, 'sine', 0.12, 0);
            playTone(659, 0.15, 'sine', 0.12, 0.12);
            playTone(784, 0.15, 'sine', 0.12, 0.24);
            playTone(1047, 0.4, 'sine', 0.15, 0.36);
            playTone(784, 0.15, 'sine', 0.1, 0.56);
            playTone(1047, 0.5, 'sine', 0.18, 0.68);
        },

        // Badge unlock
        badge: function () {
            playTone(440, 0.1, 'sine', 0.12, 0);
            playTone(554, 0.1, 'sine', 0.12, 0.08);
            playTone(659, 0.1, 'sine', 0.12, 0.16);
            playTone(880, 0.4, 'triangle', 0.15, 0.24);
        },

        // Star earned sparkle
        sparkle: function () {
            playNoise(0.1, 0.04);
            playTone(2000, 0.15, 'sine', 0.06, 0.02);
            playTone(2400, 0.12, 'sine', 0.05, 0.08);
        },

        // Skip counting hop
        hop: function () {
            playTone(600, 0.08, 'sine', 0.08, 0);
        },

        // Array dot appear
        pop: function () {
            playTone(900, 0.06, 'sine', 0.06, 0);
        }
    };
})();
