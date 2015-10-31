Nehan.TextGenerator = (function(){
  /**
     @memberof Nehan
     @class TextGenerator
     @classdesc inline level generator, output inline level block.
     @constructor
     @extends {Nehan.LayoutGenerator}
     @param style {Nehan.Style}
     @param stream {Nehan.TokenStream}
     @param child_generator {Nehan.LayoutGenerator}
  */
  function TextGenerator(context){
    Nehan.LayoutGenerator.call(this, context);
  }
  Nehan.Class.extend(TextGenerator, Nehan.LayoutGenerator);

  var __find_head_text = function(element){
    return (element instanceof Nehan.Box)? __find_head_text(element.elements[0]) : element;
  };

  TextGenerator.prototype._yield = function(){
    if(!this.context.layoutContext.hasInlineSpaceFor(1)){
      return null;
    }
    var is_head_output = this.context.style.contentMeasure === this.context.layoutContext.getInlineMaxMeasure();

    while(this.hasNext()){
      var element = this._getNext();
      if(element === null){
	break;
      }
      var measure = this._getMeasure(element);
      //console.log("[t:%s]%o(%s), m = %d (%d/%d)", this.context.markup.name, element, (element.data || ""), measure, (this.context.layoutContext.inline.curMeasure + measure), this.context.layoutContext.inline.maxMeasure);
      if(measure === 0){
	break;
      }
      // skip head space for first word element if not 'white-space:pre'
      if(is_head_output && this.context.layoutContext.getInlineCurMeasure() === 0 &&
	 element instanceof Nehan.Char &&
	 element.isWhiteSpace() && !this.context.style.isPre()){
	var next = this.context.stream.peek();
	if(next && next instanceof Nehan.Word){
	  continue; // skip head space
	}
      }
      if(!this.context.layoutContext.hasInlineSpaceFor(measure)){
	//console.info("!> text overflow:%o(%s, m=%d)", element, element.data, measure);
	this.context.pushCache(element);
	this.context.layoutContext.setLineOver(true);
	break;
      }
      this._addElement(element, measure);
      //console.log("cur measure:%d", context.inline.curMeasure);
      if(!this.context.layoutContext.hasInlineSpaceFor(1)){
	this.context.layoutContext.setLineOver(true);
	break;
      }
    }
    return this._createOutput();
  };

  TextGenerator.prototype._createOutput = function(){
    if(this.context.layoutContext.isInlineEmpty()){
      return null;
    }
    // hyphenate if this line is generated by overflow(not line-break).
    if(this.context.style.isHyphenationEnable() && !this.context.layoutContext.isInlineEmpty() &&
       !this.context.layoutContext.hasLineBreak() && this.context.layoutContext.getInlineRestMeasure() <= this.context.style.getFontSize()){
      this._hyphenateLine();
    }
    var line = this.context.style.createTextBlock({
      hasLineBreak:this.context.layoutContext.hasLineBreak(), // is line break included in?
      lineOver:this.context.layoutContext.isLineOver(), // is line full-filled?
      breakAfter:this.context.layoutContext.hasBreakAfter(), // is break after included in?
      hyphenated:this.context.layoutContext.isHyphenated(), // is line hyphenated?
      measure:this.context.layoutContext.getInlineCurMeasure(), // actual measure
      elements:this.context.layoutContext.getInlineElements(), // all inline-child, not only text, but recursive child box.
      charCount:this.context.layoutContext.getInlineCharCount(),
      maxExtent:this.context.layoutContext.getInlineMaxExtent(),
      maxFontSize:this.context.layoutContext.getInlineMaxFontSize(),
      hangingPunctuation:this.context.layoutContext.getHangingPunctuation(),
      isEmpty:this.context.layoutContext.isInlineEmpty()
    });

    // set position in parent stream.
    if(this._parent && this._parent.stream){
      line.pos = Math.max(0, this._parent.stream.getPos() - 1);
    }

    // call _onCreate callback for 'each' output
    this._onCreate(line);

    // call _onComplete callback for 'final' output
    if(!this.hasNext()){
      this._onComplete(line);
    }
    //console.log(">> texts:[%s], context = %o, stream pos:%d, stream:%o", line.toString(), this.context, this.context.stream.getPos(), this.context.stream);
    return line;
  };

  TextGenerator.prototype._getSiblingGenerator = function(){
    if(this.context.style.markupName === "rt"){
      return null;
    }
    var root_line = this._parent;
    while(root_line && root_line.style === this.context.style){
      root_line = root_line._parent || null;
    }
    return root_line || this._parent || null;
  };

  TextGenerator.prototype._getSiblingStream = function(){
    var sibling_gen = this._getSiblingGenerator();
    return (sibling_gen && sibling_gen.stream)? sibling_gen.stream : null;
  };

  TextGenerator.prototype._peekSiblingNextToken = function(){
    var sibling_stream = this._getSiblingStream();
    return sibling_stream? sibling_stream.peek() : null;
  };

  TextGenerator.prototype._peekSiblingNextHeadChar = function(){
    var head_c1;
    var token = this._peekSiblingNextToken();
    if(token instanceof Nehan.Text){
      head_c1 = token.getContent().substring(0,1);
      return new Nehan.Char(head_c1);
    }
    // if parent next token is not Nehan::Text,
    // it's hard to find first character, so skip it.
    return null;
  };

  // hyphenate between two different inline generator.
  TextGenerator.prototype._hyphenateSibling = function(generator){
    var next_token = generator.stream.peek();
    var tail = this.context.layoutContext.getInlineLastElement();
    var head = (next_token instanceof Nehan.Text)? next_token.getHeadChar() : null;
    if(this.context.style.isHangingPuncEnable() && head && head.isHeadNg()){
      next_token.cutHeadChar();
      this.context.layoutContext.setHangingPunctuation({
	data:head,
	style:this._getSiblingGenerator().style
      });
      return;
    } else if(tail && tail instanceof Nehan.Char && tail.isTailNg() && this.context.layoutContext.getInlineElements().length > 1){
      this.context.layoutContext.popInlineElement();
      this.context.stream.setPos(tail.pos);
      this.context.layoutContext.setLineBreak(true);
      this.context.layoutContext.setHyphenated(true);
      this.context.clearCache();
    }
  };

  TextGenerator.prototype._hyphenateLine = function(){
    // by stream.getToken(), stream pos has been moved to next pos already, so cur pos is the next head.
    var orig_head = this.context.peekLastCache() || this.context.stream.peek(); // original head token at next line.
    if(orig_head === null){
      var sibling_generator = this._getSiblingGenerator();
      if(sibling_generator && sibling_generator.stream){
	this._hyphenateSibling(sibling_generator);
      }
      return;
    }
    // hyphenate by hanging punctuation.
    var head_next = this.context.stream.peek();
    head_next = (head_next && orig_head.pos === head_next.pos)? this.context.stream.peek(1) : head_next;
    var is_single_head_ng = function(head, head_next){
      return (head instanceof Nehan.Char && head.isHeadNg()) &&
	!(head_next instanceof Nehan.Char && head_next.isHeadNg());
    };
    if(this.context.style.isHangingPuncEnable() && is_single_head_ng(orig_head, head_next)){
      this._addElement(orig_head, 0); // push tail as zero element
      if(head_next){
	this.context.stream.setPos(head_next.pos);
      } else {
	this.context.stream.get();
      }
      this.context.layoutContext.setLineBreak(true);
      this.context.layoutContext.setHyphenated(true);
      this.context.clearCache();
      return;
    }
    // hyphenate by sweep.
    var new_head = this.context.layoutContext.hyphenateSweep(orig_head); // if fixed, new_head token is returned.
    if(new_head){
      //console.log("hyphenate by sweep:orig_head:%o, new_head:%o", orig_head, new_head);
      var hyphenated_measure = new_head.bodySize || 0;
      if(Math.abs(new_head.pos - orig_head.pos) > 1){
	hyphenated_measure = Math.abs(new_head.pos - orig_head.pos) * this.context.style.getFontSize(); // [FIXME] this is not accurate size.
      }
      this.context.layoutContext.addInlineMeasure(-1 * hyphenated_measure); // subtract sweeped measure.
      //console.log("hyphenate and new head:%o", new_head);
      this.context.stream.setPos(new_head.pos);
      this.context.layoutContext.setLineBreak(true);
      this.context.layoutContext.setHyphenated(true);
      this.context.clearCache(); // stream position changed, so disable cache.
    }
  };

  TextGenerator.prototype._getNext = function(){
    if(this.context.hasCache()){
      var cache = this.context.popCache();
      return cache;
    }

    // read next token
    var token = this.context.stream.get();
    if(token === null){
      return null;
    }

    //console.log("text token:%o", token);

    // if white-space
    if(Nehan.Token.isWhiteSpace(token)){
      return this._getWhiteSpace(token);
    }

    return this._getText(token);
  };

  TextGenerator.prototype._getWhiteSpace = function(token){
    if(this.context.style.isPre()){
      return this._getWhiteSpacePre(token);
    }
    // skip continuous white-spaces.
    this.context.stream.skipUntil(Nehan.Token.isWhiteSpace);

    // first new-line and tab are treated as single half space.
    if(token.isNewLine() || token.isTabSpace()){
      Nehan.Char.call(token, " "); // update by half-space
    }
    // if white-space is not new-line, use first one.
    return this._getText(token);
  };

  TextGenerator.prototype._getWhiteSpacePre = function(token){
    if(Nehan.Token.isNewLine(token)){
      this.context.layoutContext.setLineBreak(true);
      return null;
    }
    return this._getText(token); // read as normal text
  };

  TextGenerator.prototype._getText = function(token){
    if(!token.hasMetrics()){
      this._setTextMetrics(token);
    }
    switch(token._type){
    case "char":
    case "tcy":
    case "ruby":
      return token;
    case "word":
      return this._getWord(token);
    }
    console.error("Nehan::TextGenerator, undefined token:", token);
    throw "Nehan::TextGenerator, undefined token";
  };

  TextGenerator.prototype._setTextMetrics = function(token){
    // if charactor token, set kerning before setting metrics.
    // because some additional space is added if kerning is enabled or not.
    if(Nehan.Config.kerning){
      if(token instanceof Nehan.Char && token.isKerningChar()){
	this._setTextSpacing(token);
      } else if(token instanceof Nehan.Word){
	this._setTextSpacing(token);
      }
    }
    token.setMetrics(this.context.style.flow, this.context.style.getFont());
  };

  TextGenerator.prototype._setTextSpacing = function(token){
    var next_token = this.context.stream.peek();
    var prev_text = this.context.layoutContext.getInlineLastElement();
    var next_text = next_token && Nehan.Token.isText(next_token)? next_token : null;
    Nehan.Spacing.add(token, prev_text, next_text);
  };

  TextGenerator.prototype._getWord = function(token){
    var rest_measure = this.context.layoutContext.getInlineRestMeasure();
    var advance = token.getAdvance(this.context.style.flow, this.context.style.letterSpacing || 0);
    
    // if there is enough space for this word, just return.
    if(advance <= rest_measure){
      token.setDivided(false);
      return token;
    }
    // at this point, this word is larger than rest space.
    // but if this word size is less than max_measure and 'word-berak' is not 'break-all',
    // just break line and show it at the head of next line.
    if(advance <= this.context.layoutContext.getInlineMaxMeasure() && !this.context.style.isWordBreakAll()){
      return token; // overflow and cached
    }
    // at this point, situations are
    // 1. advance is larger than rest_measure and 'word-break' is set to 'break-all'.
    // 2. or word itself is larger than max_measure.
    // in these case, we must cut this word into some parts.
    var part = token.cutMeasure(this.context.style.flow, this.context.style.getFont(), rest_measure); // get sliced word
    if(!token.isDivided()){
      return token;
    }
    if(token.data !== "" && token.bodySize > 0){
      this.context.stream.prev(); // re-parse this token because rest part is still exists.
    }
    part.bodySize = Math.min(rest_measure, part.bodySize); // sometimes overflows. more accurate logic is required in the future.
    return part;
  };

  TextGenerator.prototype._getMeasure = function(element){
    return element.getAdvance(this.context.style.flow, this.context.style.letterSpacing || 0);
  };

  TextGenerator.prototype._addElement = function(element, measure){
    this.context.layoutContext.addInlineTextElement(element, measure);

    // call _onAddElement callback for each 'element' of output.
    this._onAddElement(element);
  };

  return TextGenerator;
})();

