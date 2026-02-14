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

    async function fetchAndRender(filename = '') {
        try {
            loader.classList.remove('hidden');
            dashboard.classList.add('hidden');
            explorerContainer.classList.add('hidden');
            diagnosisContainer.classList.add('hidden');
            loaderText.textContent = filename ? `Analyzing ${filename}...` : 'Analyzing default log...';

            const url = filename ? `/api/analyze?file=${encodeURIComponent(filename)}` : '/api/analyze';
            const response = await fetch(url);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Server error (${response.status})`);
            }

            const data = await response.json();
            displayFilename.textContent = data.currentFile;
            renderDashboard(data);

        } catch (error) {
            console.error('Analysis Error:', error);
            loader.innerHTML = `
                <div class="glass-card">
                    <p style="color: #ff4b2b; font-weight: 600;">Analysis failed: ${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 15px; background: var(--accent-blue); border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600;">Retry Defaults</button>
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

        // 2. Metadata Cards
        document.getElementById('browser-info').textContent = data.metadata.browser || 'Unknown';
        document.getElementById('webex-version').textContent = data.metadata.webexVersion || 'N/A';
        document.getElementById('platform-info').textContent = data.metadata.platform || 'N/A';
        document.getElementById('machine-info').textContent = data.metadata.machine || 'N/A';

        // 3. Media Diagnostics
        const mediaBanner = document.getElementById('media-status-banner');
        if (data.diagnostics.media.devices.microphones.length === 0 || data.diagnostics.media.devices.cameras.length === 0) {
            mediaBanner.innerHTML = `<p style="color: #ff4b2b">⚠️ Critical warning: Missing hardware paths. Check client connections.</p>`;
        } else {
            mediaBanner.innerHTML = `<p style="color: #00ff88">✓ Audio and Video systems are correctly initialized.</p>`;
        }

        const deviceList = document.getElementById('media-devices');
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

        // 4. Error Clusters (Interactive)
        const clusterContainer = document.getElementById('error-clusters');
        clusterContainer.innerHTML = '';
        data.errorClusters.forEach(cluster => {
            const div = document.createElement('div');
            div.className = 'cluster-item';
            div.innerHTML = `
                <div class="cluster-info">
                    <p>${cluster.message}</p>
                    <span class="cluster-tag">${cluster.category}</span>
                </div>
                <div class="cluster-count">${cluster.count}x</div>
            `;
            div.onclick = () => selectCluster(cluster);
            clusterContainer.appendChild(div);
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
            const response = await fetch(`/api/diagnose?clusterId=${encodeURIComponent(cluster.id)}&category=${encodeURIComponent(cluster.category)}`);
            const diag = await response.json();

            document.getElementById('diag-reason').textContent = diag.likelyReason;
            document.getElementById('diag-detail').textContent = diag.technicalDetail;
            document.getElementById('diag-solution').textContent = diag.solution;

            aiStatus.classList.add('hidden');
            diagnosisContent.classList.remove('hidden');
        } catch (e) {
            console.error('Diagnosis lookup failed:', e);
            aiStatus.innerHTML = '<span style="color: var(--danger)">Diagnosis unavailable.</span>';
        }

        explorerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Event Listeners
    browseUploadBtn.onclick = () => logFileInput.click();
    logFileInput.onchange = handleFileUpload;
    document.getElementById('close-explorer').onclick = () => {
        explorerContainer.classList.add('hidden');
        diagnosisContainer.classList.add('hidden');
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
