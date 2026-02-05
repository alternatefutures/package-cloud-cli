import { promises as fs } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import { basename } from 'node:path';
import type { AlternateFuturesSdk } from '@alternatefutures/sdk/node';

type UploadPathOnIpfsArgs = {
  sdk: AlternateFuturesSdk;
  path: string;
};

export const uploadPathOnIpfs = async ({ sdk, path }: UploadPathOnIpfsArgs) => {
  // Open file/directory first to avoid race condition
  let fileHandle: FileHandle | undefined;
  try {
    fileHandle = await fs.open(path, 'r');
    const stat = await fileHandle.stat();

    if (stat.isDirectory()) {
      await fileHandle.close();
      const uploadResults = await sdk.ipfs().addFromPath(path, {
        wrapWithDirectory: true,
        // We must pass plain object instead of URLSearchParams because of ipfs-http-client bug
        searchParams: { alias: basename(path) } as unknown as URLSearchParams,
      });

      return uploadResults.pop();
    }

    // Read from file descriptor instead of path
    const content = await fileHandle.readFile();
    await fileHandle.close();

    return sdk.ipfs().add({ path, content: content.buffer as ArrayBuffer });
  } catch (error) {
    if (fileHandle) {
      await fileHandle.close();
    }
    throw error;
  }
};
