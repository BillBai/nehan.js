var InlineGenerator = (function(){
  function InlineGenerator(style, stream, outline_context, child_generator){
    LayoutGenerator.call(this, style, stream);
    this.outlineContext = outline_context || null;
    if(child_generator){
      this.setChildLayout(child_generator);
    }
  }
  Class.extend(InlineGenerator, LayoutGenerator);

  var __get_line_start_pos = function(line){
    var head = line.elements[0];
    return (head instanceof Box)? head.style.getMarkupPos() : head.pos;
  };

  InlineGenerator.prototype._yield = function(context){
    if(!context.isInlineSpaceLeft()){
      return null;
    }
    while(this.hasNext()){
      var element = this._getNext(context);
      if(element === null){
	break;
      }
      var measure = this._getMeasure(element);
      if(measure === 0){
	break;
      }
      if(!context.hasInlineSpaceFor(measure)){
	this.pushCache(element);
	break;
      }
      this._addElement(context, element, measure);
      if(!context.isInlineSpaceLeft()){
	break;
      }
    }
    return this._createOutput(context);
  };

  LayoutGenerator.prototype.rollback = function(parent_cache){
    if(this.stream === null){
      return;
    }
    var start_pos = (parent_cache instanceof Box)? __get_line_start_pos(parent_cache) : parent_cache.pos;
    this.stream.setPos(start_pos); // rewind stream to the head of line.

    var cache = this.popCache();

    // inline child is always inline, so repeat this rollback while cache exists.
    if(this._childLayout && cache){
      this._childLayout.rollback(cache);
    }
  };

  InlineGenerator.prototype._createChildContext = function(context){
    return new LayoutContext(
      context.block, // inline generator inherits block context as it is.
      new InlineContext(context.getInlineRestMeasure())
    );
  };

  InlineGenerator.prototype._createOutput = function(context){
    // no br, no element
    if(context.isInlineEmpty()){
      return null;
    }
    // justify if this line is generated by overflow(not line-break).
    if(!context.hasBr()){
      this._justifyLine(context);
    }
    var line = this.style.createLine({
      br:context.hasBr(), // is line broken by br?
      measure:context.getInlineCurMeasure(), // actual measure
      elements:context.getInlineElements(), // all inline-child, not only text, but recursive child box.
      texts:context.getInlineTexts(), // elements but text element only.
      charCount:context.getInlineCharCount(),
      maxExtent:context.getInlineMaxExtent(),
      maxFontSize:context.getInlineMaxFontSize()
    });

    // call _onCreate callback for 'each' output
    this._onCreate(context, line);

    // call _onComplete callback for 'final' output
    if(!this.hasNext()){
      this._onComplete(context, line);
    }
    return line;
  };

  InlineGenerator.prototype._justifyLine = function(context){
    // by stream.getToken(), stream pos has been moved to next pos already, so cur pos is the next head.
    var next_head = this.peekLastCache() || this.stream.peek();
    var new_tail = context.justify(next_head); // if justify is occured, new_tail token is gained.
    if(new_tail){
      this.stream.setPos(new_tail.pos + 1); // new stream pos is next pos of new tail.
      this.clearCache(); // stream position changed, so disable cache.
    }
  };

  InlineGenerator.prototype._getNext = function(context){
    if(this.hasCache()){
      var cache = this.popCache(context);
      return cache;
    }

    if(this.hasChildLayout()){
      return this.yieldChildLayout();
    }

    // read next token
    var token = this.stream.get();
    if(token === null){
      return null;
    }

    // inline text
    if(Token.isText(token)){
      // if tcy, wrap all content and return Tcy object and force generator terminate.
      if(this.style.getTextCombine() === "horizontal"){
	return this._getTcy(context, token);
      }
      // if white-space
      if(Token.isWhiteSpace(token)){
	return this._getWhiteSpace(context, token);
      }
      return this._getText(context, token);
    }

    // if tag token, inherit style
    var child_style = this.style;
    if(token instanceof Tag){
      child_style = new StyleContext(token, this.style, {layoutContext:context});
    }

    if(child_style.isDisabled()){
      return this._getNext(context); // just skip
    }

    // if inline -> block, force terminate inline
    if(child_style.isBlock()){
      this.stream.prev();
      this.setTerminate(true);

      // add line-break to avoid empty-line.
      // because empty-line is returned as null to parent block generator,
      // and it causes page-break of parent block generator.
      context.setLineBreak(true);
      return null;
    }

    var child_stream = this._createStream(child_style);

    // if inline-block, yield immediately, and return as child inline element.
    if(child_style.isInlineBlock()){
      return (new InlineBlockGenerator(child_style, child_stream, this.outlineContext)).yield(context);
    }


    // inline child
    switch(child_style.getMarkupName()){
    case "img":
      return child_style.createImage();

    case "br":
      context.setLineBreak(true);
      return null;

    default:
      var child_generator = this._createChildInlineGenerator(child_style, child_stream, this.outlineContext);
      this.setChildLayout(child_generator);
      return this.yieldChildLayout(context);
    }
  };

  InlineGenerator.prototype._getTcy = function(context, token){
    this.setTerminate(true);
    var tcy = new Tcy(this.style.getMarkupContent());
    return this._getText(context, tcy);
  };

  InlineGenerator.prototype._getWhiteSpace = function(context, token){
    if(this.style.isPre()){
      if(Token.isNewLine(token)){
	return null; // break line at new-line char.
      }
      return this._getText(context, token); // read as normal text
    }

    // if not pre, skip continuous white-spaces.
    this.stream.skipUntil(Token.isNewLine);

    // if white-space is new-line, ignore it.
    if(Token.isNewLine(token)){
      return this._getNext(context);
    }
    // if white-space is not new-line, use first one.
    return this._getText(context, token);
  };

  InlineGenerator.prototype._getText = function(context, token){
    if(!token.hasMetrics()){
      // if charactor token, set kerning before setting metrics.
      // because some additional space is added to it in some case.
      if(token instanceof Char){
	this._setCharKerning(context, token);
      }
      token.setMetrics(this.style.flow, this.style.font);
    }
    if(token instanceof Ruby){
      return token;
    }
    switch(token._type){
    case "char":
    case "tcy":
      return token;
      case "word":
      return this._getWord(context, token);
    }
  };

  InlineGenerator.prototype._setCharKerning = function(context, char_token){
    var next_token = this.stream.peek();
    var prev_text = context.getInlineLastText();
    var next_text = next_token && Token.isText(next_token)? next_token : null;
    Kerning.set(char_token, prev_text, next_text);
  };

  InlineGenerator.prototype._getWord = function(context, token){
    var rest_measure = context.getInlineRestMeasure();
    var advance = token.getAdvance(this.style.flow, this.style.letterSpacing || 0);
    
    // if advance of this word is less than max-measure, just return.
    if(advance <= rest_measure){
      token.setDevided(false);
      return token;
    }
    // if advance is lager than max_measure,
    // we must cut this word into some parts.
    var part = token.cutMeasure(this.style.getFontSize(), rest_measure); // get sliced word
    part.setMetrics(this.style.flow, this.style.font); // metrics for first half
    token.setMetrics(this.style.flow, this.style.font); // metrics for second half
    if(token.data !== "" && token.bodySize > 0){
      this.stream.prev(); // re-parse this token because rest part is still exists.
    }
    part.bodySize = Math.min(rest_measure, part.bodySize); // sometimes overflows. more accurate logic is required in the future.
    return part;
  };

  InlineGenerator.prototype._getMeasure = function(element){
    if(element instanceof Box){
      return element.getLayoutMeasure(this.style.flow);
    }
    if(element.getAdvance){
      return element.getAdvance(this.style.flow, this.style.letterSpacing || 0);
    }
    return 0; // TODO
  };

  InlineGenerator.prototype._addElement = function(context, element, measure){
    context.addInlineElement(element, measure);

    // call _onAddElement callback for each 'element' of output.
    this._onAddElement(element);
  };

  return InlineGenerator;
})();

