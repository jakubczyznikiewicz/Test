// ===== REWARDS & BADGES =====
var Rewards = (function () {

    var BADGES = [
        {
            id: 'first_steps',
            name: 'First Steps',
            icon: '\uD83D\uDE80',
            description: 'Complete your first quiz',
            condition: function (p) { return p.stats.totalQuizzes >= 1; }
        },
        {
            id: 'perfect_10',
            name: 'Perfect 10',
            icon: '\uD83D\uDCAF',
            description: 'Get 10 correct in one quiz',
            condition: function (p) {
                return p.quizHistory.some(function (h) { return h.correctCount >= 10; });
            }
        },
        {
            id: 'streak_5',
            name: 'On Fire',
            icon: '\uD83D\uDD25',
            description: 'Get a 5-answer streak',
            condition: function (p) { return p.stats.bestStreak >= 5; }
        },
        {
            id: 'streak_10',
            name: 'Unstoppable',
            icon: '\u26A1',
            description: 'Get a 10-answer streak',
            condition: function (p) { return p.stats.bestStreak >= 10; }
        },
        {
            id: 'perfect_score',
            name: 'Perfect Score',
            icon: '\u2B50',
            description: '100% accuracy in a quiz',
            condition: function (p) {
                return p.quizHistory.some(function (h) {
                    return h.totalQuestions >= 5 && h.accuracy === 100;
                });
            }
        },
        {
            id: 'speed_demon',
            name: 'Speed Demon',
            icon: '\u23F1\uFE0F',
            description: 'Answer 15+ in 60 seconds',
            condition: function (p) {
                return p.quizHistory.some(function (h) {
                    return h.totalQuestions >= 15 && h.timeLimit <= 60;
                });
            }
        },
        {
            id: 'century_club',
            name: 'Century Club',
            icon: '\uD83C\uDFC5',
            description: 'Answer 100 questions correctly',
            condition: function (p) { return p.stats.totalCorrect >= 100; }
        },
        {
            id: 'table_master_5',
            name: 'Fives Master',
            icon: '\uD83D\uDD1F',
            description: 'Master the 5 times table',
            condition: function (p) {
                return Progress.getTableMastery(p, 5) >= 90;
            }
        },
        {
            id: 'table_master_all',
            name: 'Math Champion',
            icon: '\uD83D\uDC51',
            description: 'Master all tables 1-10',
            condition: function (p) {
                for (var t = 1; t <= 10; t++) {
                    if (Progress.getTableMastery(p, t) < 80) return false;
                }
                return true;
            }
        },
        {
            id: 'dedicated',
            name: 'Dedicated',
            icon: '\uD83C\uDF1F',
            description: 'Complete 20 quizzes',
            condition: function (p) { return p.stats.totalQuizzes >= 20; }
        }
    ];

    function calculateStars(accuracy) {
        if (accuracy >= 90) return 3;
        if (accuracy >= 70) return 2;
        if (accuracy >= 50) return 1;
        return 0;
    }

    function checkNewBadges(profile) {
        var newBadges = [];
        BADGES.forEach(function (badge) {
            if (profile.badges.indexOf(badge.id) === -1 && badge.condition(profile)) {
                newBadges.push(badge);
                profile.badges.push(badge.id);
            }
        });
        return newBadges;
    }

    function getBadge(id) {
        return BADGES.find(function (b) { return b.id === id; });
    }

    function getAllBadges() {
        return BADGES;
    }

    // Spawn confetti particles
    function spawnConfetti(count) {
        var container = document.getElementById('confetti-container');
        if (!container) return;
        var colors = ['#6C63FF', '#4CAF50', '#FF5252', '#FFC107', '#00BCD4', '#FF9800', '#E91E63'];

        for (var i = 0; i < (count || 40); i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.setProperty('--fall-dur', (2 + Math.random() * 2) + 's');
            piece.style.setProperty('--fall-delay', (Math.random() * 0.5) + 's');
            piece.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
            piece.style.setProperty('--spin', (Math.random() * 1080) + 'deg');
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            container.appendChild(piece);
        }

        // Clean up after animation
        setTimeout(function () {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }, 4500);
    }

    // Spawn firework at a position
    function spawnFirework(x, y) {
        var container = document.getElementById('confetti-container');
        if (!container) return;
        var colors = ['#FFC107', '#FF5252', '#6C63FF', '#4CAF50', '#00BCD4'];
        var fw = document.createElement('div');
        fw.className = 'firework';
        fw.style.left = x + 'px';
        fw.style.top = y + 'px';

        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var dist = 50 + Math.random() * 40;
            var particle = document.createElement('div');
            particle.className = 'firework-particle';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.setProperty('--fx', Math.cos(angle) * dist + 'px');
            particle.style.setProperty('--fy', Math.sin(angle) * dist + 'px');
            fw.appendChild(particle);
        }

        container.appendChild(fw);
        setTimeout(function () {
            if (fw.parentNode) fw.parentNode.removeChild(fw);
        }, 1200);
    }

    // Show badge popup
    function showBadgePopup(badge) {
        var popup = document.getElementById('badge-popup');
        document.getElementById('badge-popup-icon').textContent = badge.icon;
        document.getElementById('badge-popup-name').textContent = badge.name;
        document.getElementById('badge-popup-desc').textContent = badge.description;
        popup.style.display = 'flex';

        Sounds.badge();

        setTimeout(function () {
            popup.style.display = 'none';
        }, 2500);
    }

    // Show floating +1 score
    function showFloatScore(correct) {
        var quizQuestion = document.querySelector('.quiz-question');
        if (!quizQuestion) return;
        var el = document.createElement('div');
        el.className = 'float-score' + (correct ? '' : ' float-score--wrong');
        el.textContent = correct ? '+1' : '\u2717';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%)';
        quizQuestion.style.position = 'relative';
        quizQuestion.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 900);
    }

    return {
        BADGES: BADGES,
        calculateStars: calculateStars,
        checkNewBadges: checkNewBadges,
        getBadge: getBadge,
        getAllBadges: getAllBadges,
        spawnConfetti: spawnConfetti,
        spawnFirework: spawnFirework,
        showBadgePopup: showBadgePopup,
        showFloatScore: showFloatScore
    };
})();
