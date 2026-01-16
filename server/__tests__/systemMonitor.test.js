import { getSystemInfo, getRealtimeData } from '../systemMonitor.js';
import si from 'systeminformation';

// systeminformation 모듈 모킹
jest.mock('systeminformation');

describe('systemMonitor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemInfo', () => {
    it('should return system info with correct structure', async () => {
      // Mock 데이터 설정
      si.cpu.mockResolvedValue({
        manufacturer: 'Intel',
        brand: 'Core i7',
        cores: 8,
        physicalCores: 4,
        speed: 3.6
      });

      si.mem.mockResolvedValue({
        total: 16000000000,
        free: 8000000000,
        used: 8000000000
      });

      si.osInfo.mockResolvedValue({
        platform: 'linux',
        distro: 'Ubuntu',
        release: '22.04',
        arch: 'x64',
        hostname: 'test-pc'
      });

      si.time.mockResolvedValue({
        uptime: 86400
      });

      const result = await getSystemInfo();

      expect(result).toBeDefined();
      expect(result.cpu).toHaveProperty('manufacturer');
      expect(result.cpu).toHaveProperty('cores');
      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('used');
      expect(result.os).toHaveProperty('platform');
      expect(result.uptime).toBe(86400);
    });

    it('should handle errors gracefully', async () => {
      si.cpu.mockRejectedValue(new Error('API Error'));
      si.mem.mockRejectedValue(new Error('API Error'));
      si.osInfo.mockRejectedValue(new Error('API Error'));
      si.time.mockRejectedValue(new Error('API Error'));

      const result = await getSystemInfo();

      expect(result).toBeNull();
    });

    it('should have correct CPU properties', async () => {
      si.cpu.mockResolvedValue({
        manufacturer: 'AMD',
        brand: 'Ryzen 9',
        cores: 16,
        physicalCores: 8,
        speed: 4.5
      });

      si.mem.mockResolvedValue({
        total: 32000000000,
        free: 16000000000,
        used: 16000000000
      });

      si.osInfo.mockResolvedValue({
        platform: 'win32',
        distro: 'Windows',
        release: '11',
        arch: 'x64',
        hostname: 'PC'
      });

      si.time.mockResolvedValue({
        uptime: 172800
      });

      const result = await getSystemInfo();

      expect(result.cpu.manufacturer).toBe('AMD');
      expect(result.cpu.cores).toBe(16);
      expect(result.memory.total).toBe(32000000000);
    });
  });

  describe('getRealtimeData', () => {
    it('should return realtime data with correct structure', async () => {
      // Mock 데이터 설정
      si.currentLoad.mockResolvedValue({
        currentLoad: 45.5,
        cpus: [
          { load: 40 },
          { load: 50 },
          { load: 45 },
          { load: 46 }
        ],
        avgLoad: 45.25,
        currentLoadUser: 30,
        currentLoadSystem: 15
      });

      si.cpuTemperature.mockResolvedValue({
        main: 65,
        cores: [60, 62, 66, 68]
      });

      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        available: 8500000000,
        active: 5000000000,
        wired: 2000000000,
        swaptotal: 2000000000,
        swapused: 500000000,
        swapfree: 1500000000,
        buffcache: 500000000
      });

      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          mount: '/',
          size: 100000000000,
          used: 50000000000,
          available: 50000000000,
          use: 50
        }
      ]);

      si.networkStats.mockResolvedValue([
        {
          iface: 'eth0',
          rx_sec: 1000,
          tx_sec: 2000,
          rx_bytes: 1000000,
          tx_bytes: 2000000
        }
      ]);

      si.graphics.mockResolvedValue({
        controllers: [
          {
            model: 'NVIDIA GeForce RTX 3060',
            vendor: 'NVIDIA',
            vram: 12000,
            temperatureGpu: 60,
            utilizationGpu: 50,
            memoryUsed: 6000,
            memoryTotal: 12000
          }
        ]
      });

      si.processes.mockResolvedValue({
        list: [
          {
            pid: 1234,
            name: 'node',
            cpu: 15.5,
            mem: 2.5,
            memRss: 250000000,
            state: 'running'
          },
          {
            pid: 5678,
            name: 'chrome',
            cpu: 10,
            mem: 5,
            memRss: 500000000,
            state: 'running'
          }
        ]
      });

      const result = await getRealtimeData();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.cpu).toHaveProperty('usage');
      expect(result.cpu).toHaveProperty('usagePerCore');
      expect(result.memory).toHaveProperty('total');
      expect(result.disk).toBeInstanceOf(Array);
      expect(result.network).toHaveProperty('download');
      expect(result.gpu).toBeInstanceOf(Array);
      expect(result.processes).toBeInstanceOf(Array);
    });

    it('should calculate correct CPU usage', async () => {
      si.currentLoad.mockResolvedValue({
        currentLoad: 55.5,
        cpus: [{ load: 55 }, { load: 56 }],
        avgLoad: 55.5,
        currentLoadUser: 40,
        currentLoadSystem: 15
      });

      si.cpuTemperature.mockResolvedValue({
        main: 70,
        cores: [68, 72]
      });

      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        available: 8500000000
      });

      si.fsSize.mockResolvedValue([]);
      si.networkStats.mockResolvedValue([]);
      si.graphics.mockResolvedValue({ controllers: [] });
      si.processes.mockResolvedValue({ list: [] });

      const result = await getRealtimeData();

      expect(result.cpu.usage).toBe(55.5);
      expect(result.cpu.usagePerCore).toHaveLength(2);
    });

    it('should calculate memory correctly on Linux', async () => {
      si.currentLoad.mockResolvedValue({
        currentLoad: 30,
        cpus: [{ load: 30 }],
        avgLoad: 30,
        currentLoadUser: 20,
        currentLoadSystem: 10
      });

      si.cpuTemperature.mockResolvedValue({
        main: 50,
        cores: []
      });

      // Linux 시스템: available 필드 사용
      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 12000000000,
        free: 4000000000,
        available: 8000000000,
        swaptotal: 2000000000,
        swapused: 500000000,
        swapfree: 1500000000
      });

      si.fsSize.mockResolvedValue([]);
      si.networkStats.mockResolvedValue([]);
      si.graphics.mockResolvedValue({ controllers: [] });
      si.processes.mockResolvedValue({ list: [] });

      const result = await getRealtimeData();

      // Linux: total - available = 16B - 8B = 8B
      expect(result.memory.used).toBe(8000000000);
    });

    it('should calculate memory correctly on macOS', async () => {
      si.currentLoad.mockResolvedValue({
        currentLoad: 30,
        cpus: [{ load: 30 }],
        avgLoad: 30,
        currentLoadUser: 20,
        currentLoadSystem: 10
      });

      si.cpuTemperature.mockResolvedValue({
        main: 50,
        cores: []
      });

      // macOS 시스템: active + wired 사용
      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 12000000000,
        free: 4000000000,
        available: 8000000000,
        active: 5000000000,
        wired: 3000000000,
        swaptotal: 2000000000,
        swapused: 500000000,
        swapfree: 1500000000
      });

      si.fsSize.mockResolvedValue([]);
      si.networkStats.mockResolvedValue([]);
      si.graphics.mockResolvedValue({ controllers: [] });
      si.processes.mockResolvedValue({ list: [] });

      const result = await getRealtimeData();

      // macOS: active + wired = 5B + 3B = 8B
      expect(result.memory.used).toBe(8000000000);
    });

    it('should handle empty GPU list', async () => {
      si.currentLoad.mockResolvedValue({
        currentLoad: 30,
        cpus: [{ load: 30 }],
        avgLoad: 30,
        currentLoadUser: 20,
        currentLoadSystem: 10
      });

      si.cpuTemperature.mockResolvedValue({
        main: 50,
        cores: []
      });

      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        available: 8000000000
      });

      si.fsSize.mockResolvedValue([]);
      si.networkStats.mockResolvedValue([]);
      si.graphics.mockResolvedValue({ controllers: null });
      si.processes.mockResolvedValue({ list: [] });

      const result = await getRealtimeData();

      expect(result.gpu).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      si.currentLoad.mockRejectedValue(new Error('API Error'));
      si.cpuTemperature.mockRejectedValue(new Error('API Error'));
      si.mem.mockRejectedValue(new Error('API Error'));
      si.fsSize.mockRejectedValue(new Error('API Error'));
      si.networkStats.mockRejectedValue(new Error('API Error'));
      si.graphics.mockRejectedValue(new Error('API Error'));
      si.processes.mockRejectedValue(new Error('API Error'));

      const result = await getRealtimeData();

      expect(result).toBeNull();
    });

    it('should filter processes by CPU and memory usage', async () => {
      si.currentLoad.mockResolvedValue({
        currentLoad: 30,
        cpus: [{ load: 30 }],
        avgLoad: 30,
        currentLoadUser: 20,
        currentLoadSystem: 10
      });

      si.cpuTemperature.mockResolvedValue({
        main: 50,
        cores: []
      });

      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        available: 8000000000
      });

      si.fsSize.mockResolvedValue([]);
      si.networkStats.mockResolvedValue([]);
      si.graphics.mockResolvedValue({ controllers: [] });

      // idle 프로세스는 필터링되어야 함
      si.processes.mockResolvedValue({
        list: [
          { pid: 1, name: 'active', cpu: 10, mem: 5, memRss: 100000000, state: 'running' },
          { pid: 2, name: 'idle', cpu: 0, mem: 0, memRss: 0, state: 'sleeping' },
          { pid: 3, name: 'inactive', cpu: 0, mem: 0, memRss: 0, state: 'sleeping' }
        ]
      });

      const result = await getRealtimeData();

      // cpu > 0 또는 memRss > 0인 프로세스만 포함
      expect(result.processes).toHaveLength(1);
      expect(result.processes[0].pid).toBe(1);
    });
  });
});
