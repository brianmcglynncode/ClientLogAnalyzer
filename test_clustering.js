const fs = require('fs');

function testClustering() {
    const logFilePath = 'Antonino MAZZONELLO.txt';
    const dataBuffer = fs.readFileSync(logFilePath, 'utf8');
    const lines = dataBuffer.split(/\r?\n/);
    console.log(`Analyzing ${lines.length} lines...`);

    const rawErrors = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const contentLower = line.toLowerCase();

        if (line.includes(':ERROR:') || (contentLower.includes('error') && !contentLower.includes('no error') && !line.includes('logger#log'))) {
            const timestamp = line.substring(0, 24);
            const zPos = line.indexOf('Z:');
            let content = zPos !== -1 ? line.substring(zPos + 2).trim() : line;

            // Normalize for clustering
            let clusterKey = content
                .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'ID')
                .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'TIMESTAMP')
                .replace(/:\d+:\d+:/g, ':IDX:SES:')
                .substring(0, 100); // Shorter key for better grouping

            rawErrors.push({ timestamp, message: content, clusterKey });
        }
    }

    console.log(`Found ${rawErrors.length} raw errors.`);

    const clusters = {};
    rawErrors.forEach(err => {
        if (!clusters[err.clusterKey]) {
            clusters[err.clusterKey] = {
                message: err.message.substring(0, 150),
                count: 0
            };
        }
        clusters[err.clusterKey].count++;
    });

    const sorted = Object.values(clusters).sort((a, b) => b.count - a.count);
    console.log(`Created ${sorted.length} clusters.`);
    sorted.slice(0, 5).forEach(c => console.log(`- [${c.count}x] ${c.message}`));
}

testClustering();
