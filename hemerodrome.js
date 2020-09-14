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
  timeout: 5000,
};

function Hemerodrome (options = {}) {
  this.config = merge(defaults, options, true);

  const root = {
    name: 'hemerodrome',
    object: 'results',
    items: [],
    state: 'ready',
    start: timestamp(),
    stop: -1,
  };

  //////////

  this.addChain = (object) => {
    Object.defineProperty(object, 'chain', {
      value: Promise.resolve(),
      writable: true,
      configurable: true,
      enumerable: false,
    });
  };

  this.setParent = (object, parent) => {
    Object.defineProperty(object, 'parent', {
      value: parent,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  };

  this.setPrivate = (object, property, value) => {
    Object.defineProperty(object, property, {
      value,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  };

  //////////

  this.queue = async.queue(async (file) => {
    root.state = 'running';

    const spec = {
      object: 'spec',
      name: file.replace(/^(.*?)([^/]+)$/, '$2'),
      file,
      items: [ ],
      state: 'running',
      start: timestamp(),
      stop: -1,
    };

    this.addChain(spec);
    this.setParent(spec, root);

    root.items.push(spec);

    let parent = spec;

    this.describe = (name, func, timeout = this.config.timeout) => {
      console.log('parent', parent.name);

      const suite = {
        object: 'suite',
        name,
        items: [ ],
        state: 'running',
        start: timestamp(),
        stop: -1,
      };

      this.addChain(suite);
      this.setParent(suite, parent);
      this.setPrivate(suite, 'timeout', timeout);

      console.log(suite.parent.name);

      suite.parent.items.push(suite);

      suite.parent.chain = suite.parent.chain.
        then(async () => {
          parent = suite;

          console.log('describe', name, suite.parent.name);
          await func();
        }).
        then(async () => {
          await suite.chain;

          if (suite.state === 'failed') {
            suite.parent.state = suite.state;
          } else {
            suite.state = 'passed';
          }

          suite.stop = timestamp();

          parent = suite.parent;
        }).
        catch(async (error) => {
          await suite.chain;

          suite.state = 'failed';
          suite.parent.state = suite.state;
          suite.error = error.toString();
          suite.stop = timestamp();

          parent = suite.parent;
        });

      return suite.chain;
    };

    this.it = (name, func, timeout) => {
      const test = {
        object: 'test',
        name,
        state: 'running',
        start: timestamp(),
        stop: -1,
      };

      this.setParent(test, parent);
      this.setPrivate(test, 'timeout', timeout === undefined ? parent.timeout : timeout);

      test.parent.items.push(test);
      console.log('it', name, parent.name);

      test.parent.chain = test.parent.chain.
        then(async () => {
          if (test.timeout === 0) {
            return await func();
          }

          return Promise.race([
            new Promise(async (resolve, reject) => {
              try {
                await func();
                resolve();
              } catch (error) {
                reject(error);
              }
            }),
            new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(new Error(`Async callback not called within timeout of ${ test.timeout }ms`));
              }, test.timeout);
            }),
          ]);
        }).
        then(() => {
          test.state = 'passed';
          test.stop = timestamp();
        }).
        catch((error) => {
          test.state = 'failed';
          test.parent.state = test.state;

          test.error = error.toString();

          test.stop = timestamp();
        });

      return test.parent.chain;
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

    try {
      const code = await fs.readFile(file);

      vm.runInContext(code, context, {
        filename: file,
        breakOnSigint: true,
      });

      await spec.chain;
    } catch (error) {
      spec.state = 'failed';
      spec.error = error.toString();
    }

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
    if (root.state !== 'failed') {
      root.state = 'passed';
    }

    root.stop = timestamp();

    console.log('Done!');

    console.pp(root);

    process.exit(root.state === 'failed' ? 1 : 0);
  });

  /////////

  this.addFiles = (files) => {
    this.queue.push(files);
  };
}

module.exports = Hemerodrome;
