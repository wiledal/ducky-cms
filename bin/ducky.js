#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const exec = require('child_process').exec;
const co = require('co');
const colors = require('colors');
const duckycms = require(__dirname + '/../cms/app.js');
const nedb = require('nedb');
const helpers = require(`${__dirname}/../lib/helpers.js`);
const glob = require('glob');
const DB = require('../lib/db.js');

const argv = yargs.argv;

let commands = {};
let helps = {};
function command(cmd, desc, usage, cb) {
  commands[cmd] = cb;
  helps[cmd] = {
    desc,
    usage
  }
}

function help() {
  let output = 'Ducky help:';

  for (var h in helps) {
    output += '\n' + h + '\t\t' + helps[h].usage;
  }

  console.log(output);
}

function execp(command, args) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr.red)
      resolve();
    });
  });
}

// Define commands
command('help', 'Shows the help', 'ducky help', () => {
  help();
});

command('init', 'Initiates a new project', 'ducky init <project path>', (args, argv) => {
  if (!args[1]) return console.error ("ducky ERROR :: Missing project path");
  var path = args[1];

  co(function*() {
    console.log(`Creating base project...`);
    yield execp(`cp -R ${__dirname}/../defaults ${path}`);
    console.log(`Setting up default content...`);

    // Default database input
    const db = DB(`${process.cwd()}/${path}`);
    db.insert({
      _type: "content-type",
      _name: "Pages",
      _slug: "pages",
      fields: [
        {
          name: "Title",
          type: "text",
          multiple: false
        },
        {
          name: "Body",
          type: "markdown",
          multiple: false
        }
      ]
    });
    db.insert({
      _type: "doc",
      _contentType: "pages",
      _name: "Home",
      _slug: "home",
      _slugType: 'index',
      _template: 'page',
      title: 'Welcome to DuckyCMS',
      body: 'Check out [the Admin](/admin) to start editing!',
    });

    console.log('Ducky was initiated.');
    console.log(`Now run ` + `cd ${path}`.green + ` and then ` + 'ducky cms'.green + ` to get going!`);
  });
});

command('cms', 'Starts the CMS', 'ducky cms [--port 3000]', (args, argv) => {
  glob(`${process.cwd()}/.duckycms`, (err, files) => {
    if (!files.length) return console.log('Target folder does not seem to be a DuckyCMS project'.yellow);
    duckycms(argv);
  })

});

// RUN
if (commands[argv._[0]]) {
  commands[argv._[0]](argv._, argv);
}else{
  help();
}
