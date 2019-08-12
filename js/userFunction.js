import Complex from './Complex.js';
import {getGLSLFromExpression} from './expressionParser.js';
import {outputError} from './util.js';
import FractalRenderer from './FractalRenderer.js';

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

let currentFunctionBody;

let evaluate = new Function('Complex', 'c', currentFunctionBody);
const userFunction = {
  evaluate,
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [callback];
    } else {
      this.listeners[event].push(callback);
    }
  },

  _emit(event, data) {
    if (!this.listeners[event]) {
      return;
    } else {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

$('.codeRunButton').click(function() {
  const currentFunctionBody = $('.code').get(0).value;

  updateRenderer(currentFunctionBody);
});

$('.expressionRunButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  try {
    const currentFunctionBody = getGLSLFromExpression(currentExpression);
    updateRenderer(currentFunctionBody);
  } catch (error) {
    outputError(error);
  }
});
$('.expressionCopyCodeButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  const currentFunctionBody = getGLSLFromExpression(currentExpression);

  navigator.clipboard.writeText(currentFunctionBody);
});

function updateRenderer(body) {
  //userFunction.evaluate = new Function('Complex', 'c', body);
  //console.log(userFunction.evaluate);
  
  const globals = {
    scale: 10,
    saturationRange: 5,
    valueRange: 0
  };
  userFunction.renderer = new FractalRenderer(body, 100, 100, globals);
  
  userFunction._emit('change');
}

const DEFAULT_FUNCTION_BODY = `
vec2 fun(vec2 complex) {
  return complex;
}
`;
code.text(DEFAULT_FUNCTION_BODY);
const DEFAULT_EXPRESSION_BODY = '(c^10 - c)*10';
expression.text(DEFAULT_EXPRESSION_BODY);
updateRenderer(DEFAULT_FUNCTION_BODY);

export default userFunction;
