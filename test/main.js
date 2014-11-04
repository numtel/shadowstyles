// main CasperJS test runner
// MIT License, ben@latenightsketches.com
// $ casperjs test test/main.js
// Includes all *.test.js files in test/ directory

var fs = require('fs');
var errors = [];
var pwd = fs.workingDirectory;
var dirList = fs.list(pwd + '/test/').filter(function(f){
  return f.substr(-8) === '.test.js';
});

casper.on("page.error", function(msg, trace) {
  this.echo("Error:    " + msg, "ERROR");
  this.echo("file:     " + trace[0].file, "WARNING");
  this.echo("line:     " + trace[0].line, "WARNING");
  this.echo("function: " + trace[0]["function"], "WARNING");
  errors.push(msg);
});

function createTest(name, mockupFile, handler){
  mockupFile = 'file:///' + pwd + '/' + mockupFile;
  casper.test.begin(name, 1, function(test){
    errors = [];
    casper.start(mockupFile).then(function(){
      handler.call(this, test);
    });
    casper.run(function() {
      this.echo(errors.length + ' Javascript errors found', 
                errors.length ? 'WARNING' : 'INFO');
      test.done();
    });
  });
};

// Inject each test file
dirList.forEach(require);
