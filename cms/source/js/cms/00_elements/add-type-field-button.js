mikrom.component('.js-add-new-type-field', (el) => {
  el.addEventListener('click', () => {
    var template = document.querySelector('script[type="text/template"][name="type-field"]').innerHTML;
    var fieldsContainer = document.querySelector('.fields');
    var dummy = document.createElement('div');
    dummy.innerHTML = template;

    fieldsContainer.appendChild(dummy.children[0]);

    mikrom.init();
  })
})
