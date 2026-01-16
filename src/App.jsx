import { useSystemData } from './hooks/useSystemData';
import Dashboard from './components/Dashboard';

function App() {
    const {
        isConnected,
        systemInfo,
        realtimeData,
        dataHistory,
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        getRecordedData,
        clearRecordedData
    } = useSystemData();

    if (!isConnected) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">서버에 연결 중...</p>
                <p className="loading-text" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    서버가 실행 중인지 확인해주세요 (npm run server)
                </p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Dashboard
                systemInfo={systemInfo}
                realtimeData={realtimeData}
                dataHistory={dataHistory}
                isConnected={isConnected}
                isRecording={isRecording}
                recordingTime={recordingTime}
                startRecording={startRecording}
                stopRecording={stopRecording}
                getRecordedData={getRecordedData}
                clearRecordedData={clearRecordedData}
            />
        </div>
    );
}

export default App;
