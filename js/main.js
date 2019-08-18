import userFunction from './userFunction.js';
import auxOptions from './auxOptions.js';
import {outputError, clearErrorOutput} from './util.js';

userFunction.on('change', rerender);

const container = $('.container');
const content = $('.content');
//Center on start
//content.css('left', (container.width() - $('.panel').width()) / 2);
content.css('left', container.width() / 2);
content.css('bottom', container.height() / 2);

container.on('mousedown', startDrag);
container.on('mouseup', stopDrag);
container.on('mousemove', drag);
container.on('wheel', resetDragStart);
/*
container.on('wheel', function(event) {
  const SCROLL_MULTIPLIER = 0.5;

  const amount = event.originalEvent.deltaY;

  if (amount>0) {
    changeScale(SCROLL_MULTIPLIER);
  } else {
    changeScale(1 / SCROLL_MULTIPLIER);
  }
});
*/
//Globals are evil, and I'm a friend of the devil
let isDragging;
let dragStartX;
let dragStartY;
let contentStartX;
let contentStartY;
let contentCurrentX;
let contentCurrentY;

function updateContentCurrentPosition() {
  contentCurrentX = parseInt(content.css('left'));
  contentCurrentY = parseInt(content.css('bottom'));
}
updateContentCurrentPosition();

function drag(event) {
  //updateFunctionValue(event);

  if (isDragging) {
    contentCurrentX = contentStartX+event.clientX-dragStartX;
    contentCurrentY = contentStartY-event.clientY+dragStartY;

    content.css('left', contentCurrentX);
    content.css('bottom', contentCurrentY);

    updateScreen();
  }
}

function startDrag(event) {
  isDragging = true;
  resetDragStart(event);
}
function stopDrag() {
  isDragging = false;
}

//Need this to sync plane movement with drag after rescaling it
function resetDragStart(event) {
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  contentStartX = parseInt(content.css('left'));
  contentStartY = parseInt(content.css('bottom'));
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
  content.css('transform', 'scale(1)');

  updateContentCurrentPosition();
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
  /*
  const screenBottomLeft = {
    x: -contentCurrentX,
    y: -contentCurrentY
  };
  const screenTopRight = {
    x: -contentCurrentX + screenWidth,
    y: -contentCurrentY + screenHeight
  };

  console.log(screenBottomLeft, screenTopRight);
  */

  const scale = auxOptions.contentScaleFactor;
  const distanceToCenter = {
    x: ( screenWidth/2 - contentCurrentX ) / scale,
    y: ( screenHeight/2 - contentCurrentY ) / scale
  };

  const screenBottomLeft = {
    x: distanceToCenter.x - screenWidth/2,
    y: distanceToCenter.y - screenHeight/2
  }
  const screenTopRight = {
    x: distanceToCenter.x + screenWidth/2,
    y: distanceToCenter.y + screenHeight/2
  }
  //console.log(contentCurrentX, contentCurrentY, scale, distanceToCenter, screenBottomLeft, screenTopRight);

  const bottomLeftSquare = getSquare(screenBottomLeft);
  const topRightSquare = getSquare(screenTopRight);
  for (let x = bottomLeftSquare.x; x<=topRightSquare.x; x++) {
    for (let y = bottomLeftSquare.y; y<=topRightSquare.y; y++) {
      if (!isRendered(x, y)) {
        //renderBlock(x, y).catch(error => outputError(error));
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
  renderedBlocks.forEach(block => {
    //If there is no object associated with this block then it got deleted
    //before it could finish being rendered. This means that we'll have to
    //delete it as soon as it renders, so we mark it 'dead'
    if (!block.object) {
      block.dead = true;
    } else {
      block.object.remove();
      URL.revokeObjectURL(block.objectURL);
    }
  });
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

function renderBlock(x, y) {
  const block = { x, y }
  renderedBlocks.push(block);

  userFunction.renderer.getImage(x * imageWidth, y * imageHeight)
    .then(blob => {
      //Block has been marked 'dead' in clearRenderedBlocks(), which means that
      //it got deleted while it was rendering. We can't stop render, so the
      //best we can do is to not add it to the dom once its rendering finishes
      if (block.dead) {
        return;
      }
      const objectURL = URL.createObjectURL(blob);

      const img = $('<img>', {
        src: objectURL,
        class: 'block'
      });

      //Add small numbers to fix 1px gap between images
      img.css({
        left: x*imageWidth - 0.5,
        bottom: y*imageHeight - 0.5,
        width: imageWidth + 1,
        height: imageHeight + 1
      });

      content.append(img);
      block.object = img;
      block.objectURL = objectURL;
    })
    .catch(outputError);
}

//See sketch 1
/*
function renderBlock(x, y) {
  const block = { x, y }
  renderedBlocks.push(block);

  try {
    const domImg = userFunction.renderer.getImage(x * imageWidth, y * imageHeight);
    const img = $(domImg);
    img.toggleClass('block');

    //Add small numbers to fix 1px gap between images
    img.css({
      left: x*imageWidth - 0.5,
      bottom: y*imageHeight - 0.5,
      width: imageWidth + 1,
      height: imageHeight + 1
    });
    content.append(img);
    block.object = img;
  } catch (e) {
    outputError(e);
  }
}
*/

rerender();
