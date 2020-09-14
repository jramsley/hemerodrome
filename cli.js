#!/usr/bin/env node
'use strict';

const glob = require('glob');
const { argv } = require('yargs');
const Hemerodrome = require('./hemerodrome');

//////////

const aglob = (pattern, options) => new Promise((resolve, reject) => {
  glob(pattern, options, (error, result) => {
    if (error) {
      return reject(error);
    }
    return resolve(result);
  });
});

//////////

(async () => {
  const hemerodrome = new Hemerodrome(argv);

  console.pp(argv);

  const tests = argv._;
  if (!tests.length) {
    tests.push('test/**/*.test.js');
  }

  const pattern = tests.length > 1 ? `{${ tests.join(',') }}` : tests[0];
  console.log(pattern);
  const files = await aglob(pattern);
  console.pp(files);

  hemerodrome.addFiles(files);
})();
