// ===== QUIZ ENGINE =====
var Quiz = (function () {
    var state = {
        active: false,
        difficulty: 'easy',
        maxFactor: 5,
        timeLimit: 60,
        timeRemaining: 60,
        score: 0,
        streak: 0,
        bestStreak: 0,
        totalQuestions: 0,
        correctCount: 0,
        currentQuestion: null,
        recentTables: [],  // last 3 tables used (for interleaving)
        wrongInRow: 0,
        timer: null,
        results: [],
        profile: null,
        onEnd: null
    };

    var DIFFICULTY_MAP = {
        easy: 5,
        medium: 8,
        hard: 12
    };

    function start(difficulty, timeLimit, profile, onEnd) {
        state.active = true;
        state.difficulty = difficulty;
        state.maxFactor = DIFFICULTY_MAP[difficulty] || 5;
        state.timeLimit = timeLimit;
        state.timeRemaining = timeLimit;
        state.score = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.totalQuestions = 0;
        state.correctCount = 0;
        state.currentQuestion = null;
        state.recentTables = [];
        state.wrongInRow = 0;
        state.results = [];
        state.profile = profile;
        state.onEnd = onEnd;

        // Update UI
        document.getElementById('quiz-score').textContent = '0';
        document.getElementById('quiz-streak').textContent = '0';
        document.getElementById('streak-icon').textContent = '';
        document.getElementById('quiz-timer-text').textContent = timeLimit + 's';

        var bar = document.getElementById('timer-bar');
        bar.style.width = '100%';
        bar.className = 'timer-bar';

        document.getElementById('quiz-feedback').textContent = '';
        Dragon.speak('dragon-speech-quiz', Dragon.encourageMessage(), false);

        nextQuestion();
        startTimer();
    }

    function startTimer() {
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(function () {
            state.timeRemaining -= 0.1;
            if (state.timeRemaining <= 0) {
                state.timeRemaining = 0;
                end();
                return;
            }
            updateTimerUI();
        }, 100);
    }

    function updateTimerUI() {
        var pct = (state.timeRemaining / state.timeLimit) * 100;
        var bar = document.getElementById('timer-bar');
        bar.style.width = pct + '%';

        // Color shifts
        if (pct <= 15) {
            bar.className = 'timer-bar timer-bar--danger';
            if (Math.round(state.timeRemaining) !== Math.round(state.timeRemaining + 0.1)) {
                Sounds.tick();
            }
        } else if (pct <= 40) {
            bar.className = 'timer-bar timer-bar--warning';
        } else {
            bar.className = 'timer-bar';
        }

        document.getElementById('quiz-timer-text').textContent = Math.ceil(state.timeRemaining) + 's';
    }

    function nextQuestion() {
        var pool = Progress.getWeightedPool(state.profile, state.maxFactor);

        // Interleaving: filter out recently used tables
        var filtered = pool;
        if (state.recentTables.length > 0) {
            var available = pool.filter(function (item) {
                return state.recentTables.indexOf(item.a) === -1 &&
                       state.recentTables.indexOf(item.b) === -1;
            });
            if (available.length > 0) filtered = available;
        }

        // Weighted random selection
        var totalWeight = 0;
        filtered.forEach(function (item) { totalWeight += item.weight; });
        var rand = Math.random() * totalWeight;
        var cumulative = 0;
        var selected = filtered[0];
        for (var i = 0; i < filtered.length; i++) {
            cumulative += filtered[i].weight;
            if (rand <= cumulative) {
                selected = filtered[i];
                break;
            }
        }

        // Randomly swap a and b for display variety
        var a = selected.a;
        var b = selected.b;
        if (Math.random() > 0.5 && a !== b) {
            var temp = a;
            a = b;
            b = temp;
        }

        var correctAnswer = a * b;
        var distractors = generateDistractors(a, b, correctAnswer);
        var options = [correctAnswer].concat(distractors);
        shuffle(options);

        state.currentQuestion = {
            a: a,
            b: b,
            correct: correctAnswer,
            options: options
        };

        // Track recent tables for interleaving
        state.recentTables.push(Math.min(a, b));
        if (state.recentTables.length > 3) state.recentTables.shift();

        renderQuestion();
    }

    function generateDistractors(a, b, correct) {
        var candidates = new Set();

        // Near misses
        candidates.add(correct + a);
        candidates.add(correct - a);
        candidates.add(correct + b);
        candidates.add(correct - b);
        candidates.add(correct + 1);
        candidates.add(correct - 1);
        candidates.add(correct + 2);
        candidates.add(correct - 2);

        // Adjacent table products
        if (a > 1) candidates.add((a - 1) * b);
        candidates.add((a + 1) * b);
        if (b > 1) candidates.add(a * (b - 1));
        candidates.add(a * (b + 1));

        // Common confusion: swapped digits
        if (correct >= 10) {
            var tens = Math.floor(correct / 10);
            var ones = correct % 10;
            if (ones !== tens) candidates.add(ones * 10 + tens);
        }

        // Filter: remove correct answer, negatives, zero
        var valid = [];
        candidates.forEach(function (val) {
            if (val !== correct && val > 0 && val <= 144) {
                valid.push(val);
            }
        });

        // Remove duplicates and shuffle
        valid = Array.from(new Set(valid));
        shuffle(valid);

        // If we don't have enough, add random numbers
        while (valid.length < 3) {
            var r = Math.floor(Math.random() * (state.maxFactor * state.maxFactor)) + 1;
            if (r !== correct && valid.indexOf(r) === -1) {
                valid.push(r);
            }
        }

        return valid.slice(0, 3);
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    function renderQuestion() {
        var q = state.currentQuestion;
        document.getElementById('quiz-num-a').textContent = q.a;
        document.getElementById('quiz-num-b').textContent = q.b;

        var grid = document.getElementById('answer-grid');
        var buttons = grid.querySelectorAll('.answer-btn');
        buttons.forEach(function (btn, i) {
            btn.textContent = q.options[i];
            btn.className = 'answer-btn';
            btn.dataset.value = q.options[i];
        });

        document.getElementById('quiz-feedback').textContent = '';
    }

    function submitAnswer(value) {
        if (!state.active || !state.currentQuestion) return;

        var answer = parseInt(value);
        var q = state.currentQuestion;
        var correct = answer === q.correct;

        state.totalQuestions++;

        // Record for spaced repetition
        Progress.recordFact(state.profile, q.a, q.b, correct);

        // Update score and streak
        if (correct) {
            state.score++;
            state.correctCount++;
            state.streak++;
            state.wrongInRow = 0;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;

            // Sound + visual feedback
            Sounds.correct();
            Rewards.showFloatScore(true);

            // Highlight correct button
            var buttons = document.querySelectorAll('.answer-btn');
            buttons.forEach(function (btn) {
                if (parseInt(btn.dataset.value) === q.correct) {
                    btn.classList.add('answer-btn--correct');
                }
                btn.classList.add('answer-btn--disabled');
            });

            // Dragon message
            var msg = Dragon.correctMessage(state.streak);
            Dragon.speak('dragon-speech-quiz', msg, false);

            // Streak milestones
            if (state.streak === 5 || state.streak === 10 || state.streak === 20) {
                Sounds.streak();
                Rewards.spawnConfetti(state.streak >= 20 ? 60 : state.streak >= 10 ? 40 : 20);
            }

            // Update streak icon
            var streakIcon = document.getElementById('streak-icon');
            if (state.streak >= 5) {
                streakIcon.textContent = '\uD83D\uDD25';
                streakIcon.className = 'streak-fire';
            } else {
                streakIcon.textContent = '';
                streakIcon.className = '';
            }

        } else {
            state.streak = 0;
            state.wrongInRow++;

            Sounds.wrong();
            Rewards.showFloatScore(false);

            // Highlight wrong and reveal correct
            var buttons2 = document.querySelectorAll('.answer-btn');
            buttons2.forEach(function (btn) {
                var val = parseInt(btn.dataset.value);
                if (val === answer) {
                    btn.classList.add('answer-btn--wrong');
                }
                if (val === q.correct) {
                    btn.classList.add('answer-btn--reveal');
                }
                btn.classList.add('answer-btn--disabled');
            });

            // Dragon hint (stepping-stone strategy)
            var hint = Dragon.wrongMessage() + ' ' + Dragon.getHint(q.a, q.b);
            Dragon.speak('dragon-speech-quiz', hint, false);

            document.getElementById('streak-icon').textContent = '';
            document.getElementById('streak-icon').className = '';

            // Extra encouragement if 3+ wrong in a row
            if (state.wrongInRow >= 3) {
                setTimeout(function () {
                    Dragon.speak('dragon-speech-quiz', Dragon.encourageMessage(), true);
                }, 2000);
            }
        }

        // Update score display
        document.getElementById('quiz-score').textContent = state.score;
        document.getElementById('quiz-streak').textContent = state.streak;

        // Next question after delay
        setTimeout(function () {
            if (state.active) nextQuestion();
        }, correct ? 800 : 2000); // Longer delay on wrong to read the hint
    }

    function end() {
        state.active = false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        var accuracy = state.totalQuestions > 0
            ? Math.round((state.correctCount / state.totalQuestions) * 100)
            : 0;

        var starsEarned = Rewards.calculateStars(accuracy);

        var result = {
            difficulty: state.difficulty,
            timeLimit: state.timeLimit,
            totalQuestions: state.totalQuestions,
            correctCount: state.correctCount,
            accuracy: accuracy,
            bestStreak: state.bestStreak,
            starsEarned: starsEarned
        };

        // Save to profile
        Progress.saveQuizResult(state.profile, result);

        // Check for new badges
        var newBadges = Rewards.checkNewBadges(state.profile);
        Progress.save(state.profile);

        if (state.onEnd) state.onEnd(result, newBadges);
    }

    function isActive() {
        return state.active;
    }

    function cleanup() {
        state.active = false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
    }

    return {
        start: start,
        submitAnswer: submitAnswer,
        end: end,
        isActive: isActive,
        cleanup: cleanup
    };
})();
