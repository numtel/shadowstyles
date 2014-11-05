createTest('stand alone - source', 'test/mockup/standalone.html', 2, function(test){
  var pColor = this.page.evaluate(function(){
    var pStyle = window.getComputedStyle(document.querySelector('x-foo p'));
    return pStyle.getPropertyValue('color');
  });
  // Test @import, @media, <style>, and <link> stylesheets
  test.assertEquals(pColor, "rgb(0, 119, 0)",
    'Shadowed paragraph should be green (#070)');

  var pAfterColor = this.page.evaluate(function(){
    var pStyle = window.getComputedStyle(document.querySelector('x-foo p'), '::after');
    return pStyle.getPropertyValue('color');
  });
  // Test pseudo-element (and inherently pseudo-class)
  test.assertEquals(pAfterColor, 'rgb(0, 153, 0)',
    '::after psuedo-class should be green (#090)');
});
