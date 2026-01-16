function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function DiskMonitor({ data, compact, showDetails }) {
    const disks = data?.disk || [];

    // 주요 디스크만 필터링 (/, /System/Volumes/Data 등)
    const mainDisks = disks.filter(d =>
        d.mount === '/' ||
        d.mount === '/System/Volumes/Data' ||
        d.mount.startsWith('/Volumes/')
    );

    const primaryDisk = mainDisks[0] || disks[0];
    const usagePercent = primaryDisk?.usagePercent || 0;

    // Compact card view
    if (compact) {
        return (
            <div className="card card-disk">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon disk">💾</div>
                        <span>디스크</span>
                    </div>
                </div>
                <div className="card-value">
                    {usagePercent.toFixed(1)}
                    <span className="unit">%</span>
                </div>
                {primaryDisk && (
                    <div className="card-subtitle">
                        {formatBytes(primaryDisk.used)} / {formatBytes(primaryDisk.size)}
                    </div>
                )}
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill disk"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Detailed view
    if (showDetails) {
        return (
            <div className="card card-disk">
                <div className="card-header">
                    <div className="card-title">
                        <div className="card-icon disk">💾</div>
                        <span>디스크 파티션</span>
                    </div>
                </div>

                <div className="disk-list">
                    {mainDisks.length > 0 ? mainDisks.map((disk, index) => (
                        <div key={index} className="disk-item">
                            <div className="disk-item-header">
                                <span className="disk-name">{disk.mount}</span>
                                <span className="disk-size">
                                    {formatBytes(disk.used)} / {formatBytes(disk.size)}
                                </span>
                            </div>
                            <div className="progress-label">
                                <span>{disk.type || 'Unknown'}</span>
                                <span>{disk.usagePercent?.toFixed(1)}% 사용</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill disk"
                                    style={{
                                        width: `${Math.min(disk.usagePercent || 0, 100)}%`,
                                        background: disk.usagePercent > 90
                                            ? 'var(--gradient-gpu)'
                                            : disk.usagePercent > 70
                                                ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                                : 'var(--gradient-disk)'
                                    }}
                                />
                            </div>
                            <div className="stats-grid mt-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="stat-item">
                                    <div className="stat-label">사용 중</div>
                                    <div className="stat-value">{formatBytes(disk.used)}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">사용 가능</div>
                                    <div className="stat-value">{formatBytes(disk.available)}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">전체</div>
                                    <div className="stat-value">{formatBytes(disk.size)}</div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="disk-item">
                            <p style={{ color: 'var(--text-muted)' }}>디스크 정보를 불러오는 중...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

export default DiskMonitor;
