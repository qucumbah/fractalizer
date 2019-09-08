import userFunction from './userFunction.js';
import auxOptions from './auxOptions.js';
import {outputError, clearErrorOutput, displayMessage} from './util.js';

userFunction.on('change', rerender);
auxOptions.on('change', () => {
  updateContentPosition();
  updateScreen();
});

const container = $('.container');
const content = $('.content');

// let currentDragTimer;
function updateContentPosition() {
  // console.log('update');
  content.css('left', auxOptions.contentPosition.x);
  content.css('bottom', auxOptions.contentPosition.y);
  //Drag animation will be done later, right now focus is on other features
  //Standart css transiton and jquery animations cause stutter, so I'll have to
  //write my own implementation, for which I dont have time right now
  /*
  const DURATION = 2000;
  const FRAME_LENGTH = 1000/60; //60 fps
  const newPosition = auxOptions.contentPosition;
  const oldPosition = {
    x: parseFloat( content.css('left') ),
    y: parseFloat( content.css('bottom') )
  }
  const movePerFrame = {
    x: (newPosition.x - oldPosition.x) / DURATION * FRAME_LENGTH,
    y: (newPosition.y - oldPosition.y) / DURATION * FRAME_LENGTH
  }

  function moveTowardsTarget() {
    console.log('moving');
    content.css({
      left: '+=' + movePerFrame.x,
      bottom: '+=' + movePerFrame.y
    });
  }

  moveTowardsTarget();
  if (currentDragTimer) {
    clearTimeout(currentDragTimer);
  }
  currentDragTimer = setTimeout(moveTowardsTarget, FRAME_LENGTH);
  */
}
updateContentPosition();

container.on('mousedown touchstart', startDrag);
container.on('mouseup touchend touchcancel', stopDrag);
container.on('mousemove touchmove', drag);
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
let contentStart; //Position of content on start of drag

function drag(event) {
  let changeX, changeY;

  if (event.type === 'touchmove') {
    changeX = event.changedTouches[0].clientX - dragStartX;
    changeY = event.changedTouches[0].clientY - dragStartY;
  } else {
    changeX = event.clientX - dragStartX;
    changeY = event.clientY - dragStartY;
  }

  if (isDragging) {
    // contentCurrentX = contentStartX + changeX;
    // contentCurrentY = contentStartY - changeY;
    //
    // content.css('left', contentCurrentX);
    // content.css('bottom', contentCurrentY);

    const contentPosition = {
      x: contentStart.x + changeX,
      y: contentStart.y - changeY
    };

    auxOptions.update({ contentPosition });

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
  if (event.type === 'touchstart') {
    dragStartX = event.changedTouches[0].clientX;
    dragStartY = event.changedTouches[0].clientY;
  } else {
    dragStartX = event.clientX;
    dragStartY = event.clientY;
  }

  contentStart = auxOptions.contentPosition;

  // contentStartX = parseInt(content.css('left'));
  // contentStartY = parseInt(content.css('bottom'));
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
    x: ( screenWidth/2 - auxOptions.contentPosition.x ) / scale,
    y: ( screenHeight/2 - auxOptions.contentPosition.y ) / scale
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
  const blocksToRender = [];
  for (let x = bottomLeftSquare.x; x<=topRightSquare.x; x++) {
    for (let y = bottomLeftSquare.y; y<=topRightSquare.y; y++) {
      if (!isRendered(x, y)) {
        blocksToRender.push({x, y});
        // renderBlock(x, y).catch(error => outputError(error));
        // try {
        //   renderBlock(x, y);
        // } catch (error) {
        //   outputError(error);
        // }
      }
    }
  }

  blocksToRender.forEach(block => {
    renderBlock(block.x, block.y).catch(error => outputError(error));
  });
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

//See sketch 1
async function renderBlock(x, y) {
  const block = { x, y }
  renderedBlocks.push(block);

  return userFunction.renderer.getImage(x * imageWidth, y * imageHeight)
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
    });
    // .catch(outputError);
}

/*
displayMessage({
  icon: 'info',
  text: 'aiusdhaiu hsaiduhaskjdh aisduhasdkajs bdasioudhas',
  title: 'Test message'
});
displayMessage({
  icon: 'error',
  text: 'eauoid auiedh iuahediu ahskdj haksdjasuda ksudha ',
  title: 'Error'
});
displayMessage({
  icon: 'warning',
  text: 'iaejdoaeui ajeadhiau haieudhaie uhdaieud haksjdh eiauhda ujhae',
  title: 'Warning',
  options: {
    cancel: {name: 'Cancel', handler: e => console.log('works')}
  }
});
*/

rerender();
