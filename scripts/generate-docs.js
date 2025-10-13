#!/usr/bin/env node

/**
 * Generate CLI documentation for the docs repository
 *
 * This script:
 * 1. Introspects all CLI commands using Commander
 * 2. Extracts command names, descriptions, options, and examples
 * 3. Generates markdown documentation
 * 4. Outputs to the docs repository
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMANDS_DIR = join(__dirname, '../src/commands');
const DOCS_REPO = join(__dirname, '../../altfutures-docs/docs/cli');

console.log('🔧 Generating CLI documentation...\n');

// Check if docs repo exists
if (!existsSync(DOCS_REPO)) {
  console.error(`❌ Docs repository not found at: ${DOCS_REPO}`);
  console.error('Please ensure altfutures-docs repo is cloned as a sibling directory');
  process.exit(1);
}

/**
 * Parse a command file to extract documentation
 */
function parseCommandFile(filePath) {
  const content = readFileSync(filePath, 'utf8');

  // Extract command name from file content or filename
  const commandMatch = content.match(/\.command\(['"`]([^'"`]+)['"`]\)/);
  const descriptionMatch = content.match(/\.description\(['"`]([^'"`]+)['"`]\)/);

  // Extract options
  const optionMatches = [...content.matchAll(/\.option\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`]/g)];

  return {
    command: commandMatch ? commandMatch[1] : null,
    description: descriptionMatch ? descriptionMatch[1] : '',
    options: optionMatches.map(match => ({
      flag: match[1],
      description: match[2]
    }))
  };
}

/**
 * Recursively find all command files
 */
function findCommandFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && entry !== 'prompts' && entry !== 'utils') {
      findCommandFiles(fullPath, files);
    } else if (entry.endsWith('.ts') && entry !== 'index.ts' && !entry.includes('.test.')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(commands) {
  let markdown = '# CLI Commands Reference\n\n';
  markdown += '> This documentation is auto-generated from the `cloud-cli` repository.\n\n';
  markdown += ':::tip\n';
  markdown += 'Use `af <command> --help` to see detailed help for any command.\n';
  markdown += ':::\n\n';

  // Group commands by category
  const categories = {};

  commands.forEach(cmd => {
    if (!cmd.command) return;

    const category = cmd.category || 'General';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(cmd);
  });

  // Sort categories
  const sortedCategories = Object.keys(categories).sort();

  sortedCategories.forEach(category => {
    markdown += `## ${category}\n\n`;

    categories[category].forEach(cmd => {
      markdown += `### \`af ${cmd.command}\`\n\n`;

      if (cmd.description) {
        markdown += `${cmd.description}\n\n`;
      }

      if (cmd.options && cmd.options.length > 0) {
        markdown += '**Options:**\n\n';
        markdown += '| Option | Description |\n';
        markdown += '|--------|-------------|\n';
        cmd.options.forEach(opt => {
          markdown += `| \`${opt.flag}\` | ${opt.description} |\n`;
        });
        markdown += '\n';
      }

      if (cmd.example) {
        markdown += '**Example:**\n\n';
        markdown += '```bash\n';
        markdown += `${cmd.example}\n`;
        markdown += '```\n\n';
      }

      markdown += '---\n\n';
    });
  });

  markdown += '## Global Options\n\n';
  markdown += 'These options work with all commands:\n\n';
  markdown += '- `--help, -h` - Display help for command\n';
  markdown += '- `--version, -v` - Display CLI version\n';
  markdown += '- `--json` - Output as JSON (where applicable)\n';
  markdown += '- `--no-color` - Disable colored output\n\n';

  return markdown;
}

/**
 * Get category from file path
 */
function getCategoryFromPath(filePath) {
  const parts = filePath.split('/');
  const commandsIndex = parts.indexOf('commands');

  if (commandsIndex >= 0 && parts[commandsIndex + 1]) {
    const category = parts[commandsIndex + 1];
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  return 'General';
}

/**
 * Main execution
 */
function main() {
  console.log('📖 Finding command files...');
  const commandFiles = findCommandFiles(COMMANDS_DIR);
  console.log(`✅ Found ${commandFiles.length} command files`);

  console.log('🔍 Parsing commands...');
  const commands = commandFiles.map(file => {
    const cmd = parseCommandFile(file);
    cmd.category = getCategoryFromPath(file);
    return cmd;
  }).filter(cmd => cmd.command);

  console.log(`✅ Parsed ${commands.length} commands`);

  console.log('📝 Generating markdown...');
  const markdown = generateMarkdown(commands);

  const outputFile = join(DOCS_REPO, 'commands.md');
  writeFileSync(outputFile, markdown, 'utf8');

  console.log(`✨ CLI documentation generated at: ${outputFile}`);
  console.log('\n✅ Done!\n');
}

main();
