import auxOptions from './auxOptions.js';
import userFunction from './userFunction.js';
import {wait} from './util.js';

console.log(userFunction);

let lastSavedState = {};
window.addEventListener('popstate', event => {
  if (event.state === null) {
    return;
  }

  lastSavedState = event.state;
  auxOptions.update(event.state, true);
});

auxOptions.on('change', wait(saveHistory, 1000));

function saveHistory() {
  const savedState = {};
  let changed = false;
  for (let key in auxOptions) {
    if (!key.startsWith('_')) {
      savedState[key] = auxOptions[key];
      if (savedState[key] !== lastSavedState[key]) {
        changed = true;
      }
    }
  }

  if (!changed) {
    return;
  }

  history.pushState(savedState, 'Fractalizer');
}
