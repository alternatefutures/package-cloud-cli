import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadFunctionConfig } from './loadFunctionConfig';
import type { AlternateFuturesRootConfig } from '../../../utils/configuration/types';

vi.mock('../../../utils/configuration/loadConfiguration', () => ({
  loadConfiguration: vi.fn(),
}));

import { loadConfiguration } from '../../../utils/configuration/loadConfiguration';

describe('loadFunctionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty object when config has no functions', async () => {
    vi.mocked(loadConfiguration).mockResolvedValue({
      sites: [],
      functions: [],
    } as AlternateFuturesRootConfig);

    const result = await loadFunctionConfig();
    expect(result).toEqual({});
  });

  it('should return empty object when config file not found', async () => {
    vi.mocked(loadConfiguration).mockRejectedValue(
      new Error('Config not found'),
    );

    const result = await loadFunctionConfig();
    expect(result).toEqual({});
  });

  it('should return first function config when no name specified', async () => {
    const mockConfig: AlternateFuturesRootConfig = {
      sites: [],
      functions: [
        {
          name: 'my-function',
          type: 'function',
          routes: {
            '/api/*': 'https://example.com',
          },
        },
      ],
    };

    vi.mocked(loadConfiguration).mockResolvedValue(mockConfig);

    const result = await loadFunctionConfig();
    expect(result).toEqual({
      routes: { '/api/*': 'https://example.com' },
      functionConfig: mockConfig.functions![0],
    });
  });

  it('should return matching function config by name', async () => {
    const mockConfig: AlternateFuturesRootConfig = {
      sites: [],
      functions: [
        {
          name: 'function-1',
          type: 'function',
          routes: {
            '/api1/*': 'https://api1.example.com',
          },
        },
        {
          name: 'function-2',
          type: 'function',
          routes: {
            '/api2/*': 'https://api2.example.com',
          },
        },
      ],
    };

    vi.mocked(loadConfiguration).mockResolvedValue(mockConfig);

    const result = await loadFunctionConfig('function-2');
    expect(result).toEqual({
      routes: { '/api2/*': 'https://api2.example.com' },
      functionConfig: mockConfig.functions![1],
    });
  });

  it('should return single function when name not found but only one function exists', async () => {
    const mockConfig: AlternateFuturesRootConfig = {
      sites: [],
      functions: [
        {
          name: 'function-1',
          type: 'function',
          routes: {
            '/api/*': 'https://example.com',
          },
        },
      ],
    };

    vi.mocked(loadConfiguration).mockResolvedValue(mockConfig);

    const result = await loadFunctionConfig('non-existent');
    // When name not found but only one function exists, returns that function
    expect(result).toEqual({
      routes: { '/api/*': 'https://example.com' },
      functionConfig: mockConfig.functions![0],
    });
  });

  it('should return empty object when multiple functions but no name specified', async () => {
    const mockConfig: AlternateFuturesRootConfig = {
      sites: [],
      functions: [
        {
          name: 'function-1',
          type: 'function',
        },
        {
          name: 'function-2',
          type: 'function',
        },
      ],
    };

    vi.mocked(loadConfiguration).mockResolvedValue(mockConfig);

    const result = await loadFunctionConfig();
    expect(result).toEqual({});
  });

  it('should handle functions without routes', async () => {
    const mockConfig: AlternateFuturesRootConfig = {
      sites: [],
      functions: [
        {
          name: 'my-function',
          type: 'function',
        },
      ],
    };

    vi.mocked(loadConfiguration).mockResolvedValue(mockConfig);

    const result = await loadFunctionConfig('my-function');
    expect(result).toEqual({
      routes: undefined,
      functionConfig: mockConfig.functions![0],
    });
  });
});
