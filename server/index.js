import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getSystemInfo, getRealtimeData } from './systemMonitor.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST']
    }
});

const PORT = 3001;

app.use(cors());
app.use(express.json());

// REST API: 시스템 기본 정보
app.get('/api/system-info', async (req, res) => {
    const info = await getSystemInfo();
    res.json(info);
});

// WebSocket 연결 처리
io.on('connection', async (socket) => {
    console.log('🖥️  Client connected:', socket.id);

    // 초기 시스템 정보 전송
    const systemInfo = await getSystemInfo();
    socket.emit('system-info', systemInfo);

    // 실시간 데이터 전송 인터벌
    let dataInterval = null;

    const startMonitoring = () => {
        if (dataInterval) return;

        dataInterval = setInterval(async () => {
            const data = await getRealtimeData();
            if (data) {
                socket.emit('realtime-data', data);
            }
        }, 1000); // 1초마다 데이터 전송
    };

    // 모니터링 시작
    startMonitoring();

    // 클라이언트가 모니터링 시작 요청
    socket.on('start-monitoring', () => {
        startMonitoring();
    });

    // 클라이언트가 모니터링 중지 요청
    socket.on('stop-monitoring', () => {
        if (dataInterval) {
            clearInterval(dataInterval);
            dataInterval = null;
        }
    });

    // 연결 해제
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        if (dataInterval) {
            clearInterval(dataInterval);
            dataInterval = null;
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     🖥️  System Resource Monitor Server                     ║
║     Running on http://localhost:${PORT}                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});
