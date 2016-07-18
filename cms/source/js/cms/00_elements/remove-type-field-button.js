mikrom.component('.js-remove-type-field', (el) => {
  el.addEventListener('click', () => {
    var container = el.parentNode.parentNode;
    container.parentNode.removeChild(container);
  });
})
