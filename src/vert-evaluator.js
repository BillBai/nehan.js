var VertEvaluator = (function(){
  function VertEvaluator(){
    LayoutEvaluator.call(this);
  }
  Class.extend(VertEvaluator, LayoutEvaluator);

  VertEvaluator.prototype._isFlipTree = function(tree){
    return tree.style.isTextHorizontal();
  };

  VertEvaluator.prototype._evalFlip = function(tree){
    return (new HoriEvaluator()).evaluate(tree);
  };

  VertEvaluator.prototype._evalInlineChildTree = function(tree){
    return this._evaluate(tree);
  };

  VertEvaluator.prototype._evalInlineImage = function(line, image){
    image.withBr = true;
    return this._evalTreeRoot(image, {name:"img", styles:image.getCssInline()});
  };

  VertEvaluator.prototype._evalRuby = function(line, ruby){
    var div = this._createElement("div", {
      className:"nehan-ruby-body",
      context:line.style
    });
    div.appendChild(this._evalRb(line, ruby));
    div.appendChild(this._evalRt(line, ruby));
    return div;
  };

  VertEvaluator.prototype._evalRb = function(line, ruby){
    return this._evaluate(line, {
      elements:ruby.getRbs(),
      root:this._createElement("div", {
	styles:ruby.getCssVertRb(line),
	className:"nehan-rb",
	context:line.style
      })
    });
  };

  VertEvaluator.prototype._evalRt = function(line, ruby){
    var rt = (new InlineGenerator(
      new StyleContext(ruby.rt, line.style),
      new TokenStream(ruby.getRtString()),
      null // outline context
    )).yield();
    Args.copy(rt.css, ruby.getCssVertRt(line));
    return this._evaluate(rt);
  };

  VertEvaluator.prototype._evalWord = function(line, word){
    if(Env.isTransformEnable){
      if(Env.isTrident){
	return this._evalWordTransformTrident(line, word);
      }
      return this._evalWordTransform(line, word);
    } else if(Env.isIE){
      return this._evalWordIE(line, word);
    } else {
      return "";
    }
  };

  VertEvaluator.prototype._evalWordTransform = function(line, word){
    var div_wrap = this._createElement("div", {
      styles:word.getCssVertTrans(line),
      context:line.style
    });
    var div_word = this._createElement("div", {
      content:word.data,
      className:"nehan-rotate-90",
      styles:word.getCssVertTransBody(line),
      context:line.style
    });
    div_wrap.appendChild(div_word);
    return div_wrap;
  };

  VertEvaluator.prototype._evalWordTransformTrident = function(line, word){
    var div_wrap = this._createElement("div", {
      styles:word.getCssVertTrans(line),
      context:line.style
    });
    var div_word = this._createElement("div", {
      content:word.data,
      //className:"nehan-rotate-90",
      styles:word.getCssVertTransBodyTrident(line),
      context:line.style
    });
    div_wrap.appendChild(div_word);
    return div_wrap;
  };

  VertEvaluator.prototype._evalWordIE = function(line, word){
    return this._createElement("div", {
      content:word.data,
      className:"nehan-vert-ie",
      styles:word.getCssVertTransIE(line),
      context:line.style
    }); // NOTE(or TODO):clearfix in older version after this code
  };

  VertEvaluator.prototype._evalRotateChar = function(line, chr){
    if(Env.isTransformEnable){
      return this._evalRotateCharTransform(line, chr);
    } else if(Env.isIE){
      return this._evalRotateCharIE(line, chr);
    } else {
      return this._evalCharWithBr(line, chr);
    }
  };

  VertEvaluator.prototype._evalRotateCharTransform = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-rotate-90",
      context:line.style
    });
  };

  VertEvaluator.prototype._evalRotateCharIE = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-vert-ie",
      styles:chr.getCssVertRotateCharIE(line),
      context:line.style
    }); // NOTE(or TODO):clearfix in older version after this code
  };

  VertEvaluator.prototype._evalTcy = function(line, tcy){
    return this._createElement("div", {
      content:tcy.data,
      className:"nehan-tcy",
      context:line.style
    });
  };

  VertEvaluator.prototype._evalChar = function(line, chr){
    if(chr.isImgChar()){
      if(chr.isVertGlyphEnable()){
	return this._evalVerticalGlyph(line, chr);
      }
      return this._evalImgChar(line, chr);
    } else if(chr.isHalfSpaceChar(chr)){
      return this._evalHalfSpaceChar(line, chr);
    } else if(chr.isRotateChar()){
      return this._evalRotateChar(line, chr);
    } else if(chr.isSmallKana()){
      return this._evalSmallKana(line, chr);
    } else if(chr.isPaddingEnable()){
      return this._evalPaddingChar(line, chr);
    } else if(line.letterSpacing){
      return this._evalCharLetterSpacing(line, chr);
    }
    return this._evalCharWithBr(line, chr);
  };

  // to inherit style of parent, we use <br> to keep elements in 'inline-level'.
  // for example, if we use <div> instead, parent bg-color is not inherited.
  VertEvaluator.prototype._evalCharWithBr = function(line, chr){
    chr.withBr = true;
    return document.createTextNode(Html.unescape(chr.getData()));
  };

  VertEvaluator.prototype._evalCharLetterSpacing = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      styles:chr.getCssVertLetterSpacing(line),
      context:line.style
    });
  };

  VertEvaluator.prototype._evalEmpha = function(line, chr){
    var char_body = this._createElement("span", {
      content:chr.getData(),
      className:"nehan-empha-src",
      styles:chr.getCssVertEmphaTarget(line),
      context:line.style
    });
    var empha_body = this._createElement("span", {
      content:line.style.textEmpha.getText(),
      className:"nehan-empha-text",
      styles:chr.getCssVertEmphaText(line),
      context:line.style
    });
    var wrap = this._createElement("div", {
      className:"nehan-empha-wrap",
      styles:line.style.textEmpha.getCssVertEmphaWrap(line, chr),
      context:line.style
    });
    wrap.appendChild(char_body);
    wrap.appendChild(empha_body);
    return wrap;
  };

  VertEvaluator.prototype._evalPaddingChar = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      styles:chr.getCssPadding(line),
      context:line.style
    });
  };

  VertEvaluator.prototype._evalImgChar = function(line, chr){
    var color = line.color || new Color(Layout.fontColor);
    var font_rgb = color.getRgb();
    var palette_color = Palette.getColor(font_rgb).toUpperCase();
    return this._createElement("img", {
      className:"nehan-img-char",
      attrs:{
	src:chr.getImgSrc(palette_color)
      },
      styles:chr.getCssVertImgChar(line),
      context:line.style
    });
  };

  VertEvaluator.prototype._evalVerticalGlyph = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-vert-glyph",
      styles:chr.getCssVertGlyph(line),
      context:line.style
    });
  };

  VertEvaluator.prototype._evalSmallKana = function(line, chr){
    var tag_name = (line.style.textEmpha && line.style.textEmpha.isEnable())? "span" : "div";
    return this._createElement(tag_name, {
      content:chr.getData(),
      styles:chr.getCssVertSmallKana(),
      context:line.style
    });
  };

  VertEvaluator.prototype._evalHalfSpaceChar = function(line, chr){
    return this._createElement("div", {
      content:"&nbsp;",
      styles:chr.getCssVertHalfSpaceChar(line),
      context:line.style
    });
  };

  return VertEvaluator;
})();

