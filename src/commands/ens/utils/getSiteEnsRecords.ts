import type {
  EnsRecord,
  AlternateFuturesSdk,
  Site,
} from '@alternatefutures/sdk/node';

type GetSiteEnsRecordsArgs = {
  sdk: AlternateFuturesSdk;
  site: Pick<Site, 'id'>;
};

export const getSiteEnsRecords = async ({
  sdk,
  ...args
}: GetSiteEnsRecordsArgs): Promise<EnsRecord[]> => {
  const site = await sdk.sites().get({ id: args.site.id });

  const ensRecordsGroupedByIpns = await Promise.all(
    site.ipnsRecords.map((ipnsRecord) =>
      sdk.ens().listByIpnsRecordId({ ipnsRecordId: ipnsRecord.id }),
    ),
  );

  return ensRecordsGroupedByIpns.flat();
};
