/**
 @namespace Nehan.DefaultStyle
 @description <pre>

 Important notices about style.js
 ================================

 1. some properties uses 'logical' properties
 --------------------------------------------

 [examples]
 Assume that flow of body is "lr-tb".

 ex1. {margin:{before:"10px"}} // => {margin:{top:"10px"}}
 ex2. {float:"start"} // => {float:"left"}.
 ex3. {measure:"100px", extent:"50px"} // => {width:"100px", height:"50px"}

 2. about functional css value
 ------------------------------

 you can use functional css value in each css property.

 (2.1) callback argument 'context' in functional css value is 'SelectorPropContext'

 // [example]
 // change backgroiund-color by child index.
 ".stripe-list li":{
   "background-color":function(context){
     return (context.getChildIndex() % 2 === 0)? "pink" : "white";
   }
 }

 (2.2) callback argument 'context' in 'onload' is 'SelectorContext'

 this context is 'extended class' of 'SelectorPropContext', with some extra interfaces
 that can touch css object, because 'onload' is called after all css of matched elements are loaded.

 // [example]
 // force image metrics to square sizing if width and height is not same.
 ".must-be-squares img":{
   "onload":function(context){
     var width = context.getCssAttr("width", 100);
     var height = context.getCssAttr("height", 100);
     if(width !== height){
       var larger = Math.max(width, height);
       return {width:larger, height:larger};
     }
   }
 }

 3. special properties in nehan.js
 ----------------------------------

 (3.1) box-sizing:[content-box | border-box | margin-box(default)]

 In box-sizing, 'margin-box' is special value in nehan.js, and is box-sizing default value.
 In margin-box, even if margin is included in box-size.

 Why? In normal html, outer measure size of box can be expanded,
 but in paged layout, outer measure size is strictly fixed.
 So if you represent margin/border/padding(called 'box-edge' in nehan.js),
 the only way is 'eliminating content space'.

 (3.2) flow:[lr-tb | rl-tb | tb-rl | tb-lr | flip]

 This property represents 'writing-mode' in nehan.js.

 'lr-tb' means that inline flows 'left to right', block flows 'top to bottom'.

 'tb-rl' means that inline flows 'top to bottom', block flows 'right to left', and so on.

 'flip' means that toggle 'Nehan.Config.boxFlowSet.hori' and 'Nehan.Config.boxFlowSet.vert'.
 </pre>
 */
