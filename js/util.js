export function hsvToRgb(h, s, v) {
  const hi = Math.floor((h/60)%6);
  const vMin = (100-s)*v/100;
  const a = (v-vMin)*(h%60)/60;
  const vInc = vMin+a;
  const vDec = v-a;

  let r, g, b;
  switch (hi) {
    case 0:
      r = v;
      g = vInc;
      b = vMin;
    break;
    case 1:
      r = vDec;
      g = v;
      b = vMin;
    break;
    case 2:
      r = vMin;
      g = v;
      b = vInc;
    break;
    case 3:
      r = vMin;
      g = vDec;
      b = v;
    break;
    case 4:
      r = vInc;
      g = vMin;
      b = v;
    break;
    case 5:
      r = v;
      g = vMin;
      b = vDec;
    break;
  }

  return {r, g, b};
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
