'use strict';

require('mocha');
const typeOf = require('kind-of');
const auth = require('./support/auth');
const GitHub = require('..');
const assert = require('assert');

/** @type {import('..')} */
let github;

describe('.delete', function() {
  this.timeout(10000);

  beforeEach(() => (github = new GitHub(auth)));

  describe('DELETE /user/', function() {
    it('should un-follow a user', function() {
      assert.strictEqual(typeof github.delete, 'function');
      return github.delete('/user/following/jonschlinkert')
        .then(
          res => {
            assert.ok(res);
            assert.ok(res.body);
            assert.ok(res.statusCode);
            assert.strictEqual(typeOf(res.body), 'buffer');
            assert.strictEqual(res.body.toString(), '');
            assert.strictEqual(res.statusCode, 204);
          }
        );
    });
  });
});
