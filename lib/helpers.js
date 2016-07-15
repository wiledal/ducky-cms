'use strict';

module.exports = {
  slugify: (s) => {
    return s.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  extractShortcodes: (t) => {
    // Find all [tags with="variables"]
    var re = new RegExp(/\[.+\]/gi);
    var matches = re.exec(t);
    var codes = [];

    if (!matches) return [];
    matches.forEach((m) => {
      // Remove the []
      m = m.replace(/[\]\[]/, '')
        .trim();

      // Get the first string, the shortcode type
      var codeType = m.split(/\s/gi)[0];
      var vars = [];

      // Get each variable key="pair"
      var r = new RegExp(/(\w*?\=\".*?\")/gi);
      var match = true;
      while (match = r.exec(m)) {
        vars.push(match[0]);
      }

      var varObject = {};
      vars.forEach((v) => {
        var split = v.split('=');
        varObject[split[0]] = split[1].replace(/"/gi, '');
      });

      codes.push({
        type: codeType,
        vars: varObject
      })
    });

    return codes;
  },
  toCamelCase: function(string) {
    return string.trim().toLowerCase().replace(/\s/gi, '-').replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
  }
}
