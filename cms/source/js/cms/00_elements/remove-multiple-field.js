mikrom.component('.js-remove-multiple-field', (el) => {
  el.addEventListener('click', () => {
    el.parentNode.parentNode.removeChild(el.parentNode);
  });
})
