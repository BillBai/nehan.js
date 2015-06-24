var VertEvaluator = (function(){
  /**
     @memberof Nehan
     @class VertEvaluator
     @classdesc evaluate {@link Nehan.Box} as vertical layout, and output DOMElement.
     @constructor
     @extends {Nehan.LayoutEvaluator}
  */
  function VertEvaluator(){
    LayoutEvaluator.call(this, "vert");
  }
  Nehan.Class.extend(VertEvaluator, LayoutEvaluator);

  var __is_vert_glyph_enable = Config.useVerticalGlyphIfEnable && Nehan.Env.isVerticalGlyphEnable;

  VertEvaluator.prototype._evalLinkElement = function(line, link){
    return this._evaluate(link, {
      name:(link.isTextBlock()? "div" : "a")
    });
  };

  VertEvaluator.prototype._evalRuby = function(line, ruby){
    return [
      this._evalRb(line, ruby),
      this._evalRt(line, ruby)
    ];
  };

  VertEvaluator.prototype._evalRb = function(line, ruby){
    var rb_style = new StyleContext(new Nehan.Tag("<rb>"), line.style);
    var rb_line = rb_style.createLine({
      elements:ruby.getRbs()
    });
    return this._evaluate(rb_line, {
      css:ruby.getCssVertRb(line)
    });
  };

  VertEvaluator.prototype._evalRt = function(line, ruby){
    var rt = (new InlineGenerator(
      new StyleContext(ruby.rt, line.style),
      new TokenStream(ruby.getRtString()),
      null // outline context
    )).yield();
    Nehan.Args.copy(rt.css, ruby.getCssVertRt(line));
    return this._evaluate(rt);
  };

  VertEvaluator.prototype._evalWord = function(line, word){
    if(Nehan.Env.isTransformEnable){
      if(Nehan.Env.client.isTrident()){
	return this._evalWordTransformTrident(line, word);
      }
      return this._evalWordTransform(line, word);
    } else if(Nehan.Env.client.isIE()){
      return this._evalWordIE(line, word);
    } else {
      return "";
    }
  };

  VertEvaluator.prototype._evalWordTransform = function(line, word){
    var div_wrap = this._createElement("div", {
      css:word.getCssVertTrans(line)
    });
    var div_word = this._createElement("div", {
      content:word.data,
      className:"nehan-rotate-90",
      css:word.getCssVertTransBody(line)
    });
    div_wrap.appendChild(div_word);
    return div_wrap;
  };

  VertEvaluator.prototype._evalWordTransformTrident = function(line, word){
    var div_wrap = this._createElement("div", {
      css:word.getCssVertTrans(line)
    });
    var div_word = this._createElement("div", {
      content:word.data,
      //className:"nehan-rotate-90",
      css:word.getCssVertTransBodyTrident(line)
    });
    div_wrap.appendChild(div_word);
    return div_wrap;
  };

  VertEvaluator.prototype._evalWordIE = function(line, word){
    return this._createElement("div", {
      content:word.data,
      className:"nehan-vert-ie",
      css:word.getCssVertTransIE(line)
    }); // NOTE(or TODO):clearfix in older version after this code
  };

  VertEvaluator.prototype._evalRotateChar = function(line, chr){
    if(Nehan.Env.isTransformEnable){
      return this._evalRotateCharTransform(line, chr);
    } else if(Nehan.Env.client.isIE()){
      return this._evalRotateCharIE(line, chr);
    } else {
      return this._evalCharWithBr(line, chr);
    }
  };

  VertEvaluator.prototype._evalRotateCharTransform = function(line, chr){
    var css = (Nehan.Env.client.isIE() && chr.isDash())? chr.getCssVertDashIE() : {};
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-rotate-90",
      css:css
    });
  };

  VertEvaluator.prototype._evalRotateCharIE = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-vert-ie",
      css:chr.getCssVertRotateCharIE(line)
    }); // NOTE(or TODO):clearfix in older version after this code
  };

  VertEvaluator.prototype._evalTcy = function(line, tcy){
    return this._createElement("div", {
      content:tcy.data,
      className:"nehan-tcy",
      css:tcy.getCssVert(line)
    });
  };

  VertEvaluator.prototype._evalChar = function(line, chr){
    if(chr.isImgChar()){
      if(__is_vert_glyph_enable){
	return this._evalVerticalGlyph(line, chr);
      }
      return this._evalImgChar(line, chr);
    } else if(chr.isSpace()){
      return this._evalSpace(line, chr);
    } else if(chr.isTabSpace()){
      return this._evalTabChar(line, chr);
    } else if(chr.isRotateChar()){
      if(__is_vert_glyph_enable){
	return this._evalVerticalGlyph(line, chr);
      }
      return this._evalRotateChar(line, chr);
    } else if(chr.isSmallKana()){
      return this._evalSmallKana(line, chr);
    } else if(chr.isPaddingEnable()){
      return this._evalPaddingChar(line, chr);
    } else if(line.letterSpacing){
      return this._evalCharLetterSpacing(line, chr);
    } else if(chr.isSingleHalfChar()){
      return this._evalCharSingleHalfChar(line, chr);
    } else if(chr.isHalfKana()){
      return this._evalCharHalfKana(line, chr);
    }
    return this._evalCharWithBr(line, chr);
  };

  // for example, if we use <div> instead, parent bg-color is not inherited.
  VertEvaluator.prototype._evalCharWithBr = function(line, chr){
    chr.withBr = true;
    return document.createTextNode(Nehan.Html.unescape(chr.getData()));
  };

  VertEvaluator.prototype._evalCharLetterSpacing = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      css:chr.getCssVertLetterSpacing(line)
    });
  };

  VertEvaluator.prototype._evalCharSingleHalfChar = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      css:chr.getCssVertSingleHalfChar(line)
    });
  };

  VertEvaluator.prototype._evalCharHalfKana = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      css:chr.getCssVertHalfKana(line)
    });
  };

  VertEvaluator.prototype._evalEmpha = function(line, chr){
    var char_part = this._evalEmphaSrc(line, chr);
    var empha_part = this._evalEmphaText(line, chr);
    var wrap = this._createElement("div", {
      className:"nehan-empha-wrap",
      css:line.style.textEmpha.getCssVertEmphaWrap(line, chr)
    });
    wrap.appendChild(char_part);
    wrap.appendChild(empha_part);
    return wrap;
  };

  VertEvaluator.prototype._evalEmphaSrc = function(line, chr){
    return this._createElement("span", {
      content:chr.getData(),
      className:"nehan-empha-src"
    });
  };

  VertEvaluator.prototype._evalEmphaText = function(line, chr){
    return this._createElement("span", {
      content:line.style.textEmpha.getText(),
      className:"nehan-empha-text",
      css:chr.getCssVertEmphaText(line)
    });
  };

  VertEvaluator.prototype._evalPaddingChar = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      css:chr.getCssPadding(line)
    });
  };

  VertEvaluator.prototype._evalImgChar = function(line, chr){
    var color = line.color || new Nehan.Color(Nehan.Display.fontColor);
    var font_rgb = color.getRgb();
    var palette_color = Nehan.Palette.getColor(font_rgb).toUpperCase();
    return this._createElement("img", {
      className:"nehan-img-char",
      attrs:{
	src:chr.getImgSrc(palette_color)
      },
      css:chr.getCssVertImgChar(line)
    });
  };

  VertEvaluator.prototype._evalVerticalGlyph = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-vert-glyph",
      css:chr.getCssVertGlyph(line)
    });
  };

  VertEvaluator.prototype._evalSmallKana = function(line, chr){
    var tag_name = (line.style.textEmpha && line.style.textEmpha.isEnable())? "span" : "div";
    return this._createElement(tag_name, {
      content:chr.getData(),
      css:chr.getCssVertSmallKana()
    });
  };

  VertEvaluator.prototype._evalSpace = function(line, chr){
    return this._createElement("div", {
      content:"&nbsp;",
      className:"nehan-space",
      css:chr.getCssVertSpaceChar(line)
    });
  };

  VertEvaluator.prototype._evalTabChar = function(line, chr){
    return this._createElement("div", {
      content:"&nbsp;",
      className:"nehan-tab",
      css:chr.getCssVertTabChar(line)
    });
  };

  return VertEvaluator;
})();

