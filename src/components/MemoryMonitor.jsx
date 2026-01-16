import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
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
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function MemoryMonitor({ data, dataHistory, compact, showChart }) {
    const memory = data?.memory || {};
    const usagePercent = memory.usagePercent || 0;
    const used = memory.used || 0;
    const total = memory.total || 1;
    const available = memory.available || 0;

    // Compact card view
    if (compact) {
        return (
            <div className="card card-memory">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon memory">🧠</div>
                        <span>메모리</span>
                    </div>
                </div>
                <div className="card-value">
                    {usagePercent.toFixed(1)}
                    <span className="unit">%</span>
                </div>
                <div className="card-subtitle">
                    {formatBytes(used)} / {formatBytes(total)}
                </div>
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill memory"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Chart view with doughnut
    if (showChart && dataHistory) {
        const doughnutData = {
            labels: ['사용 중', '사용 가능'],
            datasets: [
                {
                    data: [used, available],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(255, 255, 255, 0.1)'
                    ],
                    borderColor: [
                        'rgb(139, 92, 246)',
                        'rgba(255, 255, 255, 0.2)'
                    ],
                    borderWidth: 2,
                    cutout: '75%'
                }
            ]
        };

        const doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: (context) => {
                            return `${context.label}: ${formatBytes(context.raw)}`;
                        }
                    }
                }
            }
        };

        const lineData = {
            labels: dataHistory.map((_, i) => `${i}s`),
            datasets: [
                {
                    label: '메모리 사용률',
                    data: dataHistory.map(d => d?.memory?.usagePercent || 0),
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        };

        const lineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
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
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        callback: (value) => `${value}%`
                    }
                }
            },
            animation: {
                duration: 0
            }
        };

        return (
            <div className="card card-memory">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon memory">🧠</div>
                        <span>메모리 사용량</span>
                    </div>
                    <div className="card-value" style={{ fontSize: '1.5rem' }}>
                        {usagePercent.toFixed(1)}%
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                    {/* Doughnut Chart */}
                    <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {usagePercent.toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ flex: 1 }}>
                        <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="stat-item">
                                <div className="stat-label">사용 중</div>
                                <div className="stat-value">{formatBytes(used)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">사용 가능</div>
                                <div className="stat-value">{formatBytes(available)}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">전체</div>
                                <div className="stat-value">{formatBytes(total)}</div>
                            </div>
                            {memory.swapUsed > 0 && (
                                <div className="stat-item">
                                    <div className="stat-label">스왑</div>
                                    <div className="stat-value">
                                        {formatBytes(memory.swapUsed)} / {formatBytes(memory.swapTotal)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="chart-container" style={{ height: '150px', marginTop: '16px' }}>
                    <Line data={lineData} options={lineOptions} />
                </div>
            </div>
        );
    }

    return null;
}

export default MemoryMonitor;
