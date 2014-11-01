// shadow dom css isolation simulator polyfill
// MIT License, ben@latenightsketches.com
(function(){
  // A buffer must be made to bridge the elements to negated CSS selectors
  var BUFFER_ATTR = 'data-css-selector';
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
        parsedSheets = data;
        updateShadowCss(shadowChildren, parsedSheets);
      });
    }else if(parsedSheets !== 'loading'){
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
      stylesheet.stylesheet.rules.forEach(function(rule, ruleIndex){
        if(rule.type === 'rule'){
          rule.selectors.forEach(function(selector, selectorIndex){
            if(selector.indexOf('::shadow') > -1){
              // Shadow DOM is simply Child DOM
              selector = selector.replace('::shadow', '');
              stylesheet.stylesheet.rules[ruleIndex].
                selectors[selectorIndex] = selector;
            }else{
              var selectorKey = selector + '@' +
                                  rule.position.start.line + ':' +
                                  rule.position.start.column;
              var replacedIndex = sheetMeta.replacedSelectors.indexOf(selectorKey);
              if(replacedIndex > -1){
                var selectorId = sheetMeta.selectorIds[replacedIndex];
                selector = selector +
                  ':not([' + BUFFER_ATTR + '*="' + selectorId + '"])';
                stylesheet.stylesheet.rules[ruleIndex].
                  selectors[selectorIndex] = selector;
              };
              // Negate selector for all Shadow DOM
              Array.prototype.forEach.call(children, function(child){
                observer.observe(child, {attributes: true, childList: true});
                if(child.matches && child.matches(selector)){
                  var selectorId;
                  if(replacedIndex > -1){
                    selectorId = sheetMeta.selectorIds[replacedIndex];
                  }else if(selector.indexOf(':not([' + BUFFER_ATTR + '*=') === -1){
                    // generate selector unique id if doesnt exist
                    selectorId = randomString(10);
                    selector = selector +
                      ':not([' + BUFFER_ATTR + '*="' + selectorId + '"])';
                    stylesheet.stylesheet.rules[ruleIndex].
                      selectors[selectorIndex] = selector;
                    sheetMeta.replacedSelectors.push(selectorKey);
                    sheetMeta.selectorIds.push(selectorId);
                  }else{
                    // selectorId is at end, capped by '"])'
                    selectorId = selector.substr(-13, 10);
                  };
                  // add unique id to child if not included
                  var attrVal = child.getAttribute(BUFFER_ATTR);
                  if(!attrVal){
                    child.setAttribute(BUFFER_ATTR, selectorId);
                  }else if(attrVal.indexOf(selectorId) === -1){
                    child.setAttribute(BUFFER_ATTR, attrVal + selectorId);
                  };
                };
              });
            };
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

    // Remove old processed styles
    if(processedStyleEl){
      processedStyleEl.parentNode.removeChild(processedStyleEl);
    };
    // Insert updated styles
    processedStyleEl = insertStyleElement(output);
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
          resp = request.responseText;
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

})();
