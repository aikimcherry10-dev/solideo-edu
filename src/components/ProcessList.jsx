function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function ProcessList({ processes, type }) {
    const sortedProcesses = type === 'cpu'
        ? [...(processes || [])].sort((a, b) => b.cpu - a.cpu).slice(0, 8)
        : [...(processes || [])].sort((a, b) => b.mem - a.mem).slice(0, 8);

    const getBarColor = (value, type) => {
        if (type === 'cpu') {
            if (value > 50) return 'var(--accent-red)';
            if (value > 20) return 'var(--accent-yellow)';
            return 'var(--accent-green)';
        } else {
            if (value > 500 * 1024 * 1024) return 'var(--accent-red)';
            if (value > 100 * 1024 * 1024) return 'var(--accent-yellow)';
            return 'var(--accent-purple)';
        }
    };

    if (!processes || processes.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className={`card-icon ${type === 'cpu' ? 'cpu' : 'memory'}`}>
                            {type === 'cpu' ? '⚡' : '📊'}
                        </div>
                        <span>{type === 'cpu' ? 'CPU 사용량 Top 프로세스' : '메모리 사용량 Top 프로세스'}</span>
                    </div>
                </div>
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    프로세스 정보를 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <div className={`card-icon ${type === 'cpu' ? 'cpu' : 'memory'}`}>
                        {type === 'cpu' ? '⚡' : '📊'}
                    </div>
                    <span>{type === 'cpu' ? 'CPU 사용량 Top 프로세스' : '메모리 사용량 Top 프로세스'}</span>
                </div>
            </div>

            <div className="process-list">
                {/* Header */}
                <div className="process-header">
                    <span className="process-rank">#</span>
                    <span className="process-name">프로세스</span>
                    <span className="process-value">{type === 'cpu' ? 'CPU' : '메모리'}</span>
                </div>

                {/* Process items */}
                {sortedProcesses.map((proc, index) => (
                    <div key={proc.pid} className="process-item">
                        <span className="process-rank">{index + 1}</span>
                        <div className="process-info">
                            <span className="process-name" title={proc.name}>
                                {proc.name.length > 20 ? proc.name.substring(0, 20) + '...' : proc.name}
                            </span>
                            <div className="process-bar-container">
                                <div
                                    className="process-bar"
                                    style={{
                                        width: type === 'cpu'
                                            ? `${Math.min(proc.cpu, 100)}%`
                                            : `${Math.min((proc.mem / sortedProcesses[0].mem) * 100, 100)}%`,
                                        background: getBarColor(type === 'cpu' ? proc.cpu : proc.memRss, type)
                                    }}
                                />
                            </div>
                        </div>
                        <span className="process-value" style={{ color: getBarColor(type === 'cpu' ? proc.cpu : proc.memRss, type) }}>
                            {type === 'cpu'
                                ? `${proc.cpu.toFixed(1)}%`
                                : formatBytes(proc.memRss)
                            }
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProcessList;
