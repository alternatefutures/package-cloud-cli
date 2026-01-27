import { MissingExpectedDataError } from '@alternatefutures/errors';
import type { Command } from 'commander';

import { getDefined } from '../../defined';
import { t } from '../../utils/translation';
import { loginActionHandler } from './login';
import { emailLoginActionHandler } from './loginEmail';
import { logoutActionHandler } from './logout';
import { signupActionHandler } from './signup';

export default (cmd: Command): Command => {
  cmd
    .command('login')
    .description(t('cmdAuthLoginDescription'))
    .option('-e, --email', 'Login via email verification (no browser required)')
    .option(
      '--auth-url <url>',
      'Override auth service URL (e.g., http://localhost:3001)',
    )
    .action((options) => {
      // If --email flag is provided, use email-based login (no browser needed)
      if (options.email) {
        // Use europlots ingress URL which has valid SSL (*.europlots.com wildcard cert)
        // Custom domain auth.alternatefutures.ai has cert mismatch with Akash provider
        const authApiUrl =
          options.authUrl ||
          getDefined('AUTH__API_URL') ||
          'https://ubsm31q4ol97b1pi5l06iognug.ingress.europlots.com';
        return emailLoginActionHandler({ authApiUrl });
      }

      // Default: browser-based login
      const authServiceUrl =
        options.authUrl ||
        getDefined('SDK__AUTH_SERVICE_URL') ||
        getDefined('AUTH__API_URL');

      if (!authServiceUrl) {
        throw new MissingExpectedDataError();
      }

      return loginActionHandler({
        authServiceUrl,
      });
    });

  cmd
    .command('signup')
    .description('Create a new account using email verification')
    .action(() => {
      const authApiUrl =
        getDefined('AUTH__API_URL') || 'https://auth.alternatefutures.ai';

      return signupActionHandler({
        authApiUrl,
      });
    });

  cmd
    .command('logout')
    .description(t('cmdAuthLogoutDescription'))
    .action(logoutActionHandler);

  return cmd;
};
