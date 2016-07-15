//=require vendor/*.js

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function toCamelCase(string) {
    return string.trim().toLowerCase().replace(/\s/gi, '-').replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
}

function CMS() {
  var saveButtons = [].slice.call(document.querySelectorAll(".js-save-doc"));
  var saveContentTypeButtons = [].slice.call(document.querySelectorAll(".js-save-content-type"));
  var addTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-add-new-type-field"));
  var removeTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-remove-type-field"));

  var surgeDeployButton = document.querySelector(".js-deploy-surge");
  var deleteDocButton = document.querySelector(".js-delete-doc");
  var deleteContentTypeButton = document.querySelector(".js-delete-content-type");

  //=require cms/**/*.js

  var slugger = document.querySelector('.slugger');
  if (slugger) {
    var slugField = document.querySelector('.field[cms-name="_name"] input');
    slugField.addEventListener('input', function() {
      slugger.value = slugify(slugField.value);
    });
  }

  if (deleteDocButton) {
    deleteDocButton.addEventListener('click', function() {
      if (!confirm("Are you sure?")) return;

      var url = '/admin/doc/' + doc._id;
      var method = 'DELETE';

      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = 'json';
      xhr.dataType = 'json';
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        location.href = '/admin/content/' + contentType._slug;
      }

      xhr.send();
    })
  }

  if (deleteContentTypeButton) {
    deleteContentTypeButton.addEventListener('click', function() {
      if (!confirm("Are you sure?")) return;

      var url = '/admin/content-type/' + contentType._id;
      var method = 'DELETE';

      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = 'json';
      xhr.dataType = 'json';
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        location.href = '/admin/content-types/'
      }

      xhr.send();
    })
  }

  saveButtons.forEach(function(b) {
    b.addEventListener('click', function() {
      var fields = [].slice.call(document.querySelectorAll('.field'));

      var data = {};

      fields.forEach(function(f) {
        var multiple = f.getAttribute('cms-multiple') != undefined;
        var name = f.getAttribute('cms-name');
        var type = f.getAttribute('cms-type');

        if (name[0] != "_") name = toCamelCase(name);

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
  });

  saveContentTypeButtons.forEach(function(b) {
    b.addEventListener('click', function() {
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

  function bindTypeFieldEvents() {
    var removeTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-remove-type-field"));

    removeTypeFieldButtons.forEach(function(b) {
      b.addEventListener('click', clickRemoveTypeField);
    });
  }

  function clickAddTypeField() {
    var template = document.querySelector('script[type="text/template"][name="type-field"]').innerHTML;
    var fieldsContainer = document.querySelector('.fields');
    var dummy = document.createElement('div');
    dummy.innerHTML = template;

    fieldsContainer.appendChild(dummy.children[0]);

    bindTypeFieldEvents();
  }
  function clickRemoveTypeField() {
    var container = this.parentNode.parentNode;
    container.parentNode.removeChild(container);
  }

  var addTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-add-new-type-field"));
  addTypeFieldButtons.forEach(function(b) {
    b.addEventListener('click', clickAddTypeField);
  });


  // DEPLOYMENT
  var deploying = false;
  if (surgeDeployButton) {
    surgeDeployButton.addEventListener('click', function() {
      if (deploying || !confirm("Are you sure you want to deploy?")) return false;

      document.querySelector('.console').innerHTML += "<br>Deploying...";
      deploying = true;

      var url = '/admin/deploy';
      var method = 'POST';

      if (document.querySelector('input[name="surge_url"]').value == "") return alert("Please enter a domain.");

      var data = {
        method: "surge",
        surge_url: document.querySelector('input[name="surge_url"]').value
      }

      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = 'json';
      xhr.dataType = 'json';
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.send(JSON.stringify(data));

      xhr.onload = function() {
        deploying = false;
        var mess = ansi_up.ansi_to_html(xhr.response.message);
        document.querySelector('.console').innerHTML += mess;
      }
    })
  }

  bindTypeFieldEvents()

  var markdownTextAreas = [].slice.call(document.querySelectorAll('.textarea--markdown'));
  markdownTextAreas.forEach(function(t) {
    var mde = new SimpleMDE({
      element: t,
      toolbar: false,
      spellChecker: false
    });

    t.mde = mde;
  });
}
var cms = new CMS();
