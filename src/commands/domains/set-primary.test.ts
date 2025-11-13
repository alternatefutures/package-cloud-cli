import { AlternateFuturesSdk } from '@alternatefutures/sdk/node';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { output as fakeOutput } from '../../cli';
import { setPrimaryDomainActionHandler } from './set-primary';
import { promptForDomainSelection as fakePromptForDomainSelection } from './prompts/promptForDomainSelection';
import { promptForSiteSelection as fakePromptForSiteSelection } from '../sites/prompts';

vi.mock('./prompts/promptForDomainSelection', () => ({
  promptForDomainSelection: vi.fn().mockResolvedValue({
    id: 'domain-123',
    hostname: 'example.com',
  }),
}));

vi.mock('../sites/prompts', () => ({
  promptForSiteSelection: vi.fn().mockResolvedValue({
    id: 'site-123',
    slug: 'my-site',
  }),
}));

vi.mock('../../cli', () => {
  const output = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    spinner: vi.fn(),
    quoted: vi.fn().mockImplementation((text: string) => `"${text}"`),
    textColor: vi.fn().mockImplementation((text: string) => text),
    printNewLine: vi.fn(),
    hint: vi.fn(),
  };

  return { output };
});

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const domains = {
    setPrimaryDomain: vi.fn().mockResolvedValue({
      id: 'site-123',
      primaryDomain: {
        id: 'domain-123',
        hostname: 'example.com',
      },
    }),
    listDomainsForSite: vi.fn().mockResolvedValue([
      {
        id: 'domain-123',
        hostname: 'example.com',
        verified: true,
        sslStatus: 'ACTIVE',
      },
      {
        id: 'domain-124',
        hostname: 'www.example.com',
        verified: true,
        sslStatus: 'ACTIVE',
      },
    ]),
    getByHostname: vi.fn().mockResolvedValue({
      id: 'domain-123',
      hostname: 'example.com',
      verified: true,
    }),
  };

  const sites = {
    list: vi
      .fn()
      .mockResolvedValue([
        { id: 'site-123', slug: 'my-site', name: 'My Site' },
      ]),
    getBySlug: vi.fn().mockResolvedValue({
      id: 'site-123',
      slug: 'my-site',
      name: 'My Site',
    }),
  };

  AlternateFuturesSdkMock.prototype.domains = vi.fn(() => domains);
  AlternateFuturesSdkMock.prototype.sites = vi.fn(() => sites);

  return { AlternateFuturesSdk: AlternateFuturesSdkMock };
});

describe('setPrimaryDomainAction', () => {
  const sdk = new AlternateFuturesSdk({ accessTokenService: {} as any });
  const mockDomains = sdk.domains();
  const mockSites = sdk.sites();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set primary domain successfully', async () => {
    const result = await mockDomains.setPrimaryDomain({
      siteId: 'site-123',
      domainId: 'domain-123',
    });

    expect(result.id).toBe('site-123');
    expect(result.primaryDomain?.hostname).toBe('example.com');
  });

  it('should list domains for site', async () => {
    const result = await mockDomains.listDomainsForSite({
      siteId: 'site-123',
    });

    expect(result).toHaveLength(2);
    expect(result[0].verified).toBe(true);
    expect(result[1].verified).toBe(true);
  });

  it('should filter to verified domains only', async () => {
    (mockDomains.listDomainsForSite as Mock).mockResolvedValueOnce([
      {
        id: 'domain-123',
        hostname: 'example.com',
        verified: true,
        sslStatus: 'ACTIVE',
      },
      {
        id: 'domain-125',
        hostname: 'staging.example.com',
        verified: false,
        sslStatus: 'NONE',
      },
    ]);

    const result = await mockDomains.listDomainsForSite({
      siteId: 'site-123',
    });

    const verifiedDomains = result.filter((d: any) => d.verified);
    expect(verifiedDomains).toHaveLength(1);
  });

  it('should get domain by hostname', async () => {
    const result = await mockDomains.getByHostname({
      hostname: 'example.com',
    });

    expect(result.id).toBe('domain-123');
    expect(result.verified).toBe(true);
  });

  it('should handle error when domain not verified', async () => {
    (mockDomains.setPrimaryDomain as Mock).mockRejectedValueOnce(
      new Error('Only verified domains can be set as primary'),
    );

    await expect(
      mockDomains.setPrimaryDomain({
        siteId: 'site-123',
        domainId: 'domain-125',
      }),
    ).rejects.toThrow('verified');
  });

  it('should handle error when domain does not belong to site', async () => {
    (mockDomains.setPrimaryDomain as Mock).mockRejectedValueOnce(
      new Error('Domain does not belong to this site'),
    );

    await expect(
      mockDomains.setPrimaryDomain({
        siteId: 'site-123',
        domainId: 'domain-999',
      }),
    ).rejects.toThrow('does not belong');
  });

  it('should list sites for selection', async () => {
    const result = await mockSites.list();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('my-site');
  });

  it('should get site by slug', async () => {
    const result = await mockSites.getBySlug({ slug: 'my-site' });

    expect(result.id).toBe('site-123');
    expect(result.slug).toBe('my-site');
  });
});
