createTest('shadowStyles.js', 'test/mockup/test1.html', function(test){
  var pColor = this.page.evaluate(function(){
    var pStyle = window.getComputedStyle(document.querySelector('x-foo p'));
    return pStyle.getPropertyValue('color');
  });
  test.assertEquals(pColor, "rgb(255, 0, 0)",
    'Shadowed paragraph should be red');
});
