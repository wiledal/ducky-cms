//=require vendor/*.js

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function CMS() {
  var saveButtons = [].slice.call(document.querySelectorAll(".js-save-doc"));
  var saveContentTypeButtons = [].slice.call(document.querySelectorAll(".js-save-content-type"));
  var addTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-add-new-type-field"));
  var removeTypeFieldButtons = [].slice.call(document.querySelectorAll(".js-remove-type-field"));

  var surgeDeployButton = document.querySelector(".js-deploy-surge");
  var deleteDocButton = document.querySelector(".js-delete-doc");
  var deleteContentTypeButton = document.querySelector(".js-delete-content-type");

  var slugger = document.querySelector('.slugger');
  if (slugger) {
    var slugField = document.querySelector('input[name="_name"]');
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
        var t = f.querySelector('input');
        if (!t) t = f.querySelector('textarea');
        if (!t) t = f.querySelector('select');
        data[t.name] = t.value;
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
        _name: document.querySelector('input[name="_name"]').value,
        _defaultTemplate: document.querySelector('select[name="_defaultTemplate"]').value,
        fields: []
      };

      typeFields.forEach(function(f) {
        var fieldName = f.querySelector('input[name="name"]').value;
        var fieldType = f.querySelector('select[name="type"]').value;

        data.fields.push({
          name: fieldName,
          type: fieldType,
          multiple: false
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
}
var cms = new CMS();
