import Complex from './Complex.js';
import userFunction from './userFunction.js';
import {hsvToRgb, outputError, clearErrorOutput} from './util.js';

userFunction.on('change', rerender);

const container = $('.container');
const content = $('.content');
//Center on start
content.css('left', (container.width()-$('.panel').width())/2 + 'px');
content.css('bottom', (container.height()/2) + 'px');

container.on('mousedown', startDrag);
container.on('mouseup', stopDrag);
container.on('mousemove', drag);
container.on('wheel', function(event) {
  const SCROLL_MULTIPLIER = 0.5;

  const amount = event.originalEvent.deltaY;

  if (amount>0) {
    changeScale(SCROLL_MULTIPLIER);
  } else {
    changeScale(1 / SCROLL_MULTIPLIER);
  }
});

let isDragging;
let dragStartX;
let dragStartY;
let contentStartX;
let contentStartY;
let contentCurrentX = parseInt(content.css('left'));
let contentCurrentY = parseInt(content.css('bottom'));
function drag(event) {
  //updateFunctionValue(event);

  if (isDragging) {
    contentCurrentX = contentStartX+event.clientX-dragStartX;
    contentCurrentY = contentStartY-event.clientY+dragStartY;

    content.css('left', contentCurrentX + 'px');
    content.css('bottom', contentCurrentY + 'px');

    updateScreen();
  }
}

function startDrag(event) {
  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  contentStartX = parseInt(content.css('left'));
  contentStartY = parseInt(content.css('bottom'));
}
function stopDrag() {
  isDragging = false;
}

let scale = 200;
function changeScale(amount) {
  console.log(scale, 1/scale);
  scale*=amount;
  rerender();
}
/*
function updateFunctionValue(event) {
  let inputX = (-contentCurrentX+event.clientX)/scale;
  let inputY = (-contentCurrentY+(container.height()-event.clientY))/scale;

  const c = new Complex({x: inputX, y: inputY});
  let {x: resultX, y: resultY} = userFunction.evaluate(Complex, c);

  //Trim result
  inputX = inputX.toFixed(2);
  inputY = inputY.toFixed(2);
  resultX = resultX.toFixed(2);
  resultY = resultY.toFixed(2);

  const output = `f(${inputX}, ${inputY}) = (${resultX}, ${resultY})`;
  
  $('.functionValue').text(output);
}
*/
function rerender() {
  clearRenderedBlocks();
  clearErrorOutput();
  updateScreen();
}

const screenWidth = container.width();
const screenHeight = container.height();
const imageWidth = 100;
const imageHeight = 100;
let renderedBlocks = [];
function updateScreen() {
  const screenBottomLeft = {
    x: -contentCurrentX,
    y: -contentCurrentY
  };
  const screenTopRight = {
    x: -contentCurrentX + screenWidth,
    y: -contentCurrentY + screenHeight
  }

  const bottomLeftSquare = getSquare(screenBottomLeft);
  const topRightSquare = getSquare(screenTopRight);
  for (let x = bottomLeftSquare.x; x<=topRightSquare.x; x++) {
    for (let y = bottomLeftSquare.y; y<=topRightSquare.y; y++) {
      if (!isRendered(x, y)) {
        try {
          renderBlock(x, y);
        } catch (error) {
          outputError(error);
        }
      }
    }
  }
}

function clearRenderedBlocks() {
  renderedBlocks.forEach(block => URL.revokeObjectURL(block.object));
  renderedBlocks = [];
}

function getSquare({ x, y }) {
  return {
    x: Math.floor(x/imageWidth),
    y: Math.floor(y/imageHeight)
  };
}

function isRendered(x, y) {
  return renderedBlocks.some(block => block.x===x && block.y===y);
}
let first = 1;
//See sketch 1
function renderBlock(x, y) {
  const block = { x, y }
  renderedBlocks.push(block);
  
  if (first) {
    console.log(x, y);
    first = 0;
  }
  
  try {
    const domImg = userFunction.renderer.getImage(x * imageWidth, y * imageHeight);
    const img = $(domImg);
    img.toggleClass('block');
    
    img.css({
      left: x*imageWidth,
      bottom: y*imageHeight,
      width: imageWidth+'px',
      height: imageHeight+1+'px' //Fix 1px gap between images
    });
    content.append(img);
  } catch (e) {
    outputError(e);
  }
  /*
  generateImage(x*imageWidth, y*imageHeight)
    .then(blob => {
      const img = $('<img>', {
        src: URL.createObjectURL(blob),
        class: 'block'
      });

      img.css({
        left: x*imageWidth,
        bottom: y*imageHeight,
        width: imageWidth+'px',
        height: imageHeight+1+'px' //Fix 1px gap between images
      });

      content.append(img);
      block.object = blob;
    })
    .catch(outputError);
    */
}

updateScreen();
