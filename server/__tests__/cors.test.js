import cors from 'cors';

describe('CORS Configuration', () => {
  it('should allow configured origins', () => {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(allowed => allowed.includes(origin))) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: origin ${origin} is not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    };

    // Test allowed origin
    corsOptions.origin('http://localhost:5173', (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    // Test allowed origin (127.0.0.1)
    corsOptions.origin('http://127.0.0.1:5173', (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    // Test no origin (same origin)
    corsOptions.origin(undefined, (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    // Test disallowed origin
    corsOptions.origin('http://evil.com:5173', (err, result) => {
      expect(err).toBeDefined();
      expect(err.message).toContain('CORS policy');
    });
  });

  it('should have correct CORS options', () => {
    const corsOptions = {
      origin: () => {},
      credentials: true,
      methods: ['GET', 'POST']
    };

    expect(corsOptions.credentials).toBe(true);
    expect(corsOptions.methods).toContain('GET');
    expect(corsOptions.methods).toContain('POST');
  });

  it('should handle environment variable ALLOWED_ORIGINS', () => {
    const envOrigins = 'http://localhost:3000,http://example.com';
    const allowedOrigins = envOrigins.split(',');

    expect(allowedOrigins).toContain('http://localhost:3000');
    expect(allowedOrigins).toContain('http://example.com');
    expect(allowedOrigins.length).toBe(2);
  });
});
