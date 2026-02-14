const fs = require('fs');
const readline = require('readline');

async function testRegex() {
    const logFilePath = 'Antonino MAZZONELLO.txt';
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    console.log("Testing Regex against log file...");

    for await (const line of rl) {
        lineCount++;
        if (lineCount > 10) break;

        // Pattern 1: Current Regex
        const p1 = line.match(/^([^:]+):([^:]+):(?:([^:]+):)?([^:]+):(.*)$/);

        // Pattern 2: Most flexible (splitting by colon)
        const parts = line.split(':');

        console.log(`\nLine ${lineCount}:`);
        console.log(`  Raw: ${line.substring(0, 80)}...`);
        console.log(`  P1 Match: ${!!p1}`);
        if (p1) console.log(`  P1 Level: ${p1[4]}`);
        console.log(`  Split parts: ${parts.length}`);
    }
}

testRegex();
