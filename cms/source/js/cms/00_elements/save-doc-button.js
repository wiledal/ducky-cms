mikrom.component('.js-save-doc', (el) => {
  el.addEventListener('click', function() {
    var fields = [].slice.call(document.querySelectorAll('.field'));

    var data = {};

    fields.forEach(function(f) {
      var multiple = f.getAttribute('cms-multiple') != undefined;
      var name = f.getAttribute('cms-name');
      var type = f.getAttribute('cms-type');

      if (name[0] != "_") name = cmsHelpers.toCamelCase(name);

      if (multiple) {
        data[name] = [];

        switch(type) {
          case 'asset':
          case 'text':
            var inputs = [].slice.call(f.querySelectorAll('.field__input input'));
            inputs.forEach(function(input) {
              data[name].push(input.value);
            });
          break;
          case 'textarea':
            var inputs = [].slice.call(f.querySelectorAll('.field__input textarea'));
            inputs.forEach(function(input) {
              data[name].push(input.value);
            });
          break;
          case 'markdown':
            var inputs = [].slice.call(f.querySelectorAll('.field__input textarea'));
            inputs.forEach(function(input) {
              data[name].push(input.mde.value());
            });
          break;
        }
      }else{
        switch(type) {
          case 'asset':
          case 'text':
            var input = f.querySelector('input');
            data[name] = input.value;
          break;
          case 'textarea':
            var input = f.querySelector('textarea');
            data[name] = input.value;
          break;
          case 'markdown':
            var input = f.querySelector('textarea');
            data[name] = input.mde.value();
          break;
          case 'select':
            var input = f.querySelector('select');
            data[name] = input.value;
          break;
        }
      }
    });

    var url = doc._id ? '/admin/doc/' + doc._id : '/admin/doc';
    var method = doc._id ? 'PUT' : 'POST';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));

    xhr.onload = function() {
      location.href = '/admin/content/' + contentType._slug;
    }
  });
})
