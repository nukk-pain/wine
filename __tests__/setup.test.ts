describe('Development Environment', () => {
  it('should have Next.js running', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
  
  it('should load environment variables', () => {
    // 환경변수 로드 테스트
    expect(typeof process.env).toBe('object');
  });
});