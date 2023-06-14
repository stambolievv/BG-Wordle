const cache = new Map();

/**
 * @description Generates pseudorandom numbers that range between 0 and 1. By providing a seed value, you can reproduce the same sequence of random numbers each time the function is called with that seed value. If no seed value is provided or is not a finite number, the function will attempt to generate a random seed using the browser's crypto API (if supported) or using a linear congruential generator (LCG) algorithm with Math.random().
 * @param {number} [seed] - The initial seed value to use for generating random numbers. If no seed is provided or is not a finite number, a random seed value will be generated.
 * @returns {number} The generated random number between 0 and 1.
 * @see {@link https://en.wikipedia.org/wiki/Linear_congruential_generator LCG algorithm} or {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API Crypto API} for further information.
 */
export function seedRandom(seed) {
  if (cache.has(seed)) return cache.get(seed);

  const m = 2 ** 32;    // modulus
  const a = 1664525;    // multiplier
  const c = 1013904223; // increment

  const randomSeed = isNumber(seed) ? seed : (
    typeof window !== 'undefined' && isFunction(window.crypto?.getRandomValues) && isFunction(window.Uint32Array)
      ? crypto.getRandomValues(new Uint32Array(1))[0]
      : Math.floor(Math.random() * m)
  );

  const result = ((a * randomSeed + c) % m) / m;
  !isNil(seed) && cache.set(seed, result);

  return result;
}

/**
 * @description Creates an array of a given size and fills it with the given element or with indexes [0...size) if the element is not provided.
 * @param {number} size - The number of elements in the array.
 * @param {T | ((index: number) => T)} [element] - The element to fill the array with. If this is a function, it will be called with the index of the current element.
 * @returns {Array<T>} An array of length `size` with each element being the result of the `element` function or the value of `element` if it is not a function. If no `element` is provided, the array will be filled with index values [0...size-1].
 * @template [T=number] - The type of the elements in the array.
 * @example
 * createArray(3, "Hello"); // Output: ["Hello", "Hello", "Hello"]
 * createArray(5); // Output: [0, 1, 2, 3, 4]
 * createArray(4, (index) => index * 2); // Output: [0, 2, 4, 6]
 */
export function createArray(size, element) {
  const array = new Array(size);

  for (let index = 0; index < array.length; index++) {
    array[index] = isNil(element) ? index : (isFunction(element) ? element(index) : element);
  }

  return array;
}

/**
 * @description Randomly sample elements from an array.
 * @param {Array<T>} array - The array to sample from.
 * @param {Size} [size] - The number of elements to sample.
 * @returns {SampledElements<T, Size>} The sampled elements as an array, or a single element if `size` is not provided.
 * @template T - The type of the elements in the array.
 * @template {number} [Size=never] - The number of elements to sample (optional).
 */
export function sampleFromArray(array, size) {
  const getRandomIndex = () => Math.floor(Math.random() * array.length);

  if (!size) return /**@type {SampledElements<T, Size>}*/ (array[getRandomIndex()]);

  const sampledIndexes = new Set();
  const maxSize = Math.min(size, array.length);

  while (sampledIndexes.size < maxSize) {
    sampledIndexes.add(getRandomIndex());
  }

  return /**@type {SampledElements<T, Size>}*/ ([...sampledIndexes].map(index => array[index]));
}

/**
 * @description Shuffles the elements of an array randomly. The function uses the {@link https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle Fisher-Yates} shuffle algorithm.
 * @param {Array<T>} array - The array to shuffle.
 * @param {boolean} [inPlace] - Specifies whether to shuffle the array in place or create a new shuffled array.
 * @returns {Array<T>} The shuffled array. If `inPlace` is `true`, the original array is modified and returned, otherwise, a new shuffled array is returned.
 * @template T - The type of the elements in the array.
 */
