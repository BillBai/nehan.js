/*
  About 'line-rate' property in nehan.

  In normal html, size of 'line-height:1.0em' is determined by
  font size of 'parent' block.

  In contrast, property line-rate is determined by max font size of
  'current line'.

  Assume that font-size of parent block is 16px, and max font size of
  current line is 32px, line-height:1.0em is 16px, but line-rate:1.0em is 32px.
 */
var Style = {
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
    "display":"inline",
    "font-style":"italic",
    "section":true
  },
  "area":{
  },
  "article":{
    "display":"block",
    "section":true
  },
  "aside":{
    "display":"block",
    "section":true
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
    "section-root":true,
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
    "section-root":true
  },
  "br":{
    "display":"inline",
    "single":true
  },
  "button":{
    "display":"inline",
    "interactive":true
  },
  //-------------------------------------------------------
  // tag / c
  //-------------------------------------------------------
  "canvas":{
    "display":"inline",
    "embeddable":true
  },
  "caption":{
    "display":"block",
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
  },
  "colgroup":{
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
    "display":"block",
    "section-root":true
  },
  "dfn":{
    "display":"inline",
    "font-style":"italic"
  },
  "div":{
    "display":"block",

    // using div tag with static size, inline html can be embeded.
    //  <div width="100" height="100">embed html</div>
    "embeddable":true
  },
  "dl":{
    "display":"block"
  },
  "dt":{
    "display":"block",
    "font-weight":"bold",
    "margin":{
      "after":"0.2em"
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
  // nehan original tag
  "end-page":{
    "display":"block",
    "single":true
  },
  //-------------------------------------------------------
  // tag / f
  //-------------------------------------------------------
  "fieldset":{
    "display":"block",
    "section-root":true,
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
    "display":"block",
    "section-root":true
  },
  "figcaption":{
    "display":"block",
    "text-align":"center",
    "font-size": "0.8em"
  },
  "footer":{
    "display":"block",
    "section":true
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
    "line-rate":1.4,
    "font-size":"2.4em",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "margin":{
      "after":"0.5em"
    }
  },
  "h2":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"2.0em",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "margin":{
      "after":"0.75em"
    }
  },
  "h3":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.6em",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "margin":{
      "after":"1em"
    }
  },
  "h4":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.4em",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "margin":{
      "after":"1.25em"
    }
  },
  "h5":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.0em",
    "font-weight":"bold",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "margin":{
      "after":"1.5em"
    }
  },
  "h6":{
    "display":"block",
    "line-rate":1.4,
    "font-weight":"bold",
    "font-family":"'Meiryo','メイリオ','Hiragino Kaku Gothic Pro','ヒラギノ角ゴ Pro W3','Osaka','ＭＳ Ｐゴシック', monospace",
    "font-size":"1.0em"
  },
  "head":{
  },
  "header":{
    "display":"block",
    "section":true
  },
  "hr":{
    "display":"block",
    "box-sizing":"content-box",
    "border-color":"#b8b8b8",
    "border-style":"solid",
    "single":true,
    "margin":{
      "after":"1em"
    },
    "border-width":{
      "after":"1px"
    }
  },
  "hr.nehan-space":{
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
    "display":"block",
    "embeddable":true
  },
  "ins":{
  },
  "img":{
    "display":"inline",
    "box-sizing":"content-box",
    "single":true
  },
  "input":{
    "display":"inline",
    "interactive":true,
    "single":true
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
    "line-rate":1.5
  },
  "li":{
    "display":"block",
    "margin":{
      "after":"0.6em"
    }
  },
  "li-mark":{
    "display":"block"
  },
  "li-body":{
    "display":"block"
  },
  "link":{
    "meta":true,
    "single":true
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
    "meta":true,
    "single":true
  },
  "meter":{
    "display":"inline"
  },
  //-------------------------------------------------------
  // tag / n
  //-------------------------------------------------------
  "nav":{
    "display":"block",
    "section":true
  },
  "noscript":{
    "meta":true
  },
  //-------------------------------------------------------
  // tag / o
  //-------------------------------------------------------
  "object":{
    "display":"inline",
    "embeddable":true
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
      "after":"1.5em"
    }
  },
  // this is nehan local syntax.
  // as we use <br> to break line,
  // we use <page-break> to break the page.
  "page-break":{
    "display":"block",
    "single":true
  },
  "param":{
  },
  "pre":{
    "display":"block"
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
    "line-rate":1.0,
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
    "display":"inline",
    "meta":true
  },
  "section":{
    "display":"block",
    "section":true
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
    "display":"inline",
    "meta":true
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
    "display":"block",
    "embeddable":true,
    "table-layout":"fixed", // 'auto' not supported yet.
    "background-color":"white",
    "border-collapse":"collapse", // 'separate' not supported yet.
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
    "display":"block"
  },
  "td":{
    "display":"block",
    "section-root":true,
    "border-width":"1px",
    "border-color":"#a8a8a8",
    "border-style":"solid",
    "padding":{
      "start":"0.8em",
      "end":"0.8em",
      "before":"0.5em",
      "after":"0.5em"
    }
  },
  "textarea":{
    "display":"inline",
    "embeddable":true,
    "interactive":true
  },
  "tfoot":{
    "display":"block",
    "border-color":"#a8a8a8",
    "border-style":"solid",
    "font-style":"italic"
  },
  "th":{
    "display":"block",
    "line-rate":1.4,
    "border-width":"1px",
    "border-color":"#a8a8a8",
    "border-style":"solid",
    "padding":{
      "start":"0.8em",
      "end":"0.8em",
      "before":"0.5em",
      "after":"0.5em"
    }
  },
  "thead":{
    "display":"block",
    "font-weight":"bold",
    "background-color":"#c3d9ff",
    "border-color":"#a8a8a8",
    "border-style":"solid"
  },
  "time":{
    "display":"inline"
  },
  "title":{
    "meta":true
  },
  "tr":{
    "display":"block",
    "border-color":"#a8a8a8",
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
    "display":"inline",
    "embeddable":true
  },
  //-------------------------------------------------------
  // tag / w
  //-------------------------------------------------------
  "wbr":{
    "display":"inline",
    "single":true
  },
  //-------------------------------------------------------
  // tag / others
  //-------------------------------------------------------
  "?xml":{
    "single":true
  },
  "!doctype":{
    "single":true
  },
  //-------------------------------------------------------
  // rounded corner
  //-------------------------------------------------------
  ".nehan-rounded":{
    "padding":["1.6em", "1.0em", "1.6em", "1.0em"],
    "border-radius":"10px"
  },
  //-------------------------------------------------------
  // font-size classes
  //-------------------------------------------------------
  ".nehan-xx-large":{
    "font-size": Layout.fontSizeAbs["xx-large"]
  },
  ".nehan-x-large":{
    "font-size": Layout.fontSizeAbs["x-large"]
  },
  ".nehan-large":{
    "font-size": Layout.fontSizeAbs.large
  },
  ".nehan-medium":{
    "font-size": Layout.fontSizeAbs.medium
  },
  ".nehan-small":{
    "font-size": Layout.fontSizeAbs.small
  },
  ".nehan-x-small":{
    "font-size": Layout.fontSizeAbs["x-small"]
  },
  ".nehan-xx-small":{
    "font-size": Layout.fontSizeAbs["xx-small"]
  },
  ".nehan-larger":{
    "font-size": Layout.fontSizeAbs.larger
  },
  ".nehan-smaller":{
    "font-size": Layout.fontSizeAbs.smaller
  },
  //-------------------------------------------------------
  // display classes
  //-------------------------------------------------------
  ".nehan-disp-block":{
    "display":"block"
  },
  ".nehan-disp-inline":{
    "display":"inline"
  },
  ".nehan-disp-inline-block":{
    "display":"inline-block"
  },
  //-------------------------------------------------------
  // text-align classes
  //-------------------------------------------------------
  ".nehan-ta-start":{
    "text-align":"start"
  },
  ".nehan-ta-center":{
    "text-align":"center"
  },
  ".nehan-ta-end":{
    "text-align":"end"
  },
  //-------------------------------------------------------
  // float classes
  //-------------------------------------------------------
  ".nehan-float-start":{
    "float":"start"
  },
  ".nehan-float-end":{
    "float":"end"
  },
  //-------------------------------------------------------
  // flow classes
  //-------------------------------------------------------
  ".nehan-flow-lr-tb":{
    "flow":"lr-tb"
  },
  ".nehan-flow-tb-rl":{
    "flow":"tb-rl"
  },
  ".nehan-flow-tb-lr":{
    "flow":"tb-lr"
  },
  ".nehan-flow-rl-tb":{
    "flow":"rl-tb"
  },
  ".nehan-flow-flip":{
    "flow":"flip"
  },
  //-------------------------------------------------------
  // list-style-position classes
  //-------------------------------------------------------
  ".nehan-lsp-inside":{
    "list-style-position":"inside"
  },
  ".nehan-lsp-outside":{
    "list-style-position":"outside"
  },
  //-------------------------------------------------------
  // list-style-type classes
  //-------------------------------------------------------
  ".nehan-lst-none":{
    "list-style-type":"none"
  },
  ".nehan-lst-decimal":{
    "list-style-type":"decimal"
  },
  ".nehan-lst-disc":{
    "list-style-type":"disc"
  },
  ".nehan-lst-circle":{
    "list-style-type":"circle"
  },
  ".nehan-lst-square":{
    "list-style-type":"square"
  },
  ".nehan-lst-decimal-leading-zero":{
    "list-style-type":"decimal-leading-zero"
  },
  ".nehan-lst-lower-alpha":{
    "list-style-type":"lower-alpha"
  },
  ".nehan-lst-upper-alpha":{
    "list-style-type":"upper-alpha"
  },
  ".nehan-lst-lower-latin":{
    "list-style-type":"lower-latin"
  },
  ".nehan-lst-upper-latin":{
    "list-style-type":"upper-latin"
  },
  ".nehan-lst-lower-roman":{
    "list-style-type":"lower-roman"
  },
  ".nehan-lst-upper-roman":{
    "list-style-type":"upper-roman"
  },
  ".nehan-lst-lower-greek":{
    "list-style-type":"lower-greek"
  },
  ".nehan-lst-upper-greek":{
    "list-style-type":"upper-greek"
  },
  ".nehan-lst-cjk-ideographic":{
    "list-style-type":"cjk-ideographic"
  },
  ".nehan-lst-hiragana":{
    "list-style-type":"hiragana"
  },
  ".nehan-lst-hiragana-iroha":{
    "list-style-type":"hiragana-iroha"
  },
  ".nehan-lst-katakana":{
    "list-style-type":"katakana"
  },
  ".nehan-lst-katakana-iroha":{
    "list-style-type":"katakana-iroha"
  },
  //-------------------------------------------------------
  // text-combine
  //-------------------------------------------------------
  ".nehan-tcy":{
    "text-combine":"horizontal"
  },
  ".nehan-text-combine":{
    "text-combine":"horizontal"
  },
  //-------------------------------------------------------
  // text emphasis
  //-------------------------------------------------------
  ".nehan-empha-dot-filled":{
    "text-emphasis-style":"filled dot"
  },
  ".nehan-empha-dot-open":{
    "text-emphasis-style":"open dot"
  },
  ".nehan-empha-circle-filled":{
    "text-emphasis-style":"filled circle"
  },
  ".nehan-empha-circle-open":{
    "text-emphasis-style":"open circle"
  },
  ".nehan-empha-double-circle-filled":{
    "text-emphasis-style":"filled double-circle"
  },
  ".nehan-empha-double-circle-open":{
    "text-emphasis-style":"open double-circle"
  },
  ".nehan-empha-triangle-filled":{
    "text-emphasis-style":"filled triangle"
  },
  ".nehan-empha-triangle-open":{
    "text-emphasis-style":"open triangle"
  },
  ".nehan-empha-sesame-filled":{
    "text-emphasis-style":"filled sesame"
  },
  ".nehan-empha-sesame-open":{
    "text-emphasis-style":"open sesame"
  },
  //-------------------------------------------------------
  // other utility classes
  //-------------------------------------------------------
  ".nehan-drop-caps::first-letter":{
    "display":"block",
    "width":"4em",
    "height":"4em",
    "float":"start",
    "line-rate":1.0,
    "font-size":"4em"
  },
  ".nehan-line-no-ruby":{
    "line-rate":1.0
  },
  ".nehan-gap-start":{
    "margin":{
      "start":"1em"
    }
  },
  ".nehan-gap-end":{
    "margin":{
      "end":"1em"
    }
  },
  ".nehan-gap-after":{
    "margin":{
      "after":"1em"
    }
  },
  ".nehan-gap-before":{
    "margin":{
      "before":"1em"
    }
  }
};
