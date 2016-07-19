mikrom.component('.js-deploy', (el, attr) => {
  el.addEventListener('click', () => {
    if (window.cmsDeploying || !confirm("Are you sure you want to deploy?")) return;
    window.cmsDeploying = true;

    var url = '/admin/deploy/' + attr.deploymentId;
    var method = 'POST';

    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';
    xhr.dataType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    document.querySelector('.console').innerHTML += `\nDeploying... please wait...`

    xhr.onload = function() {
      var mess = ansi_up.ansi_to_html(xhr.response.message);
      document.querySelector('.console').innerHTML += mess;
    }
  })
});
