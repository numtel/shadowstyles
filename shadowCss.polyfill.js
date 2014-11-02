// shadow dom css isolation simulator polyfill
// MIT License, ben@latenightsketches.com
(function(){
  "use strict";
  // A buffer must be made to bridge the elements to negated CSS selectors
  var BUFFER_ATTR = 'data-css-negated';
  var UNIQUE_ID_LENGTH = 5;
  // Cache loaded stylesheet data
  var parsedSheets;
  // Current inserted style element
  var processedStyleEl;

  // Main public method
  // @param {string} nodeName - Element type to isolate styles of child DOM
  document.isolateShadowStyles = function(nodeName){
    var shadowChildren = findChildren(nodeName);
    if(parsedSheets === undefined){
      parsedSheets = 'loading';
      loadAllStyleSheets(function(data){
        // Actually a synchronous callback
        parsedSheets = data;
        updateShadowCss(shadowChildren, parsedSheets);
      });
    }else if(parsedSheets !== 'loading'){
      // Should never see parsedSheets as 'loading'
      updateShadowCss(shadowChildren, parsedSheets);
    };
  };

  // Watch for changes to shadowed elements
  var observer = new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      if(mutation.type === 'attributes' && mutation.attributeName !== BUFFER_ATTR){
        updateShadowCss([mutation.target], parsedSheets);
      }else if(mutation.type === 'childList'){
        var sorted = [];
        Array.prototype.forEach.call(mutation.addedNodes, function(el){
          var removed = Array.prototype.indexOf.call(mutation.removedNodes, el);
          if(el.nodeName !== '#text' && !el.getAttribute(BUFFER_ATTR)){
            sorted.push(el);
          };
        });
        if(sorted.length > 0){
          updateShadowCss(sorted, parsedSheets);
        };
      };
    });
  });

  // Modify document styles to place selected element child DOM in a simulated
  // shadow.
  // @param {[element]} children - Which elements to simulate child DOM in
  //                               shadow
  // @param {[obj]}    parsedCss - Output from loadAllStyleSheets()
  var updateShadowCss = function(children, parsedCss){
    var output = '';
    parsedCss.forEach(function(sheetMeta){
      var stylesheet;
      if(sheetMeta.parsedData){
        stylesheet = JSON.parse(sheetMeta.parsedData);
      }else{
        stylesheet = css.parse(sheetMeta.data);
        sheetMeta.parsedData = JSON.stringify(stylesheet);
      };
      // Helper function relies on scope
      var handleRule = function(rule){
        rule.selectors.forEach(function(selector, selectorIndex){
          if(selector.indexOf('::shadow') > -1){
            // Shadow DOM is simply Child DOM
            selector = selector.replace('::shadow', '');
            rule.selectors[selectorIndex] = selector;
          }else{
            var selectorKey = selector + '@' +
                                rule.position.start.line + ':' +
                                rule.position.start.column;
            var replacedIndex = sheetMeta.replacedSelectors.indexOf(selectorKey);
            if(replacedIndex > -1){
              // Selector already negated, update output
              var selectorId = sheetMeta.selectorIds[replacedIndex];
              selector = insertBufferAttr(selector, selectorId);
              rule.selectors[selectorIndex] = selector;
            };
            // Negate selector for all Shadow DOM
            Array.prototype.forEach.call(children, function(child){
              observer.observe(child, {attributes: true, childList: true});
              var attrVal = child.getAttribute(BUFFER_ATTR);
              if(!attrVal){
                // Initialize attribute
                attrVal = 'z'; // Any string will do
                child.setAttribute(BUFFER_ATTR, attrVal);
              };
              // Match without pseudo classs in the selector
              var selectorToMatch = selector.replace(pseudoClassRegex, '');
              try{
                var isMatch = child.matches && child.matches(selectorToMatch);
              }catch(err){
                // Invalid selector
                // console.log(err);
                return;
              };
              if(isMatch){
                var selectorId;
                var bufferPos = selector.indexOf(':not([' + BUFFER_ATTR + '*=');
                if(replacedIndex > -1){
                  // selector already negated
                  selectorId = sheetMeta.selectorIds[replacedIndex];
                }else if(bufferPos === -1){
                  // not yet negated, generate selector unique id
                  // trust that it's unique...checking would take too long!
                  // Just up the length if there is possibility of a dupe
                  selectorId = randomString(UNIQUE_ID_LENGTH);
                  selector = insertBufferAttr(selector, selectorId);
                  rule.selectors[selectorIndex] = selector;
                  // add record to meta object
                  sheetMeta.replacedSelectors.push(selectorKey);
                  sheetMeta.selectorIds.push(selectorId);
                }else{
                  // negated, selectorId is after bufferPos
                  selectorId = selector.substr(bufferPos + BUFFER_ATTR.length + 9,
                                               UNIQUE_ID_LENGTH);
                };
                if(attrVal.indexOf(selectorId) === -1){
                  // add unique id to child if not included
                  attrVal += selectorId;
                  child.setAttribute(BUFFER_ATTR, attrVal);
                };
              };
            });
          };
        });
      };
      // Crawl the stylesheet
      stylesheet.stylesheet.rules.forEach(function(rule, ruleIndex){
        if(rule.type === 'rule'){
          handleRule(rule);
        }else if(rule.type === 'media'){
          rule.rules.forEach(function(subRule){
            handleRule(subRule);
          });
        };
      });
      output += css.stringify(stylesheet);

      if(sheetMeta.el){
        // Remove old stylesheet element
        sheetMeta.el.parentNode.removeChild(sheetMeta.el);
        delete sheetMeta.el;
      };
    });

    if(processedStyleEl){
      if(processedStyleEl.innerHTML === output){
        // Don't exchange styles if the output didn't change
        return;
      }else{
        // Remove old processed styles
        processedStyleEl.parentNode.removeChild(processedStyleEl);
      };
    };
    // Insert updated styles
    processedStyleEl = insertStyleElement(output);
  };

  // Add buffer attribute to selector
  // Takes existing pseudo class position into consideration
  // @param {string} selector
  // @param {string} selectorId - unique identifier
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

  // Load all the page's stylesheets and then call css event on document
  // Requests are made synchronously to allow script to run before page render
  // @param {function} callback - One parameter: array output {el, data}
  var loadAllStyleSheets = function(callback) {
    var parsedCss = [];
    //read style tags
    var styleElements = document.querySelectorAll('style');
    Array.prototype.forEach.call(styleElements, function(style){
      parsedCss.push({
        data: style.innerHTML,
        el: style,
        replacedSelectors: [],
        selectorIds: []
      });
    });
    //read linked stylesheets
    var linkCount = 0, linkReturn = 0;
    var linkElements = document.querySelectorAll("link[rel=stylesheet]");
    Array.prototype.forEach.call(linkElements, function(link){
      linkCount++;
      var path = link.href.slice(0, link.href.lastIndexOf("/") + 1);
      var request = new XMLHttpRequest();
      var onComplete = function(){
        linkReturn++;
        if(linkCount === linkReturn){
          callback(parsedCss);
        };
      };

      request.onload = function() {
        if(request.status >= 200 && request.status < 400){
          // Success!
          parsedCss.push({
            data: request.responseText,
            el: link,
            replacedSelectors: [],
            selectorIds: []
          });
        }else{
          // We reached our target server, but it returned an error
        };
        onComplete();
      };

      request.onerror = function() {
        // There was a connection error of some sort
        onComplete();
      };
      // Perform synchronous request (should already be cached)
      request.open('GET', link.href, false);
      request.send(null);
    });
  };

  // @param {string} selector - Element node name
  // @return {array} - Child Elements
  var findChildren = function(selector) {
    var roots = document.querySelectorAll(selector);
    var children = [];
    Array.prototype.forEach.call(roots, function(rootEl){
      observer.observe(rootEl, {attributes: true, childList: true});
      var found = rootEl.querySelectorAll('*');
      Array.prototype.forEach.call(found, function(child){
        children.push(child);
      });
    });
    return children;
  };

  // @param {string} data - CSS Text
  // @return {element} - Inserted style element
  var insertStyleElement = function(data){
    var head = document.head || document.getElementsByTagName('head')[0];
    var newStyle = document.createElement('style');

    newStyle.type = 'text/css';
    if(newStyle.styleSheet){
      newStyle.styleSheet.cssText = data;
    }else{
      newStyle.appendChild(document.createTextNode(data));
    };

    head.appendChild(newStyle);
    return newStyle;
  };

  // @param {integer} length
  // @return {string}
  var randomString = function(length){
    if(length === undefined){
      length = 10;
    };
    var text = "",
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
    for( var i=0; i < length; i++ ){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    };
    return text;
  };

  var pseudoClassRegex = new RegExp('(:after|:before|:hover|:active|:focus|' +
        ':checked|:valid|:invalid)', 'gi');
})();
