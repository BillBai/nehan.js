var BlockLayoutGenerator = (function(){
  function BlockLayoutGenerator(style, stream){
    LayoutGenerator.call(this, style, stream);
  }
  Class.extend(BlockLayoutGenerator, LayoutGenerator);

  BlockLayoutGenerator.prototype.yield = function(context){
    context = context || this._createStartContext();
    //console.log("yield %s, rest_extent = %d", this.style.getMarkupName(), context.getBlockRestExtent());
    if(context.getBlockMaxExtent() < 0){
      //console.log("no more extent rest");
      return null;
    }
    while(true){
      var element = this._getNext(context);
      if(element === null){
	//console.log("[%s] null", this.style.getMarkupName());
	break;
      }
      var extent = element.getBoxExtent(this.style.flow);
      //console.log("[%s] block %o extent:%d", this.style.getMarkupName(), element, extent);
      if(context.getBlockCurExtent() + extent > context.getBlockMaxExtent()){
	//console.log("[%s] block over(cached, extent=%d) context(cur:%d, max:%d)", this.style.getMarkupName(), extent, context.getBlockCurExtent(), context.getBlockMaxExtent());
	this.pushCache(element);
	break;
      }
      this._addElement(context, element, extent);
      if(context.getBlockCurExtent() === context.getBlockMaxExtent()){
	//console.log("block just filled");
	break;
      }
      //console.log("...accepted by %s(rest extent = %d)", this.style.markup.name, context.getBlockRestExtent());
    }
    return this._createBlock(context);
  };

  BlockLayoutGenerator.prototype._addElement = function(context, element, extent){
    if(this.style.isPushed()){
      context.pushBockElement(element, extent);
    } else if(this.style.isPulled()){
      context.pullBlockElement(element, extent);
    } else {
      context.addBlockElement(element, extent);
    }
  };

  BlockLayoutGenerator.prototype._createBlock = function(context){
    var extent = context.getBlockCurExtent();
    var elements = context.getBlockElements();
    if(extent === 0 || elements.length === 0){
      //console.log("[%s] empty block!", this.style.getMarkupName());
      return null;
    }
    return this.style.createBlock({
      extent:extent,
      elements:elements
    });
  };

  BlockLayoutGenerator.prototype._getNext = function(context){
    if(this.hasCache()){
      var cache = this.popCache();
      // restore inline context if measure changed from when this cache is pushed.
      if(this.hasChildLayout() && cache.display === "inline" && !cache.hasLineBreak){
	var context2 = this._createChildBlockContext(context, this._childLayout.style)

	// restart line in larger measure context.
	if(cache.getBoxMeasure(this.style.flow) <= context.getInlineMaxMeasure()){
	  return this.yieldChildLayout(context2.restoreInlineContext(cache));
	}
	// restart line into shorter measure context, caused by float-layouting.
	// in description,
	//
	// 1. some float-layout has rest extent, and try to yield single line in that space but can't be included and cached.
	// 2. and when restart, measure of new layout has shorter measure than the cached line.
	//
	// to resolve this situation, we restart stream from the head of line.
	this._childLayout.stream.setPos(cache.elements[0].pos); // TODO: if cache.elements[0] is not text object, it may trouble.
	this._childLayout.clearCache(); // stream rewinded, so cache must be destroyed.
	return this.yieldChildLayout(context2);
      }
      return cache;
    }
    
    if(this.hasChildLayout()){
      //console.log("[%s]child layout exists", this.style.getMarkupName());
      var context2 = this._createChildBlockContext(context, this._childLayout.style);
      return this.yieldChildLayout(context2);
    }

    // read next token
    var token = this.stream.get();
    if(token === null){
      return null;
    }

    // if tag token, inherit style
    var child_style = (token instanceof Tag)? new StyleContext(token, this.style) : this.style;

    // inline text or inline tag
    if(Token.isText(token) || child_style.isInline()){
      //console.log("block -> inline from %s", this.style.getMarkupName());
      this.stream.prev();
      this.setChildLayout(new InlineLayoutGenerator(this.style, this.stream));

      // block context is not required by inline-generator.
      // because it yields single line and block-over is always captured by it's parent block generator.
      return this.yieldChildLayout();
    }

    var child_context = this._createChildBlockContext(context, child_style);

    // child block with float
    if(child_style.isFloated()){
      this.stream.prev();
      this.setChildLayout(new FloatLayoutGenerator(this.style, this.stream));
      return this.yieldChildLayout(this._createChildBlockContext(context)); // child context with no child-style.
    }

    if(child_style.display === "list-item"){
      this.setChildLayout(new ListItemLayoutGenerator(child_style, this._createStream(token), context));
      return this.yieldChildLayout(child_context);
    }

    if(child_style.display === "table-row"){
      this.setChildLayout(new TableRowLayoutGenerator(child_style, this._createStream(token), context));
      return this.yieldChildLayout(child_context);
    }

    switch(child_style.getMarkupName()){
    case "ul": case "ol":
      this.setChildLayout(new ListLayoutGenerator(child_style, new ListTagStream(token.getContent())));
      return this.yieldChildLayout(child_context);
      
    default:
      this.setChildLayout(new BlockLayoutGenerator(child_style, this._createStream(token)));
      return this.yieldChildLayout(child_context);
    }
  };

  BlockLayoutGenerator.prototype._createStream = function(tag){
    return new TokenStream(tag.getContent()); // TODO
  };

  return BlockLayoutGenerator;
})();

