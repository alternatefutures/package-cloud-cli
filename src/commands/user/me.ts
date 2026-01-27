import { MissingExpectedDataError } from '@alternatefutures/errors';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { config } from '../../config';
import { getDefined } from '../../defined';
import { output } from '../../cli';
import { t } from '../../utils/translation';

type MeActionArgs = {
  json?: boolean;
};

type MeResponse = {
  data?: {
    me?: {
      id: string;
      email?: string | null;
      username?: string | null;
      walletAddress?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const meAction: SdkGuardedFunction<MeActionArgs> = async ({ args }) => {
  const graphqlUrl = getDefined('SDK__GRAPHQL_API_URL');
  if (!graphqlUrl) {
    throw new MissingExpectedDataError();
  }

  const token = config.personalAccessToken.get();
  if (!token) {
    output.error(t('missingPersonalAccessToken'));
    return;
  }

  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: token,
    },
    body: JSON.stringify({
      query: `query Me {
        me { id email username walletAddress createdAt updatedAt }
      }`,
    }),
  });

  const body = (await res.json()) as MeResponse;

  if (!res.ok || body.errors?.length) {
    const msg =
      body.errors?.[0]?.message || `Request failed with ${res.status}`;
    output.error(msg);
    return;
  }

  const me = body.data?.me;
  if (!me) {
    output.error(t('recordsNotFoundUnexpectedly'));
    return;
  }

  if (args.json) {
    output.raw(JSON.stringify(me, null, 2));
    output.printNewLine();
    return;
  }

  output.table([
    {
      ID: me.id,
      Email: me.email ?? '',
      Username: me.username ?? '',
      Wallet: me.walletAddress ?? '',
      'Created At': me.createdAt ?? '',
      'Updated At': me.updatedAt ?? '',
    },
  ]);
};

export const meActionHandler = withGuards(meAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});

