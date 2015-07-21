# nehan.js

## Introduction

nehan.js is dynamic and logical html layout engine written in javascript, especially focused on generating **logical paged media** asynchronously.

In nehan.js, you can write styles in javascript context, so `functional css property` is supported(and various other hooks are supported).

Almost all html5 tags are supported, and further more, vertical layout(lr-tb, rl-tb) supported.

Available on IE8+, Firefox3.5+, Google Chrome4+, Safari3+, Opera10+ etc.

See [demo](http://tb.antiscroll.com/static/nehan-demo/) or [playground(Japanese)](http://tb.antiscroll.com/static/editor).

## Install

Include css, js in the ``<head>``

```html
<link href="/path/to/nehan.css" type="text/css" rel="stylesheet">
<script src="/path/to/nehan.js" type="text/javascript"></script>
```

## Application sample

- [Nehan Reader/Paged-media reader for google chrome](https://chrome.google.com/webstore/detail/nehan-reader/bebbekgiffjpgjlgkkhmlgheckolmdcf)
- [nehan.js playground!!](http://tb.antiscroll.com/static/editor/)
- [Responsivook](http://tb.antiscroll.com/static/responsivook/)

## Screenshot

These screenshots are layout result of [jekyll-nehan](https://github.com/tategakibunko/jekyll-nehan).

### 1. horizontal paged media
<img src="https://raw.github.com/tategakibunko/jekyll-nehan/master/assets/sshot-hori.png" width="300" height="160" />

### 2. vertical paged media
<img src="https://raw.github.com/tategakibunko/jekyll-nehan/master/assets/sshot-vert.png" width="300" height="160" />

## Quick Start 1 (for simple single page layout)

Note that we can use functional value for styles!!

```javascript
// NehanPagedElement is available for Nehan.version >= 5.0.3
var pe = Nehan.createPagedElement();

// before calling setContent, set 'body' style of this paged-element.
// note that you can't use camel-cased css property.
pe.setStyle("body", {
  "flow":"lr-tb",
  //"flow":"tb-rl", // for Japanese vertical
  "font-size":16, // use 'font-size' instead of 'fontSize'!
  "width":640,
  "height":480,
  // you can use functional css property!
  "background-color":function(prop_context){
    // you can get many pseudo-class in javascript.
    // console.log("nth-child:%d", prop_context.getChildIndex());
    // console.log("nth-of-type:%d", prop_context.getChildIndexOfType());
    // console.log("is-last-child:%o", prop_context.isLastChild());
    // console.log("is-only-child:%o", prop_context.isOnlyChild());
    return "white";
  },
  // called after after all props in "body" selector are loaded.
  "onload":function(selector_context){
    // console.log("nth-child:%d", selector_context.getChildIndex());
    // console.log("markup:%o", selector_context.getMarkup());
  },
  // called after "body" is converted into DOM Element.
  "oncreate":function(context){
    context.dom.onclick = function(){
      alert("body is clicked!");
    };
    // many various context data...
    // console.log("abstract logical box:%o", context.box);
    // console.log("abstract style info:%o", context.box.style);
    // console.log("markup info:%o", context.box.markup);
  }
});

// by setContent, paged-media is asynchronously generated.
pe.setContent("<h1>hello, nehan.js</h1>", {
  onProgress : function(tree){}, // tree.pageNo, tree.percent is available.
  onComplete : function(time){}
});

// set paged-media element to some target dom.
document.getElementById("result").appendChild(pe.getElement());

// set next/prev callback to some clickable target.
document.getElementById("next").onclick = function(){ pe.setNextPage() };
document.getElementById("prev").onclick = function(){ pe.setPrevPage() };
```

## Quick Start 2 (more flexible way)

```javascript
// create layout engine.
var engine = Nehan.createEngine();

// set body size(= page size)
engine.setStyle("body", {
  "flow":"lr-tb", // or "tb-rl"(vertical)
  "font-size":16,
  "width":640,
  "height":480
});

// generate page stream from engine.
var page_stream = engine.createPageStream("<h1>hello, nehan.js</h1>");

// get target dom.
var target_dom = document.getElementById("my-page-document");

// start parsing
page_stream.asyncGet({
  // called when each abstract layout tree is generated.
  onProgress: function(stream, tree){
    var page = stream.getPage(tree.pageNo); // tree -> page object
    target_dom.appendChild(page.element);
  },
  // called when all pages are generated.
  onComplete: function(stream, time){
    console.log("finished!! => %fmsec", time);
  }
});
```

### Styling(engine local style)

Engine local style is only available for the single engine.

```javascript
// create layout engine.
var engine = Nehan.createEngine();

// set engine local style.
engine.setStyles({
  // note that 'body size' = 'page size'.
  "body":{
    "flow":"lr-tb", // document mode horizontal
    //"flow":"tb-rl", // document mode vertical(Japanese)
    "width":"80%", // percent size from parent, 'screen.width' at this case.
    // "width":900, // direct size
    "height":"60%", // percent size from parent, 'screen.height' at this case.
    "font-size":16, // note that camel-case(fontSize) is not allowed.
    "font-family":"Meiryo",
    // functional property is supported.
    // about prop_context, see src/selector-prop-context.js
    "background-color":function(prop_context){
      // you can use many pseudo-class in javascript!!
      // console.log("nth-child:%d", prop_context.getChildIndex());
      // console.log("nth-of-type:%d", prop_context.getChildIndexOfType());
      // console.log("is-last-child:%o", prop_context.isLastChild());
      // console.log("is-only-child:%o", prop_context.isOnlyChild());
      return "white";
    },
    // onload callback is called after all the properties of this selector('body' at this case) are loaded.
    "onload":function(selector_context){
      var markup = selector_context.getMarkup();
      console.log(markup.getName()); // => "body"
      console.log(markup.getAttr("foo")); // => 'aaa' if <body foo='aaa'>
      console.log(markup.getData("fuga")); // => '10' if <body data-fuga='10'>
      console.log(markup.getContent()); // => 'hello' if <body>hello</body>
      console.log(markup.getCssAttr("font-family")); // => 'Meiryo'

      // you can overwrite content dynamically like this.
      markup.setContent(markup.getContent() + "!!");

      // other context variables(see src/selector-prop-context.js or src/selector-context.js)
      console.log("nth-child is %d", selector_context.getChildIndex());
      console.log("nth-child-of-type is %d", selector_context.getChildIndexOfType());
      console.log("rest extent size is %d", selector_context.getRestExtent());
      console.log("rest measure size is %d", selector_context.getRestMeasure());
    },
    // oncreate callback is called when this element is actually generated by evaluator.
    "oncreate":function(context){
      context.dom.onclick = function(){
        alert("hello!");
      };
      console.log("abstract logical layout:%o", context.box);
      console.log("style context:%o", context.box.style);
      console.log("markup object:%o", context.box.markup);
    }
  },
  // you can use regexp as element name like this.
  "header /h[1-6]/":{
    "font-weight":"bold",
    // note that directions in nehan.js are defined as 'logical' like this.
    "margin":{
      "after":"1.5em" // 'after' is 'bottom' if body.flow = 'lr-tb'('left' if 'tb-rl').
    }
  }
});
```

### important notice about css properties in nehan.js
Note that camel case is not allowed for css properties.

- "font-size":16 => OK
- "fontSize":16 => NG

## Styling(global style)

Instead of <code>engine.setStyle</code> or <code>pe.setStyle</code>, <code>Nehan.setStyle</code> is used to set **global style**.

Global styles are shared by all engines created in same window.

```javascript
Nehan.setStyle("body", {
  "font-size":16
});

// multiple values by setStyles.
Nehan.setStyles({
  "body":{
    "color":"#ccc"
  },
  "h1":{
    "font-size":"3em"
  }
});
```

## License

MIT License
