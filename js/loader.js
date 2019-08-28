// Probably wont be used as loading times are too fast
class Loader {
  constructor() {

  }

  start = itemsToFinish => {

  }

  end = () => {

  }

  addToProgress = number => {
    if (!number) {
      this.setProgress(this._progress + 1);
    }
    if (number < 0) {
      throw new Erorr('Cant subtract from progress');
    }

    this.setProgress(this._progress + number);
  }

  setProgress = newProgress => {
    if (newProgress < 0 || newProgress > finish) {

    }
    this._progress = newProgress;
  }
}
