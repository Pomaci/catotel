#!/usr/bin/env node
import openapiDiff from 'openapi-diff';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { diffSpecs } = openapiDiff;

const schemaPath = path.join('catotel-api', 'openapi', 'catotel-api.json');
const baseRef =
  process.env.OPENAPI_BASE_REF ||
  process.env.GITHUB_BASE_REF ||
  process.env.GITHUB_REF_NAME ||
  'origin/main';

function readSchemaFromGit(ref) {
  try {
    return execSync(`git show ${ref}:${schemaPath}`, { encoding: 'utf8' });
  } catch (error) {
    console.warn(
      `[openapi-check] Unable to read schema at ${ref}:${schemaPath} (${error.message}).`,
    );
    return null;
  }
}

function parseChangesetFrontmatter(content) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) {
    return {};
  }
  const end = trimmed.indexOf('---', 3);
  if (end === -1) {
    return {};
  }
  const header = trimmed.slice(3, end).trim();
  const result = {};
  for (const line of header.split(/\r?\n/)) {
    const match = line.match(/"([^"]+)":\s*(major|minor|patch)/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

function hasMajorChangesetFor(pkg) {
  if (!fs.existsSync('.changeset')) {
    return false;
  }
  const entries = fs
    .readdirSync('.changeset')
    .filter((entry) => entry.endsWith('.md'));
  for (const entry of entries) {
    const frontmatter = parseChangesetFrontmatter(
      fs.readFileSync(path.join('.changeset', entry), 'utf8'),
    );
    if (frontmatter[pkg] === 'major') {
      return true;
    }
  }
  return false;
}

async function main() {
  if (!fs.existsSync(schemaPath)) {
    console.log(
      `[openapi-check] Current schema ${schemaPath} not found. Skipping.`,
    );
    return;
  }

  const baseContent = readSchemaFromGit(baseRef);
  if (!baseContent) {
    console.log(
      `[openapi-check] No base schema detected at ${baseRef}; skipping diff.`,
    );
    return;
  }

  const currentContent = fs.readFileSync(schemaPath, 'utf8');
  const diffResult = await diffSpecs({
    sourceSpec: {
      content: baseContent,
      location: `${baseRef}:${schemaPath}`,
      format: 'openapi3',
    },
    destinationSpec: {
      content: currentContent,
      location: schemaPath,
      format: 'openapi3',
    },
  });

  if (!diffResult) {
    console.log('[openapi-check] No diff result produced.');
    return;
  }

  const changesDetected =
    (diffResult.breakingDifferences?.length ?? 0) > 0 ||
    (diffResult.nonBreakingDifferences?.length ?? 0) > 0 ||
    (diffResult.unclassifiedDifferences?.length ?? 0) > 0 ||
    diffResult.breakingDifferencesFound;

  if (!changesDetected) {
    console.log('[openapi-check] No OpenAPI changes detected.');
    return;
  }

  if (diffResult.breakingDifferencesFound) {
    console.warn(
      '[openapi-check] Breaking OpenAPI change detected. Verifying semver discipline...',
    );
    const targets = ['@catotel/api-client'];
    const missing = targets.filter((pkg) => !hasMajorChangesetFor(pkg));
    if (missing.length) {
      console.error(
        `[openapi-check] Missing major changeset for: ${missing.join(', ')}.`,
      );
      console.error(
        'Add a changeset (pnpm changeset) with a major bump for the API client to document the breaking change.',
      );
      process.exit(1);
    }
    console.log(
      '[openapi-check] Major changeset found for API client. Continuing.',
    );
  } else {
    console.log(
      '[openapi-check] No breaking OpenAPI changes detected. Additive changes are allowed.',
    );
  }
}

main().catch((error) => {
  console.error('[openapi-check] Failed to diff OpenAPI schemas.');
  console.error(error);
  process.exit(1);
});
