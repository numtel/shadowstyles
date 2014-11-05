// shadowStyles CSS Isolator
// MIT License, ben@latenightsketches.com
// Nightwatch tests for stand alone installation

var cwd = process.cwd();
var successColor = 'rgba(0, 119, 0, 1)';
var successHoverColor = 'rgba(0, 153, 0, 1)';

var appPath = process.env.TRAVIS ?
  'http://localhost:8000/' : 'file:///' + cwd + '/';

module.exports = {
  "Stand Alone - From Source": function (browser){
    browser
      .url(appPath + 'test/mockup/standalone.html')
      .waitForElementVisible('body', 1000)
      .assert.containsText('x-foo p', 'something')
      .assert.cssProperty('x-foo p', 'color', successColor)
      .moveToElement('x-foo p', 10, 10)
      .pause(10)
      .assert.cssProperty('x-foo p', 'color', successHoverColor)
      .click('button[name=insert]')
      .assert.cssProperty('#test p', 'color', successColor)
      .click('button[name=attrChange]')
      .assert.attributeEquals('x-foo p', 'class', 'test')
      .assert.cssProperty('x-foo p', 'color', successColor)
      .end();
  },
  "Stand Alone - Complied Version": function (browser){
    // Only test that compiled version loads successful
    // Just in case any syntax errors arise on minification
    browser
      .url(appPath + 'test/mockup/standalone-build.html')
      .waitForElementVisible('body', 1000)
      .assert.containsText('x-foo p', 'something')
      .assert.cssProperty('x-foo p', 'color', successColor)
      .end();
  }
};
