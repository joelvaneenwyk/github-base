'use strict';

require('mocha');
const assert = require('assert');
const GitHub = require('..');

describe('API', function() {
  it('should extend GitHub class', function(cb) {
    class Foo extends GitHub {
      whatever() {}
    }

    assert.strictEqual(typeof Foo.prototype.get, 'function');
    assert.strictEqual(typeof Foo.prototype.put, 'function');
    assert.strictEqual(typeof Foo.prototype.whatever, 'function');
    cb();
  });

  it('should call plugins', function() {
    const github = new GitHub();
    let count = 0;

    // @ts-ignore
    github.a = 'b';

    // @ts-ignore
    github.use(function() {
      count++;
      // @ts-ignore
      assert(this.a, 'b');
    });

    assert.strictEqual(count, 1);
  });
});
