# Experimental Shadow DOM CSS Polyfill

Bring support for isolated CSS in shadow elements to browsers that do not natively support `Element.createShadowRoot()`. (Firefox, IE9+)

Use at your own risk! Still under construction. [View Demo](http://numtel.github.io/shadowcss-polyfill-demo)

## How it works

1. Search for child DOM of elements to isolate.
2. Find which rules apply to those elements and add a `:not(buffer-attr*="uniqueId")` 
    pseudo-class with a unique ID to each rule. Shadowed elements gain the buffer 
    attribute containing the unique ID of each negated rule.
3. Selectors containing `::shadow` become normal child selectors.

## Todo

* ~~link media attribute pass through~~
* ~~do not remove sheets that weren't loaded~~
* ~~support multiple element types concurrently~~
* url path rewriting
* ~~parse rules inside media at-rules~~
* support @import
* ~~mutationobserver~~
* ~~pseudo-classes must be stripped for matching~~
* ~~reorganize loadcss to onload, allow tag declaration before onload~~
* discussion of all shadows as child dom
* overload createshadowroot
* support style/link tags inside shadowroot with scoping and :host pseudo rewrite
