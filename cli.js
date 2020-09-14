#!/usr/bin/env node
'use strict';

const glob = require('glob');
const { argv } = require('yargs');
const Hemerodrome = require('./hemerodrome');

const hemerodrome = new Hemerodrome(argv);

console.pp(argv);

const tests = argv._;
if (!tests.length) {
  tests.push('test/**/*.test.js');
}

const pattern = tests.length > 1 ? `{${ tests.join(',') }}` : tests[0];
console.log(pattern);
glob(pattern, {}, (error, files) => {
  console.pp(error, files);

  hemerodrome.addFiles(files);
});
