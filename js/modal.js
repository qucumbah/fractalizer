import EventEmitter from './EventEmitter.js';

class Modal extends EventEmitter {
  constructor() {
    super();
    this._modal = $('.modal');
    this._content = $('.modalContent');
    this._title = $('.modalTitle');

    this._darken = $('.modal .darken');
    this._darken.click(()=>this.hide());

    this._okButton = $('.modal .okButton');
    this._cancelButton = $('.modal .cancelButton');

    this._okButton.on('click', () => this._emit('submit'));
    this._cancelButton.on('click', () => this._emit('cancel'));
  }

  setContent(newContent) {
    this._content.empty();
    if (newContent instanceof Array) {
      newContent.forEach(elem => this._content.append(elem));
    } else {
      this._content.append(newContent);
    }
  }

  setTitle(newTitle) {
    this._title.text(newTitle);
  }

  show() {
    this._modal.fadeIn(200)
    return this;
  }

  hide() {
    this._modal.fadeOut(200)
    return this;
  }
}

const modal = new Modal();
export default modal;
