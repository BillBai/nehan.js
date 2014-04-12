var Box = (function(){
  function Box(size, style){
    this.size = size;
    this.style = style;
    this.css = {};
  }

  Box.prototype = {
    debug : function(title){
      console.log(
	"[%s](m,e) = (%d,%d), (m+,e+) = (%d,%d)", (title || "no title"),
	this.getContentMeasure(), this.getContentExtent(),
	this.getBoxMeasure(), this.getBoxExtent()
      );
    },
    getDatasetAttr : function(){
      // dataset attr of root anonymous line is already captured by parent box.
      if(this.display === "inline" && this.style.isBlock()){
	return {};
      }
      return this.style.getDatasetAttr();
    },
    getCssBlock : function(){
      var css = {};
      Args.copy(css, this.style.getCssBlock()); // base style
      Args.copy(css, this.size.getCss()); // local size
      Args.copy(css, this.css); // some dynamic values
      return css;
    },
    getCssInline : function(){
      var css = {};
      Args.copy(css, this.style.getCssInline()); // base style
      Args.copy(css, this.size.getCss()); // local size
      Args.copy(css, this.css); // some dynamic values
      return css;
    },
    getCssHoriInlineImage : function(){
      var css = this.getCssInline();
      css["vertical-align"] = "middle";
      return css;
    },
    getContentMeasure : function(flow){
      return this.size.getMeasure(flow || this.style.flow);
    },
    getContentExtent : function(flow){
      return this.size.getExtent(flow || this.style.flow);
    },
    getContentWidth : function(){
      return this.size.width;
    },
    getContentHeight : function(){
      return this.size.height;
    },
    getBoxMeasure : function(flow){
      flow = flow || this.style.flow;
      var ret = this.getContentMeasure(flow);
      if(this.edge){
	ret += this.edge.getMeasureSize(flow);
      }
      return ret;
    },
    getBoxExtent : function(flow){
      flow = flow || this.style.flow;
      var ret = this.getContentExtent(flow);
      if(this.edge){
	ret += this.edge.getExtentSize(flow);
      }
      return ret;
    },
    clearBorderBefore : function(){
      if(this.edge){
	this.edge.clearBorderBefore(this.style.flow);
      }
    },
    clearBorderAfter : function(){
      if(this.edge){
	this.edge.clearBorderAfter(this.style.flow);
      }
    },
    resizeExtent : function(flow, extent){
      this.size.setExtent(flow, extent);
      return this;
    }
  };

  return Box;
})();
