mikrom.component('.textarea--markdown', (el) => {
  var mde = new SimpleMDE({
    element: el,
    toolbar: false,
    spellChecker: false
  });

  el.mde = mde;
})
