var TreeGenerator = ElementGenerator.extend({
  init : function(context){
    this._super(context);
    this.generator = null;
    this.localPageNo = 0;
    this.localLineNo = 0;
  },
  hasNext : function(){
    if(this.generator && this.generator.hasNext()){
      return true;
    }
    return this.context.stream.hasNext();
  },
  backup : function(){
    this.context.stream.backup();
  },
  rollback : function(){
    if(this.generator){
      this.generator.rollback();
    } else {
      this.context.stream.rollback();
    }
  },
  getCurGenerator : function(){
    if(this.generator && this.generator.hasNext()){
      return this.generator;
    }
    return null;
  },
  // if size is not defined, rest size of parent is used.
  // if parent is null, root page is generated.
  yield : function(parent, size){
    var page_box, page_size;
    page_size = size || this._getBoxSize(parent);
    page_box = this._createBox(page_size, parent);
    var ret = this._yieldBlocksTo(page_box);
    return ret;
  },
  _getBoxSize : function(parent){
    return this.context.getMarkupStaticSize(parent) || parent.getRestSize();
  },
  _getLineSize : function(parent){
    var measure = parent.getContentMeasure();
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  },
  _createLine : function(parent){
    var size = this._getLineSize(parent);
    var line = Layout.createTextLine(size, parent);
    line.markup = this.context.markup;
    line.lineNo = this.localLineNo;
    return line;
  },
  _createChildInlineTreeGenerator : function(tag){
    switch(tag.getName()){
    case "ruby":
      return new RubyGenerator(this.context.createInlineRoot(tag, new RubyTagStream(tag)));
    case "a":
      return new LinkGenerator(this.context.createInlineRoot(tag));
    case "first-line":
      return new FirstLineGenerator(this.context.createInlineRoot(tag));
    default:
      return new ChildInlineTreeGenerator(this.context.createInlineRoot(tag));
    }
  },
  _createChildBlockTreeGenerator : function(parent, tag){
    switch(tag.getName()){
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
      return new HeaderGenerator(this.context.createBlockRoot(tag));
    case "section": case "article": case "nav": case "aside":
      return new SectionContentGenerator(this.context.createBlockRoot(tag));
    case "details": case "blockquote": case "figure": case "fieldset":
      return new SectionRootGenerator(this.context.createBlockRoot(tag));
    case "table":
      return new TableGenerator(this.context.createBlockRoot(tag, new TableTagStream(tag)));
    case "tbody": case "thead": case "tfoot":
      return new TableRowGroupGenerator(this.context.createBlockRoot(tag, new DirectTokenStream(tag.tableChilds)));
    case "dl":
      return new ChildBlockTreeGenerator(this.context.createBlockRoot(tag, new DefListTagStream(tag.getContent())));
    case "ul": case "ol":
      return new ListGenerator(this.context.createBlockRoot(tag,new ListTagStream(tag.getContent())));
    case "hr":
      return new HrGenerator(this.context);
    case "tr":
      return this._createTableRowGenerator(parent, tag);
    case "li":
      return this._createListItemGenerator(parent, tag);
    default:
      return new ChildBlockTreeGenerator(this.context.createBlockRoot(tag));
    }
  },
  _createTableRowGenerator : function(parent, tag){
    var partition = parent.partition.getPartition(tag.tableChilds.length);
    var context2 = this.context.createBlockRoot(tag);
    return new ParallelGenerator(List.map(tag.tableChilds, function(td){
      return new ParaChildGenerator(context2.createBlockRoot(td));
    }), partition, context2);
  },
  _createListItemGenerator : function(parent, tag){
    var list_style = parent.listStyle || null;
    if(list_style === null){
      return new ChildBlockTreeGenerator(this.context.createBlockRoot(tag));
    }
    if(list_style.isInside()){
      return this._createInsideListItemGenerator(tag, parent);
    }
    return this._createOutsideListItemGenerator(tag, parent);
  },
  _createInsideListItemGenerator : function(parent, tag){
    var marker = parent.listStyle.getMarkerHtml(tag.order + 1);
    var content = Html.tagWrap("span", marker, {
      "class":"nehan-li-marker"
    }) + Const.space + tag.getContent();
    return ChildBlockTreeGenerator(this.context.createBlockRoot(tag, new TokenStream(content)));
  },
  _createOutsideListItemGenerator : function(parent, tag){
    var context2 = this.context.createBlockRoot(tag);
    var marker = parent.listStyle.getMarkerHtml(tag.order + 1);
    var markup_marker = new Tag("<li-marker>", marker);
    var markup_body = new Tag("<li-body>", tag.getContent());
    new ParallelGenerator([
      new ParaChildGenerator(markup_marker, context2.createBlockRoot(markup_marker)),
      new ParaChildGenerator(markup_body, context2.createBlockRoot(markup_body))
    ], parent.partition, context2);
  },
  _onLastBlock : function(page){
  },
  // called when page box is fully filled.
  _onCompleteBlock : function(page){
  },
  // called when line box is fully filled.
  _onCompleteLine : function(line){
    line.setMaxExtent(this.context.getInlineMaxExtent());
    line.setMaxFontSize(this.context.getInlineMaxFontSize());
  },
  _yieldInline : function(parent){
    var line = this._createLine(parent);
    return this._yieldInlinesTo(line);
  },
  // fill page with child page elements.
  _yieldBlocksTo : function(page){
    this.context.createBlockContext(page);

    while(true){
      this.backup();
      var element = this._yieldPageElement(page);
      if(element == Exceptions.PAGE_BREAK){
	break;
      } else if(element == Exceptions.BUFFER_END){
	break;
      } else if(element == Exceptions.SKIP){
	break;
      } else if(element == Exceptions.RETRY){
	this.rollback();
	break;
      } else if(element == Exceptions.BREAK){
	break;
      } else if(element == Exceptions.IGNORE){
	continue;
      }

      try {
	this.context.addBlockElement(element);
	if(this.generator){
	  this.generator.commit();
	}
	if(this._isTextLine(element)){
	  this.localLineNo++;
	}
      } catch(e){
	if(e === "OverflowBlock" || e === "EmptyBlock"){
	  this.rollback();
	}
	break;
      }
    }
    if(this.localPageNo > 0){
      page.clearBorderBefore();
    } else {
    }
    if(!this.hasNext()){
      this._onLastBlock(page);
    } else {
      page.clearBorderAfter();
    }
    this._onCompleteBlock(page);

    // if content is not empty, increment localPageNo.
    if(page.getBoxExtent() > 0){
      this.localPageNo++;
    }
    return page;
  },
  _yieldInlinesTo : function(line){
    //console.log(this.context);
    this.context.createInlineContext(line);
    this.backup();

    while(true){
      var element = this._yieldInlineElement(line);
      if(typeof element === "number"){
	if(element == Exceptions.BUFFER_END){
	  this.context.setLineBreak();
	  break;
	} else if(element == Exceptions.LINE_BREAK){
	  this.context.setLineBreak();
	  break;
	} else if(element == Exceptions.IGNORE){
	  continue;
	} else {
	  alert("unexpected inline-exception:" + Exceptions.toString(element));
	  break;
	}
      }

      try {
	this.context.addInlineElement(element);
      } catch(e){
	if(e === "OverflowInline"){
	  if(this.generator && (element instanceof Box || element instanceof Ruby)){
	    this.generator.rollback();
	  } else {
	    this.context.pushBackToken();
	  }
	}
	break;
      }

      // if devided word, line break and parse same token again.
      if(element instanceof Word && element.isDevided()){
	this.context.pushBackToken();
	break;
      }
    } // while(true)

    line = this.context.createLine();
    this._onCompleteLine(line);
    return line;
  },
  _yieldPageElement : function(parent){
    if(this.generator && this.generator.hasNext()){
      if(this.generator instanceof ChildInlineTreeGenerator){
	return this._yieldInline(parent);
      }
      return this.generator.yield(parent);
    }
    var token = this.context.getNextToken();
    if(token === null){
      return Exceptions.BUFFER_END;
    }
    // in block level, new-line character makes no sense, just ignored.
    if(Token.isChar(token) && token.isNewLineChar()){
      return Exceptions.IGNORE;
    }
    if(Token.isTag(token) && token.isPageBreakTag()){
      return Exceptions.PAGE_BREAK;
    }
    if(Token.isInline(token)){
      this.context.pushBackToken();
      return this._yieldInline(parent);
    }
    return this._yieldBlockElement(parent, token);
  },
  _yieldInlineElement : function(line){
    if(this.generator && this.generator.hasNext()){
      return this.generator.yield(line);
    }
    this.generator = null;
    var token = this.context.getInlineNextToken();
    return this._yieldInlineToken(line, token);
  },
  _yieldInlineToken : function(line, token){
    if(token === null){
      return Exceptions.BUFFER_END;
    }
    if(token instanceof Ruby){
      return token;
    }
    // CRLF
    if(Token.isChar(token) && token.isNewLineChar()){

      // if pre, treat CRLF as line break
      if(this.context.isPreLine()){
	return Exceptions.LINE_BREAK;
      }
      // others, just ignore
      return Exceptions.IGNORE;
    }
    if(Token.isText(token)){
      return this._yieldText(line, token);
    }
    if(Token.isTag(token) && token.getName() === "br"){
      return Exceptions.LINE_BREAK;
    }
    // token is static size tag
    if(token.hasStaticSize()){
      return this._yieldStaticElement(line, token);
    }
    // token is inline-block tag
    if(token.isInlineBlock()){
      this.generator = new InlineBlockGenerator(token, this.context);
      return this.generator.yield(line);
    }
    // token is other inline tag
    return this._yieldInlineTag(line, token);
  },
  _yieldText : function(line, text){
    if(!text.hasMetrics()){
      text.setMetrics(line.flow, line.fontSize, this.context.isTextBold());
    }
    switch(text._type){
    case "char":
    case "tcy":
      return text;
    case "word":
      return this._yieldWord(line, text);
    }
  },
  _yieldWord : function(line, word){
    var advance = word.getAdvance(line.flow, line.letterSpacing || 0);
    var max_measure = this.context.getInlineMaxMeasure();

    // if advance of this word is less than max-measure, just return.
    if(advance <= max_measure){
      word.setDevided(false);
      return word;
    }
    // if advance is lager than max_measure,
    // we must cut this word into some parts.
    var is_bold = this.context.isTextBold();
    var part = word.cutMeasure(line.fontSize, max_measure); // get sliced word
    part.setMetrics(line.flow, line.fontSize, is_bold); // metrics for first half
    word.setMetrics(line.flow, line.fontSize, is_bold); // metrics for second half
    return part;
  },
  _yieldInlineTag : function(line, tag){
    if(tag.isSingleTag()){
      return tag;
    }
    switch(tag.getName()){
    case "script":
      this.context.addScript(tag);
      return Exceptions.IGNORE;
    case "style":
      this.context.addStyle(tag);
      return Exceptions.IGNORE;
    default:
      this.generator = this._createChildInlineTreeGenerator(tag, this.localLineNo);
      return this.generator.yield(line);
    }
  },
  _yieldBlockElement : function(parent, tag){
    if(tag.hasStaticSize()){
      return this._yieldStaticTag(parent, tag);
    }

    // if different flow is defined in this block tag,
    // yield it as single inline page with rest size of current parent.
    if(tag.hasFlow() && tag.getCssAttr("flow") != parent.getFlowName()){
      var inline_size = parent.getRestSize();
      var generator = new InlinePageGenerator(this.context.createBlockRoot(tag));
      return generator.yield(parent, inline_size);
    }
    this.generator = this._createChildBlockTreeGenerator(parent, tag);
    return this.generator.yield(parent);
  },
  _yieldStaticTag : function(parent, tag){
    var box = this._yieldStaticElement(parent, tag);
    if(!(box instanceof Box)){
      return box; // exception
    }

    // pushed box is treated as a single block element.
    if(tag.isPush()){
      return box;
    }

    // floated box is treated as a single block element(with rest spaces filled by other elements).
    if(box instanceof Box && box.logicalFloat){
      return this._yieldFloatedBlock(parent, box, tag);
    }

    return box; // return as single block.
  },
  _yieldFloatedBlock : function(parent, floated_box, tag){
    var generator = new FloatedBlockTreeGenerator(this.context.createFloatedRoot(), floated_box);
    var block = generator.yield(parent);
    this.generator = generator.getCurGenerator(); // inherit generator of aligned area
    return block;
  }
});
