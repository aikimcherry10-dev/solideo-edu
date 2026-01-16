describe('Memory Calculation Utils', () => {
  // 메모리 계산 로직 테스트
  const getRealMemoryUsed = (memData) => {
    if (memData.active && memData.wired) {
      // macOS
      return memData.active + memData.wired;
    }
    if (memData.available !== undefined) {
      // Linux: MemTotal - MemAvailable가 더 정확함
      return memData.total - memData.available;
    }
    // Fallback
    return memData.used - (memData.buffcache || 0);
  };

  describe('macOS Memory Calculation', () => {
    it('should calculate memory using active + wired on macOS', () => {
      const memData = {
        total: 16000000000,
        used: 12000000000,
        free: 4000000000,
        available: 8000000000,
        active: 5000000000,
        wired: 3000000000,
        buffcache: 2000000000
      };

      const result = getRealMemoryUsed(memData);

      expect(result).toBe(8000000000); // 5B + 3B
    });

    it('should prefer active + wired over available', () => {
      const memData = {
        total: 16000000000,
        used: 12000000000,
        free: 4000000000,
        available: 6000000000,
        active: 7000000000,
        wired: 4000000000,
        buffcache: 0
      };

      const result = getRealMemoryUsed(memData);

      // macOS 우선: active + wired = 11B (not total - available = 10B)
      expect(result).toBe(11000000000);
    });
  });

  describe('Linux Memory Calculation', () => {
    it('should calculate memory using total - available on Linux', () => {
      const memData = {
        total: 16000000000,
        used: 12000000000,
        free: 4000000000,
        available: 8000000000, // Linux에서 사용
        active: undefined,
        wired: undefined,
        buffcache: 2000000000
      };

      const result = getRealMemoryUsed(memData);

      expect(result).toBe(8000000000); // 16B - 8B
    });

    it('should be more accurate than used - buffcache', () => {
      const memData = {
        total: 16000000000,
        used: 10000000000,
        free: 6000000000,
        available: 8000000000, // used - buffcache = 10B - 1B = 9B보다 정확
        buffcache: 1000000000
      };

      const result = getRealMemoryUsed(memData);

      // Linux: total - available = 8B (더 정확함)
      expect(result).toBe(8000000000);
      expect(result).not.toBe(9000000000); // used - buffcache와 다름
    });
  });

  describe('Fallback Memory Calculation', () => {
    it('should use used - buffcache as fallback', () => {
      const memData = {
        total: 16000000000,
        used: 10000000000,
        free: 6000000000,
        buffcache: 2000000000
        // available와 active/wired 모두 없음
      };

      const result = getRealMemoryUsed(memData);

      expect(result).toBe(8000000000); // 10B - 2B
    });

    it('should handle missing buffcache', () => {
      const memData = {
        total: 16000000000,
        used: 10000000000,
        free: 6000000000
        // available, active, wired, buffcache 모두 없음
      };

      const result = getRealMemoryUsed(memData);

      expect(result).toBe(10000000000); // 그냥 used 사용
    });
  });

  describe('Memory Percentage Calculation', () => {
    it('should calculate correct memory percentage', () => {
      const memData = {
        total: 16000000000,
        active: 8000000000,
        wired: 0
      };

      const used = getRealMemoryUsed(memData);
      const percentage = (used / memData.total) * 100;

      expect(percentage).toBe(50);
    });

    it('should handle 100% memory usage', () => {
      const memData = {
        total: 16000000000,
        used: 16000000000,
        available: 0,
        active: 8000000000,
        wired: 8000000000
      };

      const used = getRealMemoryUsed(memData);
      const percentage = (used / memData.total) * 100;

      expect(percentage).toBe(100);
    });

    it('should handle near-0% memory usage', () => {
      const memData = {
        total: 16000000000,
        available: 15999999000,
        active: undefined,
        wired: undefined,
        used: 1000
      };

      const used = getRealMemoryUsed(memData);
      const percentage = (used / memData.total) * 100;

      expect(percentage).toBeLessThan(0.01);
    });
  });

  describe('Network Stats Aggregation', () => {
    it('should correctly aggregate network statistics', () => {
      const networkStats = [
        {
          iface: 'eth0',
          rx_sec: 1000,
          tx_sec: 2000,
          rx_bytes: 1000000,
          tx_bytes: 2000000
        },
        {
          iface: 'wlan0',
          rx_sec: 500,
          tx_sec: 1500,
          rx_bytes: 500000,
          tx_bytes: 1500000
        }
      ];

      const totalNetwork = networkStats.reduce((acc, iface) => ({
        rx_sec: acc.rx_sec + (iface.rx_sec || 0),
        tx_sec: acc.tx_sec + (iface.tx_sec || 0),
        rx_bytes: acc.rx_bytes + (iface.rx_bytes || 0),
        tx_bytes: acc.tx_bytes + (iface.tx_bytes || 0)
      }), { rx_sec: 0, tx_sec: 0, rx_bytes: 0, tx_bytes: 0 });

      expect(totalNetwork.rx_sec).toBe(1500);
      expect(totalNetwork.tx_sec).toBe(3500);
      expect(totalNetwork.rx_bytes).toBe(1500000);
      expect(totalNetwork.tx_bytes).toBe(3500000);
    });

    it('should handle missing network speed data', () => {
      const networkStats = [
        {
          iface: 'eth0',
          rx_sec: undefined,
          tx_sec: 2000
        },
        {
          iface: 'wlan0',
          rx_sec: 500,
          tx_sec: undefined
        }
      ];

      const totalNetwork = networkStats.reduce((acc, iface) => ({
        rx_sec: acc.rx_sec + (iface.rx_sec || 0),
        tx_sec: acc.tx_sec + (iface.tx_sec || 0)
      }), { rx_sec: 0, tx_sec: 0 });

      expect(totalNetwork.rx_sec).toBe(500);
      expect(totalNetwork.tx_sec).toBe(2000);
    });
  });
});
