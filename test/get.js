'use strict';

require('mocha');
const assert = require('assert');
const auth = require('./support/auth');
const GitHub = require('..');
let org = 'jonschlinkert/github-base';

describe('.get', function() {
  it('should get resources when authenticated', function () {
    const github = new GitHub(auth);
    return github.get(`/repos/${org}/contributors`)
      .then(res => {
        assert.strictEqual(res.body.length > 0, true);
      });
  });

  it('should get resources when unauthenticated', function () {
    const github = new GitHub();
    return github.get(`/repos/${org}/contributors`)
      .then(res => {
          assert.strictEqual(res.body.length > 0, true);
        });
  });
});
