import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function formatSpeed(bytesPerSec) {
    if (!bytesPerSec || bytesPerSec < 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(Math.max(bytesPerSec, 1)) / Math.log(k));
    return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function NetworkMonitor({ data, dataHistory, compact, showChart }) {
    const network = data?.network || {};
    const download = network.download || 0;
    const upload = network.upload || 0;

    // Compact card view
    if (compact) {
        return (
            <div className="card card-network">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon network">🌐</div>
                        <span>네트워크</span>
                    </div>
                </div>
                <div className="network-stats" style={{ marginTop: 0, padding: '12px' }}>
                    <div className="network-stat">
                        <div className="network-stat-icon download">⬇️</div>
                        <div className="network-stat-value download">{formatSpeed(download)}</div>
                        <div className="network-stat-label">다운로드</div>
                    </div>
                    <div className="network-stat">
                        <div className="network-stat-icon upload">⬆️</div>
                        <div className="network-stat-value upload">{formatSpeed(upload)}</div>
                        <div className="network-stat-label">업로드</div>
                    </div>
                </div>
            </div>
        );
    }

    // Chart view
    if (showChart && dataHistory) {
        const chartData = {
            labels: dataHistory.map((_, i) => `${i}s`),
            datasets: [
                {
                    label: '다운로드',
                    data: dataHistory.map(d => (d?.network?.download || 0) / 1024), // KB/s
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: '업로드',
                    data: dataHistory.map(d => (d?.network?.upload || 0) / 1024), // KB/s
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)} KB/s`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    display: true,
                    min: 0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        callback: (value) => `${value} KB/s`
                    }
                }
            },
            animation: {
                duration: 0
            }
        };

        return (
            <div className="card card-network">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon network">🌐</div>
                        <span>네트워크 트래픽</span>
                    </div>
                </div>

                <div className="network-stats">
                    <div className="network-stat">
                        <div className="network-stat-icon download">⬇️</div>
                        <div className="network-stat-value download">{formatSpeed(download)}</div>
                        <div className="network-stat-label">다운로드</div>
                    </div>
                    <div className="network-stat">
                        <div className="network-stat-icon upload">⬆️</div>
                        <div className="network-stat-value upload">{formatSpeed(upload)}</div>
                        <div className="network-stat-label">업로드</div>
                    </div>
                    <div className="network-stat">
                        <div className="network-stat-label">총 수신</div>
                        <div className="network-stat-value" style={{ color: 'var(--text-primary)' }}>
                            {formatBytes(network.totalDownload)}
                        </div>
                    </div>
                    <div className="network-stat">
                        <div className="network-stat-label">총 송신</div>
                        <div className="network-stat-value" style={{ color: 'var(--text-primary)' }}>
                            {formatBytes(network.totalUpload)}
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <Line data={chartData} options={options} />
                </div>
            </div>
        );
    }

    return null;
}

export default NetworkMonitor;
