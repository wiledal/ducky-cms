mikrom.component('.js-delete-doc', (el, attr) => {
  el.addEventListener('click', function() {
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
  });
})
