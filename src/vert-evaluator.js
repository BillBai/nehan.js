var VertEvaluator = (function(){
  function VertEvaluator(){
    LayoutEvaluator.call(this);
  }
  Class.extend(VertEvaluator, LayoutEvaluator);

  VertEvaluator.prototype.evalInlineBlock = function(iblock){
    return this.evalBlock(iblock);
  };

  VertEvaluator.prototype.evalInlineChild = function(line, child){
    return this.evalInline(child);
  };

  VertEvaluator.prototype.evalInlineImage = function(line, image){
    return Html.tagSingle("img", {
      "src":image.style.markup.getAttr("src"),
      "style":Css.toString(image.getCssVertInlineImage())
    }) + "<br />";
  };

  VertEvaluator.prototype.evalRuby = function(line, ruby){
    var body = this.evalRb(line, ruby) + this.evalRt(line, ruby);
    return Html.tagWrap("div", body, {
      "class":"nehan-ruby-body"
    });
  };

  VertEvaluator.prototype.evalRb = function(line, ruby){
    return Html.tagWrap("div", this.evalInlineElements(line, ruby.getRbs()), {
      "style":Css.toString(ruby.getCssVertRb(line)),
      "class":"nehan-rb"
    });
  };

  VertEvaluator.prototype.evalRt = function(line, ruby){
    var rt = (new InlineGenerator(
      new StyleContext(ruby.rt, line.style),
      new TokenStream(ruby.getRtString())
    )).yield();
    Args.copy(rt.css, ruby.getCssVertRt(line));
    return this.evaluate(rt);
  };

  VertEvaluator.prototype.evalWord = function(line, word){
    if(Env.isTransformEnable){
      if(Env.isTrident){
	return this.evalWordTransformTrident(line, word);
      }
      return this.evalWordTransform(line, word);
    } else if(Env.isIE){
      return this.evalWordIE(line, word);
    } else {
      return "";
    }
  };

  VertEvaluator.prototype.evalWordTransform = function(line, word){
    var body = Html.tagWrap("div", word.data, {
      "class": "nehan-rotate-90",
      "style": Css.toString(word.getCssVertTransBody(line))
    });
    return Html.tagWrap("div", body, {
      "style": Css.toString(word.getCssVertTrans(line))
    });
  };

  VertEvaluator.prototype.evalWordTransformTrident = function(line, word){
    var body = Html.tagWrap("div", word.data, {
      // trident rotation needs some hack.
      //"class": "nehan-rotate-90",
      "style": Css.toString(word.getCssVertTransBodyTrident(line))
    });
    return Html.tagWrap("div", body, {
      "style": Css.toString(word.getCssVertTrans(line))
    });
  };

  VertEvaluator.prototype.evalWordIE = function(line, word){
    return Html.tagWrap("div", word.data, {
      "class": "nehan-vert-ie",
      "style": Css.toString(word.getCssVertTransIE(line))
    }) + Const.clearFix;
  };

  VertEvaluator.prototype.evalRotateChar = function(line, chr){
    if(Env.isTransformEnable){
      return this.evalRotateCharTransform(line, chr);
    } else if(Env.isIE){
      return this.evalRotateCharIE(line, chr);
    } else {
      return this.evalCharWithBr(line, chr);
    }
  };

  VertEvaluator.prototype.evalRotateCharTransform = function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "class":"nehan-rotate-90"
    });
  };

  VertEvaluator.prototype.evalRotateCharIE = function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "style":Css.toString(chr.getCssVertRotateCharIE(line)),
      "class":"nehan-vert-ie"
    }) + Const.clearFix;
  };

  VertEvaluator.prototype.evalTcy = function(line, tcy){
    return Html.tagWrap("div", tcy.data, {
      "class": "nehan-tcy"
    });
  };

  VertEvaluator.prototype.evalChar = function(line, chr){
    if(chr.isImgChar()){
      if(chr.isVertGlyphEnable()){
	return this.evalVerticalGlyph(line, chr);
      }
      return this.evalImgChar(line, chr);
    } else if(chr.isHalfSpaceChar(chr)){
      return this.evalHalfSpaceChar(line, chr);
    } else if(chr.isCnvChar()){
      return this.evalCnvChar(line, chr);
    } else if(chr.isRotateChar()){
      return this.evalRotateChar(line, chr);
    } else if(chr.isSmallKana()){
      return this.evalSmallKana(line, chr);
    } else if(chr.isPaddingEnable()){
      return this.evalPaddingChar(line, chr);
    } else if(line.letterSpacing){
      return this.evalCharLetterSpacing(line, chr);
    }
    return this.evalCharWithBr(line, chr);
  };

  VertEvaluator.prototype.evalCharWithBr = function(line, chr){
    return chr.data + "<br />";
  };

  VertEvaluator.prototype.evalCharLetterSpacing = function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "style":Css.toString(chr.getCssVertLetterSpacing(line))
    });
  };

  VertEvaluator.prototype.evalEmpha = function(line, chr, char_body){
    char_body = char_body.replace("<br />", "");
    var char_body2 = Html.tagWrap("span", char_body, {
      "class":"nehan-empha-src",
      "style":Css.toString(chr.getCssVertEmphaTarget(line))
    });
    var empha_body = Html.tagWrap("span", line.style.textEmpha.getText(), {
      "class":"nehan-empha-text",
      "style":Css.toString(chr.getCssVertEmphaText(line))
    });
    return Html.tagWrap("div", char_body2 + empha_body, {
      "class":"nehan-empha-wrap",
      "style":Css.toString(line.style.textEmpha.getCssVertEmphaWrap(line, chr))
    });
  };

  VertEvaluator.prototype.evalPaddingChar = function(line, chr){
    return Html.tagWrap("div", chr.data, {
      style:Css.toString(chr.getCssPadding(line))
    });
  };

  VertEvaluator.prototype.evalImgChar = function(line, chr){
    var color = line.color || new Color(Layout.fontColor);
    var font_rgb = color.getRgb();
    var palette_color = Palette.getColor(font_rgb).toUpperCase();
    return Html.tagSingle("img", {
      "class":"nehan-img-char",
      src:chr.getImgSrc(palette_color),
      style:Css.toString(chr.getCssVertImgChar(line))
    }) + Const.clearFix;
  };

  VertEvaluator.prototype.evalVerticalGlyph = function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "class":"nehan-vert-glyph",
      "style":Css.toString(chr.getCssVertGlyph(line))
    });
  };

  VertEvaluator.prototype.evalCnvChar = function(line, chr){
    return chr.cnv + "<br />";
  };

  VertEvaluator.prototype.evalSmallKana = function(line, chr){
    var tag_name = (line.style.textEmpha && line.style.textEmpha.isEnable())? "span" : "div";
    return Html.tagWrap(tag_name, chr.data, {
      style:Css.toString(chr.getCssVertSmallKana())
    });
  };

  VertEvaluator.prototype.evalHalfSpaceChar = function(line, chr){
    var font_size = line.style.getFontSize();
    var half = Math.round(font_size / 2);
    return Html.tagWrap("div", "&nbsp;", {
      style:Css.toString(chr.getCssVertHalfSpaceChar(line))
    });
  };

  VertEvaluator.prototype.evalInlineBox = function(line, box){
    var body = (box._type === "img")? this.parentEvaluator.evalImageContent(box) : box.content;
    return Html.tagWrap("div", body, {
      "style":Css.toString(box.getCssVertInlineBox())
    });
  };

  return VertEvaluator;
})();

