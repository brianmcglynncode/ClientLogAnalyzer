document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const dashboard = document.getElementById('dashboard');
    const browseUploadBtn = document.getElementById('browse-upload-btn');
    const logFileInput = document.getElementById('log-file-input');
    const displayFilename = document.getElementById('display-filename');

    const explorerContainer = document.getElementById('explorer-container');
    const diagnosisContainer = document.getElementById('diagnosis-container');
    const diagnosisContent = document.getElementById('diagnosis-content');
    const aiStatus = document.getElementById('ai-status');
    const hbBrowseBtn = document.getElementById('hb-browse-upload-btn');
    const hbFileInput = document.getElementById('hb-file-input');

    let currentMode = 'meeting';

    window.switchMode = function (mode) {
        currentMode = mode;

        // Update Buttons
        document.getElementById('btn-meeting-logs').classList.toggle('active', mode === 'meeting');
        document.getElementById('btn-heartbeats').classList.toggle('active', mode === 'heartbeat');

        // Update Headers
        document.getElementById('meeting-header').classList.toggle('hidden', mode !== 'meeting');
        document.getElementById('heartbeat-header').classList.toggle('hidden', mode !== 'heartbeat');

        // Update Dashboards
        dashboard.classList.toggle('hidden', mode !== 'meeting');
        document.getElementById('heartbeat-dashboard').classList.toggle('hidden', mode !== 'heartbeat');

        // Hide common overlays
        loader.classList.add('hidden');
        explorerContainer.classList.add('hidden');
        diagnosisContainer.classList.add('hidden');

        if (mode === 'meeting') {
            fetchAndRender(); // Load default log
        } else {
            console.log('[App] Switching to Heartbeat mode');
            window.fetchAndRenderHeartbeat(); // Load default heartbeat
        }
    };

    async function fetchAndRender(filename = '') {
        try {
            loader.classList.remove('hidden');
            dashboard.classList.add('hidden');
            explorerContainer.classList.add('hidden');
            diagnosisContainer.classList.add('hidden');
            loaderText.textContent = filename ? `Analyzing ${filename}...` : 'Initializing Dashboard...';

            const url = filename ? `/api/analyze?file=${encodeURIComponent(filename)}` : '/api/analyze';
            const response = await fetch(url);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Server error (${response.status})`);
            }

            const data = await response.json();
            console.log('[App] Received Analysis Data:', data);
            displayFilename.textContent = data.currentFile;
            renderDashboard(data);

        } catch (error) {
            console.error('Analysis Error:', error);
            loader.innerHTML = `
                <div class="glass-card">
                    <p style="color: #ff4b2b; font-weight: 600;">Startup Error: ${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">The intelligence engine is active, but couldn't load the default log. You can still upload a log file below.</p>
                    <button onclick="document.getElementById('log-file-input').click()" style="margin-top: 15px; background: var(--accent-blue); border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600;">Upload Audit Log</button>
                    <button onclick="location.reload()" style="margin-top: 15px; background: rgba(255,255,255,0.1); border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; color: #fff; margin-left: 10px;">Retry</button>
                </div>`;
        }
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            loader.classList.remove('hidden');
            dashboard.classList.add('hidden');
            loaderText.textContent = `Uploading ${file.name}...`;
            browseUploadBtn.disabled = true;

            const formData = new FormData();
            formData.append('logFile', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            const result = await response.json();
            console.log('Upload success, starting analysis:', result.filename);

            setTimeout(() => {
                fetchAndRender(result.filename);
                browseUploadBtn.disabled = false;
            }, 500);

        } catch (error) {
            console.error('Upload Error:', error);
            alert(`Upload failed: ${error.message}`);
            browseUploadBtn.disabled = false;
            loader.classList.add('hidden');
            dashboard.classList.remove('hidden');
        }
    }

    function renderDashboard(data) {
        // 1. UX Assessment Hero
        const uxBadge = document.getElementById('ux-score-badge');
        uxBadge.textContent = data.uxSummary.rating;
        uxBadge.className = `ux-badge rating-${data.uxSummary.rating}`;
        document.getElementById('ux-score-title').textContent = `Overall Experience: ${data.uxSummary.score}`;
        document.getElementById('ux-score-message').textContent = data.uxSummary.message;
        document.getElementById('ux-assessment').style.borderColor = { 5: '#00ff88', 3: '#f9d423', 2: '#ff4b2b' }[data.uxSummary.rating];

        // 1.5 Timing Metadata
        if (data.timing) {
            document.getElementById('meeting-entry').textContent = data.timing.entryTime !== 'N/A' ? formatTime(data.timing.entryTime) : 'N/A';
            document.getElementById('meeting-exit').textContent = data.timing.exitTime !== 'N/A' ? formatTime(data.timing.exitTime) : 'N/A';
            document.getElementById('meeting-duration').textContent = data.timing.duration;
        }

        // 2. Metadata Cards & Global Counter
        if (data.globalStats) {
            const counterBadge = document.getElementById('total-analyzed-badge');
            if (counterBadge) counterBadge.textContent = data.globalStats.totalFilesAnalyzed || 0;
        }

        document.getElementById('browser-info').textContent = data.metadata.browser || 'N/A';
        document.getElementById('webex-version').textContent = data.metadata.webexVersion || 'N/A';
        document.getElementById('platform-info').textContent = data.metadata.platform || 'N/A';
        document.getElementById('machine-info').textContent = data.metadata.machine || 'N/A';

        // 3. Media Diagnostics & Empty State
        const mediaBanner = document.getElementById('media-status-banner');
        const deviceList = document.getElementById('media-devices');

        if (data.status === 'awaiting_upload') {
            mediaBanner.innerHTML = `<p style="color: var(--accent-blue)">✨ Diagnostic Engine Online. Please upload a Webex audit log file to generate a deep analysis.</p>`;
            ['high', 'medium', 'low'].forEach(id => {
                const container = document.getElementById(`errors-${id}`);
                if (container) {
                    container.innerHTML = `
                        <div class="no-issues-mini" style="padding: 20px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
                            Waiting for diagnostic data...
                        </div>`;
                }
            });
            deviceList.innerHTML = '';
            loader.classList.add('hidden');
            dashboard.classList.remove('hidden');
            return;
        }

        if (data.diagnostics.media.devices.microphones.length === 0 || data.diagnostics.media.devices.cameras.length === 0) {
            mediaBanner.innerHTML = `<p style="color: #ff4b2b">⚠️ Critical warning: Missing hardware paths. Check client connections.</p>`;
        } else {
            mediaBanner.innerHTML = `<p style="color: #00ff88">✓ Audio and Video systems are correctly initialized.</p>`;
        }

        deviceList.innerHTML = '';
        const cats = {
            'Microphones': data.diagnostics.media.devices.microphones,
            'Cameras': data.diagnostics.media.devices.cameras,
            'Speakers': data.diagnostics.media.devices.speakers
        };
        for (const [name, devices] of Object.entries(cats)) {
            const devDiv = document.createElement('div');
            devDiv.className = 'device-item';
            devDiv.innerHTML = `<h4>${name}</h4><p>${devices.length > 0 ? devices.join(', ') : 'None'}</p>`;
            deviceList.appendChild(devDiv);
        }

        // 4. Error Clusters (Categorized)
        // Render timing & disconnects
        document.getElementById('meeting-duration').textContent = data.timing.duration;
        document.getElementById('meeting-entry').textContent = data.timing.entryTime !== 'N/A' ? new Date(data.timing.entryTime).toLocaleTimeString() : 'N/A';
        document.getElementById('meeting-exit').textContent = data.timing.exitTime !== 'N/A' ? new Date(data.timing.exitTime).toLocaleTimeString() : 'N/A';

        const discBadge = document.getElementById('disconnects-badge');
        document.getElementById('meeting-disconnects').textContent = data.disconnectCount;
        if (data.disconnectCount > 0) {
            discBadge.classList.add('warning-active');
        } else {
            discBadge.classList.remove('warning-active');
        }

        // Render Error Intelligence Sections
        const categoryIds = ['high', 'medium', 'low'];
        categoryIds.forEach(id => {
            const container = document.getElementById(`errors-${id}`);
            container.innerHTML = '';

            const filtered = data.errorClusters.filter(c => c.severity.toLowerCase() === id);
            if (filtered.length === 0) {
                container.innerHTML = `<div class="no-issues-mini">No ${id} severity issues detected</div>`;
            } else {
                filtered.forEach(cluster => {
                    const item = document.createElement('div');
                    item.className = 'cluster-item-mini';
                    item.onclick = () => selectCluster(cluster);

                    item.innerHTML = `
                    <div class="cluster-info">
                        <div class="cluster-msg-mini">${cluster.message}</div>
                    </div>
                    <div class="cluster-meta-mini">
                        <span class="cluster-tag-mini">${cluster.category.toUpperCase()}</span>
                        <div class="cluster-badge">${cluster.count} Events</div>
                    </div>
                `;
                    container.appendChild(item);
                });
            }
        });

        loader.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }

    async function selectCluster(cluster) {
        // 1. Open Explorer
        explorerContainer.classList.remove('hidden');
        document.getElementById('selected-cluster-name').textContent = cluster.id === 'ROAP_PROTOCOL_EVENT_CONSOLIDATED' ? 'ROAP Media Protocol' : `${cluster.category}: ${cluster.message.substring(0, 40)}`;
        const explorerList = document.getElementById('explorer-list');
        explorerList.innerHTML = '';
        cluster.instances.forEach(ins => {
            const div = document.createElement('div');
            div.className = 'explorer-item';
            div.innerHTML = `<span class="time">${formatTime(ins.timestamp)}</span><span class="msg">${ins.raw}</span>`;
            explorerList.appendChild(div);
        });

        // 2. Trigger AI Diagnosis
        diagnosisContainer.classList.remove('hidden');
        diagnosisContent.classList.add('hidden');
        aiStatus.classList.remove('hidden');

        try {
            console.log(`[App] Fetching diagnosis for: ${cluster.id}`);
            const response = await fetch(`/api/diagnose?clusterId=${encodeURIComponent(cluster.id)}&category=${encodeURIComponent(cluster.category)}`);
            const diag = await response.json();
            console.log('[App] Received Diagnosis:', diag);

            const reasonEl = document.getElementById('diag-reason');
            const detailEl = document.getElementById('diag-detail');
            const solutionEl = document.getElementById('diag-solution');

            if (reasonEl) reasonEl.textContent = diag.likelyReason || '-';
            if (detailEl) detailEl.textContent = diag.technicalDetail || '-';
            if (solutionEl) solutionEl.textContent = diag.solution || '-';

            aiStatus.classList.add('hidden');
            diagnosisContent.classList.remove('hidden');
        } catch (e) {
            console.error('[App] Diagnosis failed:', e);
            aiStatus.classList.add('hidden');
        }

        explorerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Event Listeners
    browseUploadBtn.onclick = () => logFileInput.click();
    logFileInput.onchange = handleFileUpload;

    hbBrowseBtn.onclick = () => hbFileInput.click();
    hbFileInput.onchange = (e) => handleHeartbeatUpload(e);

    document.getElementById('close-explorer').onclick = () => {
        explorerContainer.classList.add('hidden');
        diagnosisContainer.classList.add('hidden');
    };

    async function handleHeartbeatUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            loader.classList.remove('hidden');
            document.getElementById('heartbeat-dashboard').classList.add('hidden');
            loaderText.textContent = `Uploading Heartbeat ${file.name}...`;

            const formData = new FormData();
            formData.append('logFile', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            console.log('[App] Heartbeat upload success:', result.filename);

            setTimeout(() => {
                window.fetchAndRenderHeartbeat(result.filename);
            }, 500);

        } catch (error) {
            console.error('HB Upload Error:', error);
            alert(`HB Upload failed: ${error.message}`);
            loader.classList.add('hidden');
        }
    }

    // PDF Download Logic
    document.getElementById('download-pdf-btn').onclick = () => {
        const element = document.getElementById('dashboard');
        const originalOverflow = element.style.overflow;
        element.style.overflow = 'visible'; // Ensure full height is captured

        // Clone to modify for print structure if needed (optional, keeping simple for now)
        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: `ClientLogReport_${displayFilename.textContent}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Add a temporary title for the PDF
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px; color: #000;">
                <h1 style="font-size: 24px; margin: 0;">Client Log Analysis Report</h1>
                <p style="font-size: 14px; margin: 5px 0;">File: ${displayFilename.textContent}</p>
                <p style="font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        // Wrap logic to include title
        const contentContainer = document.createElement('div');
        contentContainer.appendChild(titleDiv);
        contentContainer.appendChild(element.cloneNode(true));
        
        // Adjust styles for PDF specific container (forcing light theme for readability or keeping dark)
        // For this app, let's keep the dark theme aesthetic but ensure it fits
        contentContainer.style.background = '#05070a'; 
        contentContainer.style.color = '#e0e0e0';
        contentContainer.style.padding = '20px';
        contentContainer.querySelectorAll('.glass-card').forEach(card => {
            card.style.background = 'rgba(255, 255, 255, 0.1)'; // Slightly more opaque for PDF
            card.style.boxShadow = 'none';
        });

        html2pdf().set(opt).from(contentContainer).save().then(() => {
            element.style.overflow = originalOverflow;
        });
    };

    // Initial Load
    fetchAndRender();
});

function formatTime(ts) {
    try {
        if (!ts || ts === 'N/A') return '--:--:--';
        return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return ts; }
}
