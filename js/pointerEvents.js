const container = $('.container');

let pointers = [];

function getMultitouchCenter() {
  let x = 0;
  let y = 0;

  pointers.forEach(pointer => {
    x += pointer.clientX;
    y += pointer.clientY;
  });

  x /= pointers.length;
  y /= pointers.length;

  return {x, y};
}

//Assumes there are only 2 touches
function getDistance() {
  let dx = pointers[1].clientX - pointers[0].clientX;
  let dy = pointers[1].clientY - pointers[0].clientY;

  return dx*dx + dy*dy;
}

container.on('_rawpointerdown', event => {
  //Add event to list
  pointers.push(event);

  triggerPointerEvent('_pointerdown');

  if (pointers.length === 2) {
    startPinch();
  }
});

container.on('_rawpointerup', event => {
  if (pointers.length === 2) {
    stopPinch();
  }

  triggerPointerEvent('_pointerup');

  //Remove event from list
  pointers = pointers.filter(pointer => event.pointerId !== pointer.pointerId);
});

container.on('_rawpointermove', event => {
  //Update corresponding pointer from list
  pointers = pointers.map(
      pointer => (event.pointerId === pointer.pointerId) ? event : pointer);

  triggerPointerEvent('_pointermove');

  if (pointers.length === 2) {
    changePinch();
  }
});

function triggerPointerEvent(eventName) {
  const multitouchCenter = getMultitouchCenter();
  container.trigger({
    type: eventName,
    clientX: multitouchCenter.x,
    clientY: multitouchCenter.y
  });
}

let pinchDistanceStart;

function startPinch() {
  pinchDistanceStart = getDistance();

  container.trigger({
    type: '_pinchstart',
    distance: pinchDistanceStart,
    scale: 1
  });
}

function stopPinch() {
  const currentDistance = getDistance();
  container.trigger({
    type: '_pinchstop',
    distance: currentDistance,
    scale: currentDistance/pinchDistanceStart
  });
}

function changePinch() {
  const currentDistance = getDistance();
  container.trigger({
    type: '_pinchchange',
    distance: currentDistance,
    scale: currentDistance/pinchDistanceStart
  });
}

//Had to implement my own pointer events because default browser events wouldn't
//work on mobile. Stackoverflow didn't help me:
//https://stackoverflow.com/questions/58068148/pointer-events-dont-work-correctly-on-mobile

container.on('mousedown', event => {
  container.trigger({
    type: '_rawpointerdown',
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: -1,
    originalEvent: event
  });
});

container.on('mouseup', event => {
  container.trigger({
    type: '_rawpointerup',
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: -1,
    originalEvent: event
  });
});

container.on('mousemove', event => {
  container.trigger({
    type: '_rawpointermove',
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: -1,
    originalEvent: event
  });
});

container.on('touchstart', event => {
  const startedTouch = event.changedTouches[0];
  container.trigger({
    type: '_rawpointerdown',
    clientX: startedTouch.clientX,
    clientY: startedTouch.clientY,
    pointerId: startedTouch.identifier,
    originalEvent: event
  });
});

container.on('touchend touchcancel', event => {
  const endedTouch = event.changedTouches[0];
  container.trigger({
    type: '_rawpointerup',
    pointerId: endedTouch.identifier,
    originalEvent: event
  });
});

container.on('touchmove', event => {
  const movedTouch = event.changedTouches[0];
  container.trigger({
    type: '_rawpointermove',
    clientX: movedTouch.clientX,
    clientY: movedTouch.clientY,
    pointerId: movedTouch.identifier,
    originalEvent: event
  });
});

//container.on('_pinchstart _pinchstop _pinchchange', console.log);
