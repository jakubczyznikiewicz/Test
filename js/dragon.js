// ===== DRAGON MASCOT =====
var Dragon = (function () {
    // Message pools
    var messages = {
        welcome: [
            "Hi {name}! Ready to learn?",
            "Welcome back, {name}!",
            "Hey {name}! Let's practice together!",
            "{name}! Great to see you!"
        ],
        welcomeNew: [
            "Hi there! I'm Sparky the Dragon!",
            "Welcome! What's your name?"
        ],
        correct: [
            "Amazing!",
            "Brilliant!",
            "You're a star!",
            "Awesome!",
            "Keep going!",
            "Nailed it!",
            "Super!",
            "Fantastic!",
            "Way to go!",
            "You got it!"
        ],
        streak3: [
            "Great streak!",
            "You're on a roll!",
            "Three in a row!"
        ],
        streak5: [
            "You're on fire!",
            "Unstoppable!",
            "Five in a row! WOW!"
        ],
        streak10: [
            "INCREDIBLE!",
            "You're a math genius!",
            "TEN in a row!!!"
        ],
        streak20: [
            "LEGENDARY!!!",
            "MATH CHAMPION!!!",
            "UNBELIEVABLE!!!"
        ],
        encourage: [
            "You can do it!",
            "Take your time!",
            "Think carefully!",
            "You've got this!",
            "Believe in yourself!"
        ],
        wrongGentle: [
            "Almost! Let me help...",
            "Good try! Here's a tip:",
            "So close! Try this:",
            "Not quite, but look:"
        ],
        resultsGreat: [
            "WOW! You're incredible!",
            "Amazing job, superstar!",
            "You're a multiplication master!"
        ],
        resultsGood: [
            "Great work! Keep it up!",
            "You're getting better!",
            "Nice job! Practice makes perfect!"
        ],
        resultsOk: [
            "Good effort! Try again?",
            "You're learning! Keep practicing!",
            "Every practice makes you stronger!"
        ],
        learnIntro: [
            "Let's learn the {n} times table!",
            "Ready to explore the {n}s?",
            "Let me show you the {n} times table!"
        ],
        learnArray: [
            "{a} x {b} means {a} rows of {b}!",
            "See? {a} groups of {b}!",
            "Count the rows: {a} rows with {b} each!"
        ],
        learnSkip: [
            "Let's count by {n}s!",
            "Watch the hops! Skip by {n}!",
            "Hop hop hop... count by {n}!"
        ],
        learnChart: [
            "See the pattern? The {n}s are highlighted!",
            "Look at where the {n}s land!",
            "Can you spot the pattern?"
        ],
        chartPatterns: {
            2: "All the 2s are even numbers!",
            3: "The 3s make a staircase pattern!",
            4: "The 4s are every other even number!",
            5: "The 5s always end in 0 or 5!",
            6: "The 6s are in the even rows of the 3s!",
            7: "The 7s make a zigzag pattern!",
            8: "The 8s are double the 4s!",
            9: "The 9s digits always add up to 9!",
            10: "The 10s are the whole right column!",
            11: "The 11s repeat the digit: 11, 22, 33...",
            12: "The 12s combine 10s and 2s!"
        }
    };

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function fill(template, vars) {
        var result = template;
        for (var key in vars) {
            result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), vars[key]);
        }
        return result;
    }

    // Generate a stepping-stone hint for a wrong answer
    function getHint(a, b) {
        var correct = a * b;
        var hints = [];

        // Strategy 1: use x5 as stepping stone
        if (b > 5) {
            var partial = a * 5;
            var remainder = a * (b - 5);
            hints.push(a + " x 5 = " + partial + ", plus " + a + " x " + (b - 5) + " = " + remainder + ". So it's " + correct + "!");
        }
        if (a > 5) {
            var partial2 = 5 * b;
            var remainder2 = (a - 5) * b;
            hints.push("5 x " + b + " = " + partial2 + ", plus " + (a - 5) + " x " + b + " = " + remainder2 + ". So it's " + correct + "!");
        }

        // Strategy 2: use x10 as stepping stone
        if (b > 10) {
            var p10 = a * 10;
            var r10 = a * (b - 10);
            hints.push(a + " x 10 = " + p10 + ", plus " + a + " x " + (b - 10) + " = " + r10 + ". That's " + correct + "!");
        }

        // Strategy 3: doubles
        if (a === 2) {
            hints.push("Double " + b + " = " + correct + "!");
        }
        if (b === 2) {
            hints.push("Double " + a + " = " + correct + "!");
        }

        // Strategy 4: nearby known fact
        if (b > 1) {
            var near = a * (b - 1);
            hints.push(a + " x " + (b - 1) + " = " + near + ", now add " + a + " more = " + correct + "!");
        }

        // Strategy 5: commutative
        if (a !== b) {
            hints.push("Remember: " + a + " x " + b + " is the same as " + b + " x " + a + "!");
        }

        if (hints.length === 0) {
            return "The answer is " + correct + ". Let's remember this one!";
        }

        return pick(hints);
    }

    // Set speech bubble text with optional typing effect
    function speak(elementId, text, animate) {
        var el = document.getElementById(elementId);
        if (!el) return;

        if (!animate) {
            el.textContent = text;
            return;
        }

        el.textContent = '';
        var i = 0;
        var interval = setInterval(function () {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
            } else {
                clearInterval(interval);
            }
        }, 25);
    }

    return {
        speak: speak,
        getHint: getHint,

        welcomeMessage: function (name) {
            if (!name) return pick(messages.welcomeNew);
            return fill(pick(messages.welcome), { name: name });
        },

        correctMessage: function (streak) {
            if (streak >= 20) return pick(messages.streak20);
            if (streak >= 10) return pick(messages.streak10);
            if (streak >= 5) return pick(messages.streak5);
            if (streak >= 3) return pick(messages.streak3);
            return pick(messages.correct);
        },

        wrongMessage: function () {
            return pick(messages.wrongGentle);
        },

        encourageMessage: function () {
            return pick(messages.encourage);
        },

        resultsMessage: function (accuracy) {
            if (accuracy >= 90) return pick(messages.resultsGreat);
            if (accuracy >= 60) return pick(messages.resultsGood);
            return pick(messages.resultsOk);
        },

        learnIntroMessage: function (n) {
            return fill(pick(messages.learnIntro), { n: n });
        },

        learnArrayMessage: function (a, b) {
            return fill(pick(messages.learnArray), { a: a, b: b });
        },

        learnSkipMessage: function (n) {
            return fill(pick(messages.learnSkip), { n: n });
        },

        learnChartMessage: function (n) {
            return fill(pick(messages.learnChart), { n: n });
        },

        chartPatternMessage: function (n) {
            return messages.chartPatterns[n] || "Look at the pattern the " + n + "s make!";
        }
    };
})();
