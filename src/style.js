Nehan.Style = (function(){
  /**
   @memberof Nehan
   @class Style
   @classdesc abstraction of document tree hierarchy with selector values, associated markup, cursor_context.
   @constructor

   @param context {Nehan.RenderingContext}
   @param markup {Nehan.Tag} - markup of style
   @param paernt {Nehan.Style} - parent style
   @param args {Object} - option arguments
   @param args.forceCss {Object} - system css that must be applied.
   @param args.cursorContext {Nehan.LayoutContext} - cursor context at the point of this style context created.
   */
  function Style(context, markup, parent, args){
    this._initialize(context, markup, parent, args);
  }
  
  // to fetch first text part from content html.
  var __rex_first_letter = /(^(<[^>]+>|[\s\n])*)(\S)/mi;
  var __body_font = Nehan.Display.getStdFont(); // just a cache

  var __is_managed_css_prop = function(prop){
    return Nehan.List.exists(Nehan.Config.managedCssProps, Nehan.Closure.eq(prop));
  };

  var __is_callback_css_prop = function(prop){
    return Nehan.List.exists(Nehan.Config.callbackCssProps, Nehan.Closure.eq(prop));
  };

  Style.prototype._initialize = function(selectors, markup, parent, args){
    args = args || {};

    this.selectors = selectors;
    this.markup = markup;
    this.markupName = markup.getName();
    this.parent = parent || null;

    // notice that 'this.childs' is not children of each page.
    // for example, assume that <body> consists 2 page(<div1>, <div2>).
    //
    // <body><div1>page1</div1><div2>page2</div2></body>
    //
    // at this case, global chilren of <body> is <div1> and <div2>.
    // but for '<body> of page1', <div1> is the only child, and <div2> is for '<body> of page2' also.
    // so we may create 'contextChilds' to distinguish these difference.
    this.childs = [];

    this.next = null; // next sibling
    this.prev = null; // prev sibling

    // initialize tree
    if(parent){
      parent.appendChild(this);
    }

    // create selector cache key
    this.selectorCacheKey = this._computeSelectorCacheKey();

    // create context for each functional css property.
    this.selectorPropContext = new Nehan.SelectorPropContext(this, args.cursorContext || null);

    // create selector callback context,
    // this context is passed to "onload" callback.
    // unlike selector-context, this context has reference to all css values associated with this style.
    // because 'onload' callback is called after loading selector css.
    // notice that at this phase, css values are not converted into internal style object.
    // so by updating css value, you can update calculation of internal style object.
    this.selectorContext = new Nehan.SelectorContext(this, args.cursorContext || null);

    this.managedCss = new Nehan.CssHashSet();
    this.unmanagedCss = new Nehan.CssHashSet();
    this.callbackCss = new Nehan.CssHashSet();

    // load managed css from
    // 1. load selector css.
    // 2. load inline css from 'style' property of markup.
    // 3. load callback css 'onload'.
    // 4. load system required css(args.forceCss).
    this._registerCssValues(this._loadSelectorCss(markup, parent));
    this._registerCssValues(this._loadInlineCss(markup));
    var onload = this.callbackCss.get("onload");
    if(onload){
      this._registerCssValues(onload(this.selectorContext) || {});
    }
    this._registerCssValues(args.forceCss || {});

    // always required properties
    this.display = this._loadDisplay(); // required
    this.flow = this._loadFlow(); // required
    this.boxSizing = this._loadBoxSizing(); // required

    // optional properties
    var color = this._loadColor();
    if(color){
      this.color = color;
    }
    var font = this._loadFont();
    if(font){
      this.font = font;
    }
    var box_position = this._loadBoxPosition();
    if(box_position){
      this.boxPosition = box_position;
    }
    var border_collapse = this._loadBorderCollapse();
    if(border_collapse){
      this.borderCollapse = border_collapse;
    }
    var line_height = this._loadLineHeight();
    if(line_height){
      this.lineHeight = line_height;
    }
    var text_align = this._loadTextAlign();
    if(text_align){
      this.textAlign = text_align;
    }
    var text_empha = this._loadTextEmpha();
    if(text_empha){
      this.textEmpha = text_empha;
    }
    var text_combine = this._loadTextCombine();
    if(text_combine){
      this.textCombine = text_combine;
    }
    var list_style = this._loadListStyle();
    if(list_style){
      this.listStyle = list_style;
    }
    // keyword 'float' is reserved in js, so we name this prop 'float direction' instead.
    var float_direction = this._loadFloatDirection();
    if(float_direction){
      this.floatDirection = float_direction;
    }
    var break_before = this._loadBreakBefore();
    if(break_before){
      this.breakBefore = break_before;
    }
    var break_after = this._loadBreakAfter();
    if(break_after){
      this.breakAfter = break_after;
    }
    var word_break = this._loadWordBreak();
    if(word_break){
      this.wordBreak = word_break;
    }
    var white_space = this._loadWhiteSpace();
    if(white_space){
      this.whiteSpace = white_space;
    }
    var hanging_punctuation = this._loadHangingPunctuation();
    if(hanging_punctuation){
      this.hangingPunctuation = hanging_punctuation;
    }
    var edge = this._loadEdge(this.flow, this.getFontSize());
    if(edge){
      this.edge = edge;
    }
    // static size is defined in selector or tag attr, hightest priority
    this.staticMeasure = this._loadStaticMeasure();
    this.staticExtent = this._loadStaticExtent();

    // context size(outer size and content size) is defined by
    // 1. current static size
    // 2. parent size
    // 3. current edge size.
    this.initContextSize(this.staticMeasure, this.staticExtent);

    // margin-cancel or edge-collapse after context size is calculated.
    if(this.edge){
      if(this.edge.margin){
	Nehan.MarginCancel.cancel(this);
      }
      // border collapse after context size is calculated.
      if(this.edge.border && this.getBorderCollapse() === "collapse" && this.display !== "table"){
	Nehan.BorderCollapse.collapse(this);
      }
    }

    // disable some unmanaged css properties depending on loaded style values.
    this._disableUnmanagedCssProps(this.unmanagedCss);
  };
  /**
   calculate contexual box size of this style.

   @memberof Nehan.Style
   @method initContextSize
   @param measure {int}
   @param extent {int}
   @description <pre>
   *
   * (a) outer_size
   * 1. if direct size is given, use it as outer_size.
   * 2. else if parent exists, use content_size of parent.
   * 3. else if parent not exists(root), use layout size defined in display.js.
   
   * (b) content_size
   * 1. if edge(margin/padding/border) is defined, content_size = outer_size - edge_size
   *    1.1. if box-sizing is "margin-box", margin/padding/border are included in outer_size, so
   *         content_size = outer_size - (margin + padding + border)
   *    1.2  if box-siging is "border-box", padding/border are included in outer_size, so
   *         content_size = outer_size - (padding + border)
   *    1.3  if box-sizing is "content-box", edge_size is not included in outer_size, so
   *         content_size = outer_size
   * 2. else(no edge),  content_size = outer_size
   *</pre>
   */
  Style.prototype.initContextSize = function(measure, extent){
    this.initContextMeasure(measure);
    this.initContextExtent(extent);
  };
  /**
   calculate contexual box measure

   @memberof Nehan.Style
   @method initContextMeasure
   @param measure {int}
   */
  Style.prototype.initContextMeasure = function(measure){
    this.outerMeasure = measure  || (this.parent? this.parent.contentMeasure : Nehan.Display.getMeasure(this.flow));
    this.contentMeasure = this._computeContentMeasure(this.outerMeasure);
  };
  /**
   calculate contexual box extent

   @memberof Nehan.Style
   @method initContextExtent
   @param extent {int}
   */
  Style.prototype.initContextExtent = function(extent){
    this.outerExtent = extent || (this.parent? this.parent.contentExtent : Nehan.Display.getExtent(this.flow));
    this.contentExtent = this._computeContentExtent(this.outerExtent);
  };
  /**
   update context size, and propagate update to children.

   @memberof Nehan.Style
   @param measure {int}
   @param extent {int}
   */
  Style.prototype.updateContextSize = function(measure, extent){
    // measure of marker or table is always fixed.
    if(this.markupName === "marker" || this.display === "table"){
      return this;
    }
    this.staticMeasure = measure;
    this.staticExtent = extent;
    this.initContextSize(measure, extent);

    // force re-culculate context-size of children based on new context-size of parent.
    Nehan.List.iter(this.childs, function(child){
      child.updateContextSize(null, null);
    });

    return this;
  };
  /**
   clone style-context with temporary css

   @memberof Nehan.Style
   @param css {Object}
   @return {Nehan.Style}
   */
  Style.prototype.clone = function(css){
    var clone_style = this.parent?
	new Style(this.selectors, this.markup, this.parent, {forceCss:(css || {})}) :
	this.createChild("div", css); // can't use root style(body) twice, so use 'div' instead.
    if(clone_style.parent){
      clone_style.parent.removeChild(clone_style);
    }
    clone_style.setClone(true);
    return clone_style;
  };
  /**
   append child style context

   @memberof Nehan.Style
   @param child_style {Nehan.Style}
   */
  Style.prototype.appendChild = function(child_style){
    if(this.childs.length > 0){
      var last_child = Nehan.List.last(this.childs);
      last_child.next = child_style;
      child_style.prev = last_child;
    }
    this.childs.push(child_style);
  };
  /**
   @memberof Nehan.Style
   @param child_style {Nehan.Style}
   @return {Nehan.Style | null} removed child or null if nothing removed.
   */
  Style.prototype.removeChild = function(child_style){
    var index = Nehan.List.indexOf(this.childs, function(child){
      return child === child_style;
    });
    if(index >= 0){
      var removed_child = this.childs.splice(index, 1);
      return removed_child;
    }
    return null;
  };
  /**
   inherit style with tag_name and css(optional).

   @memberof Nehan.Style
   @param tag_name {String}
   @param css {Object}
   @param tag_attr {Object}
   @return {Nehan.Style}
   */
  Style.prototype.createChild = function(tag_name, css, tag_attr){
    var tag = new Nehan.Tag("<" + tag_name + ">");
    tag.setAttrs(tag_attr || {});
    return new Style(this.selectors, tag, this, {forceCss:(css || {})});
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isClone = function(){
    return this._isClone || false;
  };
  /**
   @memberof Nehan.Style
   @param state {boolean}
   */
  Style.prototype.setClone = function(state){
    this._isClone = state;
  };
  /**
   @memberof Nehan.Style
   @param opt {Object}
   @param opt.extent {int}
   @param opt.elements {Array.<Nehan.Box>}
   @param opt.breakAfter {boolean}
   @param opt.blockId {int}
   @param opt.content {String}
   @return {Nehan.Box}
   */
  Style.prototype.createBlock = function(context, opt){
    opt = opt || {};
    var elements = opt.elements || [];
    var measure = this.contentMeasure;
    var extent = this.contentExtent;

    // if elements under <body>, staticExtent or context extent(opt.extent) is available.
    if(this.parent && opt.extent){
      extent = this.staticExtent || opt.extent;
    }

    var edge = this.edge || null;
    if(edge && (!opt.useBeforeEdge || !opt.useAfterEdge) && this.markupName !== "hr"){
      edge = edge.clone();
      if(!opt.useBeforeEdge){
	console.log("clear before edge:%d", edge.getBefore(this.flow));
	edge.clearBefore(this.flow);
      }
      if(!opt.useAfterEdge){
	console.log("clear after edge:%d", edge.getAfter(this.flow));
	edge.clearAfter(this.flow);
      }
    }

    var classes = ["nehan-block", "nehan-" + this.getMarkupName()].concat(this.markup.getClasses());
    var box_size = this.flow.getBoxSize(measure, extent);
    var box = new Nehan.Box(box_size, context);
    if(this.markup.isHeaderTag()){
      classes.push("nehan-header");
    }
    if(this.isClone()){
      classes.push("nehan-clone");
    }
    box.blockId = opt.blockId;
    box.display = (this.display === "inline-block")? this.display : "block";
    box.edge = edge;
    box.addElements(elements);
    box.classes = classes;
    box.charCount = elements.reduce(function(total, element){
      return total + (element.charCount || 0);
    }, 0);
    // [FIXME] css break-after is used only when last output.
    //box.breakAfter = this.isBreakAfter() || opt.breakAfter || false;
    box.breakAfter = opt.breakAfter || false;
    box.content = opt.content || null;
    box.isFirst = opt.isFirst || false;
    box.isLast = opt.isLast || false;
    box.restExtent = opt.restExtent || 0;
    box.restMeasure = opt.restMeasure || 0;
    if(this.isPushed()){
      box.pushed = true;
    } else if(this.isPulled()){
      box.pulled = true;
    }
    //console.log("[%s]block(%o):%s:(%d,%d)", this.markupName, box, box.toString(), box.size.width, box.size.height);
    return box;
  };
  /**
   @memberof Nehan.Style
   @param opt
   @param opt.breakAfter {boolean}
   @return {Nehan.Box}
   */
  Style.prototype.createImage = function(context, opt){
    opt = opt || {};
    // image size always considered as horizontal mode.
    var width = this.getMarkupAttr("width")? parseInt(this.getMarkupAttr("width"), 10) : (this.staticMeasure || this.getFontSize());
    var height = this.getMarkupAttr("height")? parseInt(this.getMarkupAttr("height"), 10) : (this.staticExtent || this.getFontSize());
    var classes = ["nehan-block", "nehan-image"].concat(this.markup.getClasses());
    var image_size = new Nehan.BoxSize(width, height);
    var image = new Nehan.Box(image_size, context);
    image.display = this.display; // inline, block, inline-block
    image.edge = this.edge || null;
    image.classes = classes;
    image.charCount = 0;
    if(this.isPushed()){
      image.pushed = true;
    } else if(this.isPulled()){
      image.pulled = true;
    }
    image.breakAfter = this.isBreakAfter() || opt.breakAfter || false;
    return image;
  };
  /**
   @memberof Nehan.Style
   @param opt
   @param opt.measure {int}
   @param opt.content {String}
   @param opt.charCount {int}
   @param opt.elements {Array.<Nehan.Box>}
   @param opt.maxFontSize {int}
   @param opt.maxExtent {int}
   @param opt.hasLineBreak {boolean}
   @param opt.breakAfter {boolean}
   @return {Nehan.Box}
   */
  Style.prototype.createLine = function(context, opt){
    opt = opt || {};
    var is_inline_root = this.isInlineRoot();
    var elements = opt.elements || [];
    var max_font_size = opt.maxFontSize || this.getFontSize();
    var max_extent = opt.maxExtent || this.staticExtent || 0;
    var char_count = opt.charCount || 0;
    var content = opt.content || null;
    var measure = this.contentMeasure;
    if((this.parent && opt.measure && !is_inline_root) || (this.display === "inline-block")){
      measure = this.staticMeasure || opt.measure;
    }
    var line_size = this.flow.getBoxSize(measure, max_extent);
    var classes = ["nehan-inline", "nehan-inline-" + this.flow.getName()].concat(this.markup.getClasses());
    var line = new Nehan.Box(line_size, context, "line-block");
    line.display = "inline"; // caution: display of anonymous line shares it's parent markup.
    line.addElements(elements);
    line.classes = is_inline_root? classes : classes.concat("nehan-" + this.getMarkupName());
    line.charCount = char_count;
    line.maxFontSize = max_font_size;
    line.maxExtent = max_extent;
    line.content = content;
    line.isInlineRoot = is_inline_root;
    line.hasLineBreak = opt.hasLineBreak || false;
    line.hangingPunctuation = opt.hangingPunctuation || null;

    // edge of top level line is disabled.
    // for example, consider '<p>aaa<span>bbb</span>ccc</p>'.
    // anonymous line block('aaa' and 'ccc') is already edged by <p> in block level.
    // so if line is anonymous, edge must be ignored.
    line.edge = (this.edge && !is_inline_root)? this.edge : null;

    // backup other line data. mainly required to restore inline-context.
    if(is_inline_root){
      line.lineNo = opt.lineNo;
      line.breakAfter = opt.breakAfter || false;
      line.hyphenated = opt.hyphenated || false;
      line.inlineMeasure = opt.measure || this.contentMeasure;
      line.classes.push("nehan-root-line");

      // set baseline
      Nehan.Baseline.set(line);

      // set text-align
      if(this.textAlign && (this.textAlign.isCenter() || this.textAlign.isEnd())){
	this.textAlign.setAlign(line);
      } else if(this.textAlign && this.textAlign.isJustify()){
	this.textAlign.setJustify(line);
      }
      // set edge
      var edge_size = Math.floor(line.maxFontSize * this.getLineHeight()) - line.maxExtent;
      if(line.elements.length > 0 && edge_size > 0){
	line.edge = new Nehan.BoxEdge();
	line.edge.padding.setBefore(this.flow, edge_size);
      }
    }
    //console.log("line(%o):%s:(%d,%d), is_root:%o", line, line.toString(), line.size.width, line.size.height, is_inline_root);
    return line;
  };
  /**
   @memberof Nehan.Style
   @param opt
   @param opt.measure {int}
   @param opt.content {String}
   @param opt.charCount {int}
   @param opt.elements {Array.<Nehan.Char | Nehan.Word | Nehan.Tcy>}
   @param opt.maxFontSize {int}
   @param opt.maxExtent {int}
   @param opt.hasLineBreak {boolean}
   @param opt.breakAfter {boolean}
   @return {Nehan.Box}
   */
  Style.prototype.createTextBlock = function(context, opt){
    opt = opt || {};
    var elements = opt.elements || [];
    var font_size = this.getFontSize();
    var extent = opt.maxExtent || font_size;
    var measure = opt.measure;
    var char_count = opt.charCount || 0;
    var content = opt.content || null;

    if(opt.isEmpty){
      extent = 0;
    } else if(this.isTextEmphaEnable()){
      extent = this.getEmphaTextBlockExtent();
    } else if(this.markup.name === "ruby"){
      extent = this.getRubyTextBlockExtent();
    }
    var line_size = this.flow.getBoxSize(measure, extent);
    var classes = ["nehan-text-block"].concat(this.markup.getClasses());
    var line = new Nehan.Box(line_size, context, "text-block");
    line.display = "inline"; // caution: display of anonymous line shares it's parent markup.
    line.addElements(elements);
    line.classes = classes;
    line.charCount = char_count;
    line.maxFontSize = font_size;
    line.maxExtent = extent;
    line.content = content;
    line.hasLineBreak = opt.hasLineBreak || false;
    line.hyphenated = opt.hyphenated || false;
    line.lineOver = opt.lineOver || false;
    line.hangingPunctuation = opt.hangingPunctuation || null;
    //console.log("text(%o):%s:(%d,%d)", line, line.toString(), line.size.width, line.size.height);
    return line;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isDisabled = function(){
    if(this.display === "none"){
      return true;
    }
    if(Nehan.List.exists(Nehan.Config.disabledMarkups, Nehan.Closure.eq(this.getMarkupName()))){
      return true;
    }
    if(this.contentMeasure <= 0 || this.contentExtent <= 0){
      return true;
    }
    if(this.markup.isCloseTag()){
      return true;
    }
    if(!this.markup.isSingleTag() && this.isMarkupEmpty() && this.getContent() === ""){
      return true;
    }
    return false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isBlock = function(){
    switch(this.display){
    case "block":
    case "table":
    case "table-caption":
    case "table-header-group": // <thead>
    case "table-row-group": // <tbody>
    case "table-footer-group": // <tfoot>
    case "table-row":
    case "table-cell":
    case "list-item":
      return true;
    }
    return false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isRoot = function(){
    //return this.parent === null;
    return this.getMarkupName() === "body";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isChildBlock = function(){
    return this.isBlock() && !this.isRoot();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isInlineBlock = function(){
    return this.display === "inline-block";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isInline = function(){
    return this.display === "inline";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isInlineRoot = function(){
    // Check if current inline is anonymous line block.
    // Note that inline-generators of root line share the style-context with parent block element,
    // So we use 'this.isBlock() || tis.isInlineBlock()' for checking method.
    // 1. line-object is just under the block element,
    //  <body>this text is included in anonymous line block</body>
    //
    // 2. line-object is just under the inline-block element.
    //  <div style='display:inline-block'>this text is included in anonymous line block</div>
    return this.isBlock() || this.isInlineBlock() || this.isFloated();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFloatStart = function(){
    return this.floatDirection? this.floatDirection.isStart() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFloatEnd = function(){
    return this.floatDirection? this.floatDirection.isEnd() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFloated = function(){
    return this.isFloatStart() || this.isFloatEnd();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPushed = function(){
    return this.getMarkupAttr("pushed") !== null;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPulled = function(){
    return this.getMarkupAttr("pulled") !== null;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPasted = function(){
    return this.getMarkupAttr("pasted") !== null;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isLineBreak = function(){
    return this.markupName === "br";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isTextEmphaEnable = function(){
    return (this.textEmpha && this.textEmpha.isEnable())? true : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isTextVertical = function(){
    return this.flow.isTextVertical();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isTextHorizontal = function(){
    return this.flow.isTextHorizontal();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPositionAbsolute = function(){
    return this.boxPosition? this.boxPosition.isAbsolute() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPre = function(){
    return this.whiteSpace === "pre";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isPageBreak = function(){
    switch(this.getMarkupName()){
    case "page-break": case "end-page": case "pbr":
      return true;
    default:
      return false;
    }
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isBreakBefore = function(){
    return this.breakBefore? !this.breakBefore.isAvoid() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isBreakAfter = function(){
    return this.breakAfter? !this.breakAfter.isAvoid() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFirstLine = function(){
    return this.markupName === "first-line";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFirstChild = function(){
    return this.markup.isFirstChild();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isFirstOfType = function(){
    return this.markup.isFirstOfType();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isLastChild = function(){
    return this.markup.isLastChild();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isLastOfType = function(){
    return this.markup.isLastOfType();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isOnlyChild = function(){
    return this.markup.isOnlyChild();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isOnlyOfType = function(){
    return this.markup.isOnlyOfType();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isMarkupEmpty = function(){
    return this.markup.isEmpty();
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isWordBreakAll = function(){
    return this.wordBreak? this.wordBreak.isWordBreakAll() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isHyphenationEnable = function(){
    return this.wordBreak? this.wordBreak.isHyphenationEnable() : false;
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.isHangingPuncEnable = function(){
    // if floating inline, avoid hanging pucntuation.
    if(this.isClone()){
      return false;
    }
    return this.hangingPunctuation && this.hangingPunctuation === "allow-end";
  };
  /**
   @memberof Nehan.Style
   @return {boolean}
   */
  Style.prototype.hasFlipFlow = function(){
    return this.parent? (this.flow !== this.parent.flow) : false;
  };
  /**
   @memberof Nehan.Style
   */
  Style.prototype.clearBreakBefore = function(){
    this.breakBefore = null;
  };
  /**
   @memberof Nehan.Style
   */
  Style.prototype.clearBreakAfter = function(){
    this.breakAfter = null;
  };
  /**
   search property from markup attributes first, and css values second.

   @memberof Nehan.Style
   @param name {String}
   @param def_value {default_value}
   @return {value}
   */
  Style.prototype.getAttr = function(name, def_value){
    var ret = this.getMarkupAttr(name);
    if(typeof ret !== "undefined" && ret !== null){
      return ret;
    }
    ret = this.getCssAttr(name);
    if(typeof ret !== "undefined" && ret !== null){
      return ret;
    }
    return (typeof def_value !== "undefined")? def_value : null;
  };
  /**
   @memberof Nehan.Style
   @param name {String}
   @param def_value {default_value}
   @return {value}
   */
  Style.prototype.getMarkupAttr = function(name, def_value){
    // if markup is "<img src='aaa.jpg'>"
    // getMarkupAttr("src") => 'aaa.jpg'
    if(name === "id"){
      return this.markup.id;
    }
    return this.markup.getAttr(name, def_value);
  };
  Style.prototype._evalCssAttr = function(name, value){
    // if value is function, call with selector context, and format the returned value.
    if(typeof value === "function"){
      return Nehan.CssParser.formatValue(name, value(this.selectorPropContext));
    }
    return Nehan.CssParser.formatValue(name, value);
  };
  /**
   @memberof Nehan.Style
   @param name {String}
   @param value {css_value}
   */
  Style.prototype.setCssAttr = function(name, value){
    if(__is_managed_css_prop(name)){
      this.managedCss.add(name, value);
    } else {
      this.unmanagedCss.add(name, value);
    }
  };
  /**
   @memberof Nehan.Style
   @param name {String}
   @def_value {default_value}
   @return {css_value}
   @description <pre>
   * notice that subdivided properties like 'margin-before' as [name] are always not found,
   * even if you defined them in setStyle(s).
   * because all subdivided properties are already converted into unified name in loading process.
   */
  Style.prototype.getCssAttr = function(name, def_value){
    var ret;
    ret = this.managedCss.get(name);
    if(ret !== null){
      return this._evalCssAttr(name, ret);
    }
    ret = this.unmanagedCss.get(name);
    if(ret !== null){
      return this._evalCssAttr(name, ret);
    }
    ret = this.callbackCss.get(name);
    if(ret !== null){
      return ret;
    }
    return (typeof def_value !== "undefined")? def_value : null;
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getParentMarkupName = function(){
    return this.parent? this.parent.getMarkupName() : null;
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Tag}
   */
  Style.prototype.getMarkup = function(){
    return this.markup;
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getMarkupName = function(){
    return this.markup.getName();
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getMarkupId = function(){
    return this.markup.getId();
  };
  /**
   @memberof Nehan.Style
   @return {Array.<String>}
   */
  Style.prototype.getMarkupClasses = function(){
    return this.markup.getClasses();
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getMarkupContent = function(){
    return this.markup.getContent();
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getMarkupPos = function(){
    return this.markup.pos;
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getMarkupData = function(name){
    return this.markup.getData(name);
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getContent = function(){
    var content = this.getCssAttr("content") || this.markup.getContent();
    var before = this.selectors.getValuePe(this, "before");
    if(!Nehan.Obj.isEmpty(before)){
      content = Nehan.Html.tagWrap("before", before.content || "") + content;
    }
    var after = this.selectors.getValuePe(this, "after");
    if(!Nehan.Obj.isEmpty(after)){
      content = content + Nehan.Html.tagWrap("after", after.content || "");
    }
    var first_letter = this.selectors.getValuePe(this, "first-letter");
    if(!Nehan.Obj.isEmpty(first_letter)){
      content = content.replace(__rex_first_letter, function(match, p1, p2, p3){
	return p1 + Nehan.Html.tagWrap("first-letter", p3);
      });
    }
    var first_line = this.selectors.getValuePe(this, "first-line");
    if(!Nehan.Obj.isEmpty(first_line)){
      content = Nehan.Html.tagWrap("first-line", content);
    }
    return content;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getHeaderRank = function(){
    if(this.getMarkupName().match(/h([1-6])/)){
      return parseInt(RegExp.$1, 10);
    }
    return 0;
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getSelectorCacheKey = function(){
    return this.selectorCacheKey;
  };
  /**
   @memberof Nehan.Style
   @param pseudo_element_name {String}
   @return {String}
   */
  Style.prototype.getSelectorCacheKeyPe = function(pseudo_element_name){
    return this.selectorCacheKey + "::" + pseudo_element_name;
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Font}
   */
  Style.prototype.getFont = function(){
    return this.font || (this.parent? this.parent.getFont() : Nehan.Display.getStdFont());
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Font}
   */
  Style.prototype.getRootFont = function(){
    return __body_font;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getFontSize = function(){
    return this.getFont().size;
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getFontFamily = function(){
    return this.getFont().family;
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.TextAlign}
   */
  Style.prototype.getTextAlign = function(){
    return this.textAlign || Nehan.TextAligns.get("start");
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getTextCombine = function(){
    return this.textCombine || null;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getLetterSpacing = function(){
    return this.letterSpacing || 0;
  };
  /**
   @memberof Nehan.Style
   @param order {int}
   @return {String}
   */
  Style.prototype.getListMarkerHtml = function(order){
    return this.listStyle? this.listStyle.getMarkerHtml(order) : (this.parent? this.parent.getListMarkerHtml(order) : "&nbsp;");
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getListMarkerSize = function(){
    if(this.listMarkerSize){
      return this.listMarkerSize;
    }
    if(this.parent){
      return this.parent.getListMarkerSize();
    }
    var font_size = this.getFontSize();
    return new Nehan.BoxSize(font_size, font_size);
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Color}
   */
  Style.prototype.getColor = function(){
    return this.color || (this.parent? this.parent.getColor() : new Nehan.Color(Nehan.Display.fontColor));
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Partition}
   */
  Style.prototype.getTablePartition = function(){
    return this.tablePartition || (this.parent? this.parent.getTablePartition() : null);
  };
  /**
   @memberof Nehan.Style
   @return {String}
   */
  Style.prototype.getBorderCollapse = function(){
    if(this.borderCollapse){
      return (this.borderCollapse === "inherit")? this.parent.getBorderCollapse() : this.borderCollapse;
    }
    return null;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getChildCount = function(){
    return this.childs.length;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getChildIndex = function(){
    var self = this;
    return Math.max(0, Nehan.List.indexOf(this.getParentChilds(), function(child){
      return child === self;
    }));
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getChildIndexOfType = function(){
    var self = this;
    return Math.max(0, Nehan.List.indexOf(this.getParentChildsOfType(this.getMarkupName()), function(child){
      return child === self;
    }));
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Style}
   */
  Style.prototype.getNthChild = function(nth){
    return this.childs[nth] || null;
  };
  /**
   @memberof Nehan.Style
   @return {Array.<Nehan.Style>}
   */
  Style.prototype.getParentChilds = function(){
    return this.parent? this.parent.childs : [];
  };
  /**
   @memberof Nehan.Style
   @param nth {int}
   @return {Nehan.Style}
   */
  Style.prototype.getParentNthChild = function(nth){
    return this.parent? this.parent.getNthChild(nth) : null;
  };
  /**
   @memberof Nehan.Style
   @param markup_name {String}
   @return {Nehan.Style}
   */
  Style.prototype.getParentChildsOfType = function(markup_name){
    return this.getParentChilds().filter(function(child){
      return child.getMarkupName() === markup_name;
    });
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.BoxFlow}
   */
  Style.prototype.getParentFlow = function(){
    return this.parent? this.parent.flow : this.flow;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getParentFontSize = function(){
    return this.parent? this.parent.getFontSize() : Nehan.Display.fontSize;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getParentContentMeasure = function(){
    return this.parent? this.parent.contentMeasure : Nehan.Display.getMeasure(this.flow);
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getParentContentExtent = function(){
    return this.parent? this.parent.contentExtent : Nehan.Display.getExtent(this.flow);
  };
  /**
   @memberof Nehan.Style
   @return {Nehan.Style}
   */
  Style.prototype.getNextSibling = function(){
    return this.next;
  };
  /**
   @memberof Nehan.Style
   @return {float | int}
   */
  Style.prototype.getLineHeight = function(){
    return this.lineHeight || Nehan.Display.lineHeight || 2;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEmphaTextBlockExtent = function(){
    return this.getFontSize() * 2;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getRubyTextBlockExtent = function(){
    var base_font_size = this.getFontSize();
    var extent = Math.floor(base_font_size * (1 + Nehan.Display.rubyRate));
    return (base_font_size % 2 === 0)? extent : extent + 1;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getAutoLineExtent = function(){
    return Math.floor(this.getFontSize() * this.getLineHeight());
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeMeasure = function(flow){
    var edge = this.edge || null;
    return edge? edge.getMeasure(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeExtent = function(flow){
    var edge = this.edge || null;
    return edge? edge.getExtent(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeStart = function(flow){
    var edge = this.edge || null;
    return edge? edge.getStart(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeEnd = function(flow){
    var edge = this.edge || null;
    return edge? edge.getEnd(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeBefore = function(flow){
    var edge = this.edge || null;
    return edge? edge.getBefore(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getEdgeAfter = function(flow){
    var edge = this.edge || null;
    return edge? edge.getAfter(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getInnerEdgeMeasure = function(flow){
    var edge = this.edge || null;
    return edge? edge.getInnerMeasureSize(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @return {int}
   */
  Style.prototype.getInnerEdgeExtent = function(flow){
    var edge = this.edge || null;
    return edge? edge.getInnerExtentSize(flow || this.flow) : 0;
  };
  /**
   @memberof Nehan.Style
   @param block {Nehan.Box}
   @return {Object}
   */
  Style.prototype.getCssBlock = function(block){
    // notice that box-size, box-edge is box local variable,<br>
    // so style of box-size(content-size) and edge-size are generated at Box::getCssBlock
    var css = {};
    var is_vert = this.isTextVertical();
    css.display = "block";
    if(this.font){
      Nehan.Args.copy(css, this.font.getCss());
    }
    if(this.parent && this.getMarkupName() !== "body"){
      Nehan.Args.copy(css, this.parent.flow.getCss());
    }
    if(this.color){
      Nehan.Args.copy(css, this.color.getCss());
    }
    if(this.letterSpacing && !is_vert){
      css["letter-spacing"] = this.letterSpacing + "px";
    }
    if(this.floatDirection){
      Nehan.Args.copy(css, this.floatDirection.getCss(is_vert));
    }
    if(this.boxPosition){
      Nehan.Args.copy(css, this.boxPosition.getCss());
    }
    if(this.zIndex){
      css["z-index"] = this.zIndex;
    }
    this.unmanagedCss.copyValuesTo(css);
    Nehan.Args.copy(css, block.size.getCss(this.flow)); // content size
    if(block.edge){
      Nehan.Args.copy(css, block.edge.getCss());
    }
    Nehan.Args.copy(css, block.css); // some dynamic values
    return css;
  };
  /**
   @memberof Nehan.Style
   @param line {Nehan.Box}
   @return {Object}
   */
  Style.prototype.getCssLineBlock = function(line){
    // notice that line-size, line-edge is box local variable,
    // so style of line-size(content-size) and edge-size are generated at Box::getBoxCss
    var css = {};
    Nehan.Args.copy(css, line.size.getCss(this.flow));
    if(line.edge){
      Nehan.Args.copy(css, line.edge.getCss());
    }
    if(this.isInlineRoot()){
      Nehan.Args.copy(css, this.flow.getCss());
    }
    if(this.font && (!this.isInlineRoot() || this.isFirstLine())){
      Nehan.Args.copy(css, this.font.getCss());
    }
    if(this.color){
      Nehan.Args.copy(css, this.color.getCss());
    }
    if(this.isInlineRoot()){
      css["line-height"] = this.getFontSize() + "px";
    }
    if(this.isTextVertical()){
      css["display"] = "block";
    }
    this.unmanagedCss.copyValuesTo(css);
    Nehan.Args.copy(css, line.css);
    css["background-color"] = this.getCssAttr("background-color", "transparent");
    return css;
  };
  /**
   @memberof Nehan.Style
   @param line {Nehan.Box}
   @return {Object}
   */
  Style.prototype.getCssTextBlock = function(line){
    // notice that line-size, line-edge is box local variable,
    // so style of line-size(content-size) and edge-size are generated at Box::getCssInline
    var css = {};
    Nehan.Args.copy(css, line.size.getCss(this.flow));
    if(line.edge){
      Nehan.Args.copy(css, line.edge.getCss());
    }
    if(this.isTextVertical()){
      css["display"] = "block";
      css["line-height"] = "1em";
      if(Nehan.Env.client.isAppleMobileFamily()){
	css["letter-spacing"] = "-0.001em";
      }
    } else {
      Nehan.Args.copy(css, this.flow.getCss());
      css["line-height"] = line.maxFontSize + "px";

      // enable line-height only when horizontal mode.
      // this logic is required for drop-caps of horizontal mode.
      // TODO: more simple solution.
      var line_height = this.getCssAttr("line-height");
      if(line_height){
	css["line-height"] = this._computeUnitSize(line_height, this.getFontSize()) + "px";
      }
      if(this.getMarkupName() === "ruby" || this.isTextEmphaEnable()){
	css["display"] = "inline-block";
      }
    }
    this.unmanagedCss.copyValuesTo(css);
    Nehan.Args.copy(css, line.css);
    css["background-color"] = this.getCssAttr("background-color", "transparent");
    return css;
  };
  /**
   @memberof Nehan.Style
   @param line {Nehan.Box}
   @return {Object}
   */
  Style.prototype.getCssInlineBlock = function(line){
    var css = this.getCssBlock(line);
    if(this.isTextVertical()){
      if(!this.isFloated()){
	delete css["css-float"];
      }
    } else {
      Nehan.Args.copy(css, this.flow.getCss());
    }
    css.display = "inline-block";
    return css;
  };
  /**
   @memberof Nehan.Style
   @param line {Nehan.Box}
   @param image {Nehan.Box}
   @return {Object}
   */
  Style.prototype.getCssHoriInlineImage = function(line, image){
    return this.flow.getCss();

  };

  Style.prototype._computeSelectorCacheKey = function(){
    var keys = this.parent? [this.parent.getSelectorCacheKey()] : [];
    keys.push(this.markup.getKey());
    return keys.join(">");
  };

  Style.prototype._computeContentMeasure = function(outer_measure){
    switch(this.boxSizing){
    case "margin-box": return outer_measure - this.getEdgeMeasure();
    case "border-box": return outer_measure - this.getInnerEdgeMeasure();
    case "content-box": return outer_measure;
    default: return outer_measure;
    }
  };

  Style.prototype._computeContentExtent = function(outer_extent){
    switch(this.boxSizing){
    case "margin-box": return outer_extent - this.getEdgeExtent();
    case "border-box": return outer_extent - this.getInnerEdgeExtent();
    case "content-box": return outer_extent;
    default: return outer_extent;
    }
  };

  Style.prototype._computeFontSize = function(val, unit_size){
    var str = String(val).replace(/\/.+$/, ""); // remove line-height value like 'large/150%"'
    var size = Nehan.Display.fontSizeNames[str] || str;
    var max_size = this.getParentFontSize();
    var font_size = this._computeUnitSize(size, unit_size, max_size);
    return Math.min(font_size, Nehan.Display.maxFontSize);
  };

  Style.prototype._computeUnitSize = function(val, unit_size, max_size){
    var str = String(val);
    if(str.indexOf("rem") > 0){
      var rem_scale = parseFloat(str.replace("rem",""));
      return Math.round(__body_font.size * rem_scale); // use root font-size
    }
    if(str.indexOf("em") > 0){
      var em_scale = parseFloat(str.replace("em",""));
      return Math.round(unit_size * em_scale);
    }
    if(str.indexOf("pt") > 0){
      return Math.round(parseInt(str, 10) * 4 / 3);
    }
    if(str.indexOf("%") > 0){
      return Math.round(max_size * parseInt(str, 10) / 100);
    }
    var px = parseInt(str, 10);
    return isNaN(px)? 0 : px;
  };

  Style.prototype._computeCornerSize = function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = [0, 0];
      ret[prop][0] = this._computeUnitSize(val[prop][0], unit_size);
      ret[prop][1] = this._computeUnitSize(val[prop][1], unit_size);
    }
    return ret;
  };

  Style.prototype._computeEdgeSize = function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = this._computeUnitSize(val[prop], unit_size);
    }
    return ret;
  };

  Style.prototype._loadSelectorCss = function(markup, parent){
    switch(markup.getName()){
    case "marker":
    case "before":
    case "after":
    case "first-letter":
    case "first-line":
      // notice that style of pseudo-element is defined with parent context.
      var pe_values = this.selectors.getValuePe(parent, markup.getName());
      //console.log("[%s::%s] pseudo values:%o", parent.markupName, this.markup.name, pe_values);
      return pe_values;

    default:
      var values = this.selectors.getValue(this);
      //console.log("[%s] selector values:%o", this.markup.name, values);
      return values;
    }
  };

  Style.prototype._loadInlineCss = function(markup){
    var style = markup.getAttr("style");
    if(style === null){
      return {};
    }
    var stmts = (style.indexOf(";") >= 0)? style.split(";") : [style];
    var allowed_props = Nehan.Config.allowedInlineStyleProps || [];
    var values = stmts.reduce(function(ret, stmt){
      var nv = stmt.split(":");
      if(nv.length >= 2){
	var prop = Nehan.Utils.trim(nv[0]).toLowerCase();
	var value = Nehan.Utils.trim(nv[1]);
	var norm_prop = Nehan.CssParser.normalizeProp(prop);
	var fmt_value = Nehan.CssParser.formatValue(prop, value);
	if(allowed_props.length === 0 || Nehan.List.exists(allowed_props, Nehan.Closure.eq(norm_prop))){
	  ret[norm_prop] = fmt_value;
	}
      }
      return ret;
    }, {});
    //console.log("[%s] load inline css:%o", this.markup.name, values);
    return values;
  };

  Style.prototype._disableUnmanagedCssProps = function(unmanaged_css){
    if(this.isTextVertical()){
      // unmanaged 'line-height' is not welcome for vertical-mode.
      unmanaged_css.remove("line-height");
    }
  };

  Style.prototype._registerCssValues = function(values){
    Nehan.Obj.iter(values, function(prop, value){
      var norm_prop = Nehan.CssParser.normalizeProp(prop);
      if(__is_callback_css_prop(norm_prop)){
	this.callbackCss.add(norm_prop, value);
      } else if(__is_managed_css_prop(norm_prop)){
	this.managedCss.add(norm_prop, this._evalCssAttr(prop, value));
      } else {
	this.unmanagedCss.add(norm_prop, this._evalCssAttr(prop, value));
      }
    }.bind(this));
  };

  Style.prototype._loadDisplay = function(){
    switch(this.getMarkupName()){
    case "first-line":
    case "li-marker":
    case "li-body":
      return "block";
    default:
      return this.getCssAttr("display", "inline");
    }
  };

  Style.prototype._loadFlow = function(){
    var value = this.getCssAttr("flow", "inherit");
    var parent_flow = this.parent? this.parent.flow : Nehan.Display.getStdBoxFlow();
    if(value === "inherit"){
      return parent_flow;
    }
    if(value === "flip"){
      return parent_flow.getFlipFlow();
    }
    return Nehan.BoxFlows.getByName(value);
  };

  Style.prototype._loadBoxPosition = function(){
    var pos_value = this.getCssAttr("position");
    if(!pos_value){
      return null;
    }
    var box_pos = new Nehan.BoxPosition(pos_value);
    var font_size = this.getFontSize();
    Nehan.List.iter(Nehan.Const.cssBoxDirsLogical, function(dir){
      var value = this.getCssAttr(dir);
      if(value){
	box_pos[value] = this._computeUnitSize(value, font_size);
      }
    }.bind(this));
    return box_pos;
  };

  Style.prototype._loadBorderCollapse = function(){
    return this.getCssAttr("border-collapse");
  };

  Style.prototype._loadColor = function(){
    var value = this.getCssAttr("color", "inherit");
    if(value !== "inherit"){
      return new Nehan.Color(value);
    }
    return null;
  };

  Style.prototype._loadFont = function(){
    var parent_font = this.getFont();
    var font_size = this.getCssAttr("font-size", "inherit");
    var font_family = this.getCssAttr("font-family", "inherit");
    var font_weight = this.getCssAttr("font-weight", "inherit");
    var font_style = this.getCssAttr("font-style", "inherit");

    // if no special settings, font-style is already defined in parent block.
    // but if parent is inline like <span style='font-size:small'><p>foo</p></span>,
    // then <span>(linline) is terminated when it meets <p>(block), and any box is created by span,
    // so in this case, parent style(span) must be defined by <p>.
    if(this.parent && this.parent.isBlock() && font_size === "inherit" && font_family === "inherit" && font_weight === "inherit" && font_style === "inherit"){
      return null;
    }
    var font = new Nehan.Font(parent_font.size);

    font.family = parent_font.family;
    font.style = parent_font.style;
    font.weight = parent_font.weight;

    if(font_size !== "inherit"){
      font.size = this._computeFontSize(font_size, parent_font.size);
    }
    if(font_family !== "inherit"){
      font.family = font_family;
    }
    if(font_weight !== "inherit"){
      font.weight = font_weight;
    }
    if(font_style !== "inherit"){
      font.style = font_style;
    }
    if(this.getMarkupName() === "body"){
      __body_font = font;
    }
    return font;
  };

  Style.prototype._loadBoxSizing = function(){
    return this.getCssAttr("box-sizing", "margin-box");
  };

  Style.prototype._loadEdge = function(flow, font_size){
    var padding = this._loadPadding(flow, font_size);
    var margin = this._loadMargin(flow, font_size);
    var border = this._loadBorder(flow, font_size);
    if(padding === null && margin === null && border === null){
      return null;
    }
    return new Nehan.BoxEdge({
      padding:padding,
      margin:margin,
      border:border
    });
  };

  Style.prototype._loadEdgeSize = function(font_size, prop){
    var edge_size = this.getCssAttr(prop);
    if(edge_size === null){
      return null;
    }
    return this._computeEdgeSize(edge_size, font_size);
  };

  Style.prototype._loadPadding = function(flow, font_size){
    var edge_size = this._loadEdgeSize(font_size, "padding");
    if(edge_size === null){
      return null;
    }
    var padding = new Nehan.Padding();
    padding.setSize(flow, edge_size);
    return padding;
  };

  Style.prototype._loadMargin = function(flow, font_size){
    var edge_size = this._loadEdgeSize(font_size, "margin");
    if(edge_size === null){
      return null;
    }
    var margin = new Nehan.Margin();
    margin.setSize(flow, edge_size);

    // if inline, disable margin-before and margin-after.
    if(this.isInline()){
      margin.clearBefore(flow);
      margin.clearAfter(flow);
    }
    return margin;
  };

  Style.prototype._loadBorder = function(flow, font_size){
    var edge_size = this._loadEdgeSize(font_size, "border-width");
    var border_radius = this.getCssAttr("border-radius");
    if(edge_size === null && border_radius === null){
      return null;
    }
    var border = new Nehan.Border();
    if(edge_size){
      border.setSize(flow, edge_size);
    }
    if(border_radius){
      border.setRadius(flow, this._computeCornerSize(border_radius, font_size));
    }
    var border_color = this.getCssAttr("border-color");
    if(border_color){
      border.setColor(flow, border_color);
    }
    var border_style = this.getCssAttr("border-style");
    if(border_style){
      border.setStyle(flow, border_style);
    }
    return border;
  };

  Style.prototype._loadLineHeight = function(){
    var value = this.getCssAttr("line-height", "inherit");
    if(value === "inherit"){
      return (this.parent && this.parent.lineHeight)? this.parent.lineHeight : Nehan.Display.lineHeight;
    }
    return parseFloat(value || Nehan.Display.lineHeight);
  };

  Style.prototype._loadTextAlign = function(){
    var value = this.getCssAttr("text-align", "inherit");
    if(value === "inherit" && this.parent && this.parent.textAlign){
      return this.parent.textAlign;
    }
    return Nehan.TextAligns.get(value || "start");
  };

  Style.prototype._loadTextEmpha = function(){
    var empha_style = this.getCssAttr("text-emphasis-style", "none");
    if(empha_style === "none" || empha_style === "inherit"){
      return null;
    }
    var empha_pos = this.getCssAttr("text-emphasis-position", {hori:"over", vert:"right"});
    var empha_color = this.getCssAttr("text-emphasis-color");
    return new Nehan.TextEmpha({
      style:new Nehan.TextEmphaStyle(empha_style),
      pos:new Nehan.TextEmphaPos(empha_pos),
      color:(empha_color? new Nehan.Color(empha_color) : this.getColor())
    });
  };

  Style.prototype._loadTextEmphaStyle = function(){
    var value = this.getCssAttr("text-emphasis-style", "inherit");
    return (value !== "inherit")? new TextEmphaStyle(value) : null;
  };

  Style.prototype._loadTextEmphaPos = function(){
    return this.getCssAttr("text-emphasis-position", {hori:"over", vert:"right"});
  };

  Style.prototype._loadTextEmphaColor = function(color){
    return this.getCssAttr("text-emphasis-color", color.getValue());
  };

  Style.prototype._loadTextCombine = function(){
    return this.getCssAttr("text-combine");
  };

  Style.prototype._loadFloatDirection = function(){
    var name = this.getCssAttr("float", "none");
    if(name === "none"){
      return null;
    }
    return Nehan.FloatDirections.get(name);
  };

  Style.prototype._loadBreakBefore = function(){
    var value = this.getCssAttr("break-before");
    return value? Nehan.Breaks.getBefore(value) : null;
  };

  Style.prototype._loadBreakAfter = function(){
    var value = this.getCssAttr("break-after");
    return value? Nehan.Breaks.getAfter(value) : null;
  };

  Style.prototype._loadWordBreak = function(){
    var inherit = this.parent? this.parent.wordBreak : Nehan.WordBreaks.getByName("normal");
    var value = this.getCssAttr("word-break");
    return value? Nehan.WordBreaks.getByName(value) : inherit;
  };

  // same as 'word-wrap' in IE.
  // value: 'break-word' or 'normal'
  /*
  Style.prototype._loadOverflowWrap = function(){
    var inherit = this.parent? this.parent.overflowWrap : "normal";
    return this.getCssAttr("overflow-wrap") || inherit;
  };*/

  Style.prototype._loadWhiteSpace = function(){
    var inherit = this.parent? this.parent.whiteSpace : "normal";
    return this.getCssAttr("white-space", inherit);
  };

  Style.prototype._loadHangingPunctuation = function(){
    var inherit = this.parent? this.parent.hangingPunctuation : "none";
    return this.getCssAttr("hanging-punctuation", inherit);
  };

  Style.prototype._loadListStyle = function(){
    var list_style_type = this.getCssAttr("list-style-type", "none");
    if(list_style_type === "none"){
      return null;
    }
    return new Nehan.ListStyle({
      type:list_style_type,
      position:this.getCssAttr("list-style-position", "outside"),
      image:this.getCssAttr("list-style-image", "none")
    });
  };

  Style.prototype._loadLetterSpacing = function(font_size){
    var letter_spacing = this.getCssAttr("letter-spacing");
    if(letter_spacing){
      return this._computeUnitSize(letter_spacing, font_size);
    }
    return null;
  };

  Style.prototype._loadStaticMeasure = function(){
    var prop = this.flow.getPropMeasure();
    var max_size = this.getParentContentMeasure();
    var static_size = this.getAttr(prop, null) || this.getAttr("measure", null) || this.getCssAttr(prop, null) || this.getCssAttr("measure", null);
    return (static_size !== null)? this._computeUnitSize(static_size, this.getFontSize(), max_size) : null;
  };

  Style.prototype._loadStaticExtent = function(){
    var prop = this.flow.getPropExtent();
    var max_size = this.getParentContentExtent();
    var static_size = this.getAttr(prop, null) || this.getAttr("extent", null) || this.getCssAttr(prop, null) || this.getCssAttr("extent", null);
    return static_size? this._computeUnitSize(static_size, this.getFontSize(), max_size) : null;
  };

  return Style;
})();
