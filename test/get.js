'use strict';

require('mocha');
const assert = require('assert');
const auth = require('./support/auth');
const GitHub = require('..');
let org = 'jonschlinkert/github-base';

/** @type {import('..')} */
let github;

describe('.get', function() {
  beforeEach(() => (github = new GitHub(auth)));

  it('should get resources when authenticated', function() {
    return github.get(`/repos/${org}/contributors`)
      .then(res => assert.strictEqual(res.body.length > 0, true));
  });

  it('should get resources when unauthenticated', function() {
    return github.get(`/repos/${org}/contributors`)
      .then(res => assert.strictEqual(res.body.length > 0, true));
  });
});
