var DocumentContext = (function(){

  // header id to associate each header with outline.
  var __global_header_id = 0;
  
  function DocumentContext(option){
    var opt = option || {};
    this.markup = opt.markup || null;
    this.stream = opt.stream || null;
    this.charPos = opt.charPos || 0;
    this.pageNo = opt.pageNo || 0;
    this.header = opt.header || new DocumentHeader();
    this.blockContext = opt.blockContext || null;
    this.inlineContext = opt.inlineContext || null;
    this.outlineContext = opt.outlineContext || new OutlineContext();
    this.anchors = opt.anchors || {};
  }

  DocumentContext.prototype = {
    // docunemt type
    setDocumentType : function(markup){
      this.documentType = markup;
    },
    // stream
    hasNextToken : function(){
      return this.stream.hasNext();
    },
    getNextToken : function(){
      return this.stream.get();
    },
    skipToken : function(){
      this.stream.next();
    },
    pushBackToken : function(){
      this.stream.prev();
    },
    getStreamPos : function(){
      return this.stream.getPos();
    },
    getSeekPos : function(){
      return this.stream.getSeekPos();
    },
    getSeekPercent : function(){
      return this.stream.getSeekPercent();
    },
    getMarkupStaticSize : function(parent){
      var font_size = parent? parent.fontSize : Layout.fontSize;
      var measure = parent? parent.getContentMeasure(parent.flow) : Layout.getStdMeasure();
      return this.markup? this.markup.getStaticSize(font_size, measure) : null;
    },
    getMarkupName : function(){
      return this.markup? this.markup.getName() : "";
    },
    getMarkupClasses : function(){
      return this.markup? this.markup.classes : [];
    },
    // block context
    createBlockRoot : function(markup, stream){
      stream = (stream === null)? null : (stream || new TokenStream(markup.getContent()));
      return new DocumentContext({
	markup:markup.inherit(this.markup, this),
	stream:stream,
	charPos:this.charPos,
	pageNo:this.pageNo,
	header:this.header,
	outlineContext:this.outlineContext,
	ahchors:this.anchors
      });
    },
    createFloatedRoot : function(){
      return new DocumentContext({
	markup:this.markup,
	stream:this.stream,
	charPos:this.charPos,
	pageNo:this.pageNo,
	header:this.header,
	outlineContext:this.outlineContext,
	ahchors:this.anchors
      });
    },
    createBlockContext : function(parent){
      this.blockContext = new BlockTreeContext(parent);
      return this.blockContext;
    },
    addBlockElement : function(element){
      this.blockContext.addElement(element);
    },
    // inline context
    createInlineRoot : function(markup, stream){
      stream = (stream === null)? null : (stream || new TokenStream(markup.getContent()));
      return new DocumentContext({
	markup:markup.inherit(this.markup, this),
	stream:stream,
	charPos:this.charPos,
	pageNo:this.pageNo,
	header:this.header,
	blockContext:this.blockContext,
	outlineContext:this.outlineContext,
	ahchors:this.anchors
      });
    },
    createInlineContext : function(parent){
      this.inlineContext = new InlineTreeContext(parent, this);
      return this.inlineContext;
    },
    createLine : function(){
      return this.inlineContext.createLine();
    },
    getInlineNextToken : function(){
      return this.inlineContext.getNextToken();
    },
    getInlineMaxMeasure : function(){
      return this.inlineContext.getMaxMeasure();
    },
    getInlineMaxExtent : function(){
      return this.inlineContext.getMaxExtent();
    },
    getInlineMaxFontSize : function(){
      return this.inlineContext.getMaxFontSize();
    },
    setLineBreak : function(){
      this.inlineContext.setLineBreak();
    },
    addInlineElement : function(element){
      this.inlineContext.addElement(element);
    },
    isPreLine : function(){
      return this.markup.getName() === "pre";
    },
    isTextBold : function(){
      return this.inlineContext.isTextBold();
    },
    // header
    getHeader : function(){
      return this.header;
    },
    addScript : function(markup){
      this.header.addScript(markup);
    },
    addStyle : function(markup){
      this.header.addStyle(markup);
    },
    getPageNo : function(){
      return this.pageNo;
    },
    getCharPos : function(){
      return this.charPos;
    },
    stepPageNo : function(){
      this.pageNo++;
    },
    addCharPos : function(char_count){
      this.charPos += char_count;
    },
    // anchors
    setAnchor : function(anchor_name){
      this.anchors[anchor_name] = this.pageNo;
    },
    getAnchors : function(){
      return this.anchors;
    },
    getAnchorPageNo : function(anchor_name){
      return this.anchors[anchor_name] || -1;
    },
    // outline context
    getOutlineBuffer : function(root_name){
      return this.outlineContext.getOutlineBuffer(root_name);
    },
    startSectionRoot : function(){
      var type = this.markup.getName();
      this.outlineContext.startSectionRoot(type);
    },
    endSectionRoot : function(){
      var type = this.markup.getName();
      return this.outlineContext.endSectionRoot(type);
    },
    logStartSection : function(){
      var type = this.markup.getName();
      this.outlineContext.logStartSection(type, this.pageNo);
    },
    logEndSection : function(){
      var type = this.markup.getName();
      this.outlineContext.logEndSection(type);
    },
    logSectionHeader : function(){
      var type = this.markup.getName();
      var rank = this.markup.getHeaderRank();
      var title = this.markup.getContentRaw();
      var page_no = this.pageNo;
      var header_id = __global_header_id++;
      this.outlineContext.logSectionHeader(type, rank, title, page_no, header_id);
      return header_id;
    }
  };

  return DocumentContext;
})();

