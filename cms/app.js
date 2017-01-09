'use strict';

const koa = require('koa');
const koaRouter = require('koa-router');
const koaStatic = require('koa-static');
const koaMount = require('koa-mount');
const koaBody = require('koa-body');
const helpers = require(`${__dirname}/../lib/helpers.js`);

const marked = require('marked');
const clientGulp = require('./client-gulpfile.js');
const nunjucks = require('nunjucks');
const glob = require('glob-promise');
const path = require('path');
const DB = require('../lib/db.js');

const exec = require('child_process').exec;
function execp(command, args) {
  return new Promise((resolve, reject) => {
    exec(command, args, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        resolve(err);
        return;
      }
      if (stdout) {
        console.log(stdout);
        resolve(stdout);
      }
      if (stderr) {
        console.log(stderr.red);
        resolve(stderr);
      }
    });
  });
}

module.exports = (options) => {
  const port = options.port ? options.port : 3000;
  const projectPath = process.cwd();

  // Run app
  const app = koa();
  const router = koaRouter(app);
  const db = DB(projectPath);

  const nun = nunjucks.configure(`${__dirname}/templates`, {
    watch: true
  });

  nun.addGlobal('slugify', helpers.slugify);
  nun.addFilter('slugify', helpers.slugify);

  nun.addGlobal('camelCasify', helpers.toCamelCase);
  nun.addFilter('camelCasify', helpers.toCamelCase);

  // Nunjucks middleware
  app.context.render = function(file, options) {
    this.body = nun.render(`${file}.njk`, options);
  }

  // MIDDLEWARE INITS
  app.use(koaMount('/', koaStatic(`${projectPath}/build`)));
  app.use(koaMount('/admin/assets', koaStatic(__dirname + '/assets')));

  app.use(function*(next) {
    var assets = yield glob(`${projectPath}/assets/uploads/**/*`);
    var contentTypes = yield db.contentTypes.find({ _type: 'content-type' });

    for (var i = 0; i < contentTypes.length; i++) {
      var docs = yield db.content.find({ _contentType: contentTypes[i]._slug });
      contentTypes[i]._docs = docs;
    }

    var assetsSorted = assets.map((a) => {
      return path.basename(a);
    });

    nun.addGlobal('assets', assetsSorted);
    nun.addGlobal('contentTypes', contentTypes);

    yield next;
  })

  app.use(koaBody());
  app.use(router.routes());

  // Routes
  router.get('/admin', function*() {
    return this.render('views/index');
  });
  router.get('/admin/content/:slug', function*() {
    var contentType = yield db.contentTypes.findOne({ _slug: this.params.slug });
    var docs = yield db.content.find({ _contentType: contentType._slug });
    this.render('views/content', {
      contentType: contentType,
      docs: docs
    });
  });
  router.get('/admin/content/:id/edit', function*() {
    var doc = yield db.content.findOne({ _id: this.params.id });
    var contentType = yield db.contentTypes.findOne({ _slug: doc._contentType });

    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-edit', {
      templates: templates,
      contentType: contentType,
      doc: doc,
      selectedTemplate: doc._template
    });
  });
  router.get('/admin/content/:slug/new', function*() {
    var contentType = yield db.contentTypes.findOne({ _slug: this.params.slug });
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-edit', {
      contentType: contentType,
      templates: templates,
      selectedTemplate: contentType._defaultTemplate
    });
  });

  router.get('/admin/content-types', function*() {
    this.render('views/content-types');
  });
  router.get('/admin/content-types/:id/edit', function*() {
    var contentType = yield db.contentTypes.findOne({ _id: this.params.id });
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-type-edit', {
      contentType: contentType,
      templates: templates,
      selectedTemplate: contentType._defaultTemplate
    });
  });
  router.get('/admin/content-types/new', function*() {
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-type-edit', {
      templates: templates,
    });
  });

  router.get('/admin/deploy', function*() {
    this.render('views/deploy', {
      deployments: yield db.deployments.find({})
    });
  });

  router.get('/admin/deployment/new', function*() {
    this.render('views/deploy-edit');
  });
  router.get('/admin/deployment/:id', function*() {
    var deployment = yield db.deployments.findOne({ _id: this.params.id });
    this.render('views/deploy-edit', {
      deployment: deployment
    });
  });

  router.get('/admin/assets', function*() {
    this.render('views/assets');
  });

  router.post('/admin/assets/upload', koaBody({
    multipart: true,
    formidable: {
      onFileBegin: (name, file) => {
        file.path = `${projectPath}/assets/uploads/${file.name}`
      }
    }
  }), function*(next) {
    this.body = {
      success: true
    }
    yield next;
  })

  router.get('/admin/assets/all', function*() {
    this.render('views/api/assets');
  });

  // Create new
  router.post('/admin/doc/', function*() {
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._type = 'doc';
    doc._createdAt = +new Date();
    doc._updatedAt = +new Date();

    db.content.insert(doc);
    clientGulp.start('build');
  });
  router.put('/admin/doc/:id', function*() {
    var id = this.params.id;
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._updatedAt = +new Date();

    db.content.update({ _id: id }, { $set: doc });

    this.body = {success: true};
    clientGulp.start('build');
  });
  router.delete('/admin/doc/:id', function*() {
    var id = this.params.id;
    db.content.remove({ _id: id });

    clientGulp.start('build');
  });

  router.post('/admin/content-type/', function*() {
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._type = 'content-type';

    db.contentTypes.insert(doc)

    clientGulp.start('build');;
  });
  router.put('/admin/content-type/:id', function*() {
    var id = this.params.id;
    var doc = this.request.body;

    db.contentTypes.update({ _id: id }, { $set: doc });

    this.body = {
      success: true
    }

    clientGulp.start('build');
  });
  router.delete('/admin/content-type/:id', function*() {
    var id = this.params.id;
    var contentType = yield db.contentTypes.findOne({ _id: this.params.id });

    db.contentTypes.remove({ _contentType: contentType._slug }, { multi: true });
    db.contentTypes.remove({ _id: id });

    clientGulp.start('build');
  });

  // Deployment
  router.post('/admin/deployment/', function*() {
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._type = 'deployment';

    db.deployments.insert(doc)
    this.body = {
      success: true
    }
  });
  router.put('/admin/deployment/:id', function*() {
    var id = this.params.id;
    var doc = this.request.body;

    db.deployments.update({ _id: id }, { $set: doc });

    this.body = {
      success: true
    }
  });
  router.delete('/admin/deployment/:id', function*() {
    var id = this.params.id;
    db.deployments.remove({ _id: id });

    this.body = {
      success: true
    }
  });


  // deploy
  router.post('/admin/deploy/:id', function*() {
    var deployment = yield db.deployments.findOne({ _id: this.params.id });

    if (deployment._method == 'surge') {
      var result = yield execp(`surge ./build --domain ${deployment.domain}`, {
        cwd: projectPath
      });

      this.body = {
        success: true,
        message: result
      }
    }
  });

  app.listen(port);
  console.log(`DuckyCMS is listening on ${port}. ` + `QUACK!`.yellow);
  console.log(`Check out your page at ` + `http://localhost:${port}`.green);

  clientGulp.start('watch');
};
