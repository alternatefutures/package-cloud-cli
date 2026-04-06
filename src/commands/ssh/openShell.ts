import WebSocket from 'ws';

import { output } from '../../cli';
import chalk from 'chalk';
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
  const wsUrl = apiUrl.replace(/^http/, 'ws');

  output.log(chalk.dim('Connecting to shell...'));

  await new Promise<void>((resolve) => {
    const params = new URLSearchParams({ serviceId });
    if (opts.service) params.set('service', opts.service);
    if (opts.command) params.set('command', opts.command);
    const ws = new WebSocket(`${wsUrl}/ws/shell?${params.toString()}`);

    const connectTimeout = setTimeout(() => {
      output.error('Connection timed out after 30 seconds');
      ws.close();
      resolve();
    }, 30_000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    });

    let ready = false;

    ws.on('message', (data: WebSocket.Data) => {
      if (!ready) {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ready') {
          ready = true;
          clearTimeout(connectTimeout);
          output.log(
            chalk.green('Connected. Type ') +
              chalk.bold('exit') +
              chalk.green(' or press Ctrl+D to disconnect.'),
          );
          output.log('');

          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
          }
          process.stdin.resume();

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
          output.error(msg.message || 'Shell connection failed');
          resolve();
          process.exit(1);
        }
        return;
      }

      process.stdout.write(data as Buffer);
    });

    ws.on('close', (_code: number, reason: Buffer) => {
      clearTimeout(connectTimeout);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      const reasonStr = reason.toString();
      if (reasonStr && reasonStr !== 'user_disconnect') {
        output.log(chalk.dim(`\nSession closed: ${reasonStr}`));
      } else {
        output.log(chalk.dim('\nSession closed.'));
      }
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
