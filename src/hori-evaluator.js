var HoriEvaluator = (function(){
  /**
     @memberof Nehan
     @class HoriEvaluator
     @classdesc evaluate {@link Nehan.Box} as horizontal layout, and output DOMElement.
     @constructor
     @extends {Nehan.LayoutEvaluator}
  */
  function HoriEvaluator(){
    LayoutEvaluator.call(this, "hori");
  }
  Nehan.Class.extend(HoriEvaluator, LayoutEvaluator);

  HoriEvaluator.prototype._evalInlineChildTree = function(line, tree){
    return this._evaluate(tree, {
      name:"span"
    });
  };

  HoriEvaluator.prototype._evalLinkElement = function(line, link){
    return this._evaluate(link, {
      name:(link.isTextBlock()? "span" : "a")
    });
  };

  HoriEvaluator.prototype._evalInlineImage = function(line, image){
    return this._evaluate(image, {
      name:"img",
      css:image.getCssHoriInlineImage(line)
    });
  };

  HoriEvaluator.prototype._evalRuby = function(line, ruby){
    return [
      this._evalRt(line, ruby),
      this._evalRb(line, ruby)
    ];
  };

  HoriEvaluator.prototype._evalRb = function(line, ruby){
    var rb_style = new StyleContext(new Nehan.Tag("<rb>"), line.style);
    var rb_line = rb_style.createLine({
      elements:ruby.getRbs()
    });
    return this._evaluate(rb_line, {
      css:ruby.getCssHoriRb(line)
    });
  };

  HoriEvaluator.prototype._evalRt = function(line, ruby){
    return this._createElement("div", {
      content:ruby.getRtString(),
      className:"nehan-rt",
      css:ruby.getCssHoriRt(line)
    });
  };

  HoriEvaluator.prototype._evalWord = function(line, word){
    return document.createTextNode(word.data);
  };

  HoriEvaluator.prototype._evalTcy = function(line, tcy){
    return this._createElement("span", {
      css:tcy.getCssHori(line),
      content:tcy.data
    });
  };

  HoriEvaluator.prototype._evalChar = function(line, chr){
    if(chr.isDash()){
      return document.createTextNode(chr.data);
    }
    if(chr.isSpace()){
      return this._evalSpace(line, chr);
    }
    if(chr.isTabSpace()){
      return this._evalTabChar(line, chr);
    }
    if(chr.isCharRef()){
      return document.createTextNode(Nehan.Html.unescape(chr.getData()));
    }
    if(chr.isKerningChar()){
      return this._evalKerningChar(line, chr);
    }
    return document.createTextNode(chr.getData());
  };

  HoriEvaluator.prototype._evalEmpha = function(line, chr){
    var char_part = this._evalEmphaSrc(line, chr);
    var empha_part = this._evalEmphaText(line, chr);
    var wrap = this._createElement("span", {
      css:line.style.textEmpha.getCssHoriEmphaWrap(line, chr)
    });
    wrap.appendChild(empha_part);
    wrap.appendChild(char_part);
    return wrap;
  };

  HoriEvaluator.prototype._evalEmphaSrc = function(line, chr){
    return this._createElement("div", {
      content:chr.getData(),
      className:"nehan-empha-src",
      css:chr.getCssHoriEmphaSrc(line)
    });
  };

  HoriEvaluator.prototype._evalEmphaText = function(line, chr){
    return this._createElement("div", {
      content:line.style.textEmpha.getText(),
      className:"nehan-empha-text",
      css:chr.getCssHoriEmphaText(line)
    });
  };

  HoriEvaluator.prototype._evalKerningChar = function(line, chr){
    var css = chr.getCssPadding(line);
    if(chr.isKakkoStart()){
      css["margin-left"] = "-0.5em";
      return this._createElement("span", {
	content:chr.getData(),
	className:"nehan-char-kakko-start",
	css:css
      });
    }
    if(chr.isKakkoEnd()){
      css["margin-right"] = "-0.5em";
      return this._createElement("span", {
	content:chr.getData(),
	className:"nehan-char-kakko-end",
	css:css
      });
    }
    if(chr.isKutenTouten()){
      css["margin-right"] = "-0.5em";
      return this._createElement("span", {
	content:chr.getData(),
	className:"nehan-char-kuto",
	css:css
      });
    }
    return document.createTextNode(chr.getData());
  };

  HoriEvaluator.prototype._evalPaddingChar = function(line, chr){
    return this._createElement("span", {
      content:chr.getData(),
      css:chr.getCssPadding(line)
    });
  };

  HoriEvaluator.prototype._evalSpace = function(line, chr){
    return this._createElement("span", {
      content:"&nbsp;",
      className:"nehan-space",
      css:chr.getCssHoriSpaceChar(line)
    });
  };

  HoriEvaluator.prototype._evalTabChar = function(line, chr){
    return this._createElement("span", {
      content:"&nbsp;",
      className:"nehan-tab",
      css:chr.getCssHoriTabChar(line)
    });
  };

  return HoriEvaluator;
})();

