import * as readline from 'node:readline';
import { output } from '../../cli';
import { config } from '../../config';

type EmailLoginActionHandlerArgs = {
  authApiUrl: string;
};

type EmailRequestResponse = {
  success: boolean;
  expiresIn: number;
  error?: string;
};

type EmailVerifyResponse = {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  error?: string;
};

type PatCreateResponse = {
  token: { token: string };
};

const createPrompt = (): readline.Interface => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const askQuestion = (
  rl: readline.Interface,
  question: string,
): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

export const emailLoginActionHandler = async ({
  authApiUrl,
}: EmailLoginActionHandlerArgs) => {
  const rl = createPrompt();

  try {
    output.log('');
    output.log('🔐 AlternateFutures CLI Login (Email)');
    output.log('─────────────────────────────────────');
    output.log('');
    output.log('Login via email verification - no browser required.');
    output.log('');

    // Step 1: Get email
    const email = await askQuestion(rl, '📧 Enter your email address: ');

    if (!email || !email.includes('@')) {
      output.error('Invalid email address');
      rl.close();
      return;
    }

    output.log('');
    output.spinner('Sending verification code...');

    // Step 2: Request verification code
    const requestResponse = await fetch(`${authApiUrl}/auth/email/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const requestData = (await requestResponse.json()) as EmailRequestResponse;

    if (!requestResponse.ok || !requestData.success) {
      output.error(requestData.error || 'Failed to send verification code');
      rl.close();
      return;
    }

    output.success('Verification code sent to your email');
    output.log('');
    output.log(
      `📬 Check your inbox for a 6-digit code (expires in ${Math.floor((requestData.expiresIn || 300) / 60)} minutes)`,
    );
    output.log('');

    // Step 3: Get verification code
    const code = await askQuestion(
      rl,
      '🔐 Enter the 6-digit verification code: ',
    );

    if (!code || code.length !== 6) {
      output.error('Invalid verification code. Please enter a 6-digit code.');
      rl.close();
      return;
    }

    output.log('');
    output.spinner('Verifying code...');

    // Step 4: Verify code
    const verifyResponse = await fetch(`${authApiUrl}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const verifyData = (await verifyResponse.json()) as EmailVerifyResponse;

    if (!verifyResponse.ok || verifyData.error) {
      output.error(verifyData.error || 'Verification failed');
      rl.close();
      return;
    }

    // Step 5: Create a Personal Access Token using the access token
    const accessToken = verifyData.accessToken;

    output.spinner('Creating CLI access token...');

    const patResponse = await fetch(`${authApiUrl}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: `CLI Token - ${new Date().toISOString().split('T')[0]}`,
      }),
    });

    let personalAccessToken: string;

    if (patResponse.ok) {
      const patData = (await patResponse.json()) as PatCreateResponse;
      personalAccessToken = patData.token.token;
    } else {
      // If PAT creation endpoint doesn't exist, use the access token directly
      // This is a fallback for compatibility
      personalAccessToken = accessToken;
    }

    // Step 6: Save the token
    config.personalAccessToken.set(personalAccessToken);
    config.projectId.clear();

    output.success('Login successful!');
    output.log('');
    output.log(`✅ Logged in as: ${email}`);
    output.log('');
    output.log(
      'You can now use the AlternateFutures CLI to deploy your projects.',
    );
    output.printNewLine();

    rl.close();
  } catch (error) {
    // Provide detailed error information for debugging
    if (error instanceof Error) {
      const fetchError = error as Error & { cause?: Error };

      if (error.message === 'fetch failed') {
        output.error('Network request failed');
        output.log('');
        output.log('Possible causes:');
        output.log(`  - Auth service unreachable at: ${authApiUrl}`);
        output.log('  - SSL/TLS certificate issues');
        output.log('  - DNS resolution failed');
        output.log('  - Network connectivity issues');
        output.log('');

        if (fetchError.cause) {
          output.log(
            `Technical details: ${fetchError.cause.message || fetchError.cause}`,
          );
        }

        output.log('');
        output.log('Troubleshooting:');
        output.log(
          `  1. Verify the auth service is running: curl -k ${authApiUrl}/health`,
        );
        output.log('  2. Check your network connection');
        output.log(
          '  3. Try setting NODE_TLS_REJECT_UNAUTHORIZED=0 if using self-signed certs',
        );
      } else {
        output.error(error.message);
        if (fetchError.cause) {
          output.log(`Cause: ${fetchError.cause.message || fetchError.cause}`);
        }
      }
    } else {
      output.error('An unexpected error occurred during login');
      output.log(`Details: ${String(error)}`);
    }

    rl.close();
  }
};
