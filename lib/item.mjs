import { createHash } from 'crypto';
import { timestamp } from 'barrkeep/utils.js';
import States from './states.mjs';

class Item {
  #name
  #description
  #id
  #parent
  #state
  #start
  #stop

  constructor(name = '') {
    this.#name = name;
    this.#start = timestamp();
    this.#id = createHash('md5').update(this.#start.toString()).digest('hex');
    this.#state = States.PENDING;
  }

  get name () {
    return this.#name;
  };

  set name (str) {
    this.#name = str;
  };

  get description () {
    return this.#description;
  };

  set description (str) {
    this.#description = str;
  };

  get id () {
    return this.#id;
  };

  get start () {
    return this.#start;
  };

  get stop () {
    return this.#stop;
  };

  get duration () {
    return this.stop && (this.stop - this.start);
  };

  get state () {
    return this.#state;
  };

  end () {
    if(States.ACTIVE.includes(this.state)) {
      this.#state = States.CANCELED;
    }
    this.#stop || (this.#stop = timestamp());
  };

  get summary () {
    return {
      name: this.name,
      description: this.description,
      state: this.state,
      id: this.id,
      start: this.start,
      stop: this.stop,
      duration: this.duration
    };
  };
}

export default Item
