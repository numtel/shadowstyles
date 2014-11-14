// shadowStyles CSS Isolator
// MIT License, ben@latenightsketches.com
// test/nightwatch/webcomponent.js

// Nightwatch tests for webcomponent integration

var successColor = 'rgba(0, 119, 0, 1)';

var appPath = process.env.TRAVIS ?
  'http://localhost:8000/' : 'file:///' + process.cwd() + '/';

module.exports = {
  'Web Component - From Source': function (browser){
    browser
      .url(appPath + 'test/mockup/webcomponent.html')
      .waitForElementVisible('body', 1000)
      .assert.containsText('x-foo p', 'I am an x-foo!')

      .assert.cssProperty('x-foo p', 'color', successColor,
        'Static rule negation')

      .click('button[name=insert]')
      .assert.cssProperty('x-foo p:nth-child(4)', 'color', successColor,
        'New child rule negation')

      .click('button[name=attrChange]')
      .assert.attributeEquals('x-foo p', 'class', 'test')
      .assert.cssProperty('x-foo p', 'color', successColor,
        'Element with changed attribute updated')
      .assert.cssProperty('x-foo p em', 'color', successColor,
        'Children of elements with changed attribute updated')

      .click('button[name=ancestorAttrChange]')
      .assert.cssProperty('x-foo p', 'color', successColor,
        'Shadowed elements updated on ancestor attribute update')

      .end();
  }
};
