import { describe, expect, it } from 'vitest';
import { validateRoutes } from './routeValidation';

describe('validateRoutes', () => {
  it('should accept null or undefined routes', () => {
    expect(validateRoutes(null)).toEqual({ valid: true });
    expect(validateRoutes(undefined)).toEqual({ valid: true });
  });

  it('should reject non-object routes', () => {
    expect(validateRoutes('string')).toEqual({
      valid: false,
      error: 'Routes must be an object mapping path patterns to target URLs',
    });
    expect(validateRoutes(123)).toEqual({
      valid: false,
      error: 'Routes must be an object mapping path patterns to target URLs',
    });
  });

  it('should reject array routes', () => {
    expect(validateRoutes([])).toEqual({
      valid: false,
      error: 'Routes must be an object mapping path patterns to target URLs',
    });
  });

  it('should reject empty routes object', () => {
    expect(validateRoutes({})).toEqual({
      valid: false,
      error: 'Routes object cannot be empty',
    });
  });

  it('should reject path patterns not starting with /', () => {
    expect(validateRoutes({ 'api/test': 'https://example.com' })).toEqual({
      valid: false,
      error:
        'Invalid path pattern "api/test". Path patterns must start with "/"',
    });
  });

  it('should reject non-string target URLs', () => {
    expect(validateRoutes({ '/api': 123 })).toEqual({
      valid: false,
      error: 'Invalid target URL for path "/api". Target must be a string',
    });
  });

  it('should reject invalid URL formats', () => {
    expect(validateRoutes({ '/api': 'not-a-url' })).toEqual({
      valid: false,
      error:
        'Invalid target URL "not-a-url" for path "/api". Must be a valid URL',
    });
  });

  it('should reject URLs without http/https protocol', () => {
    expect(validateRoutes({ '/api': 'ftp://example.com' })).toEqual({
      valid: false,
      error:
        'Invalid target URL "ftp://example.com" for path "/api". Must use http:// or https:// protocol',
    });
  });

  it('should accept valid route configurations', () => {
    expect(
      validateRoutes({
        '/api/users/*': 'https://users-service.com',
        '/api/products/*': 'https://products-service.com',
        '/api/*': 'https://api.example.com',
        '/*': 'https://default.com',
      }),
    ).toEqual({ valid: true });
  });

  it('should accept routes with http protocol', () => {
    expect(
      validateRoutes({
        '/api/*': 'http://localhost:3000',
      }),
    ).toEqual({ valid: true });
  });

  it('should accept routes with ports', () => {
    expect(
      validateRoutes({
        '/api/*': 'https://example.com:8080',
      }),
    ).toEqual({ valid: true });
  });

  it('should accept routes with paths', () => {
    expect(
      validateRoutes({
        '/api/*': 'https://example.com/path/to/service',
      }),
    ).toEqual({ valid: true });
  });

  it('should accept routes with query parameters', () => {
    expect(
      validateRoutes({
        '/api/*': 'https://example.com?param=value',
      }),
    ).toEqual({ valid: true });
  });
});
