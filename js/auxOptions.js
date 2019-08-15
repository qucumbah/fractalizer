const auxOptions = {
  _listeners: {},
  
  fastMode: false,
  scale: 200,
  contentScaleFactor: 1,
  saturationRange: 5,
  valueRange: 0,
  
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
        contentScaleFactor?contentScaleFactor:this.contentScaleFactor;
    this.saturationRange =
        saturationRange?saturationRange:this.saturationRange;
    this.valueRange =
        valueRange?valueRange:this.valueRange;
    
    this._emit('change', this);
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
}

const content = $('.content');
const container = $('.container');
const runButtons = $('.runButton');
const fastModeCheckbox = $('#fastModeCheckbox');
const scaleSlider = $('#scaleSlider');
const saturationRangeSlider = $('#saturationRangeSlider');
const valueRangeSlider = $('#valueRangeSlider');

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
  
  /*
  const transforms = [];
  */
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

function getContentOffset() {
  
}

runButtons.on('click', event => {
  initialScale = 0;
  if (!auxOptions.fastMode) {
    auxOptions.update({ contentScaleFactor: 1 });
  }
});

scaleSlider.on('input', event => {
  const change = (event.target.value - 50) * 5;
  setFakeScale(auxOptions.scale + change);
});
scaleSlider.on('change', event => {
  scaleSlider.val(50);
  setActualScale();
});
$('.container').on('wheel', event => {
  const DEFAULT_AMOUNT = 10;
  
  const amount = event.originalEvent.deltaY;
  
  const mouseOffset = {
    bottom: container.height() - event.offsetY,
    left: event.offsetX
  }
  
  if (amount>0) {
    setFakeScale(fakeScale - DEFAULT_AMOUNT, mouseOffset);
  } else {
    setFakeScale(fakeScale + DEFAULT_AMOUNT, mouseOffset);
  }
  setActualScale();
});

saturationRangeSlider.on('change', function() {
  auxOptions.update({ saturationRange: saturationRangeSlider.val() });
});
saturationRangeSlider.val(auxOptions.saturationRange);

valueRangeSlider.on('change', function() {
  auxOptions.update({ valueRange: valueRangeSlider.val() });
});
valueRangeSlider.val(auxOptions.valueRange);

export default auxOptions;