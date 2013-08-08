var PageStream = Class.extend({
  init : function(text){
    this.text = this._createSource(text);
    this.generator = this._createGenerator(this.text);
    this.evaluator = this._createEvaluator();
    this.buffer = [];
    this._timeStart = null;
    this._timeElapsed = null;
    this._seekPageNo = 0;
    this._seekPercent = 0;
    this._seekPos = 0;
    this._retryCount = 0;
  },
  hasPage : function(page_no){
    return (typeof this.buffer[page_no] != "undefined");
  },
  hasNext : function(){
    return this.generator.hasNext();
  },
  hasOutline : function(root_name){
    return this.generator.hasOutline(root_name);
  },
  getNext : function(){
    if(!this.hasNext()){
      return null;
    }
    var cur_page_no = this._seekPageNo;
    if(!this.hasPage(cur_page_no)){
      var entry = this._yield();
      this._addBuffer(entry);
      this._seekPageNo++;
      this._seekPercent = entry.percent;
      this._seekPos = entry.seekPos;
    }
    return this.get(cur_page_no);
  },
  // int -> EvalResult
  get : function(page_no){
    var entry = this.buffer[page_no];
    if(entry instanceof EvalResult){ // already evaluated.
      return entry;
    }
    // if still not evaluated, eval and get EvalResult
    var result = this.evaluator.evaluate(entry);
    this.buffer[page_no] = result; // over write buffer entry by result.
    return result;
  },
  getPageCount : function(){
    return this.buffer.length;
  },
  getGroupPageNo : function(cell_page_no){
    return cell_page_no;
  },
  getOutlineTree : function(root_name){
    return this.generator.getOutlineTree(root_name || "body");
  },
  getOutlineNode : function(root_name, opt){
    var tree = this.getOutlineTree(root_name);
    var converter = new OutlineConverter(tree, opt || {});
    return converter.outputNode();
  },
  getAnchors : function(){
    return this.generator.getAnchors();
  },
  getAnchorPageNo : function(anchor_name){
    return this.generator.getAnchorPageNo(anchor_name);
  },
  getSeekPageResult : function(){
    return this.get(this._seekPageNo);
  },
  getSeekPageNo : function(){
    return this._seekPageNo;
  },
  getSeekPercent : function(){
    return this._seekPercent;
  },
  getSeekPos : function(){
    return this._seekPos;
  },
  setAnchor : function(name, page_no){
    this.generator.setAnchor(name, page_no);
  },
  getTimeElapsed : function(){
    return this._timeElapsed;
  },
  syncGet : function(){
    this._setTimeStart();
    while(this.generator.hasNext()){
      this.getNext();
    }
    return this._setTimeElapsed();
  },
  asyncGet : function(opt){
    Args.merge(this, {
      onComplete : function(time){},
      onProgress : function(self){},
      onError : function(self){}
    }, opt || {});
    this._setTimeStart();
    this._asyncGet(opt.wait || 0);
  },
  _yield : function(){
    return this.generator.yield();
  },
  _setTimeStart : function(){
    this._timeStart = (new Date()).getTime();
    return this._timeStart;
  },
  _setTimeElapsed : function(){
    this._timeElapsed = (new Date()).getTime() - this._timeStart;
    return this._timeElapsed;
  },
  _asyncGet : function(wait){
    if(!this.generator.hasNext()){
      var time = this._setTimeElapsed();
      this.onComplete(time);
      return;
    }
    var self = this;
    var entry = this._yield();
    if(entry.seekPos > 0 && this._seekPos === entry.seekPos){
      this._retryCount++;
      if(this._retryCount > Config.maxRollbackCount){
	this.onError(this);
	return;
      }
    }
    this._addBuffer(entry);
    this.onProgress(this);
    this._seekPageNo++;
    this._seekPercent = entry.percent;
    this._seekPos = entry.seekPos;
    this._retryCount = 0;
    reqAnimationFrame(function(){
      self._asyncGet(wait);
    });
  },
  _addBuffer : function(entry){
    this.buffer.push(entry);
  },
  // common preprocessor
  _createSource : function(text){
    return text
      .replace(/(\/[a-zA-Z0-9\-]+>)[\s\n]+(<[^\/])/g, "$1$2") // discard space between close tag and open tag.
      .replace(/\t/g, "") // discard TAB
      .replace(/<!--[\s\S]*?-->/g, "") // discard comment
      .replace(/<rp>[^<]*<\/rp>/gi, "") // discard rp
      .replace(/<rb>/gi, "") // discard rb
      .replace(/<\/rb>/gi, "") // discard /rb
      .replace(/<rt><\/rt>/gi, ""); // discard empty rt
  },
  _createGenerator : function(text){
    return new DocumentGenerator(
      new DocumentContext({
	stream:new DocumentTagStream(text)
      })
    );
  },
  _createEvaluator : function(){
    return new PageEvaluator();
  }
});
