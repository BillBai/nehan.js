Nehan.RenderingContext = (function(){
  function RenderingContext(opt){
    opt = opt || {};
    this.yieldCount = 0;
    this.terminate = false;
    this.generator = null; // set by constructor of LayoutGenerator
    this.cachedElements = [];
    this.parent = opt.parent || null;
    this.child = opt.child || null;
    this.style = opt.style || null;
    this.stream = opt.stream || null;
    this.layoutContext = opt.layoutContext || null;
    this.selectors = opt.selectors || new Nehan.Selectors(Nehan.Stylesheet.create());
    this.documentContext = opt.documentContext || new Nehan.DocumentContext();
    this.pageEvaluator = opt.pageEvaluator || new Nehan.PageEvaluator(this);
  }

  // -----------------------------------------------
  // [add]
  // -----------------------------------------------
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
    var max_size = this.layoutContext.getBlockMaxExtent();
    var max_measure = this.layoutContext.getInlineMaxMeasure();
    var element_size = element.getLayoutExtent(this.style.flow);
    var prev_extent = this.layoutContext.getBlockCurExtent();
    var next_extent = prev_extent + element_size;
    var tail_edge_size = this.getEdgeAfter();
    
    this.debugBlockElement(element, element_size);

    // if it's not last output, tail edge is not included.
    if(this.hasNext()){
      if(tail_edge_size > 0){
	console.log("[add block] tail edge(%d) is not included", tail_edge_size);
      }
      max_size += tail_edge_size;
    } else if(tail_edge_size > 0){
      console.log("[add block] tail edge(%d) is available at last pos!", tail_edge_size);
    }

    if(element.isResumableLine(max_measure) && this.hasChildLayout() && this.child.isInline()){
      this.child.setResumeLine(element);
      return;
    }
    if(next_extent <= max_size){
      this.layoutContext.addBlockElement(element, element_size);
      if(element.hasLineBreak){
	this.documentContext.incLineBreakCount();
      }
    }
    if(next_extent > max_size){
      this.pushCache(element);
    }
    // if overflow, penetrate page-break to parent layout.
    if(element.breakAfter || next_extent >= max_size){
      if(element.breakAfter){
	console.info("inherit break after");
      } else {
	console.info("size over");
      }
	
      this.setBreakAfter(true);
      throw "break-after";
    }
  };

  RenderingContext.prototype.addInlineElement = function(element){
    if(element === null){
      console.log("[%s]:eof", this.getGeneratorName());
      throw "eof";
    }
    var max_size = this.layoutContext.getInlineMaxMeasure();
    var element_size = this.getElementLayoutMeasure(element);
    var prev_measure = this.layoutContext.getInlineCurMeasure(this.style.flow);
    var next_measure = prev_measure + element_size;

    this.debugInlineElement(element, element_size);

    if(element_size === 0){
      throw "zero";
    }
    if(next_measure <= max_size){
      this.layoutContext.addInlineBoxElement(element, element_size);
      if(element.hangingPunctuation){
	if(element.hangingPunctuation.style === this.style){
	  var chr = this.yieldHangingChar(element.hangingPunctuation.data);
	  this.layoutContext.addInlineBoxElement(chr, 0);
	} else {
	  this.layoutContext.setHangingPunctuation(element.hangingPunctuation); // inherit to parent generator
	}
      }
      if(element.hasLineBreak){
	this.layoutContext.setLineBreak(true);
	throw "line-break";
      }
    }
    if(next_measure > max_size){
      this.pushCache(element);
    }
    if(next_measure >= max_size){
      throw "overflow";
    }
  };

  RenderingContext.prototype.addTextElement = function(element){
    if(element === null){
      throw "eof";
    }
    var max_size = this.layoutContext.getInlineMaxMeasure();
    var element_size = this.getTextMeasure(element);
    var prev_measure = this.layoutContext.getInlineCurMeasure(this.style.flow);
    var next_measure = prev_measure + element_size;
    var next_token = this.stream.peek();

    //this.debugTextElement(element, element_size);
    
    if(element_size === 0){
      throw "zero";
    }
    // skip head space for first word element if not 'white-space:pre'
    if(prev_measure === 0 &&
       max_size === this.style.contentMeasure &&
       this.style.isPre() === false &&
       next_token instanceof Nehan.Word &&
       element instanceof Nehan.Char &&
       element.isWhiteSpace()){
      return;
    }
    if(next_measure <= max_size){
      this.layoutContext.addInlineTextElement(element, element_size);
    }
    if(next_measure > max_size){
      this.pushCache(element);
    }
    if(next_measure >= max_size){
      this.layoutContext.setLineOver(true);
      throw "overflow";
    }
  };

  // -----------------------------------------------
  // [clear]
  // -----------------------------------------------
  RenderingContext.prototype.clearCache = function(cache){
    this.cachedElements = [];
  };

  RenderingContext.prototype.clearBreakBefore = function(){
    this.breakBefore = true; // set already break flag.
  };

  // -----------------------------------------------
  // [create]
  // -----------------------------------------------
  RenderingContext.prototype.create = function(opt){
    return new RenderingContext({
      parent:opt.parent || null,
      style:opt.style || null,
      stream:opt.stream || null,
      layoutContext:this.layoutContext || null,
      selectors:this.selectors, // always same
      documentContext:this.documentContext, // always saame
      pageEvaluator:this.pageEvaluator // always same
    });
  };

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
    return new Nehan.LayoutContext(
      new Nehan.BlockContext(this.getContextMaxExtent()),
      new Nehan.InlineContext(this.getContextMaxMeasure())
    );
  };

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
      var marker_html = this.style.getListMarkerHtml(index + 1);
      marker_tag.setContent(marker_html);
      var marker_style = item_context.createTmpChildStyle(marker_tag);
      //console.log("marker style:%o", marker_style);
      var marker_context = item_context.createChildContext(marker_style);
      var marker_box = new Nehan.InlineGenerator(marker_context).yield();
      var marker_measure = marker_box? marker_box.getLayoutMeasure() : 0;
      //console.log("RenderingContext::marker context:%o", marker_context);
      indent_size = Math.max(indent_size, marker_measure);
    }.bind(this));

    console.info("indent size:%d, body size:%d", indent_size, (this.style.contentMeasure - indent_size));

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

  RenderingContext.prototype.createFloatGenerator = function(first_float_gen){
    console.log("create float generator!");
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

    var float_root_style = this.createTmpChildStyle(new Nehan.Tag("space-root"), {
      forceCss:{display:"block"}
    });
    var float_root_context = this.createChildContext(float_root_style);
    float_root_context.floatedGenerators = floated_generators;

    var space_style = float_root_context.createChildStyle(new Nehan.Tag("space"), {
      forceCss:{display:"block"}
    });
    var space_context = float_root_context.createChildContext(space_style, {stream:this.stream});
    var space_gen = new Nehan.BlockGenerator(space_context);

    return new Nehan.FloatGenerator(float_root_context);
  };

  RenderingContext.prototype.createChildBlockGenerator = function(child_style, child_stream){
    //console.log("createChildBlockGenerator(%s):%s", child_style.getMarkupName(), child_style.markup.getContent());
    var child_context = this.createChildContext(child_style, {
      stream:child_stream || this.createStream(child_style)
    });

    var direct_block = this.yieldBlockDirect(child_context);
    if(direct_block){
      child_context.lazyOutput = direct_block;
      return new Nehan.LazyGenerator(child_context);
    }

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
  RenderingContext.prototype.createInlineRootGenerator = function(){
    return this.createChildInlineGenerator(this.style, this.stream);
  };

  RenderingContext.prototype.createChildInlineGenerator = function(style, stream){
    var child_context = this.createChildContext(style, {
      stream:(stream || this.createStream(style))
    });

    var direct_block = this.yieldInlineDirect(child_context);
    if(direct_block){
      child_context.lazyOutput = direct_block;
      return new Nehan.LazyGenerator(child_context);
    }

    if(this.parent.style !== style && style.isInlineBlock()){
      return new Nehan.InlineBlockGenerator(child_context);
    }
    switch(style.getMarkupName()){
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

  RenderingContext.prototype.createPageBreak = function(){
  };

  RenderingContext.prototype.createWhiteSpace = function(){
    return this.createBlockBox({
      noEdge:true,
      extent:this.layoutContext.getBlockMaxExtent(),
      elements:[]
    });
  };

  RenderingContext.prototype.createWrapBlock = function(measure, extent, elements){
    var size = this.style.flow.getBoxSize(measure, extent);
    var box = new Nehan.Box(size, this);
    box.display = "block";
    box.elements = elements;
    return box;
  };

  RenderingContext.prototype.createBlockBoxClasses = function(){
    var classes = ["nehan-block", "nehan-" + this.getMarkupName()];
    if(this.style.isClone()){
      classes.push("nehan-clone");
    }
    if(this.style.markup.isHeaderTag()){
      classes.push("nehan-header");
    }
    classes = classes.concat(this.style.markup.getClasses());
    return classes;
  };

  RenderingContext.prototype.createBlockBoxContextEdge = function(){
    if(!this.style.edge){
      return null;
    }
    if(this.style.getMarkupName() === "hr"){
      return this.style.edge; // can't modify
    }
    var use_before_edge = this.isFirstOutput();
    var use_after_edge = !this.hasNext();
    if(use_before_edge && use_after_edge){
      return this.style.edge;
    }
    var edge = this.style.edge.clone();
    if(!use_before_edge){
      edge.clearBefore(this.style.flow);
    }
    if(!use_after_edge){
      edge.clearAfter(this.style.flow);
    }
    return edge;
  };

  RenderingContext.prototype.createBlockBox = function(opt){
    opt = opt || {};
    var measure = this.layoutContext.getInlineMaxMeasure();
    var extent = (typeof opt.extent !== "undefined")? opt.extent : this.layoutContext.getBlockCurExtent();
    var elements = opt.elements || this.layoutContext.getBlockElements();
    if(this.isBody()){
      extent = this.style.contentExtent;
    }
    var box_size = this.style.flow.getBoxSize(measure, extent);
    var box = new Nehan.Box(box_size, this);
    box.elements = elements;
    box.content = opt.content || null;
    box.display = (this.style.display === "inline-block")? this.style.display : "block";
    box.edge = opt.noEdge? null : this.createBlockBoxContextEdge();
    box.classes = this.createBlockBoxClasses();
    box.charCount = elements.reduce(function(total, element){
      return total + (element.charCount || 0);
    }, 0);
    //box.breakAfter = !this.hasNext() && this.layoutContext.hasBreakAfter();
    box.breakAfter = this.layoutContext.hasBreakAfter();
    this.layoutContext.setBreakAfter(false); // clear flag
    if(extent === 0 || elements.length === 0){
      console.warn("zero block? %o", box);
      box.breakAfter = true;
    }
    if(this.style.isPushed()){
      box.pushed = true;
    } else if(this.style.isPulled()){
      box.pulled = true;
    }
    console.log("box(%s) break after:%o", box.toString(), box.breakAfter);
    return box;
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
  // [debug]
  // -----------------------------------------------
  RenderingContext.prototype.debugBlockElement = function(element, extent){
    var name = this.getGeneratorName();
    var bc = this.layoutContext.block;
    var str = element.toString();
    var max = bc.maxExtent;
    var prev = bc.curExtent;
    var next = prev + extent;
    var parent_rest = this.parent && this.parent.layoutContext? this.parent.layoutContext.getBlockRestExtent() : this.layoutContext.getBlockRestExtent();
    console.info("[add block] %s:%o, e(%d / %d) -> e(%d / %d), +%d(prest:%d)\n%s", name, element, prev, max, next, max, extent, parent_rest, str);
    if(next > max){
      console.log("over %c%d", "color:red", (next - max));
    }
  };

  RenderingContext.prototype.debugInlineElement = function(element, measure){
    var name = this.getGeneratorName();
    var ic = this.layoutContext.inline;
    var str = element.toString();
    var max = ic.maxMeasure;
    var prev = ic.curMeasure;
    var next = prev + measure;
    console.log("[add inline] %s:%o(%s), m(%d / %d) -> m(%d / %d), +%d", name, element, str, prev, max, next, max, measure);
  };

  RenderingContext.prototype.debugTextElement = function(element, measure){
    var name = this.getGeneratorName();
    var ic = this.layoutContext.inline;
    var str = element.data || "";
    var max = ic.maxMeasure;
    var prev = ic.curMeasure;
    var next = prev + measure;
    console.log("[add text] %s:%o(%s), m(%d / %d) -> m(%d / %d), +%d", name, element, str, prev, max, next, max, measure);
  };

  // -----------------------------------------------
  // [end]
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
  // [extend]
  // -----------------------------------------------
  RenderingContext.prototype.extend = function(opt){
    return new RenderingContext({
      parent:opt.parent || this.parent,
      style:opt.style || this.style,
      stream:opt.stream || this.stream,
      layoutContext:this.layoutContext || this.layoutContext,
      selectors:this.selectors, // always same
      documentContext:this.documentContext, // always same
      pageEvaluator:this.pageEvaluator // always same
    });
  };

  // -----------------------------------------------
  // [gen]
  // -----------------------------------------------
  RenderingContext.prototype.genBlockId = function(){
    return this.documentContext.genBlockId();
  };

  RenderingContext.prototype.genRootBlockId = function(){
    return this.documentContext.genRootBlockId();
  };

  // -----------------------------------------------
  // [get]
  // -----------------------------------------------
  RenderingContext.prototype.getFlow = function(){
    return this.style.flow;
  };

  RenderingContext.prototype.getMarkupName = function(){
    return this.style? this.style.getMarkupName() : "";
  };

  RenderingContext.prototype.getDisplay = function(){
    return this.style? this.style.display : "";
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
    var max_size = (this.parent && this.parent.layoutContext)? this.parent.layoutContext.getInlineRestMeasure() : this.style.contentMeasure;
    return Math.min(max_size, this.style.contentMeasure);
  };

  RenderingContext.prototype.getEdgeExtent = function(){
    if(this.generator instanceof Nehan.TextGenerator){
      return 0;
    }
    if(this.isInlineRoot()){
      return 0;
    }
    return this.style.getEdgeExtent(this.style.flow);
  };

  RenderingContext.prototype.getEdgeBefore = function(){
    if(this.generator instanceof Nehan.TextGenerator){
      return 0;
    }
    if(this.isInlineRoot()){
      return 0;
    }
    return this.style.getEdgeBefore();
  };

  RenderingContext.prototype.getEdgeAfter = function(){
    if(this.generator instanceof Nehan.TextGenerator){
      return 0;
    }
    if(this.isInlineRoot()){
      return 0;
    }
    return this.style.getEdgeAfter();
  };

  RenderingContext.prototype.getContextMaxExtent = function(){
    var max_size;
    var edge_size = this.getEdgeExtent();
    var first_edge_size = this.getEdgeBefore();
    var tail_edge_size = this.getEdgeAfter();

    if(this.parent && this.parent.layoutContext){
      max_size = this.parent.layoutContext.getBlockRestExtent() - edge_size;
    } else {
      max_size = this.style.contentExtent;
    }

    max_size = Math.min(max_size, this.style.contentExtent);

    //console.log("%s max extent:%d", this.getGeneratorName(), max_size);

    // if inline root, edge size is already calculated by parent block, so just use it.
    if(this.isInlineRoot()){
      return max_size;
    }

    // if not first output, before edge is not included.
    if(!this.isFirstOutput()){
      if(first_edge_size > 0){
	console.log("[context extent] first edge(%d) is not included", first_edge_size);
      }
      return max_size + first_edge_size;
    } else if(first_edge_size > 0){
      console.log("[context extent] first edge(%d) is available", first_edge_size);
    }
    /*
    if(tail_edge_size > 0){
      console.log("[context extent] tail edge(%d) is temporily included", tail_edge_size);
    }*/
    return max_size;
  };

  RenderingContext.prototype.getElementLayoutExtent = function(element){
    return element.getLayoutExtent(this.style.flow);
  };

  RenderingContext.prototype.getElementLayoutMeasure = function(element){
    return element.getLayoutMeasure(this.style.flow);
  };

  RenderingContext.prototype.getTextMeasure = function(element){
    return element.getAdvance(this.style.flow, this.style.letterSpacing || 0);
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
    if(this.generator instanceof Nehan.BlockGenerator){
      return markup_name + "(block)";
    }
    return markup_name + "(" + this.getDisplay() + ")";
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
  // [has]
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
    return Nehan.List.exists(this.floatedGenerators || [], function(gen){
      return gen.hasNext();
    });
  };

  RenderingContext.prototype.hasNextParallelLayout = function(){
    return Nehan.List.exists(this.parallelGenerators || [], function(gen){
      return gen.hasNext();
    });
  };

  RenderingContext.prototype.hasCache = function(){
    return this.cachedElements.length > 0;
  };

  // -----------------------------------------------
  // [init]
  // -----------------------------------------------
  RenderingContext.prototype.initLayoutContext = function(){
    console.log("initLayoutContext, yieldCount=%o", this.yieldCount);
    this.layoutContext = this.createLayoutContext();
    if(this.resumeLine){
      this.layoutContext.resumeLine(this.resumeLine);
      this.resumeLine = null;
    }
  };

  RenderingContext.prototype.initListContext = function(){
    this.listContext = this.createListContext();
  };

  // -----------------------------------------------
  // [is]
  // -----------------------------------------------
  RenderingContext.prototype.isBody = function(){
    return this.getMarkupName() === "body";
  };

  RenderingContext.prototype.isInline = function(){
    return (
      this.style.isInline() ||
      this.generator instanceof Nehan.TextGenerator ||
      this.generator instanceof Nehan.InlineGenerator
    );
  };

  RenderingContext.prototype.isInlineRoot = function(){
    if(this.style !== this.parent.style){
      return false;
    }
    if(this.generator instanceof Nehan.TextGenerator){
      return false;
    }
    return (this.generator instanceof Nehan.InlineGenerator ||
	    this.generator instanceof Nehan.InlineBlockGenerator);
    //return this.generator instanceof Nehan.InlineGenerator && this.style.isInlineRoot();
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
  // [peek]
  // -----------------------------------------------
  RenderingContext.prototype.peekLastCache = function(){
    return Nehan.List.last(this.cachedElements);
  };

  // -----------------------------------------------
  // [pop]
  // -----------------------------------------------
  RenderingContext.prototype.popCache = function(){
    var cache = this.cachedElements.pop();
    console.info("use cache:%o(%s)", cache, this.stringOfElement(cache));
    cache.breakAfter = false;
    return cache;
  };

  // -----------------------------------------------
  // [push]
  // -----------------------------------------------
  RenderingContext.prototype.pushCache = function(element){
    var size = (element instanceof Nehan.Box)? element.getLayoutExtent(this.style.flow) : (element.bodySize || 0);
    console.log("push cache:%o(e = %d, text = %s)", element, size, this.stringOfElement(element));
    element.cacheCount = (element.cacheCount || 0) + 1;
    if(this.hasChildLayout()){
      this.child.yieldCount--;
    }
    if(element.cacheCount >= Nehan.Config.maxRollbackCount){
      console.error("too many rollback! context:%o, element:%o", this, element);
      throw "too many rollback";
    }
    this.cachedElements.push(element);
  };

  // -----------------------------------------------
  // [set]
  // -----------------------------------------------
  RenderingContext.prototype.setTerminate = function(status){
    this.terminate = status;
  };

  RenderingContext.prototype.setBreakAfter = function(status){
    this.layoutContext.setBreakAfter(status);
    console.log("setBreakAfter");
  };

  RenderingContext.prototype.setOwnerGenerator = function(generator){
    this.generator = generator;
    this._name = this.getGeneratorName();
    console.log("generator:%s", this.getGeneratorName());
  };

  RenderingContext.prototype.setResumeLine = function(line){
    this.resumeLine = line;
    console.warn("[TODO]setResumeLine:%o", line);
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
  // [start]
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
  // [stringOf]
  // -----------------------------------------------
  RenderingContext.prototype.stringOfTree = function(){
    var leaf = this.getGeneratorName();
    if(this.parent){
      return this.parent.stringOfTree() + ">" + leaf;
    }
    return leaf;
  };

  RenderingContext.prototype.stringOfElement = function(element){
    if(element instanceof Nehan.Box){
      return element.toString();
    }
    return element.data || "<obj>";
  };

  // -----------------------------------------------
  // [update]
  // -----------------------------------------------
  RenderingContext.prototype.updateContextSize = function(measure, extent){
    this.style.updateContextSize(measure, extent);
    if(this.child){
      this.child.updateContextSize(measure, extent);
    }
  };

  RenderingContext.prototype.updateParent = function(parent_context){
    console.log("parent:%s, child:%s", parent_context.getGeneratorName(), this.getGeneratorName());
    this.style = parent_context.style;
    this.parent = parent_context;
    if(parent_context.child === this){
      return;
    }
    parent_context.child = this;
    if(this.child){
      this.child.updateParent(this);
    }
  };

  // -----------------------------------------------
  // [yield]
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

  RenderingContext.prototype.yieldBlockDirect = function(child_context){
    if(child_context.style.isPasted()){
      return this.yieldPastedBlock(child_context);
    }
    switch(child_context.style.getMarkupName()){
    case "img": return this.yieldImage(child_context);
    case "hr": return this.yieldHorizontalRule(child_context);
    }
    return null;
  };

  RenderingContext.prototype.yieldInlineDirect = function(child_context){
    if(child_context.style.isPasted()){
      return this.yieldPastedLine(child_context);
      return this.yieldPastedBlock(child_context);
    }
    switch(child_context.style.getMarkupName()){
    case "img": return this.yieldImage(child_context);
    }
    return null;
  };

  RenderingContext.prototype.yieldPastedLine = function(child_context){
    return child_context.style.createLine(child_context, {
      content:child_context.style.getContent()
    });
  };

  RenderingContext.prototype.yieldPastedBlock = function(child_context){
    return child_context.style.createBlock(child_context, {
      content:child_context.style.getContent()
    });
  };

  RenderingContext.prototype.yieldImage = function(child_context){
    return child_context.style.createImage(child_context);
  };

  RenderingContext.prototype.yieldHorizontalRule = function(child_context){
    return child_context.style.createBlock(child_context);
  };

  RenderingContext.prototype.yieldHangingChar = function(chr){
    chr.setMetrics(this.style.flow, this.style.getFont());
    var font_size = this.style.getFontSize();
    return this.style.createTextBlock(this, {
      elements:[chr],
      measure:chr.bodySize,
      extent:font_size,
      charCount:0,
      maxExtent:font_size,
      maxFontSize:font_size
    });
  };

  RenderingContext.prototype.yieldParallelBlocks = function(chr){
    var blocks = this.parallelGenerators.map(function(gen){
      return gen.yield();
    });

    if(blocks.every(Nehan.Closure.eq(null))){
      console.error("yield parallel all null!");
      return null;
    }

    var flow = this.style.flow;
    var max_block =  Nehan.List.maxobj(blocks, function(block){
      return block? block.getLayoutExtent(flow) : 0;
    });
    var wrap_measure = this.layoutContext.getInlineMaxMeasure();
    var wrap_extent = max_block.getLayoutExtent(flow);
    var uniformed_blocks = blocks.map(function(block, i){
      var context = this.parallelGenerators[i].context;
      if(block === null){
	return context.style.createBlock(context, {
	  elements:[],
	  extent:wrap_extent
	});
      }
      return block.resizeExtent(flow, wrap_extent);
    }.bind(this));

    return this.createWrapBlock(wrap_measure, wrap_extent, uniformed_blocks);
  };

  RenderingContext.prototype.yieldFloatStack = function(){
    var start_blocks = [], end_blocks = [];
    Nehan.List.iter(this.floatedGenerators, function(gen){
      var block = gen.yield();
      if(block){
	if(gen.context.style.isFloatStart()){
	  start_blocks.push(block);
	} else if(gen.context.style.isFloatEnd()){
	  end_blocks.push(block);
	}
      }
    });
    return new Nehan.FloatGroupStack(this.style.flow, start_blocks, end_blocks);
  };

  RenderingContext.prototype.yieldFloatSpace = function(float_group, measure, extent){
    console.info("yieldFloatSpace(float_group = %o, m = %d, e = %d)", float_group, measure, extent);
    this.updateContextSize(measure, extent);
    return this.yieldChildLayout();
  };

  // -----------------------------------------------
  // [private]
  // -----------------------------------------------
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
