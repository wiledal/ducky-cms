var fieldMultiples = [].slice.call(document.querySelectorAll('.field[cms-multiple]'));

fieldMultiples.forEach(function(f) {
  var addButton = f.querySelector('.js-add-multiple-field');

  var template = f.querySelector('.field__template').children[0];
  var fieldContainer = f.querySelector('.field__input');

  function removeMultipleField() {
    this.parentNode.parentNode.removeChild(this.parentNode);
  }

  function bindRemoveInput() {
    var inputs = [].slice.call(fieldContainer.querySelectorAll(".input"));

    inputs.forEach(function(input) {
      var b = input.querySelector('.js-remove-multiple-field');
      b.removeEventListener('click', removeMultipleField);
      b.addEventListener('click', removeMultipleField);
    });
  }

  addButton.addEventListener('click', function() {
    var newTemplate = template.cloneNode(true);
    fieldContainer.appendChild(newTemplate);
    bindRemoveInput();
    initSelectAssetButtons();
  })

  bindRemoveInput();
})
