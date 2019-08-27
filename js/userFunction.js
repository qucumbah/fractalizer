import {getGLSLFromExpression} from './expressionParser.js';
import {throttle, outputError} from './util.js';
import FractalRenderer from './FractalRenderer.js';
import EventEmitter from './EventEmitter.js';
import auxOptions from './auxOptions.js';

const DEFAULT_FUNCTION_BODY = `
vec2 fun(vec2 c) {
  vec2 temp1 = powComplex(c, vec2(10, 0));
  vec2 temp2 = sub(temp1, c);
  vec2 temp3 = mul(temp2, vec2(10, 0));
  return temp3;
}
`;

// const DEFAULT_FUNCTION_BODY = `
// vec2 fun(vec2 c) {
//   return c;
// }
// `;

class UserFunction extends EventEmitter {
  constructor() {
    super();
    this.options = {
      body: DEFAULT_FUNCTION_BODY,
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

    if (this.options.fastMode || body) {
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

auxOptions.on('change', options => userFunction.changeOptions(options));

const panel = $('.panel');
const expression = $('.expression');
const code = $('.code');

let mode = 'expression';
const expressionButton = $('.expressionButton');
const codeButton = $('.codeButton');
expressionButton.click(()=>setMode('expression'));
codeButton.click(()=>setMode('code'));

function setMode(newMode) {
  mode = newMode;
  const className = 'panel --' + mode + 'Mode';
  panel.attr('class', className)
}

$('.codeRunButton').click(function() {
  const body = $('.code').get(0).value;

  userFunction.changeOptions({ body });
});

$('.expressionRunButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  try {
    const body = getGLSLFromExpression(currentExpression);
    userFunction.changeOptions({ body });
  } catch (error) {
    outputError(error);
  }
});
$('.expressionCopyCodeButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  const currentFunctionBody = getGLSLFromExpression(currentExpression);

  navigator.clipboard.writeText(currentFunctionBody);
});
/*
const arr = userFunction.renderer.getValueAt(3, 0);
console.log(arr);
*/

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
  const contentCurrentX = parseInt(content.css('left'));
  const contentCurrentY = parseInt(content.css('bottom'));

  let x, y;
  if (event.type === 'touchmove') {
    x = event.changedTouches[0].clientX;
    y = event.changedTouches[0].clientY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }

  let inputX = (-contentCurrentX + x) / auxOptions.scale;
  let inputY = (-contentCurrentY + (container.height() - y)) / auxOptions.scale;

  const arr = userFunction.valueCalculator.getValueAt(inputX, inputY);

  displayFunctionValue(inputX, inputY, arr.x, arr.y);
});

code.text(DEFAULT_FUNCTION_BODY);
const DEFAULT_EXPRESSION_BODY = '(c^10 - c)*10';
expression.text(DEFAULT_EXPRESSION_BODY);

export default userFunction;
