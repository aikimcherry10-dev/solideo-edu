# Testing Guide - SysMon Pro

간단하고 효과적인 테스트 가이드입니다.

## 테스트 실행

### 전체 테스트 실행
```bash
npm test
```

### Watch 모드 (개발 중 자동 재실행)
```bash
npm run test:watch
```

### 커버리지 리포트
```bash
npm run test:coverage
```

---

## 테스트 구조

```
server/
├── __tests__/
│   ├── systemMonitor.test.js    # 시스템 모니터링 함수 테스트
│   ├── cors.test.js              # CORS 설정 테스트
│   └── memoryUtils.test.js        # 메모리 계산 유틸리티 테스트
├── systemMonitor.js
├── index.js
└── ...
```

---

## 테스트 커버리지

현재 작성된 테스트:

### 1️⃣ systemMonitor.test.js (12개 테스트)
- ✅ `getSystemInfo()` 함수 테스트
  - CPU, 메모리, OS 정보 조회
  - 에러 처리 및 예외 상황

- ✅ `getRealtimeData()` 함수 테스트
  - 실시간 데이터 구조 검증
  - CPU 사용률 계산
  - 메모리 계산 (Linux/macOS)
  - GPU 처리
  - 프로세스 필터링

### 2️⃣ cors.test.js (3개 테스트)
- ✅ CORS origin 검증
  - Allowed origin 확인
  - Disallowed origin 차단
  - 환경변수 처리

### 3️⃣ memoryUtils.test.js (11개 테스트)
- ✅ macOS 메모리 계산
- ✅ Linux 메모리 계산
- ✅ Fallback 메모리 계산
- ✅ 메모리 백분율 계산
- ✅ 네트워크 통계 집계

**총 26개의 단위 테스트**

---

## 테스트 예시

### systemMonitor 테스트 실행
```bash
npm test -- systemMonitor.test.js
```

### 특정 테스트만 실행
```bash
npm test -- --testNamePattern="should return system info"
```

### CORS 테스트 실행
```bash
npm test -- cors.test.js
```

---

## 주요 테스트 시나리오

### ✅ systemMonitor 테스트
1. **getSystemInfo()**
   - CPU 정보 조회 ✓
   - 메모리 정보 조회 ✓
   - OS 정보 조회 ✓
   - API 에러 처리 ✓

2. **getRealtimeData()**
   - 실시간 CPU, 메모리 데이터 ✓
   - Linux 메모리 계산 (total - available) ✓
   - macOS 메모리 계산 (active + wired) ✓
   - 프로세스 필터링 (idle 제외) ✓
   - GPU 데이터 처리 ✓

### ✅ CORS 테스트
1. **Allowed Origins**
   - localhost:5173 ✓
   - 127.0.0.1:5173 ✓
   - Same-origin ✓

2. **Disallowed Origins**
   - External domains 차단 ✓

### ✅ 메모리 계산 테스트
1. **플랫폼별 계산**
   - macOS: active + wired ✓
   - Linux: total - available ✓
   - Fallback: used - buffcache ✓

---

## 테스트 결과 해석

### 성공
```
PASS  server/__tests__/systemMonitor.test.js
  systemMonitor
    getSystemInfo
      ✓ should return system info (5ms)
      ✓ should handle errors gracefully (3ms)
    getRealtimeData
      ✓ should return realtime data (7ms)
```

### 실패
```
FAIL  server/__tests__/systemMonitor.test.js
  ● getSystemInfo › should return system info
    Expected value to be defined
```

---

## CI/CD 통합

GitHub Actions와 같은 CI 도구에서 사용:
```yaml
- name: Run tests
  run: npm test -- --coverage
```

---

## 주의사항

1. **모킹 사용**: `systeminformation` 라이브러리는 모킹됨
2. **실제 시스템 정보**: 통합 테스트 필요 시 별도 설정 필요
3. **WebSocket 테스트**: 별도의 통합 테스트 필요

---

## 다음 단계

### 추가 권장 테스트
- [ ] React 컴포넌트 테스트 (React Testing Library)
- [ ] E2E 테스트 (Cypress 또는 Playwright)
- [ ] API 통합 테스트 (supertest)
- [ ] 성능 테스트 (Lighthouse)

---

## 문제 해결

### Jest 실행 오류
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
npm test
```

### 테스트 타임아웃
```bash
# Jest 타임아웃 증가 (5초)
npm test -- --testTimeout=5000
```

---

더 많은 정보는 [Jest Documentation](https://jestjs.io/)을 참고하세요.
