var TextGenerator = (function(){
  /**
     @memberof Nehan
     @class TextGenerator
     @classdesc inline level generator, output inline level block.
     @constructor
     @extends {Nehan.LayoutGenerator}
     @param style {Nehan.StyleContext}
     @param stream {Nehan.TokenStream}
     @param child_generator {Nehan.LayoutGenerator}
  */
  function TextGenerator(style, stream){
    LayoutGenerator.call(this, style, stream);
  }
  Class.extend(TextGenerator, LayoutGenerator);

  var __find_head_text = function(element){
    return (element instanceof Box)? __find_head_text(element.elements[0]) : element;
  };

  TextGenerator.prototype._yield = function(context){
    if(!context.hasInlineSpaceFor(1)){
      return null;
    }
    var next_head = Config.justify? this._peekParentNextToken() : null;
    var next_head_char = next_head? this._peekParentNextHeadChar(next_head) : null;
    var next_head_measure = next_head? this._estimateParentNextHeadMeasure(next_head) : this.style.getFontSize();
    var is_next_head_ng = next_head_char? next_head_char.isHeadNg() : false;

    //console.log("[%s]next head:%o, next_head_char:%s, next size:%d", this.style.markupName, next_head, (next_head_char? next_head_char.data : "null"), next_head_measure);

    while(this.hasNext()){
      var element = this._getNext(context);
      if(element === null){
	break;
      }
      var measure = this._getMeasure(element);
      //console.log("[%s]%o(%s), m = %d (%d/%d, rest=%d)", this.style.markupName, element, (element.data || ""), measure, context.inline.curMeasure, context.inline.maxMeasure);
      if(measure === 0){
	break;
      }
      // if token is last one and maybe tail text, check tail/head NG between two inline generators.
      if(Config.justify && !this.stream.hasNext() && !context.hasInlineSpaceFor(measure + next_head_measure)){
	// avoid tail/head NG between two generators
	if(element instanceof Char && element.isTailNg() || is_next_head_ng){
	  context.setLineBreak(true);
	  context.setJustified(true);
	  //console.log("justified at %o:type:%s", (element.data || ""), (is_next_head_ng? "head" : "tail"));
	  //console.log("next head:%s", (next_head_char? next_head_char.data : ""));
	  this.pushCache(element);
	  break;
	}
      }
      if(!context.hasInlineSpaceFor(measure)){
	//console.info("!> text overflow:%o(m=%d)", element, measure);
	this.pushCache(element);
	break;
      }
      this._addElement(context, element, measure);
      //console.log("cur measure:%d", context.inline.curMeasure);
      if(!context.hasInlineSpaceFor(1)){
	break;
      }
    }
    return this._createOutput(context);
  };

  TextGenerator.prototype._createChildContext = function(context){
    return new CursorContext(
      context.block, // inline generator inherits block context as it is.
      new InlineContext(context.getInlineRestMeasure())
    );
  };

  TextGenerator.prototype._createOutput = function(context){
    if(context.isInlineEmpty()){
      return null;
    }
    // justify if this line is generated by overflow(not line-break).
    if(Config.justify && !context.isInlineEmpty() && !context.hasLineBreak()){
      this._justifyLine(context);
    }
    var line = this.style.createTextBlock({
      lineBreak:context.hasLineBreak(), // is line break included in?
      breakAfter:context.hasBreakAfter(), // is break after included in?
      justified:context.isJustified(), // is line justified?
      measure:context.getInlineCurMeasure(), // actual measure
      elements:context.getInlineElements(), // all inline-child, not only text, but recursive child box.
      charCount:context.getInlineCharCount(),
      maxExtent:context.getInlineMaxExtent(),
      maxFontSize:context.getInlineMaxFontSize(),
      isEmpty:context.isInlineEmpty()
    });

    // set position in parent stream.
    if(this._parent && this._parent.stream){
      line.pos = Math.max(0, this._parent.stream.getPos() - 1);
    }

    // call _onCreate callback for 'each' output
    this._onCreate(context, line);

    // call _onComplete callback for 'final' output
    if(!this.hasNext()){
      this._onComplete(context, line);
    }
    //console.log(">> texts:[%s], context = %o, stream pos:%d, stream:%o", line.toString(), context, this.stream.getPos(), this.stream);
    return line;
  };

  TextGenerator.prototype._peekParentNextToken = function(){
    if(this.style.markupName === "rt"){
      return null;
    }
    var root_line = this._parent;
    while(root_line && root_line instanceof InlineGenerator){
      root_line = root_line._parent || null;
    }
    root_line = root_line || this._parent;
    return (root_line && root_line.stream)? root_line.stream.peek() : null;
  };

  TextGenerator.prototype._peekParentNextHeadChar = function(token){
    if(token instanceof Text){
      var head_c1 = token.getContent().substring(0,1);
      return new Char(head_c1);
    } else if(token instanceof Tag){
      if(token.name === "ruby"){
	return null; // generally, ruby is not both tail-NG and head-NG.
      }
      var head_c1 = token.getContent().replace(/^[\s]*<.+?>/, "").substring(0,1);
      return new Char(head_c1);
    }
    return null;
  };

  // estimate 'maybe' size, not strict!!
  TextGenerator.prototype._estimateParentNextHeadMeasure = function(token){
    var font_size = this.style.getFontSize();
    if(token instanceof Tag && token.name === "ruby"){
      var ruby = new RubyTokenStream(token.getContent()).get();
      var char_count = ruby.getCharCount();
      var rt_char_count = ruby.getRtString().length;
      return Math.max(Math.floor(rt_char_count * font_size / 2), char_count * font_size);
    }
    return font_size;
  };

  TextGenerator.prototype._justifyLine = function(context){
    // by stream.getToken(), stream pos has been moved to next pos already, so cur pos is the next head.
    var old_head = this.peekLastCache() || this.stream.peek();
    if(old_head === null){
      return;
    }
    var new_head = context.justify(old_head); // if justified, new_head token is returned.
    if(new_head){
      //console.log("old_head:%o, new_head:%o", old_head, new_head);
      var justified_measure = (new_head.pos - old_head.pos) * this.style.getFontSize();
      context.addInlineMeasure(justified_measure);
      //console.log("justify and new head:%o", new_head);
      this.stream.setPos(new_head.pos);
      context.setLineBreak(true);
      context.setJustified(true);
      this.clearCache(); // stream position changed, so disable cache.
    }
  };

  TextGenerator.prototype._getNext = function(context){
    if(this.hasCache()){
      var cache = this.popCache(context);
      return cache;
    }

    // read next token
    var token = this.stream.get();
    if(token === null){
      return null;
    }

    //console.log("text token:%o", token);

    // if white-space
    if(Token.isWhiteSpace(token)){
      return this._getWhiteSpace(context, token);
    }

    // if tcy, wrap all content and return Tcy object and force generator terminate.
    if(this.style.getTextCombine() === "horizontal"){
      return this._getTcy(context, token);
    }
    return this._getText(context, token);
  };

  TextGenerator.prototype._breakInline = function(block_gen){
    this.setTerminate(true);
    if(this._parent === null){
      return;
    }
    if(this._parent instanceof TextGenerator){
      this._parent._breakInline(block_gen);
    } else {
      this._parent.setChildLayout(block_gen);
    }
  };

  TextGenerator.prototype._getTcy = function(context, token){
    this.setTerminate(true);
    var tcy = new Tcy(this.style.getMarkupContent());
    return this._getText(context, tcy);
  };

  TextGenerator.prototype._getWhiteSpace = function(context, token){
    if(this.style.isPre()){
      return this._getText(context, token); // read as normal text
    }
    if(Token.isNewLine(token)){
      // skip continuous white-spaces.
      this.stream.skipUntil(Token.isNewLine);
      return this._getNext(context);
    }
    // if white-space is not new-line, use first one.
    return this._getText(context, token);
  };

  TextGenerator.prototype._getText = function(context, token){
    if(!token.hasMetrics()){
      this._setTextMetrics(context, token);
    }
    switch(token._type){
    case "char":
    case "tcy":
    case "ruby":
      return token;
    case "word":
      return this._getWord(context, token);
    }
  };

  TextGenerator.prototype._setTextMetrics = function(context, token){
    // if charactor token, set kerning before setting metrics.
    // because some additional space is added if kerning is enabled or not.
    if(token instanceof Char && Config.kerning){
      this._setCharKerning(context, token);
    }
    token.setMetrics(this.style.flow, this.style.font);
  };

  TextGenerator.prototype._setCharKerning = function(context, char_token){
    var next_token = this.stream.peek();
    var prev_text = context.getInlineLastElement();
    var next_text = next_token && Token.isText(next_token)? next_token : null;
    Kerning.set(char_token, prev_text, next_text);
  };

  TextGenerator.prototype._getWord = function(context, token){
    var rest_measure = context.getInlineRestMeasure();
    var advance = token.getAdvance(this.style.flow, this.style.letterSpacing || 0);
    
    // if there is enough space for this word, just return.
    if(advance <= rest_measure){
      token.setDivided(false);
      return token;
    }
    // at this point, this word is larger than rest space.
    // but if this word size is less than max_measure and 'word-berak' is not 'break-all',
    // just break line and show it at the head of next line.
    if(advance <= context.getInlineMaxMeasure() && !this.style.isWordBreakAll()){
      return token; // overflow and cached
    }
    // at this point, situations are
    // 1. advance is larger than rest_measure and 'word-break' is set to 'break-all'.
    // 2. or word itself is larger than max_measure.
    // in these case, we must cut this word into some parts.
    var part = token.cutMeasure(this.style.getFontSize(), rest_measure); // get sliced word
    part.setMetrics(this.style.flow, this.style.font); // metrics for first half
    token.setMetrics(this.style.flow, this.style.font); // metrics for second half
    if(token.data !== "" && token.bodySize > 0){
      this.stream.prev(); // re-parse this token because rest part is still exists.
    }
    part.bodySize = Math.min(rest_measure, part.bodySize); // sometimes overflows. more accurate logic is required in the future.
    return part;
  };

  TextGenerator.prototype._getMeasure = function(element){
    return element.getAdvance(this.style.flow, this.style.letterSpacing || 0);
  };

  TextGenerator.prototype._addElement = function(context, element, measure){
    context.addInlineTextElement(element, measure);

    // call _onAddElement callback for each 'element' of output.
    this._onAddElement(context, element);
  };

  return TextGenerator;
})();

