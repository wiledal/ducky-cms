mikrom.component('.js-deploy-surge', (el) => {
  el.addEventListener('click', () => {
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
})
