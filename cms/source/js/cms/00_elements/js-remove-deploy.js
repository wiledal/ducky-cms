mikrom.component('.js-remove-deployment', (el, attr) => {
  el.addEventListener('click', function() {
    if (!confirm("Are you sure?")) return;

    var url = '/admin/deployment/' + deployment._id;
    var method = 'DELETE';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      location.href = '/admin/deploy/';
    }

    xhr.send();
  });
});
