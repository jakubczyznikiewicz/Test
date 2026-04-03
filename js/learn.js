// ===== LEARN MODE =====
var Learn = (function () {
    var currentTable = 0;
    var currentStep = 1; // 1-12 for array builder
    var skipAnimTimer = null;

    function selectTable(table) {
        currentTable = table;
        currentStep = 1;

        // Highlight selected button
        document.querySelectorAll('.table-btn').forEach(function (btn) {
            btn.classList.toggle('table-btn--selected', parseInt(btn.dataset.table) === table);
        });

        // Show learn content
        document.getElementById('learn-content').style.display = 'flex';

        // Dragon speaks
        Dragon.speak('dragon-speech-learn', Dragon.learnIntroMessage(table), true);

        // Initialize all panels
        renderArray();
        renderSkipCounting();
        renderHundredsChart();

        Sounds.tap();
    }

    // ===== ARRAY BUILDER =====
    function renderArray() {
        var a = currentTable;
        var b = currentStep;
        var answer = a * b;

        document.getElementById('array-title').innerHTML = a + ' &times; ' + b + ' = ?';
        document.getElementById('array-step').textContent = b + ' of 12';

        var grid = document.getElementById('array-grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = 'repeat(' + b + ', 1fr)';

        // Build array with staggered animation
        for (var row = 0; row < a; row++) {
            for (var col = 0; col < b; col++) {
                var dot = document.createElement('div');
                dot.className = 'array-dot';
                dot.style.animationDelay = (row * 0.15 + col * 0.05) + 's';
                grid.appendChild(dot);
            }
        }

        // Show running count
        var countEl = document.getElementById('array-count');
        countEl.textContent = '';

        // Animate the counting
        var count = 0;
        var rowIdx = 0;
        var countTimer = setInterval(function () {
            if (rowIdx < a) {
                count += b;
                rowIdx++;

                // Highlight current row
                var dots = grid.querySelectorAll('.array-dot');
                for (var c = (rowIdx - 1) * b; c < rowIdx * b; c++) {
                    if (dots[c]) dots[c].classList.add('array-dot--highlight');
                }

                if (rowIdx < a) {
                    countEl.textContent = b + ' + '.repeat(rowIdx).slice(0, -3).split('+').length > 1
                        ? count + '...'
                        : count + '...';
                    countEl.textContent = count + '...';
                } else {
                    countEl.textContent = a + ' \u00D7 ' + b + ' = ' + answer + '!';
                    document.getElementById('array-title').innerHTML = a + ' &times; ' + b + ' = ' + answer;
                }
                Sounds.pop();
            } else {
                clearInterval(countTimer);
            }
        }, 400);

        Dragon.speak('dragon-speech-learn', Dragon.learnArrayMessage(a, b), false);
    }

    function arrayNext() {
        if (currentStep < 12) {
            currentStep++;
            renderArray();
            Sounds.tap();
        }
    }

    function arrayPrev() {
        if (currentStep > 1) {
            currentStep--;
            renderArray();
            Sounds.tap();
        }
    }

    // ===== SKIP COUNTING =====
    function renderSkipCounting() {
        var n = currentTable;
        var line = document.getElementById('skip-number-line');
        line.innerHTML = '';

        var max = n * 12;
        // Show numbers from 1 to max (capped at reasonable display)
        var display = Math.min(max, n * 12);

        for (var i = 1; i <= display; i++) {
            var num = document.createElement('div');
            num.className = 'skip-num';
            num.textContent = i;
            num.dataset.num = i;
            if (i % n === 0) {
                // Will be highlighted during animation
            }
            line.appendChild(num);
        }

        document.getElementById('skip-title').textContent = 'Skip Counting by ' + n + 's';
        Dragon.speak('dragon-speech-learn', Dragon.learnSkipMessage(n), false);
    }

    function animateSkipCounting() {
        var n = currentTable;
        var max = n * 12;

        // Reset all highlights
        document.querySelectorAll('.skip-num').forEach(function (el) {
            el.classList.remove('skip-num--active', 'skip-num--hop');
        });

        // Animate one by one
        var step = 0;
        if (skipAnimTimer) clearInterval(skipAnimTimer);

        skipAnimTimer = setInterval(function () {
            step++;
            var val = n * step;
            if (val > max) {
                clearInterval(skipAnimTimer);
                skipAnimTimer = null;
                return;
            }

            var el = document.querySelector('.skip-num[data-num="' + val + '"]');
            if (el) {
                el.classList.add('skip-num--active', 'skip-num--hop');
                Sounds.hop();

                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 500);
    }

    // ===== HUNDREDS CHART =====
    function renderHundredsChart() {
        var n = currentTable;
        var chart = document.getElementById('hundreds-chart');
        chart.innerHTML = '';

        for (var i = 1; i <= 100; i++) {
            var cell = document.createElement('div');
            cell.className = 'chart-cell';
            cell.textContent = i;
            if (i % n === 0) {
                cell.classList.add('chart-cell--highlight');
            }
            chart.appendChild(cell);
        }

        document.getElementById('chart-title').textContent = 'Multiples of ' + n;
        document.getElementById('chart-pattern').textContent = Dragon.chartPatternMessage(n);

        Dragon.speak('dragon-speech-learn', Dragon.learnChartMessage(n), false);
    }

    // Tab switching
    function switchTab(tabName) {
        document.querySelectorAll('.learn-tab').forEach(function (tab) {
            tab.classList.toggle('learn-tab--active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.learn-panel').forEach(function (panel) {
            panel.classList.remove('learn-panel--active');
        });
        var panel = document.getElementById('learn-' + tabName);
        if (panel) panel.classList.add('learn-panel--active');
        Sounds.tap();
    }

    function cleanup() {
        if (skipAnimTimer) {
            clearInterval(skipAnimTimer);
            skipAnimTimer = null;
        }
    }

    return {
        selectTable: selectTable,
        arrayNext: arrayNext,
        arrayPrev: arrayPrev,
        animateSkipCounting: animateSkipCounting,
        switchTab: switchTab,
        cleanup: cleanup,
        getCurrentTable: function () { return currentTable; }
    };
})();
