import { AlternateFuturesSdk } from '@alternatefutures/sdk/node';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { output as fakeOutput } from '../../cli';
import { createCustomDomainAction } from './create-custom';
import { getHostnameOrPrompt as fakeGetHostnameOrPrompt } from './prompts/getHostnameOrPrompt';
import { promptForSiteSelection as fakePromptForSiteSelection } from '../sites/prompts';

vi.mock('../sites/prompts', () => ({
  promptForSiteSelection: vi.fn().mockResolvedValue({
    id: 'site-123',
    slug: 'my-site',
  }),
}));

vi.mock('./prompts/getHostnameOrPrompt', () => ({
  getHostnameOrPrompt: vi.fn().mockResolvedValue('example.com'),
}));

vi.mock('prompts', () => ({
  default: vi.fn().mockResolvedValue({ verificationMethod: 'TXT' }),
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
    createCustomDomain: vi.fn().mockResolvedValue({
      id: 'domain-123',
      hostname: 'example.com',
      verified: false,
      txtVerificationToken: 'af-site-verification=abc123',
      txtVerificationStatus: 'PENDING',
      sslStatus: 'NONE',
    }),
    list: vi.fn().mockResolvedValue([]),
  };

  const sites = {
    list: vi.fn().mockResolvedValue([
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

describe('createCustomDomainAction', () => {
  const sdk = new AlternateFuturesSdk({ accessTokenService: {} as any });
  const mockDomains = sdk.domains();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create custom domain with TXT verification', async () => {
    const args = {
      siteId: 'site-123',
      hostname: 'example.com',
      verificationMethod: 'TXT' as const,
      domainType: 'WEB2' as const,
    };

    await createCustomDomainAction({ sdk, args });

    expect(mockDomains.createCustomDomain).toHaveBeenCalledWith({
      siteId: 'site-123',
      hostname: 'example.com',
      verificationMethod: 'TXT',
      domainType: 'WEB2',
    });

    expect(fakeOutput.success).toHaveBeenCalled();
  });

  it('should create custom domain with CNAME verification', async () => {
    const args = {
      siteId: 'site-123',
      hostname: 'www.example.com',
      verificationMethod: 'CNAME' as const,
    };

    (mockDomains.createCustomDomain as Mock).mockResolvedValueOnce({
      id: 'domain-124',
      hostname: 'www.example.com',
      verified: false,
      expectedCname: 'cname.alternatefutures.ai',
      sslStatus: 'NONE',
    });

    await createCustomDomainAction({ sdk, args });

    expect(mockDomains.createCustomDomain).toHaveBeenCalledWith({
      siteId: 'site-123',
      hostname: 'www.example.com',
      verificationMethod: 'CNAME',
      domainType: 'WEB2',
    });
  });

  it('should create custom domain with A record verification', async () => {
    const args = {
      siteId: 'site-123',
      hostname: 'example.com',
      verificationMethod: 'A' as const,
    };

    (mockDomains.createCustomDomain as Mock).mockResolvedValueOnce({
      id: 'domain-125',
      hostname: 'example.com',
      verified: false,
      expectedARecord: '192.0.2.1',
      sslStatus: 'NONE',
    });

    await createCustomDomainAction({ sdk, args });

    expect(mockDomains.createCustomDomain).toHaveBeenCalledWith({
      siteId: 'site-123',
      hostname: 'example.com',
      verificationMethod: 'A',
      domainType: 'WEB2',
    });
  });

  it('should prompt for site if not provided', async () => {
    const args = {
      hostname: 'example.com',
      verificationMethod: 'TXT' as const,
    };

    await createCustomDomainAction({ sdk, args });

    expect(fakePromptForSiteSelection).toHaveBeenCalled();
  });

  it('should prompt for hostname if not provided', async () => {
    const args = {
      siteId: 'site-123',
      verificationMethod: 'TXT' as const,
    };

    await createCustomDomainAction({ sdk, args });

    expect(fakeGetHostnameOrPrompt).toHaveBeenCalled();
  });

  it('should display TXT record instructions after creation', async () => {
    const args = {
      siteId: 'site-123',
      hostname: 'example.com',
      verificationMethod: 'TXT' as const,
    };

    await createCustomDomainAction({ sdk, args });

    expect(fakeOutput.log).toHaveBeenCalledWith(
      expect.stringContaining('Type: TXT'),
    );
  });

  it('should create Web3 domain (ArNS)', async () => {
    const args = {
      siteId: 'site-123',
      hostname: 'my-site.arweave.net',
      verificationMethod: 'TXT' as const,
      domainType: 'ARNS' as const,
    };

    (mockDomains.createCustomDomain as Mock).mockResolvedValueOnce({
      id: 'domain-126',
      hostname: 'my-site.arweave.net',
      domainType: 'ARNS',
      verified: false,
      sslStatus: 'NONE',
    });

    await createCustomDomainAction({ sdk, args });

    expect(mockDomains.createCustomDomain).toHaveBeenCalledWith({
      siteId: 'site-123',
      hostname: 'my-site.arweave.net',
      verificationMethod: 'TXT',
      domainType: 'ARNS',
    });
  });
});
