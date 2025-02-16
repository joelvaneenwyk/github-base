'use strict';

require('mocha');
const assert = require('assert');
const auth = require('./support/auth');
const GitHub = require('..');

/** @type {import('..')} */
let github;

describe('authentication', function() {
  beforeEach(() => (github = new GitHub(auth)));

  it('should throw an error when bad credentials are provided', function () {
    const github_no_auth = new GitHub({ username: 'doowb-that-does-not-really-exist', password: 'credentials' });
    return github_no_auth.get('/repos/doowb/fooobarbaz')
      .then(res => assert(!res))
      .catch(err => {
        assert.strictEqual(err.response.statusCode, 404);
      });
  });

  it('should authenticate with username and password', function() {
    return github.get('/gists').then(res => {
      assert.strictEqual(res.body.length > 0, true);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body[0].url.startsWith('https://api.github.com/gists/'), true);
    });
  });

  it.skip('should get the rate limit', function() {
    return github.get('/rate_limit').then(res => console.log(res.data));
  });
});
