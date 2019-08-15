import {getGLSLFromExpression} from './expressionParser.js';
import {outputError} from './util.js';
import FractalRenderer from './FractalRenderer.js';
import auxOptions from './auxOptions.js';

const DEFAULT_FUNCTION_BODY = `
vec2 fun(vec2 c) {
  vec2 temp1 = powComplex(c, vec2(10, 0));
  vec2 temp2 = sub(temp1, c);
  vec2 temp3 = mul(temp2, vec2(10, 0));
  return temp3;
}
`;

const userFunction = {
  renderer: null,
  _listeners: {},
  
  init() {
    this.options = {
      body: DEFAULT_FUNCTION_BODY,
      scale: auxOptions.scale,
      saturationRange: auxOptions.saturationRange,
      valueRange: auxOptions.valueRange,
      
      _width: 100,
      _height: 100
    }
    
    this._update();
  },

  changeOptions({
      body,
      fastMode,
      scale,
      saturationRange,
      valueRange
  }) {
    this.options.body = body?body:this.options.body;
    this.options.fastMode = fastMode?fastMode:this.options.fastMode;
    this.options.scale = scale?scale:this.options.scale;
    this.options.saturationRange =
        saturationRange?saturationRange:this.options.saturationRange;
    this.options.valueRange =
        valueRange?valueRange:this.options.valueRange;
    
    if (this.options.fastMode || body) {
      this._update();
    }
  },
  
  _update() {
    this.renderer = new FractalRenderer(this.options);
    
    this._emit('change');
  },
  
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [callback];
    } else {
      this._listeners[event].push(callback);
    }
  },

  _emit(event, data) {
    if (!this._listeners[event]) {
      return;
    } else {
      this._listeners[event].forEach(callback => callback.call(null, data));
    }
  }
};

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

code.text(DEFAULT_FUNCTION_BODY);
const DEFAULT_EXPRESSION_BODY = '(c^10 - c)*10';
expression.text(DEFAULT_EXPRESSION_BODY);

export default userFunction;
