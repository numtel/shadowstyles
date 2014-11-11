// shadowStyles CSS Isolator
// MIT License, ben@latenightsketches.com
// src/shadowStyles.js

// Main library
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
  // @param {string|element|array} nodeName - String: selector to match root
  //                                          Element: element object as root
  //                                          Array: combination of both
  document.shadowStyles = function(nodeName){
    shadowNodes.push(nodeName);
    addShadowNodes();
  };

  // Helper public constant
  document.shadowStyles.nativeSupport = (function(){
    try{
      document.querySelector('::shadow');
    }catch(error){
      return false;
    };
    return true;
  })();

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
    if(!window.unwrap){
      // Include dummy for when Polymer isn't loaded.
      window.unwrap = function(obj){
        return obj;
      };
    };
    addShadowNodes();
  }, true);

  // Watch for changes to shadowed elements
  var observer = new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      var toUpdate = [];
      if(mutation.type === 'attributes' &&
          mutation.attributeName !== SHADOW_ATTR &&
          mutation.attributeName !== BUFFER_ATTR){

        // Update all children of this shadow
        toUpdate = toUpdate.concat(Array.prototype.slice.call(
          shadowAncestor(mutation.target).querySelectorAll('*'), 0));

        if(!mutation.target.hasAttribute(SHADOW_ATTR)){
          // Only worry about target if it's inside the shadow
          toUpdate.push(mutation.target);
        };
      }else if(mutation.type === 'childList'){
        Array.prototype.forEach.call(mutation.addedNodes, function(el){
          if(el.nodeName !== '#text' && !el.getAttribute(BUFFER_ATTR)){
            observer.observe(el, {attributes: true, childList: true});
            el.setAttribute(BUFFER_ATTR, '');
            toUpdate.push(el);
            el.addEventListener_ && el.addEventListener_('DOMNodeInserted',
              function(event){
                // Deal with MutationOberver timing before node inserted
                updateShadowCss(toUpdate);
              }, false);
          };
        });
      };
      updateShadowCss(toUpdate);
    });
  });

  // Watch for attribute changes to shadow ancestors
  var ancestorObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      var toUpdate = Array.prototype.slice.call(
        mutation.target.querySelectorAll('[shadow] *'), 0);
      updateShadowCss(toUpdate);
    });
  });

  var updateShadowCss = function(nodeList){
    if(!nodeList.length) return;
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
            var attrVal = child.getAttribute(BUFFER_ATTR) || '';
            try{
              var isMatch = elMatches.call(unwrap(child), selectorToMatch);
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
                selector = insertBufferAttr(selector, negateId);
                selectors[selectorIndex] = selector;
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

  var elMatches = (function(){
    var options = [
      'matches',
      'msMatchesSelector',
      'webkitMatchesSelector',
      'mozMatchesSelector',
      'oMatchesSelector'];
    for(var i = 0; i < options.length; i++){
      if(options[i] in document.documentElement){
         return document.documentElement[options[i]];
      };
    };
  })();

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

  var shadowAncestor = function(el){
    while(el.parentNode){
      if(window.ShadowRoot && el.parentNode instanceof ShadowRoot){
        return el.parentNode;
      }else if(el.hasAttribute(SHADOW_ATTR)){
        return el;
      };
      el = el.parentNode;
    };
  };

  var findAncestors = function(el){
    var ancestors = [];
    while(el.parentNode){
      ancestors.push(el.parentNode);
      el = el.parentNode;
    };
    return ancestors;
  };

  // Find children of roots, register with observer
  // @param {string|element|array} selector
  // @return {array} Child elements
  var findChildren = function(selector){
    var roots = [];
    var children = [];
    if(typeof selector === 'string'){
      roots = document.querySelectorAll(selector);
    }else if(selector instanceof Array){
      selector.forEach(function(cur){
        children = children.concat(findChildren(cur));
      });
    }else{
      // Selector is element
      roots = [selector];
    };
    Array.prototype.forEach.call(roots, function(rootEl){
      var shadowRoot = rootEl.shadowRoot || rootEl;
      observer.observe(shadowRoot, {attributes: true, childList: true});
      rootEl.setAttribute(SHADOW_ATTR, '');

      findAncestors(rootEl).forEach(function(ancestor){
        if(ancestor.addEventListener_){
          // Polymer Shadow DOM blocks mutation events but provides _ suffix
          // to access original method. For unknown reason, MutationObserver
          // does not work with these ancestors with Polymer
          ancestor.addEventListener_('DOMAttrModified', function(event){
            if(event.target !== unwrap(ancestor) ||
                event.attrName === BUFFER_ATTR ||
                event.attrName === SHADOW_ATTR) return;
            var toUpdate = shadowRoot.querySelectorAll('*');
            updateShadowCss(toUpdate);
          }, true);
        }else{
          ancestorObserver.observe(ancestor, {attributes: true});
        };
      });

      var found = shadowRoot.querySelectorAll('*');
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
    if(colonPos === -1){
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
    pseudoClass: new RegExp('(:after|:before|::after|::before|:hover|' +
        ':active|:focus|:checked|:valid|:invalid)', 'gi')
  };
})();
