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
  updateFunctionValue(event);

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

function rerender() {
  clearRenderedBlocks();
  clearErrorOutput();
  updateScreen();
}

const screenWidth = container.width();
const screenHeight = container.height();
const imageWidth = 200;
const imageHeight = 200;
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

//See sketch 1
function renderBlock(x, y) {
  const block = { x, y }
  renderedBlocks.push(block);

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
}

async function generateImage(offsetX, offsetY) {
  //We need to store (r,g,b,a) data for each pixel of the image
  //Each value needs 1 byte, so in the end we have width*height*4 bytes
  const start = Date.now();
  const data = new Uint8ClampedArray(imageWidth*imageHeight*4);

  for (let y = 0; y<imageHeight; y++) {
    for (let x = 0; x<imageWidth; x++) {
      //We need to flip the image because image coordinates go down-right, but
      //cartesian coordinates go up-right
      let {r, g, b} = getRgbAt(offsetX + x, offsetY + (imageHeight - y));

      r = Math.floor(r*255/100);
      g = Math.floor(g*255/100);
      b = Math.floor(b*255/100);

      const dataOffset = 4*(y*imageWidth+x);

      data[dataOffset+0] = r;
      data[dataOffset+1] = g;
      data[dataOffset+2] = b;
      data[dataOffset+3] = 255; //alpha
    }
  }

  const imageData = new ImageData(data, imageWidth, imageHeight);
  const blob = await imageDataToBlob(imageData);

  const end = Date.now();
  //console.log(end-start);
  return blob;
}

function getRgbAt(x, y) {
  const c = new Complex({x, y}).mul({ x: 1/scale, y: 0 });

  const polar = userFunction.evaluate(Complex, c).asPolar();
  return hsvToRgb(
    polar.a/Math.PI * 180,
    // 0.71>sqrt(2)/2, max distance from origin<width*0.71
    polar.r/(imageWidth*0.71/imageHeight)*100,
    100
  );
}

function imageDataToBlob(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageWidth;
  canvas.height = imageHeight

  canvas.getContext('2d').putImageData(imageData, 0, 0); //

  return new Promise(resolve => canvas.toBlob(resolve));
}

updateScreen();
