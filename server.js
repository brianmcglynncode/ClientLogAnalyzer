const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const STATS_FILE = path.join(__dirname, 'stats.json');

// Initialize stats
function getStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('[Stats] Error reading stats:', e);
    }
    return { totalFilesAnalyzed: 0 };
}

function saveStats(stats) {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error('[Stats] Error saving stats:', e);
    }
}

const app = express();
const port = process.env.PORT || 3001;

// Setup Storage for Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './'); // Save in root for analysis
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original name
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Upload Endpoint
app.post('/api/upload', upload.single('logFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log(`[API] File Uploaded: ${req.file.originalname}`);
    res.json({ filename: req.file.originalname });
});

// AI Diagnosis Endpoint
app.get('/api/diagnose', (req, res) => {
    const clusterId = req.query.clusterId;
    const category = req.query.category;

    console.log(`[AI] Diagnosing Cluster: ${clusterId} (${category})`);

    const diagnoses = {
        'ROAP_PROTOCOL_EVENT_CONSOLIDATED': {
            likelyReason: 'Standard WebRTC/ROAP signaling flow for session establishment.',
            technicalDetail: 'ROAP (RTCWeb Offer/Answer Protocol) is used by Webex to negotiate media capabilities (audio/video codecs, ICE candidates) between the client and the media server.',
            solution: 'If count is extremely high without successful connection, check firewall port 5004 (UDP) and ensure no SSL inspection is breaking the signaling websocket.'
        },
        'TypeError: this[t].serialize is not a function': {
            likelyReason: 'A telemetry or UI state object was undefined when the client tried to send metrics.',
            technicalDetail: 'The JavaScript runtime attempted to call .serialize() on a null or mismatched object, often related to older Webex UI components or cached application states.',
            solution: 'Generally harmless unless UI is freezing. Recommended fix: Clear Webex cache or ensure the client is updated to the latest version.'
        },
        'Security': {
            likelyReason: 'Authentication token expiry or cross-origin policy (CORS) restriction.',
            technicalDetail: 'The client encountered a 401 Unauthorized or 403 Forbidden response when attempting to call a background service like "Mercury" or "UDS".',
            solution: 'Logout and log back in to refresh the OAuth token. Check if a proxy is stripping authorization headers.'
        },
        'Network': {
            likelyReason: 'Intermittent packet loss or DNS resolution failure.',
            technicalDetail: 'The browser detected a socket hang-up (ECONNRESET) or a timeout while fetching critical meeting manifest files.',
            solution: 'Check local network stability. Ensure webex.com and wbx2.com domains are whitelisted in any corporate security software.'
        }
    };

    const result = diagnoses[clusterId] || diagnoses[category] || {
        likelyReason: 'Generic application error or transient state issue.',
        technicalDetail: 'This error indicates a non-critical inconsistency in the client state machine.',
        solution: 'Continue monitorning. If frequency increases, collect a full environment dump with Ctrl+Shift+Alt+D.'
    };

    // Simulate AI "Research" time
    setTimeout(() => {
        res.json(result);
    }, 1200);
});

// Heartbeat Analysis Endpoint
app.get('/api/heartbeat', (req, res) => {
    const requestedFile = req.query.file || 'Heartbeat.txt';
    console.log(`[API] Heartbeat Fetch for: ${requestedFile}`);

    const filePath = path.join(__dirname, requestedFile);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Heartbeat file not found' });
    }

    try {
        const dataBuffer = fs.readFileSync(filePath, 'utf8');
        // Check if it's already JSON or if we need to wrap it
        let jsonData;
        try {
            jsonData = JSON.parse(dataBuffer);
        } catch (e) {
            // If it's the raw Heartbeat.txt format often seen in logs (JSON-like but maybe not perfect)
            // For now assume it's valid JSON if we want to parse it as such
            throw new Error('Invalid JSON format');
        }
        res.json(jsonData);
    } catch (err) {
        console.error('[Heartbeat] Critical Fault:', err);
        res.status(500).json({ error: 'Failed to parse heartbeat data' });
    }
});

