mikrom.component('.js-save-deployment', (el) => {
  el.addEventListener('click', () => {


    var data = {
      _name: document.querySelector('.field[cms-name="_name"] input').value,
      _method: document.querySelector('.field[cms-name="_method"] input').value,
      domain: document.querySelector('.field[cms-name="Domain"] input').value
    }

    var url = deployment._id ? '/admin/deployment/' + deployment._id : '/admin/deployment';
    var method = deployment._id ? 'PUT' : 'POST';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));

    xhr.onload = function() {
      location.href = '/admin/deploy/';
    }
  })
});
