// shadow dom css isolation simulator polyfill
// MIT License, ben@latenightsketches.com
(function(){
  "use strict";
  // A buffer must be made to bridge the elements to negated CSS selectors
  var BUFFER_ATTR = 'css-negate';
  var SHADOW_ATTR = 'shadow'
  var UNIQUE_ID_LENGTH = 5;

  // Cache node names to be shadowed while waiting for window.onload
  var shadowNodes = [];
  var documentReady = false;

  // Main public method
  // @param {string} nodeName - Element type to isolate styles of child DOM
  document.isolateShadowStyles = function(nodeName){
    shadowNodes.push(nodeName);
    addShadowNodes();
  };
  
  var addShadowNodes = function(){
    if(documentReady){
      while(shadowNodes.length){
        var nodeName = shadowNodes.shift();
        var shadowChildren = findChildren(nodeName);
        updateShadowCss(shadowChildren);
      };
    };
  };

  window.addEventListener('load', function(){
    documentReady = true;
    addShadowNodes();
  }, true);

  // Watch for changes to shadowed elements
  var observer = new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      if(mutation.type === 'attributes' &&
          mutation.attributeName !== SHADOW_ATTR &&
          mutation.attributeName !== BUFFER_ATTR){
        if(mutation.target.hasAttribute(SHADOW_ATTR)){
          updateShadowCss(mutation.target.querySelectorAll('*'));
        }else{
          updateShadowCss([mutation.target]);
        };
      }else if(mutation.type === 'childList'){
        var sorted = [];
        Array.prototype.forEach.call(mutation.addedNodes, function(el){
          var removed = Array.prototype.indexOf.call(mutation.removedNodes, el);
          if(el.nodeName !== '#text' && !el.getAttribute(BUFFER_ATTR)){
            // A new child element has appeared!
            observer.observe(el, {attributes: true, childList: true});
            el.setAttribute(BUFFER_ATTR, '');
            sorted.push(el);
          };
        });
        if(sorted.length > 0){
          updateShadowCss(sorted);
        };
      };
    });
  });

  var updateShadowCss = function(nodeList){
    Array.prototype.forEach.call(document.styleSheets, function(sheetRoot){
      crawlRules(sheetRoot, function(rule, ruleIndex, sheet){
        var selectors = rule.selectorText.split(',');
        selectors.forEach(function(selector, selectorIndex){
          selector = selector.trim();
          // Skip selectors that match shadow attribute
          if(selector.indexOf('[' + SHADOW_ATTR + ']') > -1) return;
          // Match without pseudo classs in the selector
          var selectorToMatch = selector.replace(regex.pseudoClass, '');
          Array.prototype.forEach.call(nodeList, function(child){
            var attrVal = child.getAttribute(BUFFER_ATTR);
            try{
              var isMatch = child.matches && child.matches(selectorToMatch);
            }catch(err){
              // Invalid selector
              return;
            };
            if(isMatch){
              // Check if unique identifier already exists
              var negateId = selector.match(regex.bufferAttr);
              if(negateId){
                negateId = negateId[1];
              }else{
                negateId = randomString(UNIQUE_ID_LENGTH);
                selector = selectors[selectorIndex] = 
                  insertBufferAttr(selector, negateId);
                var ruleBody = rule.cssText.substr(rule.selectorText.length);
                sheet.insertRule(selectors.join(', ') + ruleBody, ruleIndex + 1);
                sheet.deleteRule(ruleIndex);
                rule = sheet.cssRules[ruleIndex];
              };

              if(attrVal.indexOf(negateId) === -1){
                attrVal += negateId;
                child.setAttribute(BUFFER_ATTR, attrVal);
              };
            };
          });
        });
      });
    });
  };

  var crawlRules = function(sheet, ruleHandler){
    if(sheet.cssRules){
      Array.prototype.forEach.call(sheet.cssRules, function(rule, index){
        if(rule.type === 1){
          // Normal rule
          ruleHandler(rule, index, sheet);
        }else if(rule.cssRules) {
          // Has child rules, like @media
          crawlRules(rule, ruleHandler);
        }else if(rule.styleSheet) {
          // Has child sheet, like @import
          crawlRules(rule.styleSheet, ruleHandler);
        };
      });
    };
  };

  var findChildren = function(selector) {
    var roots = document.querySelectorAll(selector);
    var children = [];
    Array.prototype.forEach.call(roots, function(rootEl){
      observer.observe(rootEl, {attributes: true, childList: true});
      rootEl.setAttribute(SHADOW_ATTR, '');
      var found = rootEl.querySelectorAll('*');
      Array.prototype.forEach.call(found, function(child){
        observer.observe(child, {attributes: true, childList: true});
        child.setAttribute(BUFFER_ATTR, '');
        children.push(child);
      });
    });
    return children;
  };

  // Add buffer attribute to selector
  // Takes existing pseudo class position into consideration
  // @param {string} selector
  // @param {string} selectorId - unique identifier
  // @return {string} - Modified selector
  var insertBufferAttr = function(selector, selectorId){
    var colonPos = selector.lastIndexOf(':');
    var lastSpace = selector.lastIndexOf(' ');
    var bufferAttr = ':not([' + BUFFER_ATTR + '*="' + selectorId + '"])';
    if(colonPos === -1 || 
        (lastSpace > -1 && colonPos > lastSpace)){
      // No pseudo-class, place at end
      return selector + bufferAttr;
    }else{
      // Place before other pseudo-classes
      var anotherColon = selector.lastIndexOf(':', colonPos - 1);
      while(anotherColon > lastSpace){
        colonPos = anotherColon;
        anotherColon = selector.lastIndexOf(':', anotherColon - 1);
      };
      return selector.substr(0, colonPos) +
              bufferAttr +
              selector.substr(colonPos);
    };
  };

  var randomString = function(length){
    var text = "",
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
    for(var i=0; i < length; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    };
    return text;
  };

  var regex = {
    bufferAttr: new RegExp(':not\\(\\[' + BUFFER_ATTR + '\\*="([^"]+)"\\]\\)'),
    pseudoClass: new RegExp('(::after|::before|:hover|:active|:focus|' +
        ':checked|:valid|:invalid)', 'gi')
  };
})();
