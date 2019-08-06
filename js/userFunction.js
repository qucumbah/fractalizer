import Complex from './Complex.js';
import {getJSFromExpression} from './expressionParser.js';
import {outputError} from './util.js';

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

  updateFunctionBody(currentFunctionBody);
});

$('.expressionRunButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  try {
    const currentFunctionBody = getJSFromExpression(currentExpression);
    updateFunctionBody(currentFunctionBody);
  } catch (error) {
    outputError(error);
  }
});
$('.expressionCopyCodeButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  const currentFunctionBody = getJSFromExpression(currentExpression);

  navigator.clipboard.writeText(currentFunctionBody);
});

function updateFunctionBody(body) {
  userFunction.evaluate = new Function('Complex', 'c', body);
  console.log(userFunction.evaluate);
  userFunction._emit('change');
}

const DEFAULT_FUNCTION_BODY = `
return c
  .pow({x: 10, y: 0})
  .sub(c)
  .mul({x: 10, y: 0});
`;
code.text(DEFAULT_FUNCTION_BODY);
const DEFAULT_EXPRESSION_BODY = '(c^10 - c)*10';
expression.text(DEFAULT_EXPRESSION_BODY);
updateFunctionBody(DEFAULT_FUNCTION_BODY);

export default userFunction;
