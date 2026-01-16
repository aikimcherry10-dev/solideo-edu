import { useRef } from 'react';
import CpuMonitor from './CpuMonitor';
import MemoryMonitor from './MemoryMonitor';
import DiskMonitor from './DiskMonitor';
import NetworkMonitor from './NetworkMonitor';
import GpuMonitor from './GpuMonitor';
import SystemInfo from './SystemInfo';
import ProcessList from './ProcessList';
import PdfExport from './PdfExport';

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function Dashboard({
    systemInfo,
    realtimeData,
    dataHistory,
    isConnected,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    getRecordedData,
    clearRecordedData
}) {
    const dashboardRef = useRef(null);

    return (
        <>
            {/* Header */}
            <header className="header">
                <div className="header-title">
                    <div className="header-icon">📊</div>
                    <div>
                        <h1>System Resource Monitor</h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            실시간 시스템 리소스 모니터링
                        </p>
                    </div>
                </div>

                <div className="header-actions">
                    {/* Connection Status */}
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        {isConnected ? '연결됨' : '연결 끊김'}
                    </div>

                    {/* Timer Display */}
                    {isRecording && (
                        <div className="timer-display recording">
                            <span className="timer-dot"></span>
                            <span className="timer-text">{formatTime(recordingTime)}</span>
                        </div>
                    )}

                    {/* Recording Button */}
                    {!isRecording ? (
                        <button className="btn btn-primary" onClick={startRecording}>
                            ⏱️ 5분 추적 시작
                        </button>
                    ) : (
                        <button className="btn btn-danger" onClick={stopRecording}>
                            ⏹️ 추적 중지
                        </button>
                    )}

                    {/* PDF Export */}
                    <PdfExport
                        dashboardRef={dashboardRef}
                        getRecordedData={getRecordedData}
                        systemInfo={systemInfo}
                        realtimeData={realtimeData}
                        isRecording={isRecording}
                    />
                </div>
            </header>

            {/* Dashboard Content */}
            <div ref={dashboardRef} id="dashboard-content">
                {/* Stats Cards Row */}
                <div className="dashboard-grid">
                    <CpuMonitor data={realtimeData} compact />
                    <MemoryMonitor data={realtimeData} compact />
                    <DiskMonitor data={realtimeData} compact />
                    <NetworkMonitor data={realtimeData} compact />
                </div>

                {/* Charts Row */}
                <div className="dashboard-charts">
                    <CpuMonitor data={realtimeData} dataHistory={dataHistory} showChart />
                    <MemoryMonitor data={realtimeData} dataHistory={dataHistory} showChart />
                </div>

                <div className="dashboard-charts">
                    <NetworkMonitor data={realtimeData} dataHistory={dataHistory} showChart />
                    <GpuMonitor data={realtimeData} />
                </div>

                {/* Bottom Row */}
                <div className="dashboard-bottom">
                    <DiskMonitor data={realtimeData} showDetails />
                    <SystemInfo systemInfo={systemInfo} data={realtimeData} />
                </div>

                {/* Process Lists Row */}
                <div className="dashboard-charts" style={{ marginTop: '20px' }}>
                    <ProcessList processes={realtimeData?.processes} type="cpu" />
                    <ProcessList processes={realtimeData?.processes} type="memory" />
                </div>
            </div>
        </>
    );
}

export default Dashboard;
