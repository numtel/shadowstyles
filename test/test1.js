console.log('Loading a web page');
var page = require('webpage').create();
var url = 'test/mockup/test1.html';
page.open(url, function (status) {
  //Page is loaded!
  
  var pColor = page.evaluate(function(){
    var pStyle = window.getComputedStyle(document.querySelector('x-foo p'));
    return pStyle.getPropertyValue('color');
  });
  console.log(pColor);
  phantom.exit();
});
