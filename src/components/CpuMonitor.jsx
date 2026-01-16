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

function CpuMonitor({ data, dataHistory, compact, showChart }) {
    const cpuUsage = data?.cpu?.usage || 0;
    const temperature = data?.cpu?.temperature;

    const getTempClass = (temp) => {
        if (!temp) return '';
        if (temp >= 80) return 'hot';
        if (temp >= 60) return 'warm';
        return 'cool';
    };

    // Compact card view
    if (compact) {
        return (
            <div className="card card-cpu">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon cpu">💻</div>
                        <span>CPU</span>
                    </div>
                    {temperature && (
                        <div className="temp-display">
                            <span className="temp-icon">🌡️</span>
                            <span className={`temp-value ${getTempClass(temperature)}`}>
                                {temperature.toFixed(0)}°C
                            </span>
                        </div>
                    )}
                </div>
                <div className="card-value">
                    {cpuUsage.toFixed(1)}
                    <span className="unit">%</span>
                </div>
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill cpu"
                            style={{ width: `${Math.min(cpuUsage, 100)}%` }}
                        />
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
                    label: 'CPU 사용률',
                    data: dataHistory.map(d => d?.cpu?.usage || 0),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8
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
            <div className="card card-cpu">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon cpu">💻</div>
                        <span>CPU 사용률 추이</span>
                    </div>
                    <div className="card-value" style={{ fontSize: '1.5rem' }}>
                        {cpuUsage.toFixed(1)}%
                    </div>
                </div>
                <div className="chart-container">
                    <Line data={chartData} options={options} />
                </div>
                {data?.cpu?.usagePerCore && data.cpu.usagePerCore.length > 0 && (
                    <div className="stats-grid mt-4">
                        {data.cpu.usagePerCore.slice(0, 8).map((usage, i) => (
                            <div key={i} className="stat-item">
                                <div className="stat-label">코어 {i + 1}</div>
                                <div className="stat-value">{usage.toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export default CpuMonitor;
