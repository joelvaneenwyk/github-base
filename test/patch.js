'use strict';

require('mocha');
const assert = require('assert');
const auth = require('./support/auth');
const GitHub = require('..');

/** @type {import('..')} */
let github;

describe('.patch', function() {
  this.timeout(5000);

  beforeEach(() => (github = new GitHub(auth)));

  it('should PATCH an issue', () => {
    /** @type {import('..').GitHubRequestConfig} */
    let opts = {
      owner: 'jonschlinkert',
      repo: 'github-base',
      number: 14,
      title: 'issue-api-test',
      body: `this is a test ${+(new Date())}`,
      assignees: ['jonschlinkert'],
      state: 'closed'
    };

    return github.patch(`/repos/${opts.owner}/${opts.repo}/issues/${opts.number}`, opts)
      .then((res) => {
        assert.strictEqual(res.body.number, 14);
        assert.strictEqual(res.body.title, 'issue-api-test');
      });
  });
});
