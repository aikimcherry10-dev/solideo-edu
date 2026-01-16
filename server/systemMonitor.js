import si from 'systeminformation';

// 시스템 정보 수집 함수
export async function getSystemInfo() {
    try {
        const [cpu, mem, osInfo, time] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.osInfo(),
            si.time()
        ]);

        return {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores,
                speed: cpu.speed
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used
            },
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: osInfo.hostname
            },
            uptime: time.uptime
        };
    } catch (error) {
        console.error('Error getting system info:', error);
        return null;
    }
}

// 실시간 리소스 데이터 수집
export async function getRealtimeData() {
    try {
        const [
            cpuLoad,
            cpuTemp,
            mem,
            fsSize,
            networkStats,
            graphics,
            currentLoad,
            processes
        ] = await Promise.all([
            si.currentLoad(),
            si.cpuTemperature(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
            si.graphics(),
            si.currentLoad(),
            si.processes()
        ]);

        // 네트워크 총 통계 계산
        const totalNetwork = networkStats.reduce((acc, iface) => ({
            rx_sec: acc.rx_sec + (iface.rx_sec || 0),
            tx_sec: acc.tx_sec + (iface.tx_sec || 0),
            rx_bytes: acc.rx_bytes + (iface.rx_bytes || 0),
            tx_bytes: acc.tx_bytes + (iface.tx_bytes || 0)
        }), { rx_sec: 0, tx_sec: 0, rx_bytes: 0, tx_bytes: 0 });

        // GPU 정보 추출
        const gpuInfo = graphics.controllers && graphics.controllers.length > 0
            ? graphics.controllers.map(gpu => ({
                model: gpu.model,
                vendor: gpu.vendor,
                vram: gpu.vram,
                temperatureGpu: gpu.temperatureGpu || null,
                utilizationGpu: gpu.utilizationGpu || null,
                memoryUsed: gpu.memoryUsed || null,
                memoryTotal: gpu.memoryTotal || null
            }))
            : [];

        // 메모리 계산 로직 수정 (macOS 호환성 강화)
        const realUsed = (mem.active && mem.wired)
            ? mem.active + mem.wired
            : (mem.used - (mem.buffcache || 0));

        return {
            timestamp: Date.now(),
            cpu: {
                usage: cpuLoad.currentLoad || 0,
                usagePerCore: cpuLoad.cpus ? cpuLoad.cpus.map(c => c.load) : [],
                temperature: cpuTemp.main || null,
                temperaturePerCore: cpuTemp.cores || []
            },
            memory: {
                total: mem.total,
                used: realUsed,
                free: mem.total - realUsed,
                available: mem.available,
                swapTotal: mem.swaptotal,
                swapUsed: mem.swapused,
                swapFree: mem.swapfree,
                usagePercent: (realUsed / mem.total) * 100
            },
            disk: fsSize.map(fs => ({
                fs: fs.fs,
                type: fs.type,
                mount: fs.mount,
                size: fs.size,
                used: fs.used,
                available: fs.available,
                usagePercent: fs.use
            })),
            network: {
                download: totalNetwork.rx_sec,
                upload: totalNetwork.tx_sec,
                totalDownload: totalNetwork.rx_bytes,
                totalUpload: totalNetwork.tx_bytes,
                interfaces: networkStats.map(iface => ({
                    iface: iface.iface,
                    rx_sec: iface.rx_sec || 0,
                    tx_sec: iface.tx_sec || 0
                }))
            },
            gpu: gpuInfo,
            load: {
                avgLoad: currentLoad.avgLoad || 0,
                currentLoad: currentLoad.currentLoad || 0,
                currentLoadUser: currentLoad.currentLoadUser || 0,
                currentLoadSystem: currentLoad.currentLoadSystem || 0
            },
            processes: processes.list ? processes.list.map(p => ({
                pid: p.pid,
                name: p.name,
                cpu: p.cpu || 0,
                mem: p.mem || 0,
                memRss: p.memRss || 0,
                state: p.state
            })).filter(p => p.cpu > 0 || p.memRss > 0) : []
        };
    } catch (error) {
        console.error('Error getting realtime data:', error);
        return null;
    }
}
