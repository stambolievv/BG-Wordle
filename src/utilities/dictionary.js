import Config from '../config';
import { Storage } from './storage';

/**
 * @description Loads the word list for `wordLength`, using the cache when available.
 * Cached entries have no expiry because dictionary content only changes with a new deployment.
 * @param {number} wordLength - Number of letters each word must have.
 * @returns {Promise<Array<string>>} Sorted, uppercase word list.
 */
export async function loadDictionary(wordLength) {
  const cached = Storage.getDictionaryCache(wordLength);
  if (cached) return cached.dictionary;

  const res = await fetch(`${Config.dictionaryPath}/${wordLength}.json`);
  if (!res.ok) throw new Error(`Failed to load dictionary for length ${wordLength}: ${res.status}`);

  const dictionary = /** @type {string[]} */ (await res.json());
  Storage.setDictionaryCache(dictionary, wordLength);

  return dictionary;
}
