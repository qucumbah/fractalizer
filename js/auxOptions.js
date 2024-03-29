import EventEmitter from './EventEmitter.js';
import Slider from './Slider.js';
import ScaleSlider from './ScaleSlider.js';
import modal from './modal.js';
import {outputError} from './util.js';
import {getGLSLFromExpression} from './expressionParser.js';

const content = $('.content');
const container = $('.container');

const DEFAULT_CODE_BODY = `
vec2 fun(vec2 c) {
  vec2 temp1 = powComplex(c, vec2(10, 0));
  vec2 temp2 = sub(temp1, c);
  vec2 temp3 = mul(temp2, vec2(10, 0));
  return temp3;
}
`;
const DEFAULT_EXPRESSION_BODY = '(c^10 - c)*10';

class AuxOptions extends EventEmitter {
  constructor() {
    super();
    this.fastMode = false;
    this.scale = 200;
    this.contentScaleFactor = 1;
    this.saturationRange = 0.5;
    this.valueRange = 0;
    this.viewportCenter = {
      x: container.width() / 2,
      y: container.height() / 2,
    };
    this.contentPosition = this.viewportCenter;
    this.body = DEFAULT_CODE_BODY;
    this.expressionBody = DEFAULT_EXPRESSION_BODY;
    this.codeBody = DEFAULT_CODE_BODY;
    this.mode = 'expression';
    this.rerender = false;
  }

  update(newOptions) {
    for (let key in newOptions) {
      if (newOptions[key] !== undefined) {
        this[key] = newOptions[key];
      }
    }

    this._emit('change', this);
  }
}

const auxOptions = new AuxOptions();

/*
const scaleSlider = $('#scaleSlider');
const saturationRangeSlider = $('#saturationRangeSlider');
const valueRangeSlider = $('#valueRangeSlider');

const scaleSlider = new Slider('scaleSlider', auxOptions.scale, 100, 300);
const saturationRangeSlider = new Slider('saturationRangeSlider');
const valueRangeSlider = new Slider('valueRangeSlider');
*/
const scaleSlider = new ScaleSlider({
  className: 'scaleSlider',
  value: auxOptions.scale,
  min: auxOptions.scale - 100,
  max: auxOptions.scale + 100,
  lowerBound: 1,
});
const saturationRangeSlider = new Slider({
  className: 'saturationRangeSlider',
  value: auxOptions.saturationRange,
  min: 0,
  max: 5,
  lowerBound: 0,
});
const valueRangeSlider = new Slider({
  className: 'valueRangeSlider',
  value: auxOptions.valueRange,
  min: 0,
  max: 5,
  lowerBound: 0,
});

let fakeScale = auxOptions.scale;
let initialScale = auxOptions.scale;

function setFakeScale(amount, mouseOffset) {
  if (amount <= 1) {
    return;
  }

  setNeedsRerun(true);

  if (!initialScale) {
    initialScale = auxOptions.scale;
  }

  const oldScaleFactor = fakeScale / initialScale;
  fakeScale = amount;
  const newScaleFactor = fakeScale / initialScale;

  auxOptions.update({ contentScaleFactor: newScaleFactor });

  //Center of scaling should stay in place
  const centerOfScalingOffset = mouseOffset?mouseOffset:{
    x: container.width() / 2,
    y: container.height() / 2
  };
  const contentOffset = auxOptions.contentPosition;

  const f = newScaleFactor / oldScaleFactor;
  const changeX = (contentOffset.x - centerOfScalingOffset.x) * (f-1);
  const changeY = (contentOffset.y - centerOfScalingOffset.y) * (f-1);

  const contentPosition = {
    x: contentOffset.x + changeX,
    y: contentOffset.y + changeY
  };
  auxOptions.update({ contentPosition });
  content.css('transform', 'scale(' + newScaleFactor + ')');
}

scaleSlider.on('input', event => {
  setFakeScale( scaleSlider.actualVal() );
});
scaleSlider.on('change', event => {
  auxOptions.update({ scale: fakeScale });
});

const DEFAULT_AMOUNT = 1.1;
function zoomIn(mouseOffset) {
  setFakeScale(fakeScale * DEFAULT_AMOUNT, mouseOffset);

  scaleSlider.val(fakeScale);
}
function zoomOut(mouseOffset) {
  setFakeScale(fakeScale / DEFAULT_AMOUNT, mouseOffset);

  scaleSlider.val(fakeScale);
}

$('.container').on('wheel', event => {
  const amount = event.originalEvent.deltaY;

  const mouseOffset = {
    y: container.height() - event.offsetY,
    x: event.offsetX
  }

  if (amount>0) {
    zoomOut(mouseOffset);
  } else {
    zoomIn(mouseOffset);
  }
});

