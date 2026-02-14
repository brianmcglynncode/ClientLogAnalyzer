const fs = require('fs');

function dumpLog() {
    const logFilePath = 'Antonino MAZZONELLO.txt';
    const buffer = fs.readFileSync(logFilePath, { encoding: null, flag: 'r' });

    console.log(`Log File Size: ${buffer.length} bytes`);

    console.log('\n--- FIRST 500 BYTES (HEX and UTF-8) ---');
    const first500 = buffer.slice(0, 500);
    console.log(first500.toString('hex').match(/.{1,32}/g).join('\n'));
    console.log('\nUTF-8 Interpretation:');
    console.log(first500.toString('utf8'));

    console.log('\n--- LINE ENDING CHECK ---');
    const content = buffer.slice(0, 1000).toString('utf8');
    console.log(`Includes \\r\\n: ${content.includes('\r\n')}`);
    console.log(`Includes \\n: ${content.includes('\n')}`);

    console.log('\n--- SPLIT TEST ---');
    const lines = content.split(/\r?\n/);
    console.log(`Lines found in first 1000 bytes: ${lines.length}`);
    lines.slice(0, 5).forEach((line, i) => {
        console.log(`L${i + 1}: [${line.substring(0, 50)}...] (length: ${line.length})`);
    });
}

dumpLog();
