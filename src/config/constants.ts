/**
 * Defines known safe, warning, and dangerous SPDX license identifiers for risk classification.
 *
 * The lists are not exhaustive but cover common licenses and their variants.
 * The classification is based on general legal interpretations of these licenses in the context of typical software projects, but it is not legal advice.
 * Always consult a legal professional for specific licensing questions.
 */
export const SAFE_LICENSES = [
  'MIT',
  'ISC',
  'APACHE-2.0',
  'BSD-2-CLAUSE',
  'BSD-3-CLAUSE',
  'UNLICENSE',
  'CC0-1.0',
];

/**
 * Warning licenses are those that may have copyleft provisions or other requirements that could be problematic for some projects, especially closed-source or commercial ones.
 * They are not inherently "bad" but require careful consideration.
 */
export const WARNING_LICENSES = [
  'LGPL-2.1',
  'LGPL-3.0',
  'MPL-2.0',
  'EPL-2.0',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'AGPL-3.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0-or-later',
  'AGPL-3.0-or-later',
];

/**
 * Dangerous licenses are those that have strong copyleft provisions or other terms that are generally considered risky for most projects, especially if you want to avoid open-sourcing your own code.
 */
export const DANGER_LICENSES = [
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-3.0',
  'SSPL-1.0',
  'LGPL-2.1-only',
  'LGPL-3.0-only',
  'LGPL-2.1-or-later',
  'LGPL-3.0-or-later',
];