const zoomInButton = $('.zoomInButton');
const zoomOutButton = $('.zoomOutButton');

zoomInButton.on('click', () => zoomIn());
zoomOutButton.on('click', () => zoomOut());

let pinchScaleStart;

$('.container').on('_pinchstart', event => {
  pinchScaleStart = fakeScale;
});

$('.container').on('_pinchchange', event => {
  setFakeScale(event.scale * pinchScaleStart);
});

$('.container').on('_pinchend', event => {
  scaleSlider.val(fakeScale);
});

saturationRangeSlider.on('change', function() {
  auxOptions.update({ saturationRange: saturationRangeSlider.val() });
});
valueRangeSlider.on('change', function() {
  auxOptions.update({ valueRange: valueRangeSlider.val() });
});

const navigateButton = $('.navigateButton');
navigateButton.on('click', ()=>showNavigateModal());

function showNavigateModal() {
  const modalContent = [];

  const real = $('<div>');
  const realName = $('<div>', {class: 'name', text: 'Real:'});
  const realInput = $('<input>');
  real.append(realName);
  real.append(realInput);

  const imag = $('<div>');
  const imagName = $('<div>', {class: 'name', text: 'Imaginary:'});
  const imagInput = $('<input>');
  imag.append(imagName);
  imag.append(imagInput);

  modalContent.push(real, imag);

  modal.setTitle('Go to position');
  modal.setContent(modalContent);

  modal.off('cancel');
  modal.off('submit');

  modal.on('cancel', () => modal.hide());
  modal.on('submit', () => {
    const x = parseFloat( realInput.val() );
    const y = parseFloat( imagInput.val() );
    if ( isNaN(x) || isNaN(y) ) {
      const newModalContent = [];
      const error = $('<div>', {
        class: 'error',
        text: 'Please enter valid numbers'
      });
      newModalContent.push(real, imag, error);
      modal.setContent(newModalContent);
      return;
    }
    modal.hide();
    setContentPosition(x, y);
  });

  modal.show();
}

function setContentPosition(x, y) {
  const contentPosition = {
    x: x * -auxOptions.scale,
    y: y * -auxOptions.scale
  };
  auxOptions.update({ contentPosition });
}

const panel = $('.panel');
const expression = $('.expression');
const code = $('.code');

const expressionButton = $('.expressionButton');
const codeButton = $('.codeButton');
expressionButton.click(()=>setMode('expression'));
codeButton.click(()=>setMode('code'));

function setMode(newMode) {
  auxOptions.mode = newMode;
  const className = 'panel --' + auxOptions.mode + 'Mode';
  panel.attr('class', className)
}

const codeRunButton = $('.codeRunButton');
const expressionRunButton = $('.expressionRunButton');

codeRunButton.click(function() {
  const body = $('.code').get(0).value;

  try {
	auxOptions.update({
    body,
    codeBody: body,
    contentScaleFactor: 1,
    scale: fakeScale,
    rerender: true
  });

  initialScale = 0;
  setNeedsRerun(false);
  } catch (error) {
    outputError(error);
  }
});

expressionRunButton.click(function() {
  const currentExpression = $('.expression').get(0).value;

  try {
    const body = getGLSLFromExpression(currentExpression);
    auxOptions.update({
      body,
      expressionBody: currentExpression,
      contentScaleFactor: 1,
      scale: fakeScale,
      rerender: true
    });

    initialScale = 0;
    setNeedsRerun(false);
  } catch (error) {
    outputError(error);
  }
});
$('.expressionCopyCodeButton').click(function() {
  const currentExpression = $('.expression').get(0).value;
  const currentFunctionBody = getGLSLFromExpression(currentExpression);

  navigator.clipboard.writeText(currentFunctionBody);
});

const fastRunButton = $('.fastRunButton');
fastRunButton.click(fastRun);

//This is set to true after any scale change; changes back to false after
//codeRunButton or expressionRunButton get pressed
let scaleChanged = false;
function setNeedsRerun(value) {
  scaleChanged = value;
  if (!value) {
    fastRunButton.removeClass('--needsRerun');
  } else {
    fastRunButton.addClass('--needsRerun');
  }
}

function fastRun() {
  if (!scaleChanged) {
    return;
  }

  if (auxOptions.mode === 'expression') {
    expressionRunButton.trigger('click');
  } else {
    codeRunButton.trigger('click');
  }
}

auxOptions.on('change', event => {
  expression.val(event.expressionBody);
  code.text(event.codeBody);
});

expression.text(DEFAULT_EXPRESSION_BODY);
code.text(DEFAULT_CODE_BODY);

export default auxOptions;