export function shuffle(array, inPlace = false) {
  if (!inPlace) array = array.slice(0);

  for (let i = array.length - 1; i > 0; i--) {
    const j = ~~(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * @description Generates a random boolean value based on a given chance.
 * @param {number} [chance] - The chance of getting a `true` value. Should be a number between 0 and 1. By default, the chance is 50%.
 * @returns {boolean} A random boolean value based on the chance.
 */
export function getChance(chance = 0.5) {
  return seedRandom() < chance ? true : false;
}

/**
 * @description Generates a random floating-point number between the specified minimum and maximum values.
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (exclusive).
 * @returns {number} A random floating-point number between the minimum and maximum values.
 */
export function getRandomFloat(min, max) {
  return seedRandom() * (max - min) + min;
}

/**
 * @description Generates a random integer between the specified minimum and maximum values.
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (inclusive).
 * @returns {number} A random integer between the minimum and maximum values.
 */
export function getRandomInt(min, max) {
  return Math.floor(getRandomFloat(min, max + 1));
}

/**
 * @description Returns a random value between the two provided values based on the given chance.
 * @param {T1} value1 - The first value to choose from.
 * @param {T2} value2 - The second value to choose from.
 * @param {number} [chanceForValue1] - The chance for the first value to be returned, ranging from 0 to 1.
 * @returns {T1 | T2} The randomly selected value.
 * @template T1 - The type of the first value.
 * @template T2 - The type of the second value.
 */
export function getRandomValue(value1, value2, chanceForValue1 = 0.5) {
  return seedRandom() < chanceForValue1 ? value1 : value2;
}

/**
 * @description Clamps a `value` within an original range and maps it to a new range.
 * @param {number} value - The value to be clamped.
 * @param {Array<number>} valueRange - The original range of values that the value is within.
 * @param {Array<number>} newRange - The new range of values to clamp and map the value to.
 * @returns {number} The clamped and mapped value within the new range.
 * @example
 * clampBetweenRanges(50, [0, 100], [-1, 1]);  // Output: 0
 * clampBetweenRanges(80, [0, 100], [0, 255]); // Output: 204
 * clampBetweenRanges(-7, [-10, 0], [0, 255]); // Output: 76.5
 */
export function clampBetweenRanges(value, valueRange, newRange) {
  const [valueMin, valueMax] = valueRange;
  const [newMin, newMax] = newRange;

  const clampedValue = Math.max(valueMin, Math.min(valueMax, value));
  const valuePercentage = (clampedValue - valueMin) / (valueMax - valueMin);
  const mappedValue = valuePercentage * (newMax - newMin) + newMin;

  return mappedValue;
}

/**
 * @description Clamps a `value` between 0 and a maximum value, and maps it to a new range from 0 to 1.
 * @param {number} value - The value to be clamped.
 * @param {number} max - The maximum value to clamp the value to.
 * @returns {number} The clamped and mapped value within 0 and 1.
 * @example
 * clamp(10, 20); // Output: 0.5
 * clamp(-5, 10); // Output: 0
 * clamp(30, 25); // Output: 1
 */
export function clamp(value, max) {
  return clampBetweenRanges(value, [0, max], [0, 1]);
}

/**
 * @description Generates a random hexadecimal color code.
 * @returns {string} A random hexadecimal color code in the format `#RRGGBB`.
 */
export function randomHexColor() {
  const color = (~~(seedRandom() * 0xffffff)).toString(16).padStart(6, '0');
  return `#${color}`;
}

/**
 * @description Converts an angle in radians to degrees.
 * @param {number} radians - The angle to convert, in radians.
 * @returns {number} The angle in degrees.
 */
export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * @description Converts an angle in degrees to radians.
 * @param {number} degrees - The angle to convert, in degrees.
 * @returns {number} The angle in radians.
 */
export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * @description Creates an DOM element with specified tag and properties.
 * @param {K} tag - The tag of the new element to create.
 * @param {ElementCreationOptions<K>} [options] - The properties and values to apply to the element.
 * @returns {HTMLElementTagNameMap[K]} The newly created element.
 * @template {keyof HTMLElementTagNameMap} K - The tag type parameter representing the tag of the element.
 * @example
 * const button = createElement('button', {
 *   parent: document.body,
 *   attributes: {
 *     id: 'myButton',
 *     class: 'btn btn-primary'
 *   },
 *   style: {
 *     backgroundColor: 'blue',
 *     color: 'white',
 *     padding: '10px 20px'
 *   },
 *   children: ['Click me!']
 * });
 * @example
 * const div = createElement('div', {
 *   parent: document.body,
 *   prepend: true,
 *   attributes: {
 *     id: 'myDiv',
 *     class: 'container',
 *     'data-custom': 'value'
 *   },
 *   style: {
 *     color: 'blue',
 *     fontSize: '16px'
 *   },
 *   children: [
 *     'Hello, ',
 *     createElement('strong', { textContent: 'world' }),
 *     '!'
 *   ]
 * });
 * @example
 * const customElement = createElement('my-custom-element', {
 *   customProp: 'custom value',
 *   onclick: () => console.log('Clicked!')
 * });
 */
export function createElement(tag, options = {}) {
  const { parent, prepend = false, attributes, children, style, ...rest } = options;

  const element = document.createElement(tag);

  if (!isNil(attributes)) {
    for (const key in attributes) element.setAttribute(key, attributes[key]);
  }

  if (isArray(children)) {
    for (const child of children) element.append(child);
  }

  if (!isNil(style)) {
    Object.assign(element.style, style);
  }

  Object.assign(element, rest);

  if (!isNil(parent)) prepend ? parent.prepend(element) : parent.append(element);

  return element;
}

/**
 * @description Return `true` if the value is a string, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is string} Boolean expression.
 */
export function isString(value) {
  return typeof value === 'string';
}

/**
 * @description Return `true` if the value is a number (finite & not NaN), otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is number} Boolean expression.
 */
export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
}

/**
 * @description Return `true` if the value is a boolean, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is boolean} Boolean expression.
 */
export function isBoolean(value) {
  return typeof value === 'boolean' && (value === true || value === false);
}

/**
 * @description Return `true` if the value is nil (null | undefined | void), otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is null | undefined | void} Boolean expression.
 */
export function isNil(value) {
  return value === null || value === undefined || value === void 0;
}

/**
 * @description Return `true` if the value is an object, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is Record<string, any>} Boolean expression.
 */
export function isObject(value) {
  return typeof value === 'object' && !isNil(value) && !isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * @description Return `true` if the value is an array, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is Array} Boolean expression.
 */
export function isArray(value) {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

/**
 * @description Return `true` if the value is a function, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is Function} Boolean expression.
 */
export function isFunction(value) {
  return typeof value === 'function' && (Object.prototype.toString.call(value) === '[object Function]' || Object.prototype.toString.call(value) === '[object AsyncFunction]');
}

/**
 * @typedef {([N] extends [never] ? T : T[])} SampledElements The sampled elements as an array, or a single element if `size` is not provided.
 * @template T - The type of the elements in the array.
 * @template {number} [N=never] - The number of elements to sample (optional).
 */

/**
 * @typedef {object} InternalCreationOptions Represents the internal creation options for an element. These options are specific to the internal implementation and usage of the `createElement` function. They provide properties for the parent element, attributes, children, and style of the new element. By separating these internal options, we can ensure that the core functionality of the `createElement` function remains intact and unaffected by external factors.
 * @property {Element} parent The parent to append the new element to.
 * @property {boolean} prepend Should the parent be prepended instead of appended the new element to.
 * @property {Record<string, string>} attributes The attributes to set on the new element.
 * @property {Array<Element | string>} children The children to append to the new element.
 * @property {Partial<CSSStyleDeclaration>} style The style to apply to the new element.
 */
/**
 * @typedef {Omit<HTMLElementTagNameMap[K], keyof InternalCreationOptions>} ExternalCreationOptions Represents the external creation options for an element. These options are meant to be provided by the consumers of the `createElement` function. They extend the built-in HTML element types, allowing additional properties to be passed as options. However, we exclude the properties that are already defined in the `InternalCreationOptions` type to avoid duplicate keys. This ensures that the external options do not interfere with the internal options and maintain compatibility with the built-in HTML element types.
 * @template {keyof HTMLElementTagNameMap} K - The tag type parameter representing the tag of the element.
 */
/**
 * @typedef {Partial<InternalCreationOptions> & Partial<ExternalCreationOptions<K>>} ElementCreationOptions Represents the combined creation options for an element. It includes both the internal and external options. By merging these options, we allow users of the `createElement` function to provide a comprehensive set of properties for creating elements. The resulting `ElementCreationOptions` type ensures that all necessary options are accounted for, while avoiding conflicts and maintaining compatibility.
 * @template {keyof HTMLElementTagNameMap} K - The tag type parameter representing the tag of the element.
 */