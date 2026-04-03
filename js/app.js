// ===== APP MAIN =====
var App = (function () {
    var profile = null;
    var selectedDifficulty = 'easy';
    var selectedTime = 60;

    function init() {
        profile = Progress.load();

        // Restore sound setting
        Sounds.setMuted(!profile.settings.soundEnabled);
        updateMuteButton();

        // Restore last difficulty/time
        selectedDifficulty = profile.settings.difficulty || 'easy';
        selectedTime = profile.settings.timeLimit || 60;

        // Show appropriate home state
        if (profile.player.name) {
            showReturningUser();
        } else {
            showNewUser();
        }

        // Set up event delegation
        document.getElementById('app').addEventListener('click', handleAction);

        // Handle Enter key on name input
        document.getElementById('player-name').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') saveName();
        });
    }

    function showNewUser() {
        document.getElementById('name-entry').style.display = 'flex';
        document.getElementById('home-buttons').style.display = 'none';
        document.getElementById('home-welcome').textContent = '';
        Dragon.speak('dragon-speech-home', Dragon.welcomeMessage(null), true);
    }

    function showReturningUser() {
        document.getElementById('name-entry').style.display = 'none';
        document.getElementById('home-buttons').style.display = 'flex';
        var stars = profile.stats.totalStars;
        document.getElementById('home-welcome').innerHTML =
            'Hi, <strong>' + escapeHtml(profile.player.name) + '</strong>! \u2B50 ' + stars + ' stars';
        Dragon.speak('dragon-speech-home', Dragon.welcomeMessage(profile.player.name), true);
    }

    function saveName() {
        var input = document.getElementById('player-name');
        var name = input.value.trim();
        if (!name) {
            input.focus();
            return;
        }
        profile.player.name = name;
        Progress.save(profile);
        showReturningUser();
        Sounds.celebration();
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(function (s) {
            s.classList.remove('screen--active');
        });
        var screen = document.getElementById(id);
        if (screen) screen.classList.add('screen--active');
    }

    // ===== EVENT DELEGATION =====
    function handleAction(e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.dataset.action;
        Sounds.tap();

        switch (action) {
            case 'save-name':
                saveName();
                break;

            case 'go-home':
                Quiz.cleanup();
                Learn.cleanup();
                showScreen('screen-home');
                showReturningUser();
                break;

            case 'go-settings':
                showScreen('screen-settings');
                highlightDifficulty(selectedDifficulty);
                highlightTime(selectedTime);
                break;

            case 'go-learn':
                showScreen('screen-learn');
                document.getElementById('learn-content').style.display = 'none';
                Dragon.speak('dragon-speech-learn', 'Pick a table to learn!', true);
                break;

            case 'go-progress':
                renderProgress();
                showScreen('screen-progress');
                break;

            case 'select-difficulty':
                selectedDifficulty = target.dataset.difficulty;
                highlightDifficulty(selectedDifficulty);
                profile.settings.difficulty = selectedDifficulty;
                Progress.save(profile);
                break;

            case 'select-time':
                selectedTime = parseInt(target.dataset.time);
                highlightTime(selectedTime);
                profile.settings.timeLimit = selectedTime;
                Progress.save(profile);
                break;

            case 'start-quiz':
                startQuiz(selectedDifficulty, selectedTime);
                break;

            case 'submit-answer':
                if (Quiz.isActive()) {
                    Quiz.submitAnswer(target.dataset.value || target.textContent);
                }
                break;

            case 'play-again':
                startQuiz(selectedDifficulty, selectedTime);
                break;

            case 'toggle-mute':
                var muted = Sounds.toggleMute();
                profile.settings.soundEnabled = !muted;
                Progress.save(profile);
                updateMuteButton();
                break;

            // Learn mode actions
            case 'select-table':
                Learn.selectTable(parseInt(target.dataset.table));
                break;

            case 'learn-tab':
                Learn.switchTab(target.dataset.tab);
                break;

            case 'array-next':
                Learn.arrayNext();
                break;

            case 'array-prev':
                Learn.arrayPrev();
                break;

            case 'skip-animate':
                Learn.animateSkipCounting();
                break;

            case 'learn-to-quiz':
                // Start a quiz focused on the learned table
                var table = Learn.getCurrentTable();
                if (table >= 1 && table <= 5) selectedDifficulty = 'easy';
                else if (table <= 8) selectedDifficulty = 'medium';
                else selectedDifficulty = 'hard';
                startQuiz(selectedDifficulty, selectedTime);
                break;
        }
    }

    function startQuiz(difficulty, timeLimit) {
        showScreen('screen-quiz');
        profile = Progress.load(); // Refresh profile
        Quiz.start(difficulty, timeLimit, profile, onQuizEnd);
    }

    function onQuizEnd(result, newBadges) {
        Sounds.celebration();
        showScreen('screen-results');

        // Title based on performance
        var titles = {
            high: ['Incredible!', 'Amazing!', 'Superstar!', 'Brilliant!'],
            mid: ['Great Job!', 'Well Done!', 'Nice Work!', 'Good Going!'],
            low: ['Good Try!', 'Keep Going!', 'Practice Makes Perfect!']
        };
        var titlePool = result.accuracy >= 80 ? titles.high :
                        result.accuracy >= 50 ? titles.mid : titles.low;
        document.getElementById('results-title').textContent =
            titlePool[Math.floor(Math.random() * titlePool.length)];

        // Stars
        var starsHtml = '';
        for (var i = 1; i <= 3; i++) {
            var earned = i <= result.starsEarned;
            starsHtml += '<span class="results-star ' +
                (earned ? 'results-star--earned' : '') + '">\u2605</span>';
        }
        document.getElementById('results-stars').innerHTML = starsHtml;

        // Stats
        document.getElementById('results-score').textContent =
            result.correctCount + ' / ' + result.totalQuestions;
        document.getElementById('results-accuracy').textContent = result.accuracy + '%';
        document.getElementById('results-streak').textContent = result.bestStreak;

        // Dragon message
        Dragon.speak('dragon-speech-results', Dragon.resultsMessage(result.accuracy), true);

        // Encouragement message
        document.getElementById('results-message').textContent =
            Dragon.resultsMessage(result.accuracy);

        // Confetti for good performance
        if (result.starsEarned >= 3) {
            Rewards.spawnConfetti(60);
            // Fireworks
            setTimeout(function () { Rewards.spawnFirework(100, 200); }, 300);
            setTimeout(function () { Rewards.spawnFirework(250, 150); }, 600);
            setTimeout(function () { Rewards.spawnFirework(180, 300); }, 900);
        } else if (result.starsEarned >= 2) {
            Rewards.spawnConfetti(30);
        }

        // Badge popups
        var badgesHtml = '';
        if (newBadges.length > 0) {
            newBadges.forEach(function (badge, idx) {
                setTimeout(function () {
                    Rewards.showBadgePopup(badge);
                }, 1500 + idx * 3000);
            });
            badgesHtml = '<p style="font-weight:900;color:var(--color-warning);">' +
                '\uD83C\uDFC5 New Badge' + (newBadges.length > 1 ? 's' : '') + ' Unlocked!</p>';
            newBadges.forEach(function (b) {
                badgesHtml += '<span style="font-size:2rem;">' + b.icon + '</span> ';
            });
        }
        document.getElementById('results-badges').innerHTML = badgesHtml;

        // Refresh profile for home screen
        profile = Progress.load();
    }

    // ===== PROGRESS SCREEN =====
    function renderProgress() {
        profile = Progress.load();

        document.getElementById('prog-quizzes').textContent = profile.stats.totalQuizzes;
        document.getElementById('prog-correct').textContent = profile.stats.totalCorrect;
        document.getElementById('prog-streak').textContent = profile.stats.bestStreak;
        document.getElementById('prog-stars').textContent = profile.stats.totalStars;

        // Mastery grid
        var grid = Progress.getMasteryGrid(profile);
        var gridEl = document.getElementById('mastery-grid');
        gridEl.innerHTML = '';

        // Header row: empty corner + column labels
        var corner = document.createElement('div');
        corner.className = 'mastery-cell mastery-header';
        corner.textContent = '\u00D7';
        gridEl.appendChild(corner);
        for (var c = 1; c <= 12; c++) {
            var hdr = document.createElement('div');
            hdr.className = 'mastery-cell mastery-header';
            hdr.textContent = c;
            gridEl.appendChild(hdr);
        }

        // Data rows
        for (var r = 0; r < 12; r++) {
            var rowLabel = document.createElement('div');
            rowLabel.className = 'mastery-cell mastery-header';
            rowLabel.textContent = r + 1;
            gridEl.appendChild(rowLabel);

            for (var cc = 0; cc < 12; cc++) {
                var cell = document.createElement('div');
                cell.className = 'mastery-cell mastery-cell--' + grid[r][cc].level;
                var acc = grid[r][cc].accuracy;
                if (acc >= 0) cell.textContent = acc + '%';
                gridEl.appendChild(cell);
            }
        }

        // Badge shelf
        var shelfEl = document.getElementById('badge-shelf');
        shelfEl.innerHTML = '';
        Rewards.getAllBadges().forEach(function (badge) {
            var unlocked = profile.badges.indexOf(badge.id) !== -1;
            var item = document.createElement('div');
            item.className = 'badge-item';
            item.innerHTML =
                '<div class="badge-icon ' + (unlocked ? '' : 'badge-icon--locked') + '">' +
                    (unlocked ? badge.icon : '\uD83D\uDD12') +
                '</div>' +
                '<span class="badge-name">' + badge.name + '</span>';
            shelfEl.appendChild(item);
        });
    }

    // ===== HELPERS =====
    function highlightDifficulty(diff) {
        document.querySelectorAll('.difficulty-card').forEach(function (card) {
            card.classList.toggle('difficulty-card--selected', card.dataset.difficulty === diff);
        });
    }

    function highlightTime(time) {
        document.querySelectorAll('.time-btn').forEach(function (btn) {
            btn.classList.toggle('time-btn--active', parseInt(btn.dataset.time) === time);
        });
    }

    function updateMuteButton() {
        var muted = Sounds.isMuted();
        document.querySelector('.mute-icon-on').style.display = muted ? 'none' : 'inline';
        document.querySelector('.mute-icon-off').style.display = muted ? 'inline' : 'none';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen: showScreen,
        profile: function () { return profile; }
    };
})();
