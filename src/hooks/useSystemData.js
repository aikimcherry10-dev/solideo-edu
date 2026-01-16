import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSystemData() {
    const [isConnected, setIsConnected] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [dataHistory, setDataHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const socketRef = useRef(null);
    const recordingRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        // Socket.IO 연결
        socketRef.current = io('http://localhost:3001', {
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Connected to server');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            setIsConnected(false);
        });

        socketRef.current.on('system-info', (data) => {
            setSystemInfo(data);
        });

        socketRef.current.on('realtime-data', (data) => {
            setRealtimeData(data);

            // 히스토리 데이터 유지 (최근 60개 = 1분)
            setDataHistory(prev => {
                const newHistory = [...prev, data];
                if (newHistory.length > 60) {
                    return newHistory.slice(-60);
                }
                return newHistory;
            });

            // 녹화 중일 때 데이터 저장
            if (recordingRef.current.length > 0 || isRecording) {
                recordingRef.current.push(data);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // 5분 녹화 시작
    const startRecording = useCallback(() => {
        recordingRef.current = [];
        setIsRecording(true);
        setRecordingTime(300); // 5분 = 300초

        timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setIsRecording(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // 녹화 중지
    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setIsRecording(false);
        setRecordingTime(0);
    }, []);

    // 녹화된 데이터 가져오기
    const getRecordedData = useCallback(() => {
        return recordingRef.current;
    }, []);

    // 녹화 데이터 초기화
    const clearRecordedData = useCallback(() => {
        recordingRef.current = [];
    }, []);

    return {
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
    };
}
