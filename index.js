'use strict';

require('barrkeep/pp');
const fs = require('fs');
const vm = require('vm');

function Hemerodrome (config, files) {
  const root = {
    name: 'hemerodrame',
    items: [],
  };

  //////////

  let parent = root;

  this.describe = (name, func) => {
    const suite = {
      object: 'suite',
      name,
      items: [ ],
      parent,
    };

    parent.items.push(suite);

    parent = suite;

    console.log('describe', name);
    func();

    parent = suite.parent;
  };

  this.it = (name, func) => {
    const test = {
      name,
      func,
    };

    parent.items.push(test);

    console.log('it', name);
    func();
  };

  //////////

  for (const file of files) {
    const context = {
      describe: this.describe,
      it: this.it,
      console,
      process,
      global,
      require,
      parent: root,
    };

    vm.createContext(context);

    const code = fs.readFileSync(file).toString();

    const result = vm.runInContext(code, context);
  }

  console.pp(root);
}

const hemerodrome = new Hemerodrome({}, [ './test/basic.test.js' ]);
