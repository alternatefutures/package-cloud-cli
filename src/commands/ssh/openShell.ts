import WebSocket from 'ws';

import chalk from 'chalk';
import { output } from '../../cli';
import { config } from '../../config';
import { loginGuard } from '../../guards/loginGuard';

export async function openShell(
  serviceId: string,
  opts: { service?: string; command?: string } = {},
): Promise<void> {
  await loginGuard();

  const token = config.personalAccessToken.get();
  if (!token) {
    output.error('Not authenticated. Run `af login` first.');
    process.exit(1);
  }

  const apiUrl =
    process.env.AF_API_URL ||
    process.env.SDK__GRAPHQL_API_URL ||
    'https://api.alternatefutures.ai';
  const wsUrl = apiUrl
    .replace(/\/graphql\/?$/, '')
    .replace(/\/+$/, '')
    .replace(/^http/, 'ws');

  output.printNewLine();
  output.spinner('Connecting to shell...');

  await new Promise<void>((resolve) => {
    const params = new URLSearchParams({ serviceId });
    if (opts.service) params.set('service', opts.service);
    if (opts.command) params.set('command', opts.command);
    // perMessageDeflate batches single-keystroke frames waiting for compression
    // payoff that never comes for terminal traffic. Explicitly off — same on
    // the server side in service-cloud-api/src/services/shell/shellEndpoint.ts.
    const ws = new WebSocket(`${wsUrl}/ws/shell?${params.toString()}`, {
      perMessageDeflate: false,
    });

    const connectTimeout = setTimeout(() => {
      output.error('Connection timed out after 30 seconds.');
      ws.close();
      resolve();
    }, 30_000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    });

    let ready = false;

    ws.on('message', (data: WebSocket.Data) => {
      if (!ready) {
        let msg: { type?: unknown; message?: unknown };
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }

        if (
          typeof msg?.type !== 'string' ||
          !['ready', 'error'].includes(msg.type)
        ) {
          return;
        }

        if (msg.type === 'ready') {
          ready = true;
          clearTimeout(connectTimeout);

          // Clear spinner and show clean connected banner
          output.stopSpinner();
          process.stdout.write('\x1b[2J\x1b[H');
          process.stdout.write(
            chalk.green.bold(' ● Connected') +
              chalk.dim(` — ${serviceId}\n`) +
              chalk.dim('   Type exit or press Ctrl+D to disconnect.\n\n'),
          );

          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
          }
          process.stdin.resume();

          // Raw stdin → WebSocket. No local echo, no prediction — the remote
          // PTY owns echoing (and turns it off when the foreground program
          // wants raw mode, e.g. vim, htop, passwd). Anything we render
          // locally would either double-print or, worse, mismatch and
          // produce the "delay then random characters" jank we used to ship.
          process.stdin.on('data', (chunk: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(chunk);
            }
          });

          if (process.stdout.columns && process.stdout.rows) {
            ws.send(
              JSON.stringify({
                type: 'resize',
                cols: process.stdout.columns,
                rows: process.stdout.rows,
              }),
            );
          }

          process.stdout.on('resize', () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'resize',
                  cols: process.stdout.columns,
                  rows: process.stdout.rows,
                }),
              );
            }
          });

          return;
        }

        if (msg.type === 'error') {
          clearTimeout(connectTimeout);
          const errMessage =
            typeof msg.message === 'string'
              ? msg.message
              : 'Shell connection failed';
          output.error(errMessage);
          resolve();
          process.exit(1);
        }
        return;
      }

      process.stdout.write(data as Buffer);
    });

    ws.on('close', () => {
      clearTimeout(connectTimeout);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      process.stdout.write('\n');
      output.printNewLine();
      output.log(chalk.dim('Session closed.'));
      output.printNewLine();
      resolve();
    });

    ws.on('error', (err: Error) => {
      clearTimeout(connectTimeout);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      output.error(`Connection error: ${err.message}`);
      resolve();
      process.exit(1);
    });
  });
}
