#!/usr/bin/env node
/**
 * scripts/new-project.mjs
 * Scaffolds a new project folder + data file template.
 *
 * Usage:
 *   npm run new-project -- my-project
 *   npm run new-project -- my-project "My Project Title" UX/UI
 *
 * If title/category are omitted, defaults are used.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const projectId = process.argv[2];
const projectTitle = process.argv[3] || 'Untitled Project';
const projectCategory = process.argv[4] || 'UX/UI';

if (!projectId) {
    console.error('Usage: npm run new-project -- <project-id> [title] [category]');
    console.error('Example: npm run new-project -- my-brand "Brand Identity" UX/UI');
    process.exit(1);
}

// Validate project ID format (lowercase, hyphens, alphanumeric)
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(projectId)) {
    console.error(`Error: project ID "${projectId}" must be lowercase, hyphenated, alphanumeric (e.g. "my-brand")`);
    process.exit(1);
}

const dataFile = resolve(root, 'src/data/projects', `${projectId}.js`);
const assetDir = resolve(root, 'src/assets/projects', projectId);
const galleryDir = resolve(assetDir, 'gallery');

// Check for existing project
if (existsSync(dataFile)) {
    console.error(`Error: project "${projectId}" already exists at ${dataFile}`);
    process.exit(1);
}

// Create asset folders
await mkdir(galleryDir, { recursive: true });
console.log(`Created asset folder: src/assets/projects/${projectId}/gallery/`);

// Create data file from template
const template = `/**
 * src/data/projects/${projectId}.js
 * Project: ${projectTitle}
 * Category: ${projectCategory}
 */
export default {
    id: "${projectId}",
    title: "${projectTitle}",
    category: "${projectCategory}",
    featured: false,
    thumbnail: "/src/assets/projects/${projectId}/thumb.png",
    hero: "/src/assets/projects/${projectId}/hero.png",
    description: "One-sentence overview shown on the 3D card.",
    role: ["Role 1", "Role 2"],
    tools: ["Tool 1", "Tool 2"],
    challenge: "The problem you solved.",
    solution: "How you approached it.",
    results: "Measurable outcomes.",
    gallery: [
        "/src/assets/projects/${projectId}/gallery/01-overview.jpg"
    ],
    position: { x: 0, y: 0, z: 0 }
};
`;

await writeFile(dataFile, template, 'utf-8');
console.log(`Created data file: src/data/projects/${projectId}.js`);

// Create placeholder .gitkeep in gallery so the folder is tracked
await writeFile(resolve(galleryDir, '.gitkeep'), '', 'utf-8');

console.log('');
console.log('Next steps:');
console.log(`  1. Add images to src/assets/projects/${projectId}/ (thumb.png, hero.png, gallery/)`);
console.log(`  2. Edit the data file: src/data/projects/${projectId}.js`);
console.log(`  3. Register it in src/data/projects/index.js:`);
console.log(`     import ${projectId.replace(/-([a-z])/g, (_, c) => c.toUpperCase())} from './${projectId}.js';`);
console.log(`     ...and add it to the PROJECTS array`);
console.log(`  4. Add "${projectId}" to the matching category's projects array in src/data/projectData.js`);
console.log('');
console.log('Done!');