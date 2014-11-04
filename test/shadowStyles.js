var errors = [];
casper.on("page.error", function(msg, trace) {
  this.echo("Error:    " + msg, "ERROR");
  this.echo("file:     " + trace[0].file, "WARNING");
  this.echo("line:     " + trace[0].line, "WARNING");
  this.echo("function: " + trace[0]["function"], "WARNING");
  errors.push(msg);
});

casper.test.begin("shadowStyles.js", 1, function(test){
  var pwd = require('fs').workingDirectory;
  var mockupFile = 'file:///' + pwd + '/test/mockup/test1.html';
  casper.start(mockupFile).then(function(){
    var pColor = this.page.evaluate(function(){
      var pStyle = window.getComputedStyle(document.querySelector('x-foo p'));
      return pStyle.getPropertyValue('color');
    });
    test.assertEquals(pColor, "rgb(255, 0, 0)",
      'Shadowed paragraph should be red');
  });
  casper.run(function() {
    if (errors.length > 0) {
      this.echo(errors.length + ' Javascript errors found', "WARNING");
    } else {
      this.echo(errors.length + ' Javascript errors found', "INFO");
    }
    test.done();
  });
});
