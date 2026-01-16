// Chart Configuration
Chart.defaults.color = '#6b7280';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
Chart.defaults.font.family = "'mono', monospace";

const MAX_POINTS = 60; // 1 minute history

// Initialize Main Chart
const ctx = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(MAX_POINTS).fill(''),
        datasets: [
            {
                label: 'CPU',
                data: Array(MAX_POINTS).fill(0),
                borderColor: '#00f3ff',
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0
            },
            {
                label: '메모리',
                data: Array(MAX_POINTS).fill(0),
                borderColor: '#bc13fe',
                backgroundColor: 'rgba(188, 19, 254, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, boxWidth: 8 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(255, 255, 255, 0.02)' }
            },
            x: { display: false }
        },
        animation: false
    }
});

// CPU Sparkline
const cpuCtx = document.getElementById('cpuSparkline').getContext('2d');
const cpuSparkline = new Chart(cpuCtx, {
    type: 'bar',
    data: {
        labels: Array(20).fill(''),
        datasets: [{
            data: Array(20).fill(0),
            backgroundColor: '#00f3ff',
            borderRadius: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false, max: 100 } },
        animation: { duration: 200 } // Subtle animation for bars
    }
});

// Generate Network Activity Bars
const netContainer = document.getElementById('netActivity');
const netBars = [];
for (let i = 0; i < 15; i++) {
    const div = document.createElement('div');
    div.className = 'net-bar';
    div.style.height = '10%';
    div.style.backgroundColor = i % 2 === 0 ? '#3b82f6' : '#10b981';
    netContainer.appendChild(div);
    netBars.push(div);
}

// --- DEBUG CONSOLE ---
const debugContainer = document.createElement('div');
debugContainer.className = 'fixed bottom-0 left-0 w-full h-32 bg-black/90 text-green-400 font-mono text-xs p-2 overflow-y-auto pointer-events-none z-50 opacity-50 hover:opacity-100 transition-opacity';
debugContainer.style.borderTop = '1px solid #333';
document.body.appendChild(debugContainer);

function log(msg) {
    const line = document.createElement('div');
    line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    debugContainer.prepend(line);
    // Cleanup old logs
    if (debugContainer.children.length > 50) debugContainer.lastChild.remove();
}

// --- CONNECTION LOGIC ---
const statusEl = document.getElementById('connectionStatus');
let usePolling = false;
let pollInterval = null;

// 1. Try WebSocket first
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws`;

log(`서버 연결 시도 중: ${wsUrl}...`);
let ws = null;

function connectWebSocket() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        log("WebSocket 연결 성공!");
        setConnectedStatus(true, "WS 모드");
    };

    ws.onclose = (e) => {
        log(`WebSocket 연결 종료 (코드: ${e.code}). 폴링 모드로 전환합니다...`);
        setConnectedStatus(false);
        startPollingFallback();
    };

    ws.onerror = (e) => {
        log("WebSocket 오류 발생.");
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateDashboard(data);
    };
}

function startPollingFallback() {
    if (usePolling) return; // Already polling
    usePolling = true;
    log("HTTP 폴링(대체 모드) 시작...");

    pollInterval = setInterval(async () => {
        try {
            const resp = await fetch('/stats');
            if (!resp.ok) throw new Error("Fetch failed");
            const data = await resp.json();
            updateDashboard(data);
            setConnectedStatus(true, "HTTP 모드");
        } catch (e) {
            log(`폴링 오류: ${e.message}`);
            setConnectedStatus(false);
        }
    }, 1000);
}

function setConnectedStatus(isConnected, mode) {
    if (isConnected) {
        statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500"></span> ${mode || '연결됨'}`;
        statusEl.className = 'flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-mono border border-green-500/30';
    } else {
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 연결 끊김';
        statusEl.className = 'flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-mono border border-red-500/30';
    }
}

// Start
connectWebSocket();

// Update Logic
let lastNetSent = 0;
let lastNetRecv = 0;
let firstRun = true;

