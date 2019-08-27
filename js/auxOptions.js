import EventEmitter from './EventEmitter.js';
import Slider from './Slider.js';
import ScaleSlider from './ScaleSlider.js';

class AuxOptions extends EventEmitter {
  constructor() {
    super();
    this.fastMode = false;
    this.scale = 200;
    this.contentScaleFactor = 1;
    this.saturationRange = 0.5;
    this.valueRange = 0;
  }

  update({
    fastMode,
    scale,
    contentScaleFactor,
    saturationRange,
    valueRange
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

    this._emit('change', this);
  }
}

const auxOptions = new AuxOptions();

const content = $('.content');
const container = $('.container');
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
    bottom: container.height() / 2,
    left: container.width() / 2
  };
  const contentOffset = {
    bottom: parseFloat(content.css('bottom')),
    left: parseFloat(content.css('left'))
  };

  const f = newScaleFactor / oldScaleFactor;
  const changeBottom =
      (contentOffset.bottom - centerOfScalingOffset.bottom) * (f-1);
  const changeLeft =
      (contentOffset.left - centerOfScalingOffset.left) * (f-1);

  //change = (content - centerOfScaling) * newScaleFactor / oldScaleFactor;
  //console.log(f, centerOfScalingOffset, contentOffset, changeBottom, changeLeft);
  content.css({
    bottom: contentOffset.bottom + changeBottom,
    left: contentOffset.left + changeLeft,
    transform: 'scale(' + newScaleFactor + ')'
  });
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
$('.container').on('wheel', event => {
  const DEFAULT_AMOUNT = 1.1;

  const amount = event.originalEvent.deltaY;

  const mouseOffset = {
    bottom: container.height() - event.offsetY,
    left: event.offsetX
  }

  if (amount>0) {
    setFakeScale(fakeScale / DEFAULT_AMOUNT, mouseOffset);
  } else {
    setFakeScale(fakeScale * DEFAULT_AMOUNT, mouseOffset);
  }

  scaleSlider.val(fakeScale);
  //setActualScale();
});

saturationRangeSlider.on('change', function() {
  auxOptions.update({ saturationRange: saturationRangeSlider.val() });
});
valueRangeSlider.on('change', function() {
  auxOptions.update({ valueRange: valueRangeSlider.val() });
});

export default auxOptions;
