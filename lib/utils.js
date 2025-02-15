
/**
 * Utils for GitHub API requests
 *
 * @module utils
 *
 * @typedef {import('axios').AxiosResponse} AxiosXHR
 * @typedef {Promise<AxiosXHR>} AxiosPromise
 * @typedef {{
 *   id?: any,
 *   data: any,
 *   body: any,
 *   url?: string,
 *   statusCode: number,
 *   op?: string
 * } & AxiosXHR} GitHubXHR
 * @typedef {Promise<GitHubXHR>} GitHubPromise
 * @typedef {(url: string, res: any, acc: any[]) => void} Next
 * @typedef {import('axios').AxiosRequestConfig & {
 *   method: string,
 *   params?: string[],
 *   next?: Next | null,
 *   bearer?: string,
 *   token?: string,
 *   username?: string,
 *   password?: string
 * }} GitHubRequestConfig
 */

const qs = require('qs');
const url = require('url');
const get = require('get-value');
const axios = require('axios').default;
const paged = require('paged-request');
const parseLink = require('parse-link-header');
const defaultHeaders = {
  accept: 'application/json',
  'user-agent': 'https://github.com/jonschlinkert/github-base'
};

/** @type {GitHubRequestConfig} */
exports.DefaultOptions = {
  method: '',
  params: [],
  url: '',
  headers: {},
  token: '',
  username: '',
  password: ''
};

/**
 * Make a request to the GitHub API.
 *
 * @param {string} method - The HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} path - The API endpoint path
 * @param {GitHubRequestConfig} options - The request options including headers, params, etc.
 * @returns {GitHubPromise}
 */
exports.request = function(method, path, options) {
  const defaults = exports.defaults();
  const opts = Object.assign({}, defaults(method, path, options));
  let data = /^(put|patch|post)$/i.test(opts.method) ? options : null;
  let data_string = data ? JSON.stringify(sanitize(data, opts.params)) : null;
  let instance = axios.create();
  let verb = (opts.method || '').toLowerCase();

  /** @type {AxiosPromise} */
  let promise;
  let url = opts.url || '';
  switch (verb) {
    case 'post':
      promise = instance.post(url, data_string, opts);
      break;
    case 'put':
      promise = instance.put(url, data_string, opts);
      break;
    case 'patch':
      promise = instance.patch(url, data_string, opts);
      break;
    case 'delete':
      promise = instance.delete(url, opts);
      break;
    case 'get':
    default:
      promise = instance.get(url, opts);
      break;
  }

  return promise.then(res => {
    /** @type {GitHubXHR} */
    const github_res = Object.assign({}, res, { body: res.data, statusCode: res.status });
    return result(github_res, data_string, opts, options);
  });
};

/**
 * Recursive walk over paged content
 *
 * @param {string} method
 * @param {string} path
 * @param {GitHubRequestConfig} options
 * @returns
 */
exports.paged = function(method, path, options) {
  const defaults = exports.defaults();
  const opts = defaults(method, path, options);

  /**
   *
   * @param {string} _url
   * @param {GitHubXHR} res
   * @param {Array} acc
   * @returns
   */
  function nextPage(_url, res, acc) {
    if (typeof opts.next === 'function') {
      opts.next(_url, sanitize(res), sanitize(acc));
    }

    let page;
    return res.headers.link && (page = parseLink(res.headers.link)) && page.next ? page.next.url : null;
  }

  return paged(opts.url, opts, nextPage)
    .then(res => result(res, null, opts, options))
    .then(res => sanitize(res));
};

/**
 * Normalize request options object, request body, headers and related properties
 * to use for GitHub API requests.
 *
 * @param  {GitHubRequestConfig?} appOptions Options on the instance of github-base.
 * @return {(method: string, uri: string, methodOptions: GitHubRequestConfig) => GitHubRequestConfig} Returns a function that takes a request method name, the URL to expand, and method options.
 */
exports.defaults = function (appOptions = null) {
  const defaults = { apiurl: 'https://api.github.com', method: 'get', params: [] };
  return function(method, uri, methodOptions) {
    const options = Object.assign({}, defaults, appOptions, methodOptions, { uri, method });
    const context = { orig: Object.assign({}, options), options: lowercaseKeys(options) };
    context.options.url = interpolate(uri, context);
    context.options.headers = createHeaders(context.options);

    let opts = context.options;
    const body = omit(context.orig, Object.keys(opts));
    const json = opts.json;
    const text = opts.body;

    if (!opts.mode && /\/markdown(?!\/raw)/.test(opts.url)) {
      opts.mode = 'gfm';
    }

    const bodyKeys = Object.keys(body);
    if (bodyKeys.length > 0) {
      opts = omit(opts, bodyKeys);
      opts.headers['content-length'] = JSON.stringify(body).length;

      if (typeof opts.headers['content-type'] !== 'string') {
        opts.headers['content-type'] = 'application/json';
      }
    } else if (lowercase(opts.method) === 'put') {
      opts.headers['content-length'] = 0;
    }

    if (typeof json === 'boolean') {
      opts.json = json;
    }

    if (text) {
      opts.body = opts.json !== true ? JSON.stringify(text) : text;
    }

    opts = sanitize(opts, opts.params);
    return opts;
  };
};