Nehan.DefaultStyle = (function(){
  var __header_margin = function(ctx){
    var em = ctx.style.getFontSize();
    var rem = ctx.style.getRootFont().size;
    return {
      before:Math.floor(2 * rem - 0.14285 * em),
      after:rem
    };
  };
  return {
    create : function(){
      return {
	//-------------------------------------------------------
	// tag / a
	//-------------------------------------------------------
	"a":{
	  "display":"inline"
	},
	"abbr":{
	  "display":"inline"
	},
	"address":{
	  //"section":true,
	  "display":"inline",
	  "font-style":"italic"
	},
	"area":{
	},
	"article":{
	  //"section":true,
	  "display":"block"
	},
	"aside":{
	  //"section":true,
	  "display":"block"
	},
	"audio":{
	},
	//-------------------------------------------------------
	// tag / b
	//-------------------------------------------------------
	"b":{
	  "display":"inline",
	  "font-weight":"bold"
	},
	"base":{
	},
	"bdi":{
	  "display":"inline"
	},
	"bdo":{
	  "display":"inline"
	},
	"blockquote":{
	  "color":"#666666",
	  "display":"block",
	  //"section-root":true,
	  "padding":{
	    "start":"1em",
	    "end":"1em",
	    "before":"0.5em",
	    "after":"0.5em"
	  },
	  "margin":{
	    "after":"1.5em"
	  }
	},
	"body":{
	  "display":"block",
	  "flow":"lr-tb",
	  "box-sizing":"content-box",
	  //"section-root":true,
	  "hanging-punctuation":"allow-end"
	},
	"br":{
	  "display":"inline"
	},
	"button":{
	  //"interactive":true,
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / c
	//-------------------------------------------------------
	"canvas":{
	  //"embeddable":true,
	  "display":"inline"
	},
	"caption":{
	  "display":"table-caption",
	  "text-align":"center",
	  "margin":{
	    "after":"0.5em"
	  }
	},
	"cite":{
	  "display":"inline"
	},
	"code":{
	  "font-family":"'andale mono', 'lucida console', monospace",
	  "display":"inline"
	},
	"col":{
	  "display":"table-column"
	},
	"colgroup":{
	  "display":"table-column-group"
	},
	"command":{
	},
	//-------------------------------------------------------
	// tag / d
	//-------------------------------------------------------
	"datalist":{
	},
	"dd":{
	  "display":"block",
	  "margin":{
	    "start":"1em",
	    "end":"1em",
	    "after":"1.6em"
	  }
	},
	"del":{
	  "color":"#666666",
	  "display":"inline"
	},
	"details":{
	  //"section-root":true,
	  "display":"block"
	},
	"dfn":{
	  "display":"inline",
	  "font-style":"italic"
	},
	"div":{
	  "display":"block"
	},
	"dl":{
	  "display":"block"
	},
	"dt":{
	  "display":"block",
	  "font-weight":"bold",
	  "margin":{
	    "after":"1em"
	  }
	},
	//-------------------------------------------------------
	// tag / e
	//-------------------------------------------------------
	"em":{
	  "display":"inline",
	  "font-style":"italic"
	},
	"embed":{
	},
	//-------------------------------------------------------
	// tag / f
	//-------------------------------------------------------
	"fieldset":{
	  "display":"block",
	  //"section-root":true,
	  "padding":{
	    "start":"1em",
	    "end":"0.2em",
	    "before":"0.2em",
	    "after":"1em"
	  },
	  "margin":{
	    "after":"1.5em"
	  },
	  "border-width":"1px"
	},
	"figure":{
	  //"section-root":true,
	  "display":"block"
	},
	"figcaption":{
	  "display":"block",
	  "text-align":"center",
	  "font-size": "0.8em"
	},
	"footer":{
	  //"section":true,
	  "display":"block"
	},
	// need to define to keep compatibility.
	"font":{
	  "display":"inline"
	},
	"form":{
	  "display":"block"
	},
	//-------------------------------------------------------
	// tag / h
	//-------------------------------------------------------
	"h1":{
	  "display":"block",
	  "font-size":"2.4em",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "font-weight":"bold",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"h2":{
	  "display":"block",
	  "font-size":"2.0em",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "font-weight":"bold",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"h3":{
	  "display":"block",
	  "font-size":"1.6em",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "font-weight":"bold",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"h4":{
	  "display":"block",
	  "font-size":"1.4em",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "font-weight":"bold",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"h5":{
	  "display":"block",
	  "font-size":"1.0em",
	  "font-weight":"bold",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"h6":{
	  "display":"block",
	  "font-weight":"bold",
	  "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
	  "font-size":"1.0em",
	  "line-height":"1.4em",
	  "margin":__header_margin
	},
	"head":{
	  "display":"none"
	},
	"header":{
	  //"section":true,
	  "display":"block"
	},
	"hr":{
	  "display":"block",
	  "box-sizing":"content-box",
	  "border-color":"#b8b8b8",
	  "border-style":"solid",
	  "line-height":"1em",
	  "margin":{
	    "after":"1em"
	  },
	  "extent":"1px",
	  "border-width":{
	    "after":"1px"
	  }
	},
	"hr.space":{
	  "border-width":"0px"
	},
	"html":{
	  "display":"block"
	},
	//-------------------------------------------------------
	// tag / i
	//-------------------------------------------------------
	"i":{
	  "display":"inline"
	},
	"iframe":{
	  //"embeddable":true,
	  "display":"block"
	},
	"ins":{
	},
	"img":{
	  "display":"inline"
	  //"box-sizing":"content-box"
	},
	"input":{
	  //"interactive":true,
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / k
	//-------------------------------------------------------
	"kbd":{
	  "display":"inline"
	},
	"keygen":{
	},
	//-------------------------------------------------------
	// tag / l
	//-------------------------------------------------------
	"label":{
	  "display":"inline"
	},
	"legend":{
	  "display":"block",
	  "font-weight":"bold",
	  "line-height":"1.5em"
	},
	"li":{
	  "display":"list-item",
	  "margin":{
	    "after":"0.6em"
	  }
	},
	"link":{
	  //"meta":true
	},
	//-------------------------------------------------------
	// tag / m
	//-------------------------------------------------------
	"main":{
	  "display":"block"
	},
	"map":{
	},
	"mark":{
	  "display":"inline"
	},
	"menu":{
	  "display":"block"
	},
	"meta":{
	  //"meta":true
	},
	"meter":{
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / n
	//-------------------------------------------------------
	"nav":{
	  //"section":true,
	  "display":"block"
	},
	"noscript":{
	  //"meta":true
	},
	//-------------------------------------------------------
	// tag / o
	//-------------------------------------------------------
	"object":{
	  //"embeddable":true,
	  "display":"inline"
	},
	"ol":{
	  "display":"block",
	  "list-style-image":"none",
	  "list-style-position": "outside",
	  "list-style-type": "decimal",
	  "margin":{
	    "before":"1em"
	  }
	},
	"optgroup":{
	},
	"option":{
	},
	"output":{
	},
	//-------------------------------------------------------
	// tag / p
	//-------------------------------------------------------
	"p":{
	  "display":"block",
	  "margin":{
	    "after":"1rem"
	  }
	},
	"param":{
	},
	"pre":{
	  "display":"block",
	  "white-space":"pre"
	},
	"progress":{
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / q
	//-------------------------------------------------------
	"q":{
	  "display":"block"
	},
	//-------------------------------------------------------
	// tag / r
	//-------------------------------------------------------
	"rb":{
	  "display":"inline"
	},
	"rp":{
	  "display":"inline"
	},
	"ruby":{
	  "display":"inline"
	},
	"rt":{
	  "font-size":"0.5em",
	  "line-height":"1.0em",
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / s
	//-------------------------------------------------------
	"s":{
	  "display":"inline"
	},
	"samp":{
	  "display":"inline"
	},
	"script":{
	  //"meta":true,
	  "display":"inline"
	},
	"section":{
	  //"section":true,
	  "display":"block"
	},
	"select":{
	},
	"small":{
	  "display":"inline",
	  "font-size":"0.8em"
	},
	"source":{
	},
	"span":{
	  "display":"inline"
	},
	"strong":{
	  "display":"inline",
	  "font-weight":"bold"
	},
	"style":{
	  //"meta":true,
	  "display":"inline"
	},
	"sub":{
	  "display":"inine"
	},
	"summary":{
	  "display":"inline"
	},
	"sup":{
	  "display":"inine"
	},
	//-------------------------------------------------------
	// tag / t
	//-------------------------------------------------------
	"table":{
	  "display":"table",
	  //"embeddable":true,
	  "table-layout":"fixed",
	  //"table-layout":"auto",
	  "background-color":"white",
	  "border-collapse":"collapse", // 'separate' is not supported yet.
	  "border-color":"#a8a8a8",
	  "border-style":"solid",
	  //"border-spacing":"5px", // TODO: support batch style like "5px 10px".
	  "border-width":"1px",
	  "margin":{
	    "start":"0.5em",
	    "end":"0.5em",
	    "after":"1.6em"
	  }
	},
	"tbody":{
	  "display":"table-row-group",
	  "border-collapse":"inherit"
	},
	"td":{
	  "display":"table-cell",
	  //"section-root":true,
	  "border-width":"1px",
	  "border-color":"#a8a8a8",
	  "border-collapse":"inherit",
	  "border-style":"solid",
	  "padding":{
	    "start":"0.5em",
	    "end":"0.5em",
	    "before":"0.4em",
	    "after":"0.4em"
	  }
	},
	"textarea":{
	  //"embeddable":true,
	  //"interactive":true,
	  "display":"inline"
	},
	"tfoot":{
	  "display":"table-footer-group",
	  "border-width":"1px",
	  "border-color":"#a8a8a8",
	  "border-collapse":"inherit",
	  "border-style":"solid",
	  "font-style":"italic"
	},
	"th":{
	  "display":"table-cell",
	  "line-height":"1.4em",
	  "border-width":"1px",
	  "border-color":"#a8a8a8",
	  "border-collapse":"inherit",
	  "border-style":"solid",
	  "padding":{
	    "start":"0.5em",
	    "end":"0.5em",
	    "before":"0.4em",
	    "after":"0.4em"
	  }
	},
	"thead":{
	  "display":"table-header-group",
	  "font-weight":"bold",
	  "background-color":"#c3d9ff",
	  "border-width":"1px",
	  "border-color":"#a8a8a8",
	  "border-collapse":"inherit",
	  "border-style":"solid"
	},
	"time":{
	  "display":"inline"
	},
	"title":{
	  //"meta":true
	},
	"tr":{
	  "display":"table-row",
	  "border-collapse":"inherit",
	  "border-color":"#a8a8a8",
	  "border-width":"1px",
	  "border-style":"solid"
	},
	"track":{
	},
	//-------------------------------------------------------
	// tag / u
	//-------------------------------------------------------
	"u":{
	  "display":"inline"
	},
	"ul":{
	  "display":"block",
	  "list-style-image":"none",
	  "list-style-type":"disc",
	  "list-style-position":"outside",
	  "margin":{
	    "before":"1em"
	  }
	},
	//-------------------------------------------------------
	// tag / v
	//-------------------------------------------------------
	"var":{
	  "display":"inline"
	},
	"video":{
	  //"embeddable":true,
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / w
	//-------------------------------------------------------
	"wbr":{
	  "display":"inline"
	},
	//-------------------------------------------------------
	// tag / others
	//-------------------------------------------------------
	"?xml":{
	},
	"!doctype":{
	},
	// <page-break>, <pbr>, <end-page> are all same and nehan.js original tag,
	// defined to keep compatibility of older nehan.js document,
	// and must be defined as logical-break-before, logical-break-after props in the future.
	"page-break":{
	  "display":"inline"
	},
	"pbr":{
	  "display":"inline"
	},
	"end-page":{
	  "display":"inline"
	},
	//-------------------------------------------------------
	// rounded corner
	//-------------------------------------------------------
	".rounded":{
	  "padding":{
	    before:"1.6em",
	    end:"1.0em",
	    after:"1.6em",
	    start:"1.0em"
	  },
	  "border-radius":"10px"
	},
	//-------------------------------------------------------
	// font-size classes
	//-------------------------------------------------------
	".xx-large":{
	  "font-size": Nehan.Config.absFontSizes["xx-large"]
	},
	".x-large":{
	  "font-size": Nehan.Config.absFontSizes["x-large"]
	},
	".large":{
	  "font-size": Nehan.Config.absFontSizes.large
	},
	".medium":{
	  "font-size": Nehan.Config.absFontSizes.medium
	},
	".small":{
	  "font-size": Nehan.Config.absFontSizes.small
	},
	".x-small":{
	  "font-size": Nehan.Config.absFontSizes["x-small"]
	},
	".xx-small":{
	  "font-size": Nehan.Config.absFontSizes["xx-small"]
	},
	".larger":{
	  "font-size": Nehan.Config.absFontSizes.larger
	},
	".smaller":{
	  "font-size": Nehan.Config.absFontSizes.smaller
	},
	//-------------------------------------------------------
	// box-sizing classes
	//-------------------------------------------------------
	".content-box":{
	  "box-sizing":"content-box"
	},
	".border-box":{
	  "box-sizing":"border-box"
	},
	".margin-box":{
	  "box-sizing":"margin-box"
	},
	//-------------------------------------------------------
	// display classes
	//-------------------------------------------------------
	".disp-none":{
	  "display":"none"
	},
	".disp-block":{
	  "display":"block"
	},
	".disp-inline":{
	  "display":"inline"
	},
	".disp-iblock":{
	  "display":"inline-block"
	},
	//-------------------------------------------------------
	// text-align classes
	//-------------------------------------------------------
	".ta-start":{
	  "text-align":"start"
	},
	".ta-center":{
	  "text-align":"center"
	},
	".ta-end":{
	  "text-align":"end"
	},
	".ta-justify":{
	  "text-align":"justify"
	},
	//-------------------------------------------------------
	// float classes
	//-------------------------------------------------------
	".float-start":{
	  "float":"start"
	},
	".float-end":{
	  "float":"end"
	},
	//-------------------------------------------------------
	// float classes
	//-------------------------------------------------------
	".clear-start":{
	  "clear":"start"
	},
	".clear-end":{
	  "clear":"end"
	},
	".clear-both":{
	  "clear":"both"
	},
	//-------------------------------------------------------
	// flow classes
	//-------------------------------------------------------
	".flow-lr-tb":{
	  "flow":"lr-tb"
	},
	".flow-tb-rl":{
	  "flow":"tb-rl"
	},
	".flow-tb-lr":{
	  "flow":"tb-lr"
	},
	".flow-rl-tb":{
	  "flow":"rl-tb"
	},
	".flow-flip":{
	  "flow":"flip"
	},
	//-------------------------------------------------------
	// list-style-position classes
	//-------------------------------------------------------
	".lsp-inside":{
	  "list-style-position":"inside"
	},
	".lsp-outside":{
	  "list-style-position":"outside"
	},
	//-------------------------------------------------------
	// list-style-type classes
	//-------------------------------------------------------
	".lst-none":{
	  "list-style-type":"none"
	},
	".lst-decimal":{
	  "list-style-type":"decimal"
	},
	".lst-disc":{
	  "list-style-type":"disc"
	},
	".lst-circle":{
	  "list-style-type":"circle"
	},
	".lst-square":{
	  "list-style-type":"square"
	},
	".lst-decimal-leading-zero":{
	  "list-style-type":"decimal-leading-zero"
	},
	".lst-lower-alpha":{
	  "list-style-type":"lower-alpha"
	},
	".lst-upper-alpha":{
	  "list-style-type":"upper-alpha"
	},
	".lst-lower-latin":{
	  "list-style-type":"lower-latin"
	},
	".lst-upper-latin":{
	  "list-style-type":"upper-latin"
	},
	".lst-lower-roman":{
	  "list-style-type":"lower-roman"
	},
	".lst-upper-roman":{
	  "list-style-type":"upper-roman"
	},
	".lst-lower-greek":{
	  "list-style-type":"lower-greek"
	},
	".lst-upper-greek":{
	  "list-style-type":"upper-greek"
	},
	".lst-cjk-ideographic":{
	  "list-style-type":"cjk-ideographic"
	},
	".lst-hiragana":{
	  "list-style-type":"hiragana"
	},
	".lst-hiragana-iroha":{
	  "list-style-type":"hiragana-iroha"
	},
	".lst-katakana":{
	  "list-style-type":"katakana"
	},
	".lst-katakana-iroha":{
	  "list-style-type":"katakana-iroha"
	},
	//-------------------------------------------------------
	// text-combine
	//-------------------------------------------------------
	".tcy":{
	  "text-combine":"horizontal"
	},
	".text-combine":{
	  "text-combine":"horizontal"
	},
	//-------------------------------------------------------
	// text emphasis
	//-------------------------------------------------------
	".empha-dot-filled":{
	  "text-emphasis-style":"filled dot"
	},
	".empha-dot-open":{
	  "text-emphasis-style":"open dot"
	},
	".empha-circle-filled":{
	  "text-emphasis-style":"filled circle"
	},
	".empha-circle-open":{
	  "text-emphasis-style":"open circle"
	},
	".empha-double-circle-filled":{
	  "text-emphasis-style":"filled double-circle"
	},
	".empha-double-circle-open":{
	  "text-emphasis-style":"open double-circle"
	},
	".empha-triangle-filled":{
	  "text-emphasis-style":"filled triangle"
	},
	".empha-triangle-open":{
	  "text-emphasis-style":"open triangle"
	},
	".empha-sesame-filled":{
	  "text-emphasis-style":"filled sesame"
	},
	".empha-sesame-open":{
	  "text-emphasis-style":"open sesame"
	},
	//-------------------------------------------------------
	// break
	//-------------------------------------------------------
	".break-before":{
	  "break-before":"always"
	},
	".break-after":{
	  "break-after":"always"
	},
	//-------------------------------------------------------
	// word-break
	//-------------------------------------------------------
	".wb-all":{
	  "word-break":"break-all"
	},
	".wb-normal":{
	  "word-break":"normal"
	},
	".wb-keep":{
	  "word-break":"keep-all"
	},
	//-------------------------------------------------------
	// combination
	//-------------------------------------------------------
	"ul ul":{
	  margin:{before:"0"}
	},
	"ul ol":{
	  margin:{before:"0"}
	},
	"ol ol":{
	  margin:{before:"0"}
	},
	"ol ul":{
	  margin:{before:"0"}
	},
	//-------------------------------------------------------
	// list marker
	//-------------------------------------------------------
	"li::marker":{
	  padding:{end:"0.3em"}
	},
	//-------------------------------------------------------
	// other utility classes
	//-------------------------------------------------------
	".drop-caps::first-letter":{
	  "display":"block",
	  "box-sizing":"content-box",
	  "float":"start",
	  "font-size":"4em",
	  "measure":"1em",
	  "extent":"1em",
	  "padding":{before:"0.1em"},
	  "line-height":"1em"
	},
	".gap-start":{
	  "margin":{
	    "start":"1em"
	  }
	},
	".gap-end":{
	  "margin":{
	    "end":"1em"
	  }
	},
	".gap-after":{
	  "margin":{
	    "after":"1em"
	  }
	},
	".gap-before":{
	  "margin":{
	    "before":"1em"
	  }
	}
      };
    } // function : create(){
  }; // return
})();
