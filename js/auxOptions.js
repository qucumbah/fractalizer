import EventEmitter from './EventEmitter.js';
import Slider from './Slider.js';
import ScaleSlider from './ScaleSlider.js';
import modal from './modal.js';

const content = $('.content');
const container = $('.container');

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
  }

  update({
    fastMode,
    scale,
    contentScaleFactor,
    saturationRange,
    valueRange,
    viewportCenter,
    contentPosition
  }) {
    //console.log(this);
    this.fastMode = (fastMode!==undefined)?fastMode:this.fastMode;
    this.scale = scale?scale:this.scale;
    this.contentScaleFactor =
        (contentScaleFactor!==undefined)?contentScaleFactor:this.contentScaleFactor;
    this.saturationRange =
        (saturationRange!==undefined)?saturationRange:this.saturationRange;
    this.valueRange =
        (valueRange!==undefined)?valueRange:this.valueRange;
    this.viewportCenter = viewportCenter?viewportCenter:this.viewportCenter;
    this.contentPosition = contentPosition?contentPosition:this.contentPosition;

    this._emit('change', this);
  }
}

const auxOptions = new AuxOptions();

const runButtons = $('.runButton');
const fastModeCheckbox = $('.fastModeCheckbox');
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

fastModeCheckbox.on('change', function(event) {
  const fastMode = fastModeCheckbox.is(':checked');
  auxOptions.update({ fastMode });
});

let fakeScale = auxOptions.scale;
let initialScale = auxOptions.scale;

function setFakeScale(amount, mouseOffset) {
  if (amount <= 0) {
    return;
  }

  if (!initialScale) {
    initialScale = auxOptions.scale;
  }

  const oldScaleFactor = fakeScale / initialScale;
  fakeScale = amount;
  const newScaleFactor = fakeScale / initialScale;

  if (!auxOptions.fastMode) {
    auxOptions.update({ contentScaleFactor: newScaleFactor });
  }

  //Center of scaling should stay in place
  const centerOfScalingOffset = mouseOffset?mouseOffset:{
    x: container.width() / 2,
    y: container.height() / 2
  };
  const contentOffset = auxOptions.contentPosition;

  const f = newScaleFactor / oldScaleFactor;
  const changeX = (contentOffset.x - centerOfScalingOffset.x) * (f-1);
  const changeY = (contentOffset.y - centerOfScalingOffset.y) * (f-1);

  //change = (content - centerOfScaling) * newScaleFactor / oldScaleFactor;
  //console.log(f, centerOfScalingOffset, contentOffset, changeBottom, changeLeft);
  const contentPosition = {
    x: contentOffset.x + changeX,
    y: contentOffset.y + changeY
  };
  auxOptions.update({ contentPosition });
  content.css('transform', 'scale(' + newScaleFactor + ')');
  //console.log(content.css());
}

function setActualScale() {
  auxOptions.update({ scale: fakeScale });
  if (auxOptions.fastMode) {
    initialScale = 0;
  }
}

runButtons.on('click', event => {
  initialScale = 0;
  if (!auxOptions.fastMode) {
    auxOptions.update({ contentScaleFactor: 1 });
  }
});

scaleSlider.on('input', event => {
  setFakeScale( scaleSlider.actualVal() );
});
scaleSlider.on('change', event => {
  setActualScale();
});

const DEFAULT_AMOUNT = 1.1;
function zoomIn(mouseOffset) {
  setFakeScale(fakeScale * DEFAULT_AMOUNT, mouseOffset);

  scaleSlider.val(fakeScale);
  setActualScale();
}
function zoomOut(mouseOffset) {
  setFakeScale(fakeScale / DEFAULT_AMOUNT, mouseOffset);

  scaleSlider.val(fakeScale);
  setActualScale();
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

export default auxOptions;
