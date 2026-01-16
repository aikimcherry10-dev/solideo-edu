function formatUptime(seconds) {
    if (!seconds) return 'N/A';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);

    return parts.join(' ') || '0분';
}

function SystemInfo({ systemInfo, data }) {
    const os = systemInfo?.os || {};
    const cpu = systemInfo?.cpu || {};
    const load = data?.load || {};

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <div className="card-icon system">ℹ️</div>
                    <span>시스템 정보</span>
                </div>
            </div>

            <div className="system-info-list">
                <div className="system-info-item">
                    <span className="label">운영체제</span>
                    <span className="value">{os.distro || 'Unknown'} {os.release || ''}</span>
                </div>
                <div className="system-info-item">
                    <span className="label">호스트명</span>
                    <span className="value">{os.hostname || 'Unknown'}</span>
                </div>
                <div className="system-info-item">
                    <span className="label">아키텍처</span>
                    <span className="value">{os.arch || 'Unknown'}</span>
                </div>
                <div className="system-info-item">
                    <span className="label">CPU</span>
                    <span className="value">{cpu.manufacturer || ''} {cpu.brand || 'Unknown'}</span>
                </div>
                <div className="system-info-item">
                    <span className="label">코어 / 스레드</span>
                    <span className="value">
                        {cpu.physicalCores || '?'} / {cpu.cores || '?'}
                    </span>
                </div>
                <div className="system-info-item">
                    <span className="label">CPU 속도</span>
                    <span className="value">{cpu.speed || '?'} GHz</span>
                </div>
                <div className="system-info-item">
                    <span className="label">가동 시간</span>
                    <span className="value">{formatUptime(systemInfo?.uptime)}</span>
                </div>
                <div className="system-info-item">
                    <span className="label">시스템 부하</span>
                    <span className="value">
                        {load.currentLoad?.toFixed(1) || '0'}%
                        <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            (User: {load.currentLoadUser?.toFixed(1) || '0'}% /
                            System: {load.currentLoadSystem?.toFixed(1) || '0'}%)
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SystemInfo;
