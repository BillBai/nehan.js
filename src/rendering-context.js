Nehan.RenderingContext = (function(){
  function RenderingContext(opt){
    opt = opt || {};
    this.yieldCount = 0;
    this.terminate = false;
    this.generator = null; // set by constructor of LayoutGenerator
    //this.breakBefore = false; // TODO
    this.cachedElements = [];
    this.parent = opt.parent || null;
    this.child = opt.child || null;
    this.style = opt.style || null;
    this.stream = opt.stream || null;
    this.lazyOutput = opt.lazyOutput || null;
    this.floatedGenerators = opt.floatedGenerators || [];
    this.parallelGenerators = opt.parallelGenerators || [];
    this.layoutContext = opt.layoutContext || null;
    this.selectors = opt.selectors || new Nehan.Selectors(Nehan.Stylesheet.create());
    this.documentContext = opt.documentContext || new Nehan.DocumentContext();
    this.pageEvaluator = opt.pageEvaluator || new Nehan.PageEvaluator(this);
  }

  RenderingContext.prototype.create = function(opt){
    return new RenderingContext({
      parent:opt.parent || null,
      style:opt.style || null,
      stream:opt.stream || null,
      lazyOutput:opt.lazyOutput || null,
      floatedGenerators:opt.floatedGenerators || [],
      parallelGenerators:opt.parallelGenerators || [],
      layoutContext:this.layoutContext || null,
      selectors:this.selectors, // always same
      documentContext:this.documentContext, // always saame
      pageEvaluator:this.pageEvaluator // always same
    });
  };

  RenderingContext.prototype.extend = function(opt){
    return new RenderingContext({
      parent:opt.parent || this.parent,
      style:opt.style || this.style,
      stream:opt.stream || this.stream,
      lazyOutput:opt.lazyOutput || this.lazyOutput,
      floatGenerators:opt.floatedGenerators || this.floatedGenerator,
      parallelGenerators:opt.parallelGenerators || this.parallelGenerators,
      layoutContext:this.layoutContext || this.layoutContext,
      selectors:this.selectors, // always same
      documentContext:this.documentContext, // always same
      pageEvaluator:this.pageEvaluator // always same
    });
  };

  // -----------------------------------------------
  // add
  // -----------------------------------------------
  RenderingContext.prototype.addText = function(text){
    if(this.stream){
      this.stream.addText(text);
    }
  };

  RenderingContext.prototype.addPage = function(page){
    this.documentContext.addPage(page);
  };

  RenderingContext.prototype.addAnchor = function(){
    var anchor_name = this.style.getMarkupAttr("name");
    if(anchor_name){
      this.documentContext.addAnchor(anchor_name);
    }
  };

  RenderingContext.prototype.addBlockElement = function(element){
    if(element === null){
      console.log("[%s]:eof", this.getGeneratorName());
      throw "eof"; // no more output
    }
    if(element.isVoid()){
      return; // just skip
    }
    var element_size = element.getLayoutExtent(this.style.flow);
    var cur_extent = this.layoutContext.getBlockCurExtent();
    var max_size = this.layoutContext.getBlockMaxExtent();

    this.debugBlockElement(element, element_size);

    // tail edge is required for final output.
    if(!this.hasNext()){
      console.log("final output, subtract after edge:%d from %d", this.style.getEdgeAfter(), max_size);
      max_size -= this.style.getEdgeAfter();
    }
    if(cur_extent + element_size > max_size){
      console.log("%d > %d(max_size)", cur_extent + element_size, max_size);
      this.pushCache(element);
      throw "overflow";
    }
    if(element.hasLineBreak){
      this.documentContext.incLineBreakCount();
    }
    this.layoutContext.addBlockElement(element, element_size);
  };

  // -----------------------------------------------
  // create
  // -----------------------------------------------
  RenderingContext.prototype.createInlineLayoutContext = function(){
    return new Nehan.LayoutContext(
      new Nehan.BlockContext(this.getContextMaxExtent()),
      new Nehan.InlineContext(this.getContextMaxMeasure())
    );
  };

  RenderingContext.prototype.createBlockLayoutContext = function(){
    return new Nehan.LayoutContext(
      new Nehan.BlockContext(this.getContextMaxExtent()),
      new Nehan.InlineContext(this.style.contentMeasure)
    );
  };

  RenderingContext.prototype.createInlineBlockLayoutContext = function(){
    var parent_context = this.parent.layoutContext;
    return new Nehan.LayoutContext(
      new Nehan.BlockContext(this.getContextMaxExtent()),
      new Nehan.InlineContext(this.getCotextInlineMeasure())
    );
  };

  // -----------------------------------------------
  // clear
  // -----------------------------------------------
  RenderingContext.prototype.clearCache = function(cache){
    this.cachedElements = [];
  };

  RenderingContext.prototype.clearBreakBefore = function(){
    this.breakBefore = true; // set already break flag.
  };

  // -----------------------------------------------
  // create
  // -----------------------------------------------
  RenderingContext.prototype.createLayoutContext = function(){
    if(!this.style || this.style.getMarkupName() === "html"){
      return null;
    }
    if(this.isInline()){
      return this.createInlineLayoutContext();
    }
    if(this.style.isInlineBlock()){
      return this.createInlineBlockLayoutContext();
    }
    return this.createBlockLayoutContext();
  };

  RenderingContext.prototype.createListContext = function(){
    var item_tags = this.stream.getTokens();
    var item_count = item_tags.length;
    var indent_size = 0;

    // find max marker size from all list items.
    item_tags.forEach(function(item_tag, index){
      // wee neeed [li][li::marker] context.
      var item_style = this.createTmpChildStyle(item_tag);
      var item_context = this.createChildContext(item_style);
      var marker_tag = new Nehan.Tag("marker");
      var marker_content = this.style.getListMarkerHtml(index + 1);
      marker_tag.setContent(marker_content);
      var marker_style = item_context.createTmpChildStyle(marker_tag);
      var marker_context = item_context.createChildContext(marker_style);
      var marker_box = new Nehan.InlineBlockGenerator(marker_context).yield();
      var marker_measure = marker_box? marker_box.getLayoutMeasure() : 0;
      indent_size = Math.max(indent_size, marker_measure);
    }.bind(this));

    //console.info("indent size:%d, body size:%d", indent_size, (this.style.contentMeasure - indent_size));

    return {
      itemCount:item_count,
      indentSize:indent_size,
      bodySize:(this.style.contentMeasure - indent_size)
    };
  };

  RenderingContext.prototype.createOutlineElementByName = function(outline_name, callbacks){
    return this.documentContext.createOutlineElementByName(outline_name, callbacks);
  };

  RenderingContext.prototype.createChildContext = function(child_style, opt){
    opt = opt || {};
    this.child = this.create({
      parent:this,
      style:child_style,
      stream:(opt.stream || this.createStream(child_style))
    });
    child_style.context = this.child;
    return this.child;
  };

  RenderingContext.prototype.createStyle = function(markup, parent_style, args){
    return new Nehan.Style(this.selectors, markup, parent_style, args || {});
  };

  RenderingContext.prototype.createChildStyle = function(markup, args){
    return new Nehan.Style(this.selectors, markup, this.style, args || {});
  };

  RenderingContext.prototype.createTmpChildStyle = function(markup, args){
    var style = this.createChildStyle(markup, args);
    this.style.removeChild(style);
    return style;
  };

  RenderingContext.prototype.createStream = function(style){
    var markup_name = style.getMarkupName();
    var markup_content = style.getContent();
    if(style.getTextCombine() === "horizontal" || markup_name === "tcy"){
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow,
	tokens:[new Nehan.Tcy(markup_content)]
      });
    }
    switch(markup_name){
    case "html":
      var html_stream = new Nehan.TokenStream(markup_content, {
	filter:Nehan.Closure.isTagName(["head", "body"])
      });
      if(html_stream.isEmptyTokens()){
	html_stream.tags = [new Nehan.Tag("body", markup_content)];
      }
      return html_stream;

    case "tbody": case "thead": case "tfoot":
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow,
	filter:Nehan.Closure.isTagName(["tr"])
      });
    case "tr":
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow,
	filter:Nehan.Closure.isTagName(["td", "th"])
      });
    case "ul": case "ol":
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow,
	filter:Nehan.Closure.isTagName(["li"])
      });
    case "word":
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow,
	tokens:[new Nehan.Word(markup_content)]
      });
    case "ruby":
      return new Nehan.RubyTokenStream(markup_content);
    default:
      return new Nehan.TokenStream(markup_content, {
	flow:style.flow
      });
    }
  };

  RenderingContext.prototype.createFloatGenerator = function(first_float_style){
    var first_float_gen = this.createChildBlockGenerator(first_float_style);
    var floated_generators = [first_float_gen];
    this.stream.iterWhile(function(token){
      if(token instanceof Nehan.Text && token.isWhiteSpaceOnly()){
	return true; // skip and continue
      }
      if(!Nehan.Token.isTag(token)){
	return false; // break
      }
      var child_style = this.createChildStyle(token);
      if(!child_style.isFloated()){
	this.style.removeChild(child_style);
	return false; // break
      }
      var generator = this.createChildBlockGenerator(child_style);
      floated_generators.push(generator);
      return true; // continue
    }.bind(this));

    var float_root_style = this.createChildStyle(new Nehan.Tag("space-root"), {
      forceCss:{display:"block"}
    });
    var float_root_context = this.createChildContext(float_root_style);
    float_root_context.floatedGenerators = floated_generators;

    var space_style = float_root_context.createChildStyle(new Nehan.Tag("space"), {
      forceCss:{display:"block"}
    });
    var space_context = float_root_context.createChildContext(space_style, {stream:this.stream});
    var space_gen = new Nehan.BlockGenerator(space_context);

    return new Nehan.FloatGenerator(float_root_context);  // run under same context
  };

  RenderingContext.prototype.createChildBlockGenerator = function(child_style, child_stream){
    //console.log("createChildBlockGenerator(%s):%s", child_style.getMarkupName(), child_style.markup.getContent());

    // if child style with 'pasted' attribute, yield block with direct content by LazyGenerator.
    // notice that this is nehan.js original attribute,
    // is required to show some html(like form, input etc) that can't be handled by nehan.js.
    if(child_style.isPasted()){
      return new Nehan.LazyGenerator(
	this.create({
	  lazyOutput:child_style.createBlock({
	    content:child_style.getContent()
	  })
	})
      );
    }

    var child_context = this.createChildContext(child_style, {
      stream:child_stream || this.createStream(child_style)
    });

    if(child_style.hasFlipFlow()){
      return new Nehan.FlipGenerator(child_context);
    }

    // switch generator by display
    switch(child_style.display){
    case "list-item":
      return new Nehan.ListItemGenerator(child_context);

    case "table":
      return new Nehan.TableGenerator(child_context);

    case "table-row":
      return new Nehan.TableRowGenerator(child_context);

    case "table-cell":
      return new Nehan.TableCellGenerator(child_context);
    }

    // switch generator by markup name
    switch(child_style.getMarkupName()){
    case "img":
      return new Nehan.LazyGenerator(
	this.create({
	  lazyOutput:child_style.createImage()
	})
      );

    case "hr":
      // create block with no elements, but with edge(border).
      return new Nehan.LazyGenerator(
	this.create({
	  lazyOutput:child_style.createBlock()
	})
      );

    case "first-line":
      return new Nehan.FirstLineGenerator(child_context);

    case "details":
    case "blockquote":
    case "figure":
    case "fieldset":
      return new Nehan.SectionRootGenerator(child_context);

    case "section":
    case "article":
    case "nav":
    case "aside":
      return new Nehan.SectionContentGenerator(child_context);

    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return new Nehan.HeaderGenerator(child_context);

    case "ul":
    case "ol":
      return new Nehan.ListGenerator(child_context);

    default:
      return new Nehan.BlockGenerator(child_context);
    }
  };

  // create inline root, and parse again.
  // example:
  // [p(block)][text][/p(block)] ->[p(block)][p(inline)][text][/p(inline)][/p(block)]
  RenderingContext.prototype.createInlineRoot = function(){
    this.stream.prev();
    this.createChildInlineGenerator(this.style, this.stream);
  };

  RenderingContext.prototype.createChildInlineGenerator = function(style, stream){
    if(style.isPasted()){
      return new Nehan.LazyGenerator(
	this.create({
	  parent:this,
	  lazyOutput:style.createLine({
	    content:style.getContent()
	  })
	})
      );
    }
    var markup_name = style.getMarkupName();
    if(markup_name === "img"){
      // if inline img, no content text is included in img tag, so we yield it by lazy generator.
      return new Nehan.LazyGenerator(
	this.create({
	  parent:this,
	  lazyOutput:style.createImage()
	})
      );
    }

    var child_context = this.createChildContext(style, {
      stream:(stream || this.createStream(style))
    });

    if(style.isInlineBlock()){
      return new Nehan.InlineBlockGenerator(child_context);
    }
    switch(markup_name){
    case "ruby":
      return new Nehan.TextGenerator(child_context);
    case "a":
      return new Nehan.LinkGenerator(child_context);
    default:
      return new Nehan.InlineGenerator(child_context);
    }
  };

  RenderingContext.prototype.createTextStream = function(text){
    if(text instanceof Nehan.Tcy || text instanceof Nehan.Word){
      return new Nehan.TokenStream(text.getData(), {
	flow:this.style.flow,
	tokens:[text]
      });
    }
    var content = text.getContent();
    return new Nehan.TokenStream(content, {
      flow:this.style.flow,
      lexer:new Nehan.TextLexer(content)
    });
  };

  RenderingContext.prototype.createChildTextGenerator = function(text){
    return new Nehan.TextGenerator(
      this.createChildContext(this.style, {
	stream:this.createTextStream(text)
      })
    );
  };

  RenderingContext.prototype.createWhiteSpace = function(){
    return this.style.createBlock(this, {
      extent:this.layoutContext.getBlockMaxExtent(),
      elements:[],
      useBeforeEdge:false,
      useAfterEdge:false,
      restMeasure:0,
      resetExtent:0
    });
  };

  RenderingContext.prototype.createWrapBlock = function(measure, extent, elements){
    var wrap_style = this.createTmpChildStyle(new Nehan.Tag("div"), {
      forceCss:{
	measure:measure,
	extent:extent
      }
    });
    return wrap_style.createBlock(this, {
      elements:elements
    });
  };

  RenderingContext.prototype.createBlock = function(){
    var extent = this.layoutContext.getBlockCurExtent();
    var elements = this.layoutContext.getBlockElements();
    if(extent === 0 || elements.length === 0){
      if(!this.hasCache() && this.isFirstOutput()){
	// size 'zero' has special meaning... so we use 1.
	return new Nehan.Box(new Nehan.BoxSize(1,1), this, "void"); // empty void element
      }
      return null;
    }
    var after_edge_size = this.style.getEdgeAfter();
    return this.style.createBlock(this, {
      rootBlockId:(this.rootBlockId || null),
      blockId:this.blockId,
      extent:extent,
      elements:elements,
      breakAfter:this.layoutContext.hasBreakAfter(),
      useBeforeEdge:this.isFirstOutput(),
      useAfterEdge:(!this.hasNext() && after_edge_size <= this.layoutContext.getBlockRestExtent()),
      restMeasure:this.layoutContext.getInlineRestMeasure(),
      restExtent:this.layoutContext.getBlockRestExtent()
    });
  };

  RenderingContext.prototype.createLine = function(){
    if(this.layoutContext.isInlineEmpty()){
      return null;
    }
    var line = this.style.createLine(this, {
      lineNo:this.layoutContext.getBlockLineNo(),
      hasLineBreak:this.layoutContext.hasLineBreak(), // is line break included in?
      breakAfter:this.layoutContext.hasBreakAfter(), // is break after included in?
      hyphenated:this.layoutContext.isHyphenated(), // is line hyphenated?
      measure:this.layoutContext.getInlineCurMeasure(), // actual measure
      elements:this.layoutContext.getInlineElements(), // all inline-child, not only text, but recursive child box.
      charCount:this.layoutContext.getInlineCharCount(),
      maxExtent:(this.layoutContext.getInlineMaxExtent() || this.style.getFontSize()),
      maxFontSize:this.layoutContext.getInlineMaxFontSize(),
      hangingPunctuation:this.layoutContext.getHangingPunctuation()
    });

    //console.log("%o create output(%s): conetxt max measure = %d, context:%o", this, line.toString(), context.inline.maxMeasure, context);

    // set position in parent stream.
    if(this.parent && this.parent.stream){
      line.pos = Math.max(0, this.parent.stream.getPos() - 1);
    }

    if(this.style.isInlineRoot()){
      this.layoutContext.incBlockLineNo();
    }
    return line;
  };
 
  RenderingContext.prototype.createTextBlock = function(){
    if(this.layoutContext.isInlineEmpty()){
      return null;
    }
    // hyphenate if this line is generated by overflow(not line-break).
    if(this.style.isHyphenationEnable() && !this.layoutContext.isInlineEmpty() &&
       !this.layoutContext.hasLineBreak() && this.layoutContext.getInlineRestMeasure() <= this.style.getFontSize()){
      this._hyphenate();
    }
    var line = this.style.createTextBlock(this, {
      hasLineBreak:this.layoutContext.hasLineBreak(), // is line break included in?
      lineOver:this.layoutContext.isLineOver(), // is line full-filled?
      breakAfter:this.layoutContext.hasBreakAfter(), // is break after included in?
      hyphenated:this.layoutContext.isHyphenated(), // is line hyphenated?
      measure:this.layoutContext.getInlineCurMeasure(), // actual measure
      elements:this.layoutContext.getInlineElements(), // all inline-child, not only text, but recursive child box.
      charCount:this.layoutContext.getInlineCharCount(),
      maxExtent:this.layoutContext.getInlineMaxExtent(),
      maxFontSize:this.layoutContext.getInlineMaxFontSize(),
      hangingPunctuation:this.layoutContext.getHangingPunctuation(),
      isEmpty:this.layoutContext.isInlineEmpty()
    });

    // set position in parent stream.
    if(this.parent && this.parent.stream){
      line.pos = Math.max(0, this.parent.stream.getPos() - 1);
    }
    return line;
  };

  // -----------------------------------------------
  // debug
  // -----------------------------------------------
  RenderingContext.prototype.debugBlockElement = function(element, extent){
    var name = this.getGeneratorName();
    var bc = this.layoutContext.block;
    var str = element.toString();
    console.info("%s:%o, e(%d / %d):%s", name, element, (bc.curExtent + extent), bc.maxExtent, str);
  };

  RenderingContext.prototype.debugInlineElement = function(element, measure){
    var name = this.getGeneratorName();
    var ic = this.layoutContext.inline;
    var data = element.toString();
    console.log("%s:%o(%s), m(%d / %d)", name, element, data, (ic.curMeasure + measure), ic.maxMeasure);
  };

  RenderingContext.prototype.debugTextElement = function(element, measure){
    var name = this.getGeneratorName();
    var ic = this.layoutContext.inline;
    var data = element.data || "";
    console.log("%s:%o(%s), m(%d / %d)", name, element, data, (ic.curMeasure + measure), ic.maxMeasure);
  };

  // -----------------------------------------------
  // end
  // -----------------------------------------------
  /**
   called when section root(body, blockquote, fieldset, figure, td) ends.

   @memberof Nehan.RenderingContext
   @method endOutlineContext
   */
  RenderingContext.prototype.endOutlineContext = function(){
    this.documentContext.addOutlineContext(this.getOutlineContext());
  };

  /**
   called when section content(article, aside, nav, section) ends.

   @memberof Nehan.RenderingContext
   @method startSectionContext
   */
  RenderingContext.prototype.endSectionContext = function(){
    this.getOutlineContext().endSection(this.getMarkupName());
  };

  // -----------------------------------------------
  // gen
  // -----------------------------------------------
  RenderingContext.prototype.genBlockId = function(){
    return this.documentContext.genBlockId();
  };

  RenderingContext.prototype.genRootBlockId = function(){
    return this.documentContext.genRootBlockId();
  };

  // -----------------------------------------------
  // get
  // -----------------------------------------------
  RenderingContext.prototype.getFlow = function(){
    return this.style.flow;
  };

  RenderingContext.prototype.getMarkupName = function(){
    return this.style? this.style.getMarkupName() : "";
  };

  RenderingContext.prototype.getWritingDirection = function(){
    return "vert"; // TODO
  };

  RenderingContext.prototype.getPage = function(index){
    var page = this.documentContext.pages[index] || null;
    if(page instanceof Nehan.Box){
      page = this.pageEvaluator.evaluate(page);
      this.documentContext.pages[index] = page;
      return page;
    }
    return page;
  };

  RenderingContext.prototype.getChildContext = function(){
    return this.child || null;
  };

  RenderingContext.prototype.getContent = function(){
    return this.stream? this.stream.getSrc() : "";
  };

  RenderingContext.prototype.getBlockClear = function(){
    var clear = this.style.clear;
    if(clear && !clear.isDoneAll() && this.parent && this.parent.floatGroup){
      return clear;
    }
    return null;
  };

  RenderingContext.prototype.getContextMaxMeasure = function(){
    var max_size = (this.parent && this.parent.layoutContext)? this.parent.layoutContext.getInlineRestMeasure() : this.style.outerMeasure;
    if(this.style.staticMeasure){
      max_size = Math.min(max_size, this.style.staticMeasure);
    }
    // if child inline, start edge is included in first output.
    if(!this.style.isInlineRoot() && this.isFirstOutput()){
      max_size -= this.style.getEdgeStart();
    }
    return max_size;
  };

  RenderingContext.prototype.getContextMaxExtent = function(){
    var max_size = (this.parent && this.parent.layoutContext)? this.parent.layoutContext.getBlockRestExtent() : this.style.outerExtent;
    if(this.style.staticExtent){
      max_size = Math.min(max_size, this.style.staticExtent);
    }
    // before edge is included in first output.
    if(this.isFirstOutput()){
      max_size -= this.style.getEdgeBefore();
    }
    return max_size;
  };

  RenderingContext.prototype.getElementLayoutExtent = function(element){
    return element.getLayoutExtent(this.style.flow);
  };

  RenderingContext.prototype.getElementLayoutMeasure = function(element){
    return element.getLayoutMeasure(this.style.flow);
  };

  RenderingContext.prototype.getGeneratorName = function(){
    var markup_name = this.getMarkupName();
    if(this.generator instanceof Nehan.DocumentGenerator){
      return "(root)";
    }
    if(this.generator instanceof Nehan.TextGenerator){
      return markup_name + "(text)";
    }
    if(this.generator instanceof Nehan.InlineGenerator){
      return markup_name + "(inline)";
    }
    return markup_name + "(" + this.style.display + ")";
  };

  RenderingContext.prototype.getAnchorPageNo = function(anchor_name){
    return this.documentContext.getAnchorPageNo(anchor_name);
  };
  
  RenderingContext.prototype.getParentStyle = function(){
    return this.parent? this.parent.style : null;
  };

  RenderingContext.prototype.getHeaderRank = function(){
    if(this.style){
      return this.style.getHeaderRank();
    }
    return 0;
  };

  /**
   @memberof Nehan.RenderingContext
   @return {Nehan.OutlinContext}
   */
  RenderingContext.prototype.getOutlineContext = function(){
    return this.outlineContext || (this.parent? this.parent.getOutlineContext() : null);
  };

  // -----------------------------------------------
  // has
  // -----------------------------------------------
  RenderingContext.prototype.hasNext = function(){
    if(this.terminate){
      return false;
    }
    if(this.hasCache()){
      return true;
    }
    if(this.hasChildLayout()){
      return true;
    }
    if(this.hasNextFloat()){
      return true;
    }
    if(this.hasNextParallelLayout()){
      return true;
    }
    return this.stream? this.stream.hasNext() : false;
  };

  RenderingContext.prototype.hasChildLayout = function(){
    if(this.child && this.child.generator && this.child.generator.hasNext()){
      return true;
    }
    return false;
  };

  RenderingContext.prototype.hasNextFloat = function(){
    return Nehan.List.exists(this.floatedGenerators, function(gen){
      return gen.hasNext();
    });
  };

  RenderingContext.prototype.hasNextParallelLayout = function(){
    return Nehan.List.exists(this.parallelGenerators, function(gen){
      return gen.hasNext();
    });
  };

  RenderingContext.prototype.hasCache = function(){
    return this.cachedElements.length > 0;
  };

  // -----------------------------------------------
  // init
  // -----------------------------------------------
  RenderingContext.prototype.initLayoutContext = function(){
    this.layoutContext = this.createLayoutContext();
    if(this.layoutContext){
      console.log("start layout context:(m = %d, e = %d)", this.layoutContext.inline.maxMeasure, this.layoutContext.block.maxExtent);
    }
  };

  RenderingContext.prototype.initListContext = function(){
    this.listContext = this.createListContext();
  };

  // -----------------------------------------------
  // is
  // -----------------------------------------------
  RenderingContext.prototype.isInline = function(){
    return (
      this.style.isInline() ||
      this.generator instanceof Nehan.TextGenerator ||
      this.generator instanceof Nehan.InlineGenerator
    );
  };

  RenderingContext.prototype.isBreakBefore = function(){
    return this.style.isBreakBefore() && (typeof this.breakBefore === "undefined");
  };

  RenderingContext.prototype.isFirstOutput = function(){
    return this.yieldCount === 0;
  };

  RenderingContext.prototype.isTextVertical = function(){
    return this.style.isTextVertical();
  };

  // -----------------------------------------------
  // peek
  // -----------------------------------------------
  RenderingContext.prototype.peekLastCache = function(){
    return Nehan.List.last(this.cachedElements);
  };

  // -----------------------------------------------
  // pop
  // -----------------------------------------------
  RenderingContext.prototype.popCache = function(){
    return this.cachedElements.pop();
  };

  // -----------------------------------------------
  // push
  // -----------------------------------------------
  RenderingContext.prototype.pushCache = function(element){
    if(element instanceof Nehan.Box){
      console.log("push cache:", element.toString());
    } else {
      console.log("push cache:", element);
    }
    /*
    var cache_count = element.cacheCount || 0;
    if(cache_count > 0){
      if(cache_count >= Nehan.Config.maxRollbackCount){
	var element_str = (element instanceof Nehan.Box)? element.toString() : (element.data || "??");
	console.warn("[%s] too many retry:%o, element:%o(%s)", this.style.getMarkupName(), this.style, element, element_str);
	// to avoid infinite loop, force child or this generator terminate!
	if(this.child && this.child.hasNext()){
	  this.child.setTerminate(true);
	} else {
	  this.setTerminate(true);
	}
	return;
      }
    }
    element.cacheCount = cache_count + 1;
     */
    this.cachedElements.push(element);
  };

  // -----------------------------------------------
  // set
  // -----------------------------------------------
  RenderingContext.prototype.setTerminate = function(status){
    this.terminate = status;
  };

  RenderingContext.prototype.setOwnerGenerator = function(generator){
    this.generator = generator;
    //console.log("%s created, context = %o(m=%o, e=%o)", this.getGeneratorName(), this, measure, extent);
  };

  RenderingContext.prototype.setStyle = function(key, value){
    this.selectors.setValue(key, value);
  };

  RenderingContext.prototype.setStyles = function(values){
    for(var key in values){
      this.selectors.setValue(key, values[key]);
    }
  };

  // -----------------------------------------------
  // start
  // -----------------------------------------------
  /**
   called when section root(body, blockquote, fieldset, figure, td) starts.

   @memberof Nehan.RenderingContext
   */
  RenderingContext.prototype.startOutlineContext = function(){
    this.outlineContext = new Nehan.OutlineContext(this.getMarkupName());
  };

  /**
   called when section content(article, aside, nav, section) starts.

   @memberof Nehan.RenderingContext
   @method startSectionContext
   */
  RenderingContext.prototype.startSectionContext = function(){
    this.getOutlineContext().startSection({
      type:this.getMarkupName(),
      pageNo:this.documentContext.getPageNo()
    });
  };

  /**
   called when heading content(h1-h6) starts.

   @memberof Nehan.RenderingContext
   @method startHeaderContext
   @return {string} header id
   */
  RenderingContext.prototype.startHeaderContext = function(opt){
    return this.getOutlineContext().addHeader({
      headerId:this.documentContext.genHeaderId(),
      pageNo:this.documentContext.getPageNo(),
      type:opt.type,
      rank:opt.rank,
      title:opt.title
    });
  };

  // -----------------------------------------------
  // stringOf
  // -----------------------------------------------
  RenderingContext.prototype.stringOfTree = function(){
    var leaf = this.getGeneratorName();
    if(this.parent){
      return this.parent.stringOfTree() + ">" + leaf;
    }
    return leaf;
  };

  // -----------------------------------------------
  // yield
  // -----------------------------------------------
  RenderingContext.prototype.yieldChildLayout = function(){
    return this.child.generator.yield();
  };

  RenderingContext.prototype.yieldBlockClear = function(){
    var clear = this.getBlockClear();
    if(!clear){
      return null;
    }
    var float_group = this.parent.floatGroup;
    if(!float_group){
      return null;
    }
    var float_direction = float_group.getFloatDirection();
    if(float_group.isLast() && !float_group.hasNext() && clear.hasDirection(float_direction.getName())){
      clear.setDone(float_direction.getName());
      return this.createWhiteSpace();
    }
    if(!clear.isDoneAll()){
      return this.createWhiteSpace();
    }
    return null;
  };

  RenderingContext.prototype.yieldListMarker = function(){
    var item_count = this.stream.getTokenCount();
    var marker_html = this.style.getListMarkerHtml(item_count);
    var marker_context = this.createChildContext(this.style.clone({
      display:"inline-block"
    }), {
      stream:new Nehan.TokenStream(marker_html)
    });

    // create temporary inilne-generator but using clone style, this is because sometimes marker html includes "<span>" element,
    // and we have to avoid 'appendChild' from child-generator of this tmp generator.
    var tmp_gen = new Nehan.InlineGenerator(this.clone(), new Nehan.TokenStream(max_marker_html));
    var line = tmp_gen.yield();
    var marker_measure = line? line.inlineMeasure + Math.floor(this.getFontSize() / 2) : this.getFontSize();
    var marker_extent = line? line.size.getExtent(this.flow) : this.getFontSize();
    this.listMarkerSize = this.flow.getBoxSize(marker_measure, marker_extent);
  };

  // hyphenate between two different inline generator.
  RenderingContext.prototype._hyphenateSibling = function(generator){
    var next_token = generator.stream.peek();
    var tail = this.layoutContext.getInlineLastElement();
    var head = (next_token instanceof Nehan.Text)? next_token.getHeadChar() : null;
    if(this.style.isHangingPuncEnable() && head && head.isHeadNg()){
      next_token.cutHeadChar();
      this.layoutContext.setHangingPunctuation({
	data:head,
	style:this._getSiblingStyle()
      });
      return;
    } else if(tail && tail instanceof Nehan.Char && tail.isTailNg() && this.layoutContext.getInlineElements().length > 1){
      this.layoutContext.popInlineElement();
      this.stream.setPos(tail.pos);
      this.layoutContext.setLineBreak(true);
      this.layoutContext.setHyphenated(true);
      this.clearCache();
    }
  };

  RenderingContext.prototype._getSiblingContext = function(){
    if(this.getMarkupName() === "rt"){
      return null;
    }
    var root_line = this.parent;
    while(root_line && root_line.style === this.style){
      root_line = root_line.parent || null;
    }
    return root_line || this.parent || null;
  };

  RenderingContext.prototype._getSiblingStyle = function(){
    var sibling = this._getSiblingContext();
    return (sibling && sibling.style)? sibling.style : null;
  };

  RenderingContext.prototype._getSiblingStream = function(){
    var sibling = this._getSiblingContext();
    return (sibling && sibling.stream)? sibling.stream : null;
  };

  RenderingContext.prototype._peekSiblingNextToken = function(){
    var sibling_stream = this._getSiblingStream();
    return sibling_stream? sibling_stream.peek() : null;
  };

  RenderingContext.prototype._peekSiblingNextHeadChar = function(){
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

  RenderingContext.prototype._hyphenate = function(){
    // by stream.getToken(), stream pos has been moved to next pos already, so cur pos is the next head.
    var orig_head = this.peekLastCache() || this.stream.peek(); // original head token at next line.
    if(orig_head === null){
      var sibling = this._getSiblingContext();
      if(sibling && sibling.stream){
	this._hyphenateSibling(sibling);
      }
      return;
    }
    // hyphenate by hanging punctuation.
    var head_next = this.stream.peek();
    head_next = (head_next && orig_head.pos === head_next.pos)? this.stream.peek(1) : head_next;
    var is_single_head_ng = function(head, head_next){
      return (head instanceof Nehan.Char && head.isHeadNg()) &&
	!(head_next instanceof Nehan.Char && head_next.isHeadNg());
    };
    if(this.style.isHangingPuncEnable() && is_single_head_ng(orig_head, head_next)){
      this.layoutContext.addInlineTextElement(orig_head, 0);
      if(head_next){
	this.stream.setPos(head_next.pos);
      } else {
	this.stream.get();
      }
      this.layoutContext.setLineBreak(true);
      this.layoutContext.setHyphenated(true);
      this.clearCache();
      return;
    }
    // hyphenate by sweep.
    var new_head = this.layoutContext.hyphenateSweep(orig_head); // if fixed, new_head token is returned.
    if(new_head){
      //console.log("hyphenate by sweep:orig_head:%o, new_head:%o", orig_head, new_head);
      var hyphenated_measure = new_head.bodySize || 0;
      if(Math.abs(new_head.pos - orig_head.pos) > 1){
	hyphenated_measure = Math.abs(new_head.pos - orig_head.pos) * this.style.getFontSize(); // [FIXME] this is not accurate size.
      }
      this.layoutContext.addInlineMeasure(-1 * hyphenated_measure); // subtract sweeped measure.
      //console.log("hyphenate and new head:%o", new_head);
      this.stream.setPos(new_head.pos);
      this.layoutContext.setLineBreak(true);
      this.layoutContext.setHyphenated(true);
      this.clearCache(); // stream position changed, so disable cache.
    }
  };

  return RenderingContext;
})();