function updateDashboard(data) {
    // 1. Text Values
    document.getElementById('cpuValue').innerText = data.cpu.toFixed(1);
    document.getElementById('memValue').innerText = data.memory.toFixed(1);
    document.getElementById('memBar').style.width = `${data.memory}%`;
    document.getElementById('diskValue').innerText = data.disk.toFixed(1);
    document.getElementById('diskBar').style.width = `${data.disk}%`;

    // 2. Network (Calculate Speed)
    if (!firstRun) {
        // Bytes per second (approx since interval is 1s)
        const upSpeed = data.net_sent - lastNetSent;
        const downSpeed = data.net_recv - lastNetRecv;

        document.getElementById('netUp').innerText = formatBytes(upSpeed) + '/s';
        document.getElementById('netDown').innerText = formatBytes(downSpeed) + '/s';

        // Animate bars randomly based on activity
        if (upSpeed + downSpeed > 1024) {
            netBars.forEach(bar => {
                bar.style.height = Math.floor(Math.random() * 80 + 20) + '%';
            });
        } else {
            netBars.forEach(bar => {
                bar.style.height = '10%';
            });
        }
    }
    lastNetSent = data.net_sent;
    lastNetRecv = data.net_recv;
    firstRun = false;

    // 3. Charts
    updateChart(mainChart, data.cpu, data.memory);
    updateSparkline(cpuSparkline, data.cpu);

    // 4. Recording State
    handleRecordingState(data);

    // 5. Top Processes
    updateProcessTable('topCpuList', data.top_cpu, 'cpu_percent', 'text-neonBlue');
    updateProcessTable('topMemList', data.top_mem, 'memory_percent', 'text-neonPurple');
}

function updateProcessTable(elementId, data, key, colorClass) {
    const tbody = document.getElementById(elementId);
    if (!data || data.length === 0) return;

    tbody.innerHTML = data.map(proc => `
        <tr class="border-b border-gray-700/50 last:border-0 hover:bg-white/5 transition-colors">
            <td class="py-2 truncate max-w-[150px] text-gray-300" title="${proc.name}">${proc.name}</td>
            <td class="py-2 text-right text-gray-500 text-xs">${proc.pid}</td>
            <td class="py-2 text-right font-bold ${colorClass}">${(proc[key] || 0).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function updateChart(chart, cpu, mem) {
    const labels = chart.data.labels;
    const cpuData = chart.data.datasets[0].data;
    const memData = chart.data.datasets[1].data;

    // Shift data
    cpuData.shift();
    cpuData.push(cpu);
    memData.shift();
    memData.push(mem);

    chart.update();
}

function updateSparkline(chart, val) {
    const d = chart.data.datasets[0].data;
    d.shift();
    d.push(val);
    chart.update();
}

function handleRecordingState(data) {
    const startBtn = document.getElementById('startBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const ring = document.getElementById('progressRing');
    const timerText = document.getElementById('timer');
    const statusText = document.getElementById('statusText');
    const glow = document.getElementById('recordingGlow');

    if (data.recording_progress > 0 && !data.recording_finished) {
        // Recording in progress
        const percent = data.recording_progress;
        const offset = 377 - (377 * percent / 100);

        ring.style.strokeDashoffset = offset;

        // Calculate remaining time (total 300s)
        const remaining = 300 - (300 * percent / 100);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        timerText.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        statusText.innerText = "기록 진행 중...";
        statusText.className = "text-xs text-red-500 uppercase animate-pulse";

        startBtn.disabled = true;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        startBtn.innerHTML = '데이터 수집 중...';

        downloadBtn.classList.add('hidden');
        glow.classList.remove('opacity-0');

    } else if (data.recording_finished) {
        // Finished
        ring.style.strokeDashoffset = 0;
        timerText.innerText = "00:00";
        statusText.innerText = "분석 완료";
        statusText.className = "text-xs text-green-500 uppercase";

        startBtn.disabled = false;
        startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        startBtn.innerHTML = '새로운 분석 시작';

        downloadBtn.classList.remove('hidden');
        glow.classList.add('opacity-0');
    } else {
        // Idle
        startBtn.disabled = false;
        startBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        5분 정밀 분석 시작`;
    }
}

// Button Events
document.getElementById('startBtn').addEventListener('click', async () => {
    await fetch('/start-recording', { method: 'POST' });
});

// Utils
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

setInterval(() => {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('date').innerText = now.toLocaleDateString();
}, 1000);
