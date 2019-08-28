export default class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [callback];
    } else {
      this._listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (!this._listeners[event]) {
      return;
    }

    if (!callback) {
      this._listeners[event] = [];
    } else {
      const index = this._listeners[event].findIndex(elem => elem === callback);

      if (index === -1) {
        return;
      }

      this._listeners[event].splice(index, 1);
    }
  }

  _emit(event, ...args) {
    if (!this._listeners[event]) {
      return;
    } else {
      this._listeners[event].forEach(callback => callback.apply(null, args));
    }
  }
}
