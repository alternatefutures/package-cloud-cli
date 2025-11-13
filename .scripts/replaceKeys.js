#!/usr/bin/env node

const { fileURLToPath } = require('url');
const fs = require('fs');
const { resolve } = require('path');
const { defined } = require('../dist/defined');

function replaceKeys({ filePath, envVars }) {
  let content = fs.readFileSync(filePath, 'utf-8');

  for (const key of Object.keys(envVars)) {
    if (!process.env[key]) {
      console.log(`👹 Oops! Missing environment variable ${key}`);
      return;
    }

    content = content.replace(`process.env.${key}`, `"${process.env[key]}"`);
  }

  fs.writeFileSync(filePath, content);
}

// Declare all the files which environment variables
// should be replaced to static values during build time.
// For each file, specify the file pathname
// and the key value pair which should be exported
const main = () => {
  const fileReplacement = [
    {
      filePath: resolve(__dirname, '../dist/defined.js'),
      envVars: defined,
    },
  ];

  fileReplacement.forEach(({ filePath, envVars }) => {
    replaceKeys({
      filePath,
      envVars,
    });
  });
};

main();
