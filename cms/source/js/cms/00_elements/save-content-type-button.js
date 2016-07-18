mikrom.component('.js-save-content-type', (el) => {
  el.addEventListener('click', function() {
    var typeFields = [].slice.call(document.querySelectorAll('.type-field'));

    var data = {
      _name: document.querySelector('.field[cms-name="_name"] input').value,
      _defaultTemplate: document.querySelector('.field[cms-name="_defaultTemplate"] select').value,
      fields: []
    };

    typeFields.forEach(function(f) {
      var fieldName = f.querySelector('input[name="name"]').value;
      var fieldType = f.querySelector('select[name="type"]').value;
      var multiple = f.querySelector('input[name="multiple"]').checked;

      data.fields.push({
        name: fieldName,
        type: fieldType,
        multiple: multiple
      })
    });

    var url = contentType._id ? '/admin/content-type/' + contentType._id : '/admin/content-type';
    var method = contentType._id ? 'PUT' : 'POST';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(JSON.stringify(data));

    xhr.onload = function() {
      location.href = '/admin/content-types/';
    }
  });
})
