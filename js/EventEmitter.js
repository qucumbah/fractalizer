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

  _emit(event, ...args) {
    if (!this._listeners[event]) {
      return;
    } else {
      this._listeners[event].forEach(callback => callback.apply(null, args));
    }
  }
}