import Item from './item.mjs';
import States from './states.mjs';
import Spec from './spec.mjs';

class Suite extends Item {
  #items

  constructor(...args) {
    super(...args);
    this.#items = [];
  };

  get items () {
    return this.#items;
  };

  add(items) {
    if (States.ENDED.includes(this.state)) {
      return;
    }
    const toAdd = [].concat(items).filter(item => item instanceof Spec);
    this.#items = this.#items.concat(toAdd);
  }

  get summary () {
    return { ...super.summary, items: this.items.map(item => item.summary) };
  };
}

export default Suite
