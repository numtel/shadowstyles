// shadowStyles CSS Isolator
// MIT License, ben@latenightsketches.com
// test/nightwatch/standalone.js

// Nightwatch tests for stand alone installation

var successColor = 'rgba(0, 119, 0, 1)';

var appPath = process.env.TRAVIS ?
  'http://localhost:8000/' : 'file:///' + process.cwd() + '/';

module.exports = {
  'Stand Alone - From Source': function (browser){
    browser
      .url(appPath + 'test/mockup/standalone.html')
      .waitForElementVisible('body', 1000)
      .assert.containsText('x-foo p', 'something')

      .assert.cssProperty('x-foo p', 'color', successColor,
        'Static rule negation')

      .moveToElement('x-foo p', 10, 10)
      .assert.cssProperty('x-foo p', 'color', successColor,
        'Pseudo-class rule negation')
      .moveToElement('#desc', 10, 10)

      .click('button[name=insert]')
      .assert.cssProperty('#test p', 'color', successColor,
        'New child rule negation')

      .click('button[name=attrChange]')
      .assert.attributeEquals('#test p', 'class', 'test')
      .assert.cssProperty('#test p', 'color', successColor,
        'Element with changed attribute updated')
      .assert.cssProperty('x-foo p em', 'color', successColor,
        'Children of elements with changed attribute updated')

      .click('button[name=ancestorAttrChange]')
      .assert.cssProperty('x-foo p', 'color', successColor,
        'Shadowed elements updated on ancestor attribute update')

      .end();
  },
  'Stand Alone - Minified Version': function (browser){
    // Only test that compiled version loads successful
    // Just in case any syntax errors arise on minification
    browser
      .url(appPath + 'test/mockup/standalone-build.html')
      .waitForElementVisible('body', 1000)
      .assert.containsText('x-foo p', 'something')
      .assert.cssProperty('x-foo p', 'color', successColor,
        'Minified script initialized')
      .end();
  }
};
