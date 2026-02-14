# ClientLogAnalyzer (v9.0)

ClientLogAnalyzer is a premium, interactive diagnostic suite designed to transform dense Webex audit logs into actionable intelligence. Featuring an AI-powered diagnosis engine and a streamlined local upload workflow, it allows support engineers and administrators to assess meeting quality and root cause technical failures in seconds.

## 🚀 Key Features

- **Executive UX Summary**: Automated assessment of meeting quality (1-5 rating) based on error density and critical failures.
- **AI-Powered Diagnosis**: Real-time analysis of error clusters providing Likely Reasons, Technical Root Causes, and Recommended Actions.
- **Local Log Upload**: Securely upload and analyze any `.txt` or `.log` file from your machine using an integrated `multer` backend.
- **Media Diagnostics**: Prioritized view of hardware health, including microphone, camera, and speaker initialization status.
- **Intelligent Error Clustering**: Automatically groups 50,000+ log lines into unique, actionable issues, filtering out heartbeat noise.
- **Interactive Explorer**: Click any error cluster to drill down into exact timestamps and raw log messages.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Multer
- **Frontend**: Vanilla JS (ES6+), Modern CSS Grid/Flexbox
- **Aesthetics**: Glassmorphism, Dynamic Blobs, Responsive Animations

## 💻 Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/brianmcglynncode/ClientLogAnalyzer.git
   ```
2. Install dependencies:
   ```bash
   cd ClientLogAnalyzer
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:3001`.

## 📂 Project Structure
- `server.js`: Express backend with log parsing and AI diagnosis logic.
- `public/`: Current frontend assets (HTML, CSS, JS).
- `Antonino MAZZONELLO.txt`: Default sample log for immediate testing.

## ⚖️ License
ISC
