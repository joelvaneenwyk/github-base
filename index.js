/**
 * GitHub API client // `github-base`
 *
 * This is a simple wrapper around the GitHub API, that makes it easy
 * to make requests to the GitHub API.
 *
 * @module github-base
 */

const use = require('use');
const utils = require('./lib/utils');

/**
 * @typedef {import('./lib/utils').Options} Options
 * @typedef {import('./lib/utils').Next} Next
 *
 * @typedef {Object} GitHubOptions
 * @property {string} [token]
 * @property {string} [username]
 * @property {string} [password]
 * @property {Record<string, string>} [headers]
 * @property {string | Record<string, string> | undefined} [key]
 */

/**
 * Create an instance of `GitHub` with the given options.
 *
 * ```js
 * const GitHub = require('github-base');
 * const github = new GitHub([options]);
 * ```
 * @name GitHub
 * @api public
 */
class GitHub {
  /**
   * Initialize a new `GitHub` with the given `options`.
   *
   * @param {GitHubOptions} options
   */
  constructor(options = {}) {
    this.options = options;
    use(this);
  }

  /**
   * Uses [needle][] to make a request to the GitHub API. Supports the following verbs:
   * `GET`, `PUT`, `POST`, `PATCH`, and `DELETE`. Takes a callback or returns a promise.
   *
   * ```js
   * // list all orgs for the authenticated user
   * const auth = require('./local-private-auth-info');
   * const github = new GitHub(auth);
   * github.request('GET', '/user/orgs')
   *   .then(res => console.log(res.body));
   * ```
   * @name .request
   * @param  {String} `method` The http VERB to use
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  request(method, path, options) {
    return utils.request(method, path, { ...this.options, ...options });
  }

  /**
   * Make a `GET` request to the GitHub API.
   *
   * ```js
   * // get a list of orgs for the authenticated user
   * github.get('/user/orgs')
   *   .then(res => console.log(res.body));
   *
   * // get gists for the authenticated user
   * github.get('/gists')
   *   .then(res => console.log(res.body));
   * ```
   * @name .get
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  get(path, options = {}) {
    return this.request('GET', path, options);
  }

  /**
   * Make a `DELETE` request to the GitHub API.
   *
   * ```js
   * // un-follow someone
   * github.delete('/user/following/:some_username', { some_username: 'whatever' })
   *   .then(res => {
   *     console.log('RESPONSE:', res);
   *   });
   * ```
   * @name .delete
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Make a `PATCH` request to the GitHub API.
   *
   * ```js
   * // update a gist
   * const fs = require('fs');
   * const options = { files: { 'readme.md': { content: fs.readFileSync('README.md', 'utf8') } } };
   * github.patch('/gists/bd139161a425896f35f8', options)
   *   .then(res => {
   *     console.log('RESPONSE:', res);
   *   });
   * ```
   * @name .patch
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  patch(path, options = {}) {
    return this.request('PATCH', path, options);
  }

  /**
   * Make a `POST` request to the GitHub API.
   *
   * ```js
   * // create a new repository
   * github.post('/user/repos', { name: 'new-repo-name' })
   *   .then(res => {
   *     console.log('RESPONSE:', res);
   *   });
   * ```
   * @name .post
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  post(path, options = {}) {
    return this.request('POST', path, options);
  }

  /**
   * Make a `PUT` request to the GitHub API.
   *
   * ```js
   * // follow someone
   * github.put('/user/following/jonschlinkert')
   *   .then(res => {
   *     console.log('RESPONSE:', res);
   *   });
   * ```
   * @name .put
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options} `options` Request [options](#options).
   * @api public
   */
  put(path, options = {}) {
    return this.request('PUT', path, options);
  }

  /**
   * Recursively make GET requests until all pages of records are returned.
   *
   * ```js
   * // get all repos for the authenticated user
   * github.paged('/user/repos?type=all&per_page=1000&sort=updated')
   *   .then(res => console.log(res.pages))
   *   .catch(console.error)
   * ```
   * @name .paged
   * @param  {String} `path` The path to append to the base GitHub API URL.
   * @param  {Options | null} `options` Request [options](#options).
   * @param  {Next} `next` Callback function to run on each page
   * @api public
   */
  paged(path, options = null, next = () => { }) {
    if (typeof options === 'function') {
      next = options;
      options = null;
    }
    return utils.paged('GET', path, { ...this.options, ...options, next });
  }
}

module.exports = GitHub;
