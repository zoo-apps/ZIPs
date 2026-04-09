#!/usr/bin/env node

/**
 * Generate a static search index JSON from ZIP markdown files.
 * This runs during prebuild so the search dialog can use client-side search
 * (required for Next.js static export / GitHub Pages deployment).
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ZIPS_DIR = path.join(process.cwd(), '../ZIPs');
const OUTPUT = path.join(process.cwd(), 'public', 'search-index.json');

function main() {
  // Ensure public dir exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const files = fs.readdirSync(ZIPS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .filter(f => f.startsWith('zip-'));

  const index = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(ZIPS_DIR, file), 'utf8');
      const { data, content: body } = matter(content);

      const zipMatch = file.match(/zip-(\d+)/);
      const zipNumber = data.zip || (zipMatch ? parseInt(zipMatch[1], 10) : null);
      const slug = file.replace(/\.mdx?$/, '');

      // Convert Date objects
      const created = data.created instanceof Date ? data.created.toISOString().split('T')[0] : data.created;

      index.push({
        id: slug,
        url: `/docs/${slug}`,
        title: data.title || slug,
        description: data.description || '',
        content: body.substring(0, 500),
        structuredData: {
          zip: zipNumber,
          status: data.status || '',
          type: data.type || '',
          category: data.category || '',
          tags: data.tags || [],
        },
      });
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  // Sort by ZIP number
  index.sort((a, b) => (a.structuredData.zip || 9999) - (b.structuredData.zip || 9999));

  fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2));
  console.log(`[search-index] Generated ${index.length} entries → public/search-index.json`);
}

main();
