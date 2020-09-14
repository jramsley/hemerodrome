'use strict';

require('barrkeep/pp');

const vm = require('vm');
const async = require('async');
const fs = require('fs').promises;
const expect = require('barrkeep/expect');
const { merge, timestamp } = require('barrkeep/utils');

const defaults = {
  parrallel: true,
  concurrency: 5,
};

function Hemerodrome (options = {}, files) {
  this.config = merge(defaults, options, true);

  const root = {
    name: 'hemerodrome',
    object: 'results',
    items: [],
    state: 'running',
    start: timestamp(),
    stop: -1,
  };

  //////////

  this.setParent = (object, parent) => {
    Object.defineProperty(object, 'parent', {
      value: parent,
      writable: false,
      configurable: false,
      enumerable: false,
    });

    return object;
  };

  //////////

  this.queue = async.queue(async (file) => {
    const spec = {
      object: 'spec',
      name: file.replace(/^(.*?)([^/]+)$/, '$2'),
      file,
      items: [ ],
      state: 'running',
      start: timestamp(),
      stop: -1,
    };

    this.setParent(spec, root);

    root.items.push(spec);

    let parent = spec;

    this.describe = async (name, func) => {
      console.log('parent', parent.name);

      const suite = {
        object: 'suite',
        name,
        items: [ ],
        state: 'running',
        start: timestamp(),
        stop: -1,
      };

      this.setParent(suite, parent);

      console.log(suite.parent.name);

      parent.items.push(suite);

      parent = suite;

      console.log('describe', name, suite.parent.name);
      try {
        await func();
        if (suite.state !== 'failed') {
          suite.state = 'passed';
        }
      } catch (error) {
        suite.state = 'failed';
        suite.error = error.toString();
      }

      if (suite.state === 'failed') {
        suite.parent.state = suite.state;
      }

      parent = suite.parent;

      suite.stop = timestamp();
    };

    this.it = async (name, func) => {
      const test = {
        object: 'test',
        name,
        state: 'running',
        start: timestamp(),
        stop: -1,
      };

      this.setParent(test, parent);

      parent.items.push(test);
      console.log('it', name, parent.name);
      try {
        await func();
        test.state = 'passed';
      } catch (error) {
        test.state = 'failed';
        test.error = error.toString();

        parent.state = 'failed';
      }

      test.stop = timestamp();
    };

    const context = {
      clearImmediate,
      clearInterval,
      clearTimeout,
      console,
      describe: this.describe,
      expect,
      global,
      it: this.it,
      process,
      queueMicrotask,
      require,
      setImmediate,
      setInterval,
      setTimeout,
    };

    vm.createContext(context);

    const code = await fs.readFile(file);

    await vm.runInContext(code, context, {
      filename: file,
      breakOnSigint: true,
    });

    if (spec.state === 'failed') {
      root.state = spec.state;
    } else {
      spec.state = 'passed';
    }

    spec.stop = timestamp();
  }, this.config.parallel ? this.config.concurrency : 1);

  //////////

  this.queue.error((error, file) => {
    console.log('error', error, file);
  });

  this.queue.drain(() => {
    root.stop = timestamp();

    console.log('Done!');

    console.pp(root);
  });

  /////////

  this.queue.push(files);
}

const hemerodrome = new Hemerodrome({}, [ './test/basic.test.js', './test/async.test.js' ]);

module.exports = hemerodrome;
