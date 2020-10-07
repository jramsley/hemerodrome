class States {
  constructor() {};

  static get PENDING () {
    return 'pending';
  };

  static get RUNNING () {
    return 'running';
  };

  static get PASSED () {
    return 'passed';
  };

  static get FAILED () {
    return 'failed';
  };

  static get CANCELED () {
    return 'canceled';
  };

  static get SKIPPED () {
    return 'skipped';
  };

  static get ACTIVE () {
    return [ this.PENDING, this.RUNNING ];
  };

  static get ENDED () {
    return [ this.FAILED, this.CANCELED, this.SKIPPED, this.PASSED ];
  };
}

export default States
