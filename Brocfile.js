//var es6 = require('broccoli-es6-module-transpiler');
var distes6 = require('broccoli-dist-es6-module');

var concat = require('broccoli-concat');
var pickFiles = require('broccoli-static-compiler');
var merge = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');
var wrap = require('broccoli-wrap');
var jshint = require('broccoli-jshint');

var halAdapterFiles = distes6('packages/ember-data-hal-adapter/lib', {
  // the entry script, and module that becomes global
  main: 'index',
  
  // will become window.HAL with the exports from 'main'
  global: 'HAL',

  //the prefix for named-amd modules
  packageName: 'hal-adapter',

  // global output only: naive shimming, when the id 'ember' is imported,
  // substitute with 'windom.Ember' instead
  shim: {
    'ember': 'Ember'
  }
});

function testTree(libTree, packageName) {
  var test = pickFiles('packages/' + packageName + '/tests', {
    srcDir: '/',
    files: ['**/*.js' ],
    destDir: '/'
  });

  // var jshinted = jshint(libTree);
  // jshinted = wrap(jshinted, {
  //     wrapper: [ "if (!QUnit.urlParams.nojshint) {\n", "\n}"]
  // });

  // test = merge([jshinted, test]);


  return test;
}


var testFiles = testTree(halAdapterFiles, 'ember-data-hal-adapter');

testFiles = concat(testFiles, {
  inputFiles: ['**/*.js'],
  seperator: '\n',
  wrapInEval: true,
  wrapInFunction: true,
  outputFile: '/tests/tests.js'
});

var buildFiles = halAdapterFiles;

var trees = merge([
  testFiles,
  buildFiles
]);

module.exports = trees;
