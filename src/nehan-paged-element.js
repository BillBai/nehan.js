var NehanPagedElement = (function(){
  function NehanPagedElement(engine_args){
    this.pageNo = 0;
    this.element = document.createElement("div");
    this.engine = Nehan.setup(engine_args);
    this._pageStream = null;
  }

  NehanPagedElement.prototype = {
    getEngine : function(){
      return this.engine;
    },
    getElement : function(){
      return this.element;
    },
    getContent : function(){
      return this._pageStream? this._pageStream.text : "";
    },
    getPageCount : function(){
      return this._pageStream? this._pageStream.getPageCount() : 0;
    },
    getPage : function(page_no){
      return this._pageStream? this._pageStream.getPage(page_no) : null;
    },
    getPagedElement : function(page_no){
      var page = this.getPage(page_no);
      return page? page.element : null;
    },
    getPageNo : function(){
      return this.pageNo;
    },
    setNextPage : function(){
      if(this.pageNo + 1 < this.getPageCount()){
	this.setPage(this.pageNo + 1);
      }
    },
    setPrevPage : function(){
      if(this.pageNo > 0){
	this.setPage(this.pageNo - 1);
      }
    },
    setStyle : function(name, value){
      this.engine.setStyle(name, value);
      return this;
    },
    setStyles : function(values){
      this.engine.setStyles(values);
      return this;
    },
    setContent : function(content, opt){
      var self = this;
      opt = opt || {};
      this._pageStream = this.engine.createPageStream(content);
      this._pageStream.asyncGet({
	onProgress : function(stream, tree){
	  if(tree.pageNo === 0){
	    self.setPage(tree.pageNo);
	  }
	  if(opt.onProgress){
	    opt.onProgress(tree);
	  }
	},
	onComplete : function(stream, time){
	  if(opt.onComplete){
	    opt.onComplete(time);
	  }
	}
      });
      return this;
    },
    setPage : function(page_no){
      var page = this.getPage(page_no);
      if(page === null || page.element === null){
	throw "page_no(" + page_no + ") is not found";
      }
      this.pageNo = page_no;
      this.element.innerHTML = "";
      this.element.appendChild(page.element);
    }
  };
  
  return NehanPagedElement;
})();

Nehan.createPagedElement = function(engine_args){
  return new NehanPagedElement(engine_args || {});
};
