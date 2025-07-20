// __tests__/unit/vision-error-handling.test.ts
import { extractTextFromImage } from '@/lib/vision';

describe('Vision API Error Handling', () => {
  it('should handle invalid image format errors', async () => {
    // Test with invalid file extension - this should fail validation
    await expect(extractTextFromImage('invalid.txt'))
      .rejects.toThrow('Unsupported image format');
  });

  it('should handle file not found errors', async () => {
    // Test with non-existent file
    await expect(extractTextFromImage('nonexistent.jpg'))
      .rejects.toThrow('File not found: nonexistent.jpg');
  });

  it('should handle empty filename', async () => {
    // Test with empty filename
    await expect(extractTextFromImage(''))
      .rejects.toThrow();
  });

  it('should handle images with no text', async () => {
    // This should work fine and return empty string for test images in test env
    if (process.env.NODE_ENV === 'test') {
      const result = await extractTextFromImage('test1.jpg');
      expect(typeof result).toBe('string');
    }
  });

  it('should validate image extensions properly', async () => {
    // Test various invalid extensions
    const invalidFiles = [
      'document.pdf',
      'text.docx', 
      'video.mp4',
      'archive.zip',
      'script.js'
    ];

    for (const file of invalidFiles) {
      await expect(extractTextFromImage(file))
        .rejects.toThrow('Unsupported image format');
    }
  });

  it('should accept valid image extensions', async () => {
    // Test valid extensions (in test environment they should work)
    if (process.env.NODE_ENV === 'test') {
      const validFiles = [
        'test1.jpg',
        'test2.jpg'
      ];

      for (const file of validFiles) {
        // Should not throw for valid extensions
        const result = await extractTextFromImage(file);
        expect(typeof result).toBe('string');
      }
    }
  });

  it('should handle path traversal attempts', async () => {
    // Test potential security issues
    const maliciousFiles = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\config\\sam',
      '/etc/shadow'
    ];

    for (const file of maliciousFiles) {
      await expect(extractTextFromImage(file))
        .rejects.toThrow();
    }
  });
});