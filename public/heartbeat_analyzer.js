/**
 * ClientLogAnalyzer – Heartbeat Analyzer
 * Specialized logic for parsing and rendering system health JSON
 */

let hbLatencyChart = null;

window.fetchAndRenderHeartbeat = async function (filename = 'Heartbeat.txt') {
    console.log('[HB] Fetching Heartbeat:', filename);
    const loader = document.getElementById('loader');
    const hbDashboard = document.getElementById('heartbeat-dashboard');
    const hbFilenameDisplay = document.getElementById('id-heartbeat-filename');
    const loaderText = document.getElementById('loader-text');

    try {
        loader.classList.remove('hidden');
        hbDashboard.classList.add('hidden');
        if (loaderText) loaderText.textContent = `Analyzing Heartbeat ${filename}...`;

        const url = `/api/heartbeat?file=${encodeURIComponent(filename)}`;
        console.log('[HB] Fetch URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch heartbeat: ${response.status}`);
        }

        const data = await response.json();
        console.log('[HB] Data received:', data);

        if (!data || typeof data !== 'object') {
            throw new Error('Server returned invalid data format');
        }

        hbFilenameDisplay.textContent = filename;
        renderHeartbeatDashboard(data);

        loader.classList.add('hidden');
        hbDashboard.classList.remove('hidden');
        console.log('[HB] Dashboard rendered successfully');
    } catch (e) {
        console.error('[HB] Error:', e);
        loader.innerHTML = `
            <div class="glass-card">
                <p style="color: var(--danger); font-weight: 600;">Heartbeat Error: ${e.message}</p>
                <button onclick="switchMode('heartbeat')" style="margin-top: 15px; background: var(--accent-purple); border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; color: #fff;">Retry</button>
            </div>`;
    }
};

function renderHeartbeatDashboard(data) {
    const analysis = analyzeHeartbeat(data);

    // 1. Update Hero / Health Status
    const statusBadge = document.getElementById('hb-overall-status');
    const statusTitle = document.getElementById('hb-status-title');
    const statusMessage = document.getElementById('hb-status-message');
    const hero = document.getElementById('hb-health-hero');

    const totalChecks = analysis.checks.length;
    const completeChecks = analysis.checks.filter(c => c.status === 'complete').length;
    const failedChecks = analysis.checks.filter(c => c.status === 'failed').length;

    if (failedChecks > 0) {
        statusBadge.textContent = '⚠';
        statusBadge.className = 'hb-badge status-critical';
        statusTitle.textContent = 'System Status: Issues Detected';
        statusMessage.textContent = `${failedChecks} diagnostic checks failed. Attention required.`;
        hero.style.borderColor = 'var(--danger)';
    } else if (completeChecks < totalChecks) {
        statusBadge.textContent = '!';
        statusBadge.className = 'hb-badge status-warning';
        statusTitle.textContent = 'System Status: Warning';
        statusMessage.textContent = 'Some checks are still running or waiting.';
        hero.style.borderColor = 'var(--warning)';
    } else {
        statusBadge.textContent = '✓';
        statusBadge.className = 'hb-badge status-healthy';
        statusTitle.textContent = 'System Status: Healthy';
        statusMessage.textContent = 'All diagnostic checks passed in the latest heartbeat.';
        hero.style.borderColor = 'var(--success)';
    }

    // 2. Update Stats
    document.getElementById('hb-mics-count').textContent = analysis.devices.microphones.length;
    document.getElementById('hb-cams-count').textContent = analysis.devices.cameras.length;
    document.getElementById('hb-webex-version').textContent = analysis.webexVersion;
    document.getElementById('hb-latency-avg').textContent = analysis.latencyAvg ? `${analysis.latencyAvg}ms` : 'N/A';

    // 3. Render Checks Grid
    const checksGrid = document.getElementById('hb-checks-grid');
    checksGrid.innerHTML = analysis.checks.map(c => `
        <div class="hb-check-card">
            <div class="hb-check-header">
                <div class="card-title">${c.description}</div>
                <div class="status-pill pill-${c.status}">${c.status}</div>
            </div>
            ${c.debugText ? `<div class="card-debug">${c.debugText}</div>` : ''}
            <div class="card-meta">
                ${c.duration ? `<span>⏱ ${c.duration}ms</span>` : ''}
                ${c.ping ? `<span>⚡ ${c.ping}ms</span>` : ''}
            </div>
        </div>
    `).join('');

    // 4. Render Latency Chart
    renderLatencyChart(analysis.latencyHistory);

    // 5. Render Events
    const eventList = document.getElementById('hb-event-list');
    eventList.innerHTML = analysis.events.map(e => `
        <div class="explorer-item">
            <span class="time">${new Date(e.time).toLocaleTimeString([], { hour12: false })}</span>
            <span class="msg">${e.message}</span>
        </div>
    `).join('');
}

function analyzeHeartbeat(data) {
    const analysis = {
        webexVersion: data.pageSpec?.webexVersion || 'Unknown',
        devices: {
            microphones: (data.deviceInfos || []).filter(d => d.kind === 'audioinput'),
            cameras: (data.deviceInfos || []).filter(d => d.kind === 'videoinput')
        },
        checks: [],
        latencyHistory: [],
        latencyAvg: 0,
        events: []
    };

    // Extract Health Checks
    if (data.lobbyCheckUserResults) {
        Object.values(data.lobbyCheckUserResults).forEach(cat => {
            Object.entries(cat).forEach(([key, check]) => {
                analysis.checks.push({
                    id: key,
                    description: check.description || key,
                    status: check.status,
                    debugText: check.debugText,
                    duration: (check.timeEnd && check.timeStart) ? (check.timeEnd - check.timeStart) : null,
                    ping: check.timePing || check.timeToDownload
                });
            });
        });
    }

    // Extract Latency & Events from logs
    if (data.logInfo) {
        let totalPing = 0;
        let pingsCount = 0;

        data.logInfo.forEach(log => {
            const [time, tabId, msg] = log;
            analysis.events.push({ time, message: msg });

            if (msg.includes('quickPingCheck:Ping')) {
                const match = msg.match(/-\s(\d+)\smilliseconds/);
                if (match) {
                    const val = parseInt(match[1]);
                    analysis.latencyHistory.push({ time, val });
                    totalPing += val;
                    pingsCount++;
                }
            }
        });

        if (pingsCount > 0) analysis.latencyAvg = Math.round(totalPing / pingsCount);
    }

    return analysis;
}

function renderLatencyChart(history) {
    const ctx = document.getElementById('hb-latency-chart').getContext('2d');

    if (hbLatencyChart) hbLatencyChart.destroy();

    const labels = history.map(h => new Date(h.time).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }));
    const values = history.map(h => h.val);

    hbLatencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Latency (ms)',
                data: values,
                borderColor: '#9d50bb',
                backgroundColor: 'rgba(157, 80, 187, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#a0a0a0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a0a0a0' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