app.get('/api/analyze', (req, res) => {
    const requestedFile = req.query.file || 'Antonino MAZZONELLO.txt';
    console.log(`[API] Deep Analysis for: ${requestedFile}`);

    const logFilePath = requestedFile.includes(':') || requestedFile.startsWith('/')
        ? requestedFile
        : path.join(__dirname, requestedFile);

    if (!fs.existsSync(logFilePath)) {
        console.log(`[API] Log file "${requestedFile}" not found at ${logFilePath}. Returning empty state.`);
        return res.json({
            status: 'awaiting_upload',
            currentFile: 'None (Global Dashboard)',
            metadata: { webexVersion: 'N/A', platform: 'N/A', browser: 'N/A', machine: 'N/A' },
            uxSummary: { score: 'Ready', rating: 10, message: 'Please upload a Webex audit log file to begin real-time diagnostic analysis.' },
            diagnostics: {
                network: { status: 'healthy', issues: [], reachability: [], latency: [] },
                media: { status: 'healthy', issues: [], devices: { cameras: [], microphones: [], speakers: [] } },
                security: { status: 'healthy', issues: [] },
                performance: { cpuSpeed: null, benchmarks: [] }
            },
            errorClusters: [],
            lifecycleInsights: []
        });
    }

    const results = {
        currentFile: requestedFile,
        metadata: { webexVersion: 'N/A', platform: 'N/A', browser: 'N/A', machine: 'N/A' },
        uxSummary: { score: 'Excellent', rating: 9, message: 'Meeting seems successful with no major interruptions detected.' },
        timing: { entryTime: 'N/A', exitTime: 'N/A', duration: 'N/A' },
        disconnectCount: 0,
        diagnostics: {
            network: { status: 'healthy', issues: [], reachability: [], latency: [] },
            media: { status: 'healthy', issues: [], devices: { cameras: [], microphones: [], speakers: [] } },
            security: { status: 'healthy', issues: [] },
            performance: { cpuSpeed: null, benchmarks: [] }
        },
        errorClusters: [],
        lifecycleInsights: []
    };

    console.log(`[Analyzer] Starting analysis of: ${requestedFile}`);

    try {
        const dataBuffer = fs.readFileSync(logFilePath, 'utf8');
        const lines = dataBuffer.split(/\r?\n/);
        console.log(`[Analyzer] Total lines to process: ${lines.length}`);
        const rawErrors = [];
        let criticalFailures = 0;
        let firstTimestamp = null;
        let lastTimestamp = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Extract the timestamp from the beginning of the line
            const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
            if (timestampMatch) {
                const ts = timestampMatch[0];
                if (!firstTimestamp) firstTimestamp = ts;
                lastTimestamp = ts;
            }

            const contentLower = line.toLowerCase();

            // 0. Disconnect / Reconnect Detection
            if (contentLower.includes('web socket offline') ||
                contentLower.includes('mercury connection lost') ||
                contentLower.includes('network error') && contentLower.includes('disconnected')) {
                results.disconnectCount++;
            }

            // 1. Metadata Deep Extraction
            if (i < 5000 && contentLower.includes('pagespec') && contentLower.includes('{')) {
                try {
                    const jsonPart = line.substring(line.indexOf('{'));
                    const pageData = JSON.parse(jsonPart);
                    if (pageData.webexVersion) {
                        const ua = pageData.navigator?.userAgent || '';
                        let browser = 'Unknown';
                        if (ua.includes('Edg/')) browser = 'Microsoft Edge';
                        else if (ua.includes('Chrome/')) browser = 'Google Chrome';
                        else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

                        let machine = 'N/A';
                        if (ua.match(/\(([^)]+)\)/)) machine = ua.match(/\(([^)]+)\)/)[1];

                        results.metadata = {
                            url: pageData.url,
                            browser: browser,
                            userAgent: ua,
                            platform: pageData.navigator?.platform || 'N/A',
                            machine: machine,
                            screen: pageData.window ? `${pageData.window.screenWidth}x${pageData.window.screenHeight}` : 'N/A',
                            webexVersion: pageData.webexVersion
                        };
                    }
                } catch (e) { }
            }

            // 2. Diagnostics
            if (contentLower.includes('logunreachableclusters')) {
                results.diagnostics.network.status = 'error';
                criticalFailures++;
                results.diagnostics.network.reachability.push({ timestamp: line.substring(0, 24), message: 'Cluster unreachable' });
            }
            if (contentLower.includes('ping -') && contentLower.includes('milliseconds')) {
                const match = line.match(/(\d+) milliseconds/);
                if (match) results.diagnostics.network.latency.push({ timestamp: line.substring(0, 24), value: parseInt(match[1]) });
            }
            if (contentLower.includes('populatesourcedevices') && contentLower.includes('{')) {
                try {
                    const dev = JSON.parse(line.substring(line.indexOf('{')));
                    const cat = dev.kind === 'videoinput' ? 'cameras' : (dev.kind === 'audioinput' ? 'microphones' : 'speakers');
                    if (cat && dev.label && !results.diagnostics.media.devices[cat].includes(dev.label)) {
                        results.diagnostics.media.devices[cat].push(dev.label);
                    }
                } catch (e) { }
            }

            // 2.5 Lifecycle & Social Insights
            const ts = line.substring(0, 24);
            if (contentLower.includes('davralocation:')) {
                const marker = 'davralocation:';
                const startPos = contentLower.indexOf(marker);
                const loc = line.substring(startPos + marker.length).trim();
                console.log(`[Analyzer] Found Navigation: ${loc}`);
                results.lifecycleInsights.push({ timestamp: ts, type: 'Navigation', message: `Page Loaded: ${loc}`, icon: '📍' });
            } else if (contentLower.includes('webex ready')) {
                results.lifecycleInsights.push({ timestamp: ts, type: 'SDK', message: 'Webex SDK Ready', icon: '🚀' });
            } else if (contentLower.includes('device registered')) {
                results.lifecycleInsights.push({ timestamp: ts, type: 'SDK', message: 'Device Registered on Webex Platform', icon: '🆔' });
            } else if (contentLower.includes('h264 codec loaded successfully')) {
                results.lifecycleInsights.push({ timestamp: ts, type: 'Performance', message: 'H264 Codec Initialized (Hardware Acceleration)', icon: '📽️' });
            } else if (contentLower.includes('visibility changed to')) {
                const state = line.substring(contentLower.indexOf('visibility changed to') + 21).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Activity', message: `User Visibility: ${state}`, icon: '👀' });
            } else if (contentLower.includes('found new participant')) {
                results.lifecycleInsights.push({ timestamp: ts, type: 'Social', message: 'New participant joined meeting', icon: '👤' });
            } else if (contentLower.includes('successfully reached') && contentLower.includes('over udp')) {
                const cluster = line.substring(contentLower.indexOf('reached') + 7, contentLower.indexOf('over')).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Network', message: `Media Cluster Reachable: ${cluster}`, icon: '📡' });
            } else if (contentLower.includes('noteresults: issue')) {
                const msg = line.substring(contentLower.indexOf('issue') + 6).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Diagnostic', message: `Critical Issue: ${msg}`, icon: '⚠️' });
            } else if (contentLower.includes('issue :')) {
                const msg = line.substring(contentLower.indexOf('issue :') + 7).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Diagnostic', message: `Issue Detected: ${msg}`, icon: '🚧' });
            } else if (contentLower.includes('countissues')) {
                const count = line.substring(contentLower.indexOf('countissues') + 12).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Diagnostic', message: `System-wide issues detected: ${count}`, icon: '📊' });
            } else if (contentLower.includes('benchmark') && contentLower.includes(': {')) {
                results.lifecycleInsights.push({ timestamp: ts, type: 'Performance', message: 'System Benchmark Completed', icon: '🏎️' });
            } else if (contentLower.includes('latency test took too long')) {
                const val = line.substring(contentLower.indexOf('long:') + 5).trim();
                results.lifecycleInsights.push({ timestamp: ts, type: 'Performance', message: `High network latency detected: ${val}ms`, icon: '⏳' });
            }

            // 3. Error Detection
            const isError = line.includes(':ERROR:') ||
                (contentLower.includes('error') && !contentLower.includes('no error') && !line.includes('logger#log'));

            if (isError) {
                const timestamp = line.substring(0, 24);
                const zPos = line.indexOf('Z:');
                let content = zPos !== -1 ? line.substring(zPos + 2).trim() : line;

                let clusterKey = content
                    .replace(/^\d+:\d+:(LOG|ERROR|WARN|INFO):/, '')
                    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'ID')
                    .replace(/"\w+":\d+/g, '"KEY":VAL')
                    .replace(/:\d+:\d+:/g, ':IDX:SES:')
                    .substring(0, 100);

                if (contentLower.includes('roap')) {
                    clusterKey = 'ROAP_PROTOCOL_EVENT_CONSOLIDATED';
                }

                rawErrors.push({ timestamp, message: content, clusterKey });
            }
        }

        // 4. UX Assessment Logic
        const errorCount = rawErrors.length;
        if (criticalFailures > 0 || errorCount > 300) {
            results.uxSummary = { score: 'Poor', rating: 3, message: 'User experienced significant technical issues, likely causing connection drops or media failures.' };
        } else if (errorCount > 100) {
            results.uxSummary = { score: 'Fair', rating: 6, message: 'Moderate number of errors detected. The meeting was likely stable but with some minor UI or performance glitches.' };
        }

        // 5. Clustering
        function categorizeError(msg, clusterKey) {
            const m = msg.toLowerCase();

            // HIGH: Direct WebRTC service impact, protocol failures, or hard disconnects
            if (clusterKey === 'ROAP_PROTOCOL_EVENT_CONSOLIDATED' ||
                m.includes('web socket offline') ||
                m.includes('websocket reconnected') ||
                (m.includes('waitforicecandidates') && m.includes('mc-8784')) ||
                m.includes('rejoincurrentmeeting') ||
                m.includes('connection lost') ||
                m.includes('media pipeline') ||
                m.includes('failed to start') ||
                m.includes('ice connection state failed')) {
                return 'High';
            }

            // MEDIUM: Operational anomalies, UI glitches, or transient errors that might be noticeable
            if (m.includes('failed to sync') ||
                m.includes('resource parameter is required') ||
                m.includes('waitforicecandidates') ||
                m.includes('cannot change video layout') ||
                m.includes('typeerror') ||
                m.includes('timeout') ||
                m.includes('retry') ||
                m.includes('mercury') ||
                m.includes('auth')) {
                return 'Medium';
            }

            // LOW: Everything else (background notes, minor serialization, telemetry pings)
            return 'Low';
        }

        const clusters = {};
        rawErrors.forEach(err => {
            const msg = err.message.toLowerCase();
            if (msg.includes('heartbeat')) return;

            if (!clusters[err.clusterKey]) {
                const severity = categorizeError(err.message, err.clusterKey);

                let category = 'Application Error';
                if (err.clusterKey === 'ROAP_PROTOCOL_EVENT_CONSOLIDATED') category = 'Media Protocol (ROAP)';
                else if (msg.includes('downscope')) category = 'Security';
                else if (msg.includes('connec') || msg.includes('reach')) category = 'Network';
                else if (msg.includes('media') || msg.includes('ice')) category = 'Media Connectivity';
                else if (msg.includes('retry')) category = 'Retries';

                let cleanMsg = err.message.substring(err.message.indexOf(':LOG:') !== -1 ? err.message.indexOf(':LOG:') + 5 : 0).trim();
                if (err.clusterKey === 'ROAP_PROTOCOL_EVENT_CONSOLIDATED') cleanMsg = 'Consolidated WebRTC/ROAP Media Protocol Events';

                if (cleanMsg.includes('{')) {
                    const jsonStart = cleanMsg.indexOf('{');
                    try {
                        const parsed = JSON.parse(cleanMsg.substring(jsonStart));
                        if (parsed.currentRoom) cleanMsg = `Room: ${parsed.currentRoom} - Stability Heartbeat`;
                        else if (parsed[1]) cleanMsg = parsed[1];
                        else cleanMsg = cleanMsg.substring(0, jsonStart).trim() || cleanMsg;
                    } catch (e) { }
                }

                clusters[err.clusterKey] = {
                    id: err.clusterKey,
                    message: cleanMsg.substring(0, 100),
                    count: 0,
                    category: category,
                    severity: severity,
                    instances: []
                };
            }
            clusters[err.clusterKey].count++;
            if (clusters[err.clusterKey].instances.length < 200) {
                clusters[err.clusterKey].instances.push({ timestamp: err.timestamp, raw: err.message });
            }
        });

        results.errorClusters = Object.values(clusters)
            .sort((a, b) => b.count - a.count)
            .slice(0, 25);

        // 6. Timing Metadata
        if (firstTimestamp && lastTimestamp) {
            console.log(`[Analyzer] Extracted Timing: ${firstTimestamp} to ${lastTimestamp}`);
            results.timing.entryTime = firstTimestamp;
            results.timing.exitTime = lastTimestamp;
            const diffMs = new Date(lastTimestamp) - new Date(firstTimestamp);
            const totalMinutes = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            results.timing.duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        } else {
            console.log('[Analyzer] Warning: No timestamps extracted from log.');
        }

        // 5. Success
        console.log(`[API] Analysis Complete for: ${targetFile}`);

    } catch (err) {
        console.error('[Analyzer] Critical Fault:', err);
    }

    // Global Counter Incremement
    const stats = getStats();
    stats.totalFilesAnalyzed = (stats.totalFilesAnalyzed || 0) + 1;
    saveStats(stats);

    results.globalStats = stats;
    res.json(results);
});

app.listen(port, () => {
    console.log(`Server starting on port ${port}...`);
});
