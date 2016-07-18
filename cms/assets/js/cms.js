'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

mikrom.component('.js-add-new-type-field', function (el) {
  el.addEventListener('click', function () {
    var template = document.querySelector('script[type="text/template"][name="type-field"]').innerHTML;
    var fieldsContainer = document.querySelector('.fields');
    var dummy = document.createElement('div');
    dummy.innerHTML = template;

    fieldsContainer.appendChild(dummy.children[0]);

    mikrom.init();
  });
});

mikrom.component('.asset', function (el, attr) {
  var selectAssetModal = document.querySelector('.modal-select-asset');

  el.addEventListener('click', function () {
    cms.currentAssetSelect.parentNode.querySelector('input').value = attr.assetSrc;
    cms.currentAssetSelect.parentNode.querySelector('img').src = "/assets/uploads/" + attr.assetSrc;
    selectAssetModal.style.display = '';
  });
});

mikrom.component('.js-delete-content-type', function (el, attr) {
  el.addEventListener('click', function () {
    if (!confirm("Are you sure?")) return;

    var url = '/admin/content-type/' + contentType._id;
    var method = 'DELETE';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
      location.href = '/admin/content-types/';
    };

    xhr.send();
  });
});

mikrom.component('.js-delete-doc', function (el, attr) {
  el.addEventListener('click', function () {
    if (!confirm("Are you sure?")) return;

    var url = '/admin/doc/' + doc._id;
    var method = 'DELETE';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
      location.href = '/admin/content/' + contentType._slug;
    };

    xhr.send();
  });
});

mikrom.component('.js-deploy-surge', function (el) {
  el.addEventListener('click', function () {
    if (deploying || !confirm("Are you sure you want to deploy?")) return false;

    document.querySelector('.console').innerHTML += "<br>Deploying...";
    deploying = true;

    var url = '/admin/deploy';
    var method = 'POST';

    if (document.querySelector('input[name="surge_url"]').value == "") return alert("Please enter a domain.");

    var data = {
      method: "surge",
      surge_url: document.querySelector('input[name="surge_url"]').value
    };

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(JSON.stringify(data));

    xhr.onload = function () {
      deploying = false;
      var mess = ansi_up.ansi_to_html(xhr.response.message);
      document.querySelector('.console').innerHTML += mess;
    };
  });
});

mikrom.component('.field[cms-multiple]', function (el) {
  var addButton = el.querySelector('.js-add-multiple-field');
  var template = el.querySelector('.field__template').children[0];
  var fieldContainer = el.querySelector('.field__input');

  addButton.addEventListener('click', function () {
    var newTemplate = template.cloneNode(true);
    fieldContainer.appendChild(newTemplate);

    mikrom.init();
  });
});

mikrom.component('.js-remove-multiple-field', function (el) {
  el.addEventListener('click', function () {
    el.parentNode.parentNode.removeChild(el.parentNode);
  });
});

mikrom.component('.js-remove-type-field', function (el) {
  el.addEventListener('click', function () {
    var container = el.parentNode.parentNode;
    container.parentNode.removeChild(container);
  });
});

mikrom.component('.js-save-content-type', function (el) {
  el.addEventListener('click', function () {
    var typeFields = [].slice.call(document.querySelectorAll('.type-field'));

    var data = {
      _name: document.querySelector('.field[cms-name="_name"] input').value,
      _defaultTemplate: document.querySelector('.field[cms-name="_defaultTemplate"] select').value,
      fields: []
    };

    typeFields.forEach(function (f) {
      var fieldName = f.querySelector('input[name="name"]').value;
      var fieldType = f.querySelector('select[name="type"]').value;
      var multiple = f.querySelector('input[name="multiple"]').checked;

      data.fields.push({
        name: fieldName,
        type: fieldType,
        multiple: multiple
      });
    });

    var url = contentType._id ? '/admin/content-type/' + contentType._id : '/admin/content-type';
    var method = contentType._id ? 'PUT' : 'POST';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(JSON.stringify(data));

    xhr.onload = function () {
      location.href = '/admin/content-types/';
    };
  });
});

mikrom.component('.js-save-doc', function (el) {
  el.addEventListener('click', function () {
    var fields = [].slice.call(document.querySelectorAll('.field'));

    var data = {};

    fields.forEach(function (f) {
      var multiple = f.getAttribute('cms-multiple') != undefined;
      var name = f.getAttribute('cms-name');
      var type = f.getAttribute('cms-type');

      if (name[0] != "_") name = cmsHelpers.toCamelCase(name);

      if (multiple) {
        data[name] = [];

        switch (type) {
          case 'asset':
          case 'text':
            var inputs = [].slice.call(f.querySelectorAll('.field__input input'));
            inputs.forEach(function (input) {
              data[name].push(input.value);
            });
            break;
          case 'textarea':
            var inputs = [].slice.call(f.querySelectorAll('.field__input textarea'));
            inputs.forEach(function (input) {
              data[name].push(input.value);
            });
            break;
          case 'markdown':
            var inputs = [].slice.call(f.querySelectorAll('.field__input textarea'));
            inputs.forEach(function (input) {
              data[name].push(input.mde.value());
            });
            break;
        }
      } else {
        switch (type) {
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

    xhr.onload = function () {
      location.href = '/admin/content/' + contentType._slug;
    };
  });
});

mikrom.component('.js-select-asset', function (el) {
  el.addEventListener('click', function () {
    var selectAssetModal = document.querySelector('.modal-select-asset');
    selectAssetModal.style.display = 'block';
    cms.currentAssetSelect = el;
  });
});

mikrom.component('.slugger', function (el, attr) {
  var slugField = document.querySelector('.field[cms-name="_name"] input');
  slugField.addEventListener('input', function () {
    el.value = cmsHelpers.slugify(slugField.value);
  });
});

mikrom.component('.textarea--markdown', function (el) {
  var mde = new SimpleMDE({
    element: el,
    toolbar: false,
    spellChecker: false
  });

  el.mde = mde;
});

mikrom.component('.js-upload-asset-button', function (el) {
  el.addEventListener('click', function () {
    var uploaderFile = document.querySelector('.js-uploader-file');
    var file = uploaderFile.files[0];
    var formData = new FormData();

    formData.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/assets/upload", true);
    xhr.send(formData);

    xhr.onload = function () {
      setTimeout(function () {
        location.reload();
      });
    };
  });
});

mikrom.component('.js-upload-asset', function (el) {
  var uploader = document.querySelector('.modal-uploader');

  el.addEventListener('click', function () {
    uploader.style.display = 'block';
  });
});

mikrom.component('.modal-select-asset', function (el) {});

var cmsHelpers = {
  slugify: function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, '-and-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
  },
  toCamelCase: function toCamelCase(text) {
    return text.trim().toLowerCase().replace(/\s/gi, '-').replace(/-([a-z])/gi, function (g) {
      return g[1].toUpperCase();
    });
  }
};

var CMS = function () {
  function CMS() {
    _classCallCheck(this, CMS);
  }

  _createClass(CMS, [{
    key: 'init',
    value: function init() {
      mikrom.init();
    }
  }]);

  return CMS;
}();

var cms = new CMS();
cms.init();