mikrom.component('.field[cms-multiple]', (el) => {
  var addButton = el.querySelector('.js-add-multiple-field');
  var template = el.querySelector('.field__template').children[0];
  var fieldContainer = el.querySelector('.field__input');

  addButton.addEventListener('click', function() {
    var newTemplate = template.cloneNode(true);
    fieldContainer.appendChild(newTemplate);
    
    mikrom.init();
  })
});
