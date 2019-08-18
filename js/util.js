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
