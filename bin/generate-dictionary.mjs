/**
 * Downloads the Bulgarian dictionary CSV from HuggingFace, filters to valid Cyrillic
 * words of the configured lengths with the allowed POS tags, and writes one JSON file
 * per word length into the public output folder. Files are written only after a
 * successful parse so existing files are never corrupted by a failed run.
 *
 * Data source: https://huggingface.co/datasets/thebogko/bulgarian-dictionary-2024
 */

import { writeFileSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import { join } from 'path';
import Config from '../src/config.js';

const { wordLengthOptions, dictionaryPath } = Config;

/**
 * Output directory derived from `Config.dictionaryPath`
 * so it always matches the URL the app fetches from
 */
const OUT_DIR = join(process.cwd(), 'public', dictionaryPath.replace(/^\/+/, ''));

/** Direct URL to the raw CSV file in the HuggingFace dataset repository. */
const CSV_URL = 'https://huggingface.co/datasets/thebogko/bulgarian-dictionary-2024/resolve/main/single_words_bg.csv';

/**
 * Allowed part-of-speech tags from the dataset schema.
 *
 * The `tag` column is a capitalised character representing the POS tag.
 * All 11 possible values:
 *   N  - noun          ('съществително име')
 *   A  - adjective     ('прилагателно име')
 *   V  - verb          ('глагол')
 *   D  - adverb        ('наречие')
 *   P  - pronoun       ('местоимение')
 *   T  - particle      ('частица')
 *   M  - numeral       ('числително име')
 *   C  - conjunction   ('съюз')
 *   I  - interjection  ('междуметие')
 *   R  - preposition   ('предлог')
 *   H  - hybrid / named entity ('лични имена, имена на държави, институции, и други имена')
 *
 * @type {Array<string>}
 */
const ALLOWED_TAGS = ['N', 'A', 'V', 'D', 'P'];

/**
 * The set of Cyrillic characters that appear on the game keyboard.
 * Any word containing a character outside this set is discarded (e.g. words
 * with hyphens, Latin letters, or digits).
 * @type {Array<string>}
 */
const VALID_CHARS = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ'];

/**
 * Returns true when every character in `word` belongs to the game keyboard.
 * @param {string} word - Uppercased candidate word.
 * @returns {boolean}
 */
function isValidWord(word) {
  return word.length > 0 && [...word].every(c => VALID_CHARS.includes(c));
}

async function main() {
  console.log(`Target word lengths : ${wordLengthOptions.join(', ')}`);
  console.log(`Downloading CSV     : ${CSV_URL}`);

  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const totalBytes = Number(res.headers.get('content-length') ?? 0);
  console.log(`File size           : ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log('Parsing...');

  /** @type {Record<number, Set<string>>} */
  const byLength = {};
  let lineCount = 0;
  let headerSkipped = false;

  const rl = createInterface({
    input: Readable.fromWeb(res.body),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true;
      continue; // skip CSV header row
    }

    lineCount++;

    const comma = line.indexOf(',');
    if (comma === -1) continue;

    const tag = line.slice(comma + 1).trim();
    if (!ALLOWED_TAGS.includes(tag)) continue;

    const upper = line.slice(0, comma).toUpperCase();
    const len = upper.length;

    if (!wordLengthOptions.includes(len)) continue;
    if (!isValidWord(upper)) continue;

    (byLength[len] ??= new Set()).add(upper);
  }

  console.log(`Processed ${lineCount.toLocaleString()} rows.\n`);
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Creating dictionary files:');
  for (const len of wordLengthOptions) {
    const wordSet = byLength[len];
    if (!wordSet?.size) {
      console.log(`  ${len}-letter words: 0 found - skipping`);
      continue;
    }

    const sorted = [...wordSet].sort();
    const outPath = join(OUT_DIR, `${len}.json`);

    writeFileSync(outPath, JSON.stringify(sorted));
    console.log(`  ${len}-letter words: ${sorted.length.toLocaleString()} found  ->  public${dictionaryPath}/${len}.json`);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
