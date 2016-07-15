// ansi_up.js
// version : 1.3.0
// author : Dru Nelson
// license : MIT
// http://github.com/drudru/ansi_up

(function (Date, undefined) {

    var ansi_up,
        VERSION = "1.3.0",

        // check for nodeJS
        hasModule = (typeof module !== 'undefined'),

        // Normal and then Bright
        ANSI_COLORS = [
          [
            { color: "0, 0, 0",        'class': "ansi-black"   },
            { color: "187, 0, 0",      'class': "ansi-red"     },
            { color: "0, 187, 0",      'class': "ansi-green"   },
            { color: "187, 187, 0",    'class': "ansi-yellow"  },
            { color: "0, 0, 187",      'class': "ansi-blue"    },
            { color: "187, 0, 187",    'class': "ansi-magenta" },
            { color: "0, 187, 187",    'class': "ansi-cyan"    },
            { color: "255,255,255",    'class': "ansi-white"   }
          ],
          [
            { color: "85, 85, 85",     'class': "ansi-bright-black"   },
            { color: "255, 85, 85",    'class': "ansi-bright-red"     },
            { color: "0, 255, 0",      'class': "ansi-bright-green"   },
            { color: "255, 255, 85",   'class': "ansi-bright-yellow"  },
            { color: "85, 85, 255",    'class': "ansi-bright-blue"    },
            { color: "255, 85, 255",   'class': "ansi-bright-magenta" },
            { color: "85, 255, 255",   'class': "ansi-bright-cyan"    },
            { color: "255, 255, 255",  'class': "ansi-bright-white"   }
          ]
        ],

        // 256 Colors Palette
        PALETTE_COLORS;

    function Ansi_Up() {
      this.fg = this.bg = this.fg_truecolor = this.bg_truecolor = null;
      this.bright = 0;
    }

    Ansi_Up.prototype.setup_palette = function() {
      PALETTE_COLORS = [];
      // Index 0..15 : System color
      (function() {
        var i, j;
        for (i = 0; i < 2; ++i) {
          for (j = 0; j < 8; ++j) {
            PALETTE_COLORS.push(ANSI_COLORS[i][j]['color']);
          }
        }
      })();

      // Index 16..231 : RGB 6x6x6
      // https://gist.github.com/jasonm23/2868981#file-xterm-256color-yaml
      (function() {
        var levels = [0, 95, 135, 175, 215, 255];
        var format = function (r, g, b) { return levels[r] + ', ' + levels[g] + ', ' + levels[b] };
        var r, g, b;
        for (r = 0; r < 6; ++r) {
          for (g = 0; g < 6; ++g) {
            for (b = 0; b < 6; ++b) {
              PALETTE_COLORS.push(format.call(this, r, g, b));
            }
          }
        }
      })();

      // Index 232..255 : Grayscale
      (function() {
        var level = 8;
        var format = function(level) { return level + ', ' + level + ', ' + level };
        var i;
        for (i = 0; i < 24; ++i, level += 10) {
          PALETTE_COLORS.push(format.call(this, level));
        }
      })();
    };

    Ansi_Up.prototype.escape_for_html = function (txt) {
      return txt.replace(/[&<>]/gm, function(str) {
        if (str == "&") return "&amp;";
        if (str == "<") return "&lt;";
        if (str == ">") return "&gt;";
      });
    };

    Ansi_Up.prototype.linkify = function (txt) {
      return txt.replace(/(https?:\/\/[^\s]+)/gm, function(str) {
        return "<a href=\"" + str + "\">" + str + "</a>";
      });
    };

    Ansi_Up.prototype.ansi_to_html = function (txt, options) {
      return this.process(txt, options, true);
    };

    Ansi_Up.prototype.ansi_to_text = function (txt) {
      var options = {};
      return this.process(txt, options, false);
    };

    Ansi_Up.prototype.process = function (txt, options, markup) {
      var self = this;
      var raw_text_chunks = txt.split(/\033\[/);
      var first_chunk = raw_text_chunks.shift(); // the first chunk is not the result of the split

      var color_chunks = raw_text_chunks.map(function (chunk) {
        return self.process_chunk(chunk, options, markup);
      });

      color_chunks.unshift(first_chunk);

      return color_chunks.join('');
    };

    Ansi_Up.prototype.process_chunk = function (text, options, markup) {

      // Are we using classes or styles?
      options = typeof options == 'undefined' ? {} : options;
      var use_classes = typeof options.use_classes != 'undefined' && options.use_classes;
      var key = use_classes ? 'class' : 'color';

      // Each 'chunk' is the text after the CSI (ESC + '[') and before the next CSI/EOF.
      //
      // This regex matches four groups within a chunk.
      //
      // The first and third groups match code type.
      // We supported only SGR command. It has empty first group and 'm' in third.
      //
      // The second group matches all of the number+semicolon command sequences
      // before the 'm' (or other trailing) character.
      // These are the graphics or SGR commands.
      //
      // The last group is the text (including newlines) that is colored by
      // the other group's commands.
      var matches = text.match(/^([!\x3c-\x3f]*)([\d;]*)([\x20-\x2c]*[\x40-\x7e])([\s\S]*)/m);

      if (!matches) return text;

      var orig_txt = matches[4];
      var nums = matches[2].split(';');

      // We currently support only "SGR" (Select Graphic Rendition)
      // Simply ignore if not a SGR command.
      if (matches[1] !== '' || matches[3] !== 'm') {
        return orig_txt;
      }

      if (!markup) {
        return orig_txt;
      }

      var self = this;

      while (nums.length > 0) {
        var num_str = nums.shift();
        var num = parseInt(num_str);

        if (isNaN(num) || num === 0) {
          self.fg = self.bg = null;
          self.bright = 0;
        } else if (num === 1) {
          self.bright = 1;
        } else if (num == 39) {
          self.fg = null;
        } else if (num == 49) {
          self.bg = null;
        } else if ((num >= 30) && (num < 38)) {
          self.fg = ANSI_COLORS[self.bright][(num % 10)][key];
        } else if ((num >= 90) && (num < 98)) {
          self.fg = ANSI_COLORS[1][(num % 10)][key];
        } else if ((num >= 40) && (num < 48)) {
          self.bg = ANSI_COLORS[0][(num % 10)][key];
        } else if ((num >= 100) && (num < 108)) {
          self.bg = ANSI_COLORS[1][(num % 10)][key];
        } else if (num === 38 || num === 48) { // extend color (38=fg, 48=bg)
          (function() {
            var is_foreground = (num === 38);
            if (nums.length >= 1) {
              var mode = nums.shift();
              if (mode === '5' && nums.length >= 1) { // palette color
                var palette_index = parseInt(nums.shift());
                if (palette_index >= 0 && palette_index <= 255) {
                  if (!use_classes) {
                    if (!PALETTE_COLORS) {
                      self.setup_palette.call(self);
                    }
                    if (is_foreground) {
                      self.fg = PALETTE_COLORS[palette_index];
                    } else {
                      self.bg = PALETTE_COLORS[palette_index];
                    }
                  } else {
                    var klass = (palette_index >= 16)
                          ? ('ansi-palette-' + palette_index)
                          : ANSI_COLORS[palette_index > 7 ? 1 : 0][palette_index % 8]['class'];
                    if (is_foreground) {
                      self.fg = klass;
                    } else {
                      self.bg = klass;
                    }
                  }
                }
              } else if(mode === '2' && nums.length >= 3) { // true color
                var r = parseInt(nums.shift());
                var g = parseInt(nums.shift());
                var b = parseInt(nums.shift());
                if ((r >= 0 && r <= 255) && (g >= 0 && g <= 255) && (b >= 0 && b <= 255)) {
                  var color = r + ', ' + g + ', ' + b;
                  if (!use_classes) {
                    if (is_foreground) {
                      self.fg = color;
                    } else {
                      self.bg = color;
                    }
                  } else {
                    if (is_foreground) {
                      self.fg = 'ansi-truecolor';
                      self.fg_truecolor = color;
                    } else {
                      self.bg = 'ansi-truecolor';
                      self.bg_truecolor = color;
                    }
                  }
                }
              }
            }
          })();
        }
      }

      if ((self.fg === null) && (self.bg === null)) {
        return orig_txt;
      } else {
        var styles = [];
        var classes = [];
        var data = {};
        var render_data = function (data) {
          var fragments = [];
          var key;
          for (key in data) {
            if (data.hasOwnProperty(key)) {
              fragments.push('data-' + key + '="' + this.escape_for_html(data[key]) + '"');
            }
          }
          return fragments.length > 0 ? ' ' + fragments.join(' ') : '';
        };

        if (self.fg) {
          if (use_classes) {
            classes.push(self.fg + "-fg");
            if (self.fg_truecolor !== null) {
              data['ansi-truecolor-fg'] = self.fg_truecolor;
              self.fg_truecolor = null;
            }
          } else {
            styles.push("color:rgb(" + self.fg + ")");
          }
        }
        if (self.bg) {
          if (use_classes) {
            classes.push(self.bg + "-bg");
            if (self.bg_truecolor !== null) {
              data['ansi-truecolor-bg'] = self.bg_truecolor;
              self.bg_truecolor = null;
            }
          } else {
            styles.push("background-color:rgb(" + self.bg + ")");
          }
        }
        if (use_classes) {
          return '<span class="' + classes.join(' ') + '"' + render_data.call(self, data) + '>' + orig_txt + '</span>';
        } else {
          return '<span style="' + styles.join(';') + '"' + render_data.call(self, data) + '>' + orig_txt + '</span>';
        }
      }
    };

    // Module exports
    ansi_up = {

      escape_for_html: function (txt) {
        var a2h = new Ansi_Up();
        return a2h.escape_for_html(txt);
      },

      linkify: function (txt) {
        var a2h = new Ansi_Up();
        return a2h.linkify(txt);
      },

      ansi_to_html: function (txt, options) {
        var a2h = new Ansi_Up();
        return a2h.ansi_to_html(txt, options);
      },

      ansi_to_text: function (txt) {
        var a2h = new Ansi_Up();
        return a2h.ansi_to_text(txt);
      },

      ansi_to_html_obj: function () {
        return new Ansi_Up();
      }
    };

    // CommonJS module is defined
    if (hasModule) {
        module.exports = ansi_up;
    }
    /*global ender:false */
    if (typeof window !== 'undefined' && typeof ender === 'undefined') {
        window.ansi_up = ansi_up;
    }
    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define("ansi_up", [], function () {
            return ansi_up;
        });
    }
})(Date);


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

  var fieldMultiples = [].slice.call(document.querySelectorAll('.field[cms-multiple]'));
  
  fieldMultiples.forEach(function(f) {
    var addButton = f.querySelector('.js-add-multiple-field');
  
    var template = f.querySelector('.field__template').children[0];
    var fieldContainer = f.querySelector('.field__input');
  
    function removeMultipleField() {
      this.parentNode.parentNode.removeChild(this.parentNode);
    }
  
    function bindRemoveInput() {
      var inputs = [].slice.call(fieldContainer.querySelectorAll(".input"));
  
      inputs.forEach(function(input) {
        var b = input.querySelector('.js-remove-multiple-field');
        b.removeEventListener('click', removeMultipleField);
        b.addEventListener('click', removeMultipleField);
      });
    }
  
    addButton.addEventListener('click', function() {
      var newTemplate = template.cloneNode(true);
      fieldContainer.appendChild(newTemplate);
      bindRemoveInput();
      initSelectAssetButtons();
    })
  
    bindRemoveInput();
  })
  
    var selectAssetModal = document.querySelector('.modal-select-asset');
  
  var assets = [].slice.call(selectAssetModal.querySelectorAll('.asset'));
  var currentAssetSelect = null;
  
  assets.forEach(function(asset) {
    asset.addEventListener('click', function() {
      currentAssetSelect.parentNode.querySelector('input').value = asset.getAttribute('asset-src');
      currentAssetSelect.parentNode.querySelector('img').src = "/assets/uploads/" + asset.getAttribute('asset-src');
      selectAssetModal.style.display = '';
    })
  })
  
  function clickSelectAssetButton() {
      var target = this;
      currentAssetSelect = this;
      selectAssetModal.style.display = 'block';
  }
  
  function initSelectAssetButtons() {
    var selectAssetButtons = [].slice.call(document.querySelectorAll('.js-select-asset'));
  
    selectAssetButtons.forEach(function(b) {
      b.removeEventListener('click', clickSelectAssetButton);
      b.addEventListener('click', clickSelectAssetButton);
    });
  }
  
  initSelectAssetButtons();
  
    var uploader = document.querySelector('.modal-uploader');
  var uploaderButton = document.querySelector('.js-upload-asset-button');
  var uploaderModalButtons = [].slice.call(document.querySelectorAll('.js-upload-asset'));
  var uploaderFile = document.querySelector('.js-uploader-file');
  
  window.uploaderFile = uploaderFile;
  
  uploaderModalButtons.forEach(function(b) {
    b.addEventListener('click', function() {
      uploader.style.display = 'block';
    })
  });
  uploaderButton.addEventListener('click', function() {
    var file = uploaderFile.files[0];
    var formData = new FormData();
  
    formData.append("file", file);
  
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/assets/upload", true);
    xhr.send(formData);
  
    xhr.onload = function() {
      setTimeout(function() {
        location.reload();
      }, 500);
    }
  });
  

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
