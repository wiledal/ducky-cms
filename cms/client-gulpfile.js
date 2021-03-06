'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');
const exec = require('child_process').exec;
const fs = require('fs');
const watch = require('gulp-watch');
const path = require('path');
const helpers = require('../lib/helpers.js');
const co = require('co');

const nunjucks = require('nunjucks');
const DB = require('../lib/db.js');
const jimp = require('jimp');
const marked = require('marked');

const projectPath = process.cwd();

function fileExists(p) {
  try {
    fs.statSync(p);
    return true;
  }catch(e) {
    return false;
  }
}

function processImage(src, o) {
  var options = o || {};
  var imgPath = src;
  var imgExt = path.extname(imgPath);
  var imgName = path.basename(imgPath, imgExt);

  var modifiers = {
    width: options.width ? options.width : -1,
    height: options.height ? options.height : -1,
    fit: options.fit ? options.fit : 'contain'
  }

  var modifiersString = `-${modifiers.width == -1 ? "0" : modifiers.width}x${modifiers.height == -1 ? "0" : modifiers.height}_${modifiers.fit}`;
  var modifiedName = imgName + (o ? modifiersString : "") + imgExt;
  if (fileExists(`${projectPath}/build/assets/img/${modifiedName}`)) return '/assets/img/' + modifiedName;

  jimp.read(src, function(err, img) {
    if (err) return console.log(err.stack);

    if (o) {
      if (modifiers.fit == "contain") img.contain(modifiers.width, modifiers.height);
      if (modifiers.fit == "cover") img.cover(modifiers.width, modifiers.height);
      if (modifiers.fit == "resize") img.resize(modifiers.width, modifiers.height);
    }

    img.write(`${projectPath}/build/assets/img/${modifiedName}`);
  });

  return '/assets/img/' + modifiedName;
}

gulp.task('clean', () => {
  return gulp.src(`${projectPath}/build`, {read: false})
    .pipe(clean());
});
gulp.task('build', () => {
  console.log("Ducky::Building project - " + new Date());
  return runSequence('clean', 'assets', 'templates');
});

gulp.task('assets', () => {
  return gulp.src(`${projectPath}/assets/**/*`)
    .pipe(gulp.dest(`${projectPath}/build/assets`));
});
gulp.task('templates', (done) => {
  co(function*() {
    try {
      const nun = nunjucks.configure(`${projectPath}/templates`);
      const db = DB(projectPath);

      const contentTypes = null;
      const assets = null;

      var docs = yield db.content.find({ _type: 'doc' });

      // Resolve references
      docs.forEach((d) => {
        for (var f in d) {
          var field = d[f];
          if (!Array.isArray(field)) {
            if (field.type == 'reference') {
              d[f] = docs.filter((d2) => d2._id == field.id)[0];
            }
          }else{
            field.forEach((nestedField) => {
              if (nestedField.type == 'reference') {
                nestedField = docs.filter((d2) => d2._id == nestedField.id)[0];
              }
            })
          }
        }
      });

      // NUNJUCK GLOBALS AND FILTERS
      nun.addFilter('slugify', helpers.slugify);
      nun.addFilter('markdown', (text) => {
        if (!text) return "";
        return marked(text);
      });
      nun.addGlobal('link', (doc) => {
        if (doc._slugType == "index") return "/";
        if (doc._slugType == "no-content-type") return `/${doc._slug}`;
        return `/${doc._contentType}/${doc._slug}`;
      });
      nun.addGlobal('uploads', function(src, options) {
        var extName = path.extname(src);
        if ((extName == ".jpg" || extName == ".png" || extName == ".gif") && options) return processImage(`${projectPath}/assets/uploads/${src}`, options);
        return '/assets/uploads/' + src;
      });
      nun.addGlobal('asset', function(src, options) {
        var extName = path.extname(src);
        if ((extName == ".jpg" || extName == ".png" || extName == ".gif") && options) return processImage(`${projectPath}/assets/${src}`, options);
        return '/assets/' + src;
      });
      nun.addGlobal('content', docs);

      docs = docs.sort((a, b) => {
        if (a._createdAt > b._createdAt) return -1;
        if (a._createdAt < b._createdAt) return 1;
        return 0;
      });

      docs.forEach((doc) => {
        var contentTypeSlug = doc._contentType;
        var nameSlug = doc._slug;

        if (!doc._template) return;

        var html = nun.render(`views/${doc._template}.njk`, doc);
        try {
          var codes = helpers.extractShortcodes(html.replace(/\&quot\;/g, '"'));
        }catch(err) {
          console.log(err);
        }

        if (doc._slugType == "index") {
          fs.writeFileSync(`${projectPath}/build/index.html`, html);
        }else if (doc._slugType == "no-content-type") {
          if (!fileExists(`${projectPath}/build/${nameSlug}`)) fs.mkdirSync(`${projectPath}/build/${nameSlug}`);
          fs.writeFileSync(`${projectPath}/build/${nameSlug}/index.html`, html);
        }else{
          if (!fileExists(`${projectPath}/build/${contentTypeSlug}`)) fs.mkdirSync(`${projectPath}/build/${contentTypeSlug}`);
          fs.mkdirSync(`${projectPath}/build/${contentTypeSlug}/${nameSlug}`);
          fs.writeFileSync(`${projectPath}/build/${contentTypeSlug}/${nameSlug}/index.html`, html);
        }
      })

      done();
    }catch(err) {
      console.log(err);
      done();
    }
  })
});

gulp.task('watch', ['build'], () => {
  watch(projectPath + '/templates/**/*', function() {
    gulp.start('build');
  });
  watch(projectPath + '/assets/**/*', function() {
    gulp.start('build');
  });
});

module.exports = gulp;
