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
    if (isNil(element)) {
      array[index] = index;
    } else if (isFunction(element)) {
      array[index] = element(index);
    } else {
      array[index] = element;
    }
  }

  return array;
}

/**
 * @overload
 * @param {Array<T>} array - The array to sample from.
 * @returns {T} The sampled element from the array.
 * @template T - The type of the elements in the array.
 */
/**
 * @overload
 * @param {Array<T>} array - The array to sample from.
 * @param {number} size - The number of elements to sample.
 * @returns {Array<T>} The sampled elements from the array.
 * @template T - The type of the elements in the array.
 */
/**
 * @description Randomly sample elements from an array.
 * @param {Array<T>} array - The array to sample from.
 * @param {number} [size] - The number of elements to sample.
 * @returns {T | Array<T>} The sampled elements as an array, or a single element if `size` is not provided.
 * @template const T - The type of the elements in the array.
 */
export function sampleFromArray(array, size) {
  if (!isNumber(size)) return array[Math.floor(Math.random() * array.length)];

  const length = array.length;
  const maxArraySize = Math.min(size, length);
  const sampledIndexes = new Set();

  while (sampledIndexes.size < maxArraySize) {
    sampledIndexes.add(Math.floor(Math.random() * length));
  }

  return [...sampledIndexes].map(index => array[index]);
}

/**
 * @description Creates an DOM element with specified tag and properties.
 * @param {T} tag - The tag of the new element to create.
 * @param {ElementCreationOptions<T>} [options] - The properties and values to apply to the element.
 * @returns {HTMLElementTagNameMap[T]} The newly created element.
 * @template {keyof HTMLElementTagNameMap} T - The tag type parameter representing the tag of the element.
 * @example
 * ```
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
 *
 * const div = createElement('div', {
 *   parent: '.wrapper',
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
 *
 * const customElement = createElement('my-custom-element', {
 *   customProp: 'custom value',
 *   onclick: () => console.log('Clicked!')
 * });
 * ```
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

  if (!isNil(parent)) {
    const parentElement = isString(parent) ? document.querySelector(parent) : parent;
    if (parentElement) parentElement[prepend ? 'prepend' : 'append'](element);
  }

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
 * @description Return `true` if the value is nil (null | undefined | void), otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is null | undefined | void} Boolean expression.
 */
export function isNil(value) {
  return value == null;
}

/**
 * @description Return `true` if the value is an array, otherwise return `false`.
 * @param {unknown} value - The value to check.
 * @returns {value is Array<unknown>} Boolean expression.
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
  return typeof value === 'function';
}

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