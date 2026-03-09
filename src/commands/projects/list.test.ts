import {
  AlternateFuturesSdk,
  PersonalAccessTokenService,
} from '@alternatefutures/sdk/node';
import chalk from 'chalk';
import { type Mock, beforeAll, describe, expect, it, vi } from 'vitest';

import { output } from '../../cli';
import { listProjectsAction } from './list';

beforeAll(() => {
  chalk.level = 0;
});

vi.mock('../../cli', () => {
  const output = {
    log: vi.fn(),
    styledTable: vi.fn(),
    hint: vi.fn(),
    printNewLine: vi.fn(),
  };

  return { output };
});

vi.mock('../../config', () => {
  const config = {
    projectId: { get: vi.fn().mockReturnValue('firstProjectId') },
  };

  return { config };
});

vi.mock('../../graphql/client', () => ({
  graphqlFetch: vi.fn().mockResolvedValue({
    data: {
      serviceRegistry: [
        { id: 's1', activeAkashDeployment: { id: 'd1' }, activePhalaDeployment: null },
        { id: 's2', activeAkashDeployment: null, activePhalaDeployment: null },
      ],
    },
  }),
}));

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const projects = {
    list: vi.fn().mockResolvedValue([
      {
        id: 'firstProjectId',
        name: 'first project',
        createdAt: '2023-02-01T00:00:00.000Z',
      },
      {
        id: 'secondProjectId',
        name: 'second project',
        createdAt: '2023-02-02T00:00:00.000Z',
      },
    ]),
  };

  AlternateFuturesSdkMock.prototype.projects = () => projects;

  return {
    AlternateFuturesSdk: AlternateFuturesSdkMock,
    PersonalAccessTokenService: vi.fn(),
  };
});

describe('List projects in which the user has membership', () => {
  it('should show styled project table with services and selection', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      listProjectsAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.projects().list).toHaveBeenCalledWith();
    expect(output.log).not.toHaveBeenCalled();

    expect(output.styledTable).toHaveBeenCalledTimes(1);

    const [head, rows] = (output.styledTable as Mock).mock.calls[0];
    expect(head).toEqual(['Project Name', 'ID', 'Services', 'Created', 'Selected']);
    expect(rows).toHaveLength(2);

    // Active project row
    expect(rows[0][0]).toContain('first project');
    expect(rows[0][2]).toContain('2 total');
    expect(rows[0][2]).toContain('1 active');
    expect(rows[0][4]).toBe('✅');

    // Inactive project row
    expect(rows[1][0]).toContain('second project');
    expect(rows[1][4]).toBe('');

    // Hint shown after table
    expect(output.hint).toHaveBeenCalledTimes(1);
    expect((output.hint as Mock).mock.calls[0][0]).toContain(
      'af projects switch',
    );
  });

  it('should show message that no projects exist', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.projects().list as Mock).mockResolvedValueOnce([]);

    await expect(
      listProjectsAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.projects().list).toHaveBeenCalled();
    expect(output.log).toHaveBeenCalledWith(
      'You do not have any projects yet.',
    );
    expect(output.styledTable).not.toHaveBeenCalled();
  });
});
