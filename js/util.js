export function throttle(inner, ms) {
  let isOnDelay = false;
  let throttledCall = null;

  function delay() {
    setTimeout(() => {
      if (throttledCall) {
        inner.apply(throttledCall.savedThis, throttledCall.args);
        throttledCall = null;
        delay();
      } else {
        isOnDelay = false;
      }
    }, ms);
  }

  return function(...args) {
    if (!isOnDelay) {
      inner.apply(this, args);
      isOnDelay = true;
      delay();
    } else {
      throttledCall = { args, savedThis: this };
    }
  }
}

//arr = Uint8Array(8), contains encoded function value at some point
//For details see fragmentShaderSource encode(). There are two sets of ints
//(real and imaginary parts) that follow this structure:
//00eeeeee 00smmmmm 00mmmmmm 00mmmmmm
//01234567 01234567 01234567 01234567
export function decode(arr) {
  const man = arr[3] % 64 + arr[2] % 64 * 64 + ( arr[1] % 32 + 32 ) * 4096;
  const sig = Math.floor( arr[1] / 32 ) >= 1 ? -1 : 1;
  const exp = arr[0] % 64;

  return sig * Math.pow(2, exp - 32) * man/131072;
}

const errorOutput = $('.errorOutput');

export function clearErrorOutput() {
  errorOutput.html('');
}

export function outputError(error) {
  console.log(error);
  let errorMessage = 'Something went wrong: '
  switch (error.name) {
    case 'TypeError':
      errorMessage += 'Looks like you haven\'t returned any result';
    break;
    default:

  }
  errorMessage += '<br><br>Full error:<br>';
  errorMessage += error;
  errorOutput.html(errorMessage);

  throw error;
}

const messageContainer = $('.messages');

export function displayMessage({ icon, text, title, options }) {
  const messageDom = $('<div>', { class: 'message' });

  const iconDom = $('<img>', {
    class: 'icon',
    draggable: 'false',
    src: '/img/messageIcons/' + icon + '.png'
  });
  const iconContainerDom = $('<div>', { class: 'iconContainer' });
  const textContainerDom = $('<div>', { class: 'textContainer' });
  const titleDom = $('<h3>', { class: 'title' }).text(title);
  const textDom = $('<p>', { class: 'text' }).text(text);

  const optionsContainerDom = $('<div>', { class: 'optionsContainer' });
  const removeThisMessage = () => messageDom.remove();
  addOption({ name: 'Ok' }, optionsContainerDom, removeThisMessage);
  if (options) {
    for (const id in options) {
      addOption(options[id], optionsContainerDom, removeThisMessage)
    }
  }

  const closeButtonDom = $('<div>', {
    class: 'closeButton',
    click: removeThisMessage
  });

  iconContainerDom.append(iconDom);
  textContainerDom.append(
    titleDom,
    textDom,
    optionsContainerDom
  );

  messageDom.append(
    iconContainerDom,
    textContainerDom,
    closeButtonDom
  );
  messageContainer.append(messageDom);
}

function addOption(option, container, removeHandler) {
  const optionDom = $('<div>', {
    class: 'option',
    text: option.name,
    click: option.handler
  });
  optionDom.click(removeHandler);

  container.append(optionDom);
}
