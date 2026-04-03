// ===== PROGRESS & PERSISTENCE =====
var Progress = (function () {
    var STORAGE_KEY = 'mathStars_profile';
    var MAX_HISTORY = 50;

    function defaultProfile() {
        return {
            version: 1,
            player: { name: '', createdAt: new Date().toISOString() },
            settings: { difficulty: 'easy', timeLimit: 60, soundEnabled: true },
            stats: {
                totalQuizzes: 0,
                totalQuestionsAnswered: 0,
                totalCorrect: 0,
                totalStars: 0,
                bestStreak: 0
            },
            facts: {},
            badges: [],
            quizHistory: []
        };
    }

    function load() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                var profile = JSON.parse(data);
                // Ensure all fields exist (migration safety)
                var def = defaultProfile();
                profile.stats = Object.assign({}, def.stats, profile.stats || {});
                profile.settings = Object.assign({}, def.settings, profile.settings || {});
                if (!profile.facts) profile.facts = {};
                if (!profile.badges) profile.badges = [];
                if (!profile.quizHistory) profile.quizHistory = [];
                if (!profile.player) profile.player = def.player;
                return profile;
            }
        } catch (e) { /* ignore parse errors */ }
        return defaultProfile();
    }

    function save(profile) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) { /* ignore quota errors */ }
    }

    // Canonical fact key: smaller number first
    function factKey(a, b) {
        var min = Math.min(a, b);
        var max = Math.max(a, b);
        return min + 'x' + max;
    }

    // Record a single answer during a quiz
    function recordFact(profile, a, b, correct) {
        var key = factKey(a, b);
        if (!profile.facts[key]) {
            profile.facts[key] = { attempts: 0, correct: 0, lastSeen: '' };
        }
        profile.facts[key].attempts++;
        if (correct) profile.facts[key].correct++;
        profile.facts[key].lastSeen = new Date().toISOString().slice(0, 10);
    }

    // Save a completed quiz result
    function saveQuizResult(profile, result) {
        profile.stats.totalQuizzes++;
        profile.stats.totalQuestionsAnswered += result.totalQuestions;
        profile.stats.totalCorrect += result.correctCount;
        profile.stats.totalStars += result.starsEarned;
        if (result.bestStreak > profile.stats.bestStreak) {
            profile.stats.bestStreak = result.bestStreak;
        }

        profile.quizHistory.push({
            date: new Date().toISOString(),
            difficulty: result.difficulty,
            timeLimit: result.timeLimit,
            totalQuestions: result.totalQuestions,
            correctCount: result.correctCount,
            accuracy: result.accuracy,
            bestStreak: result.bestStreak,
            starsEarned: result.starsEarned
        });

        // Cap history
        while (profile.quizHistory.length > MAX_HISTORY) {
            profile.quizHistory.shift();
        }

        save(profile);
    }

    // Get accuracy for a specific fact
    function getFactAccuracy(profile, a, b) {
        var key = factKey(a, b);
        var fact = profile.facts[key];
        if (!fact || fact.attempts === 0) return -1; // untried
        return Math.round((fact.correct / fact.attempts) * 100);
    }

    // Get mastery level for a specific table (1-12)
    function getTableMastery(profile, table) {
        var totalAttempts = 0;
        var totalCorrect = 0;
        for (var i = 1; i <= 12; i++) {
            var key = factKey(table, i);
            var fact = profile.facts[key];
            if (fact) {
                totalAttempts += fact.attempts;
                totalCorrect += fact.correct;
            }
        }
        if (totalAttempts === 0) return -1; // not tried
        return Math.round((totalCorrect / totalAttempts) * 100);
    }

    // Get weighted question pool for spaced repetition
    // Returns array of {a, b, weight} objects
    function getWeightedPool(profile, maxFactor) {
        var pool = [];
        for (var a = 1; a <= maxFactor; a++) {
            for (var b = a; b <= maxFactor; b++) {
                var acc = getFactAccuracy(profile, a, b);
                var weight;
                if (acc === -1) {
                    weight = 2; // untried: needs exposure
                } else if (acc < 60) {
                    weight = 3; // weak: appear much more often
                } else if (acc < 80) {
                    weight = 2; // medium: appear more often
                } else {
                    weight = 1; // mastered: normal frequency
                }
                pool.push({ a: a, b: b, weight: weight });
            }
        }
        return pool;
    }

    // Get mastery data for the full grid display
    function getMasteryGrid(profile) {
        var grid = [];
        for (var row = 1; row <= 12; row++) {
            var rowData = [];
            for (var col = 1; col <= 12; col++) {
                var acc = getFactAccuracy(profile, row, col);
                var level;
                if (acc === -1) level = 'none';
                else if (acc < 50) level = 'learning';
                else if (acc < 80) level = 'good';
                else level = 'mastered';
                rowData.push({ row: row, col: col, accuracy: acc, level: level });
            }
            grid.push(rowData);
        }
        return grid;
    }

    return {
        load: load,
        save: save,
        factKey: factKey,
        recordFact: recordFact,
        saveQuizResult: saveQuizResult,
        getFactAccuracy: getFactAccuracy,
        getTableMastery: getTableMastery,
        getWeightedPool: getWeightedPool,
        getMasteryGrid: getMasteryGrid,
        defaultProfile: defaultProfile
    };
})();
