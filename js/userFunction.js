import {throttle} from './util.js';
import FractalRenderer from './FractalRenderer.js';
import EventEmitter from './EventEmitter.js';
import auxOptions from './auxOptions.js';

class UserFunction extends EventEmitter {
  constructor() {
    super();
    this.options = {
      body: auxOptions.body,
      scale: auxOptions.scale,
      saturationRange: auxOptions.saturationRange,
      valueRange: auxOptions.valueRange,

      _width: 100,
      _height: 100
    }
    this.renderer = new FractalRenderer(this.options);
    //This is becoming really messy, but there are some bugs that I have to fix
    //right now if I want fractalizer to stay alive, so there's that
    this.valueCalculator = new FractalRenderer(this.options);

    this._update();
  }

  changeOptions({
      body,
      fastMode,
      scale,
      saturationRange,
      valueRange
  }) {
    this.options.body = body?body:this.options.body;
    this.options.fastMode =
      (fastMode!==undefined)?fastMode:this.options.fastMode;
    this.options.scale = (scale!==undefined)?scale:this.options.scale;
    this.options.saturationRange =
        (saturationRange!==undefined)?saturationRange:this.options.saturationRange;
    this.options.valueRange =
        (valueRange!==undefined)?valueRange:this.options.valueRange;

    if (body !== undefined) {
      this._update();
    }
  }

  _update() {
    this.renderer.updateProgram(this.options);
    this.valueCalculator.updateProgram(this.options);

    this._emit('change');
  }
}

const userFunction = new UserFunction();

auxOptions.on('change', options => {
  if (options.rerender) {
    userFunction.changeOptions(options);
    auxOptions.update({ rerender: false });
  }
});

const displayFunctionValue = throttle(
  function(inputX, inputY, resultX, resultY) {
    //Trim result
    inputX = inputX.toFixed(2);
    inputY = inputY.toFixed(2);
    resultX = resultX.toFixed(2);
    resultY = resultY.toFixed(2);

    const output = `f(${inputX}, ${inputY}) = (${resultX}, ${resultY})`;

    $('.functionValue').text(output);
  },
  1000/60 //ms in one frame
);

const container = $('.container');
const content = $('.content');
container.on('mousemove touchmove', event => {
  const contentPosition = auxOptions.contentPosition;

  let x, y;
  if (event.type === 'touchmove') {
    x = event.changedTouches[0].clientX;
    y = event.changedTouches[0].clientY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }

  let inputX = (-contentPosition.x + x) / auxOptions.scale;
  let inputY = (
    (-contentPosition.y + (container.height() - y)) / auxOptions.scale
  );

  const arr = userFunction.valueCalculator.getValueAt(inputX, inputY);

  displayFunctionValue(inputX, inputY, arr.x, arr.y);
});

export default userFunction;