/**
 * Create auth string - token, Bearer or Basic Auth
 *
 * @param {GitHubRequestConfig} options
 * @returns {GitHubRequestConfig}
 */
function createHeaders(options) {
  const opts = Object.assign({}, options);
  const headers = Object.assign({}, defaultHeaders, lowercaseKeys(opts.headers || {}));

  if (!opts.bearer && !opts.token && !opts.username && !opts.password) {
    return headers;
  }

  if (opts.token) {
    headers['authorization'] = 'token ' + opts.token;
    return headers;
  }

  if (opts.bearer) {
    headers['authorization'] = 'Bearer ' + opts.bearer;
    return headers;
  }

  const creds = opts.username + ':' + opts.password;
  headers['authorization'] = 'Basic ' + toBase64(creds);
  return headers;
}

/**
 * Create request URL by replacing params with actual values.
 *
 * @param {string} str
 * @param {Object} context
 * @returns {string}
 */
function interpolate(str, context) {
  const opts = { ...context.options };

  let val = opts.apiurl + str.replace(/:([\w_]+)/g, (_m, key) => {
    opts.params = union(opts.params, key);
    let val = get(opts, key);
    if (val !== void 0) {
      return val;
    }
    return key;
  });

  if (opts.method.toLowerCase() === 'get' && opts.paged !== false) {
    const obj = url.parse(val);
    const query = obj.query ? qs.parse(obj.query) : {};
    const noquery = omit(obj, ['query', 'search']);
    noquery.query = noquery.search = qs.stringify(Object.assign({ per_page: 100 }, opts.query, query));
    val = url.format(noquery);
  }

  val += /\?/.test(val) ? '&' : '?';
  val += (new Date()).getTime();
  return val;
}

/**
 * Process the result of a request
 *
 * @param {GitHubXHR} res
 * @param {string | null} data
 * @param {GitHubRequestConfig} opts
 * @param {GitHubRequestConfig} options
 * @returns {GitHubPromise}
 */
function result(res, data, opts, options) {
  if (res.statusCode >= 400) {
    const err = new Error(res.body.message);
    Reflect.defineProperty(err, 'res', { value: res, enumerable: false });
    return Promise.reject(err);
  }

  if (!res.url) res.url = opts.url;
  if (res.op) res.id = options.id;

  if (/\/markdown\/raw/.test(res.url) && opts.headers['content-type'] === 'text/plain') {
    try {
      const parsed = JSON.parse(res.body.trim().replace(/^<p>|<\/p>$/g, ''));
      res.body = `<p>${parsed.body}</p>\n`;
    } catch (err) {
      // ignore
      err;
    }
  }

  return Object.assign({}, data, res);
}

/**
 * Cleanup request options object
 *
 * @typedef {Object} TObject
 *
 * @param {TObject} options
 * @param {string[]?} blacklist
 * @returns {TObject}
 */
function sanitize(options, blacklist = null) {
  const opts = Object.assign({}, options);
  const defaults = ['apiurl', 'token', 'username', 'password', 'placeholders', 'bearer'];
  const keys = union(defaults, blacklist || []);
  return omit(opts, keys);
}

/**
 * Convert object keys to lowercase
 *
 * @typedef {Object} T
 *
 * @param {T} obj
 * @returns {T}
 */
function lowercaseKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [lowercase(key), value])
  );
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function lowercase(str) {
  return typeof str === 'string' ? str.toLowerCase() : '';
}

/**
 * Omit properties from an object
 *
 * @typedef {Object} U
 *
 * @param {U} obj
 * @param {string[] | string | null | undefined} keys
 * @returns {U}
 */
function omit(obj, keys = null) {
  const key_array = Array.isArray(keys) ? keys : (keys ? [keys] : []);
  let res = {};
  for (const key of Object.keys(obj)) {
    if (!key_array.includes(key)) {
      res[key] = obj[key];
    }
  }
  return res;
}

/**
 * Create a union of unique values from all arrays
 *
 * @typedef {any} Element
 *
 * @param  {...Element} args
 * @returns {Element[]}
 */
function union(...args) {
  const arr = new Set();
  for (const arg of args) {
    for (const ele of [].concat(arg)) {
      if (ele) arr.add(ele);
    }
  }
  return [...arr];
}

/**
 * Convert a string to base64
 *
 * @param {string} str
 * @returns {string}
 */
function toBase64(str) {
  return Buffer.from(str).toString('base64');
}
