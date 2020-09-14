'use strict';

require('barrkeep/pp');

const vm = require('vm');
const async = require('async');
const fs = require('fs').promises;
const expect = require('barrkeep/expect');

function Hemerodrome (config, files) {
  const root = {
    name: 'hemerodrome',
    items: [],
    state: 'running',
  };

  //////////

  async.eachLimit(files, 10, async (file) => {
    const spec = {
      object: 'spec',
      name: file.replace(/^(.*?)([^/]+)$/, '$2'),
      file,
      items: [ ],
      parent: root,
      state: 'running',
    };

    root.items.push(spec);

    let parent = spec;

    this.describe = async (name, func) => {
      console.log('parent', parent.name);

      const suite = {
        object: 'suite',
        name,
        items: [ ],
        parent,
        state: 'running',
      };

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
    };

    this.it = async (name, func) => {
      const test = {
        object: 'test',
        name,
        state: 'running',
      };

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
  }, (error) => {
    if (error) {
      console.log('error', error);
    }

    console.pp(root);
  });
}

const hemerodrome = new Hemerodrome({}, [ './test/basic.test.js', './test/async.test.js' ]);

module.exports = hemerodrome;
