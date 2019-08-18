if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(registration => console.log(registration))
      .catch(error => console.log(error))
  });
}
