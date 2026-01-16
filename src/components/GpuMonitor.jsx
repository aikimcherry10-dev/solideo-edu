function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function GpuMonitor({ data }) {
    const gpus = data?.gpu || [];

    if (gpus.length === 0) {
        return (
            <div className="card card-gpu">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon gpu">🎮</div>
                        <span>GPU</span>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    color: 'var(--text-muted)'
                }}>
                    <p>GPU 정보를 가져올 수 없습니다</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                        (macOS에서는 일부 GPU 정보가 제한될 수 있습니다)
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card card-gpu">
            <div className="card-header">
                <div className="card-title">
                    <div className="card-icon gpu">🎮</div>
                    <span>GPU</span>
                </div>
            </div>

            <div className="disk-list">
                {gpus.map((gpu, index) => (
                    <div key={index} className="disk-item">
                        <div className="disk-item-header">
                            <span className="disk-name">{gpu.model || 'Unknown GPU'}</span>
                            <span className="disk-size">{gpu.vendor || ''}</span>
                        </div>

                        {/* GPU Usage if available */}
                        {gpu.utilizationGpu !== null && (
                            <>
                                <div className="progress-label">
                                    <span>GPU 사용률</span>
                                    <span>{gpu.utilizationGpu?.toFixed(1)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill gpu"
                                        style={{ width: `${Math.min(gpu.utilizationGpu || 0, 100)}%` }}
                                    />
                                </div>
                            </>
                        )}

                        <div className="stats-grid mt-2">
                            {gpu.vram && (
                                <div className="stat-item">
                                    <div className="stat-label">VRAM</div>
                                    <div className="stat-value">{gpu.vram} MB</div>
                                </div>
                            )}
                            {gpu.temperatureGpu !== null && (
                                <div className="stat-item">
                                    <div className="stat-label">온도</div>
                                    <div className="stat-value" style={{
                                        color: gpu.temperatureGpu >= 80 ? 'var(--accent-red)' :
                                            gpu.temperatureGpu >= 60 ? 'var(--accent-yellow)' :
                                                'var(--accent-green)'
                                    }}>
                                        {gpu.temperatureGpu}°C
                                    </div>
                                </div>
                            )}
                            {gpu.memoryUsed !== null && gpu.memoryTotal !== null && (
                                <>
                                    <div className="stat-item">
                                        <div className="stat-label">메모리 사용</div>
                                        <div className="stat-value">{formatBytes(gpu.memoryUsed * 1024 * 1024)}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">메모리 전체</div>
                                        <div className="stat-value">{formatBytes(gpu.memoryTotal * 1024 * 1024)}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GpuMonitor;
