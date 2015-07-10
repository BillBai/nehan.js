var Box = (function(){
  /**
     @memberof Nehan
     @class Box
     @classdesc box abstraction with size and style context
     @constrctor
     @param {Nehan.BoxSize} box size
     @param {Nehan.StyleContext}
  */
  function Box(size, style, type){
    this.size = size;
    this.style = style;
    this._type = type || "block";
    this.elements = [];
    this.css = {};
  }

  var __filter_text = function(elements){
    return Nehan.List.fold(elements, [], function(ret, element){
      if(element instanceof Box){
	return ret.concat(__filter_text(element.elements || []));
      }
      return element? ret.concat(element) : ret;
    });
  };

  Box.prototype = {
    /**
       @memberof Nehan.Box
       @param element {Nehan.Box | Nehan.Char | Nehan.Word | Nehan.Tcy}
    */
    addElement : function(element){
      element.parent = this;
      this.elements.push(element);
    },
    /**
       @memberof Nehan.Box
       @param element {Array.<Nehan.Box | Nehan.Char | Nehan.Word | Nehan.Tcy>}
    */
    addElements : function(elements){
      Nehan.List.iter(elements, function(element){
	this.addElement(element);
      }.bind(this));
    },
    /**
       @memberof Nehan.Box
       @return {boolean}
    */
    isVoid : function(){
      return this._type === "void";
    },
    /**
       @memberof Nehan.Box
       @return {boolean}
    */
    isLine : function(){
      return this._type === "line-block";
    },
    /**
       @memberof Nehan.Box
       @return {boolean}
    */
    isTextBlock : function(){
      return this._type === "text-block";
    },
    /**
       @memberof Nehan.Box
       @return {boolean}
    */
    isRootLine : function(){
      return this.isRootLine || false;
    },
    /**
       filter text object and concat it as string, mainly used for debugging.

       @memberof Nehan.Box
       @return {string}
    */
    toString : function(){
      var texts = __filter_text(this.elements || []);
      return Nehan.List.fold(texts, "", function(ret, text){
	var str = (text instanceof Nehan.Ruby)? text.getRbString() : (text.data || "");
	return ret + str;
      });
    },
    /**
       @memberof Nehan.Box
       @return {string}
    */
    getId : function(){
      return this.id || null;
    },
    /**
       @memberof Nehan.Box
       @return {Array.<string>}
    */
    getClassName : function(){
      return this.classes? Nehan.List.map(this.classes, Nehan.Css.addNehanPrefix).join(" ") : "";
    },
    /**
       @memberof Nehan.Box
       @return {string}
    */
    getContent : function(){
      return this.content || null;
    },
    /**
       @memberof Nehan.Box
       @return {Function}
    */
    getOnCreate : function(){
      var oncreate = this.style.getCssAttr("oncreate") || null;

      // on create of text-block is already captured by parent line
      if(this.isTextBlock()){
	return this.style.getCssAttr("ontext") || null;
      }
      if(this.isLine()){
	return this.style.getCssAttr("online") || oncreate;
      }
      return this.style.getCssAttr("onblock") || oncreate;
    },
    /**
       @memberof Nehan.Box
       @return {Object}
    */
    getAttrs : function(){
      // attributes of text-block is already captured by parent line
      if(this.isTextBlock()){
	return null;
      }
      return this.style.markup.attrs;
    },
    /**
       @memberof Nehan.Box
       @return {Object}
    */
    getBoxCss : function(){
      switch(this.display){
      case "block": return this.getCssBlock();
      case "inline": return this.getCssInline();
      case "inline-block": return this.getCssInlineBlock();
      }
      console.error("undefined display:", this.display);
      throw "Box::getBoxCss, undefined display";
    },
    /**
       @memberof Nehan.Box
       @return {Object}
    */
    getCssBlock : function(){
      return this.style.getCssBlock(this);
    },
    /**
       @memberof Nehan.Box
       @return {Object}
    */
    getCssInline : function(){
      if(this.isTextBlock()){
	return this.style.getCssTextBlock(this);
      }
      return this.style.getCssLineBlock(this);
    },
    /**
       @memberof Nehan.Box
       @return {Object}
    */
    getCssInlineBlock : function(){
      return this.style.getCssInlineBlock(this);
    },
    /**
       @memberof Nehan.Box
       @param line {Nehan.Box}
       @return {Object}
    */
    getCssHoriInlineImage : function(line){
      return this.style.getCssHoriInlineImage(line, this);
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getContentMeasure : function(flow){
      flow = flow || this.style.flow;
      return this.size.getMeasure(flow);
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getContentExtent : function(flow){
      flow = flow || this.style.flow;
      return this.size.getExtent(flow);
    },
    /**
       @memberof Nehan.Box
       @return {int}
    */
    getContentWidth : function(){
      return this.size.width;
    },
    /**
       @memberof Nehan.Box
       @return {int}
    */
    getContentHeight : function(){
      return this.size.height;
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getEdgeMeasure : function(flow){
      flow = flow || this.style.flow;
      return this.edge? this.edge.getMeasure(flow) : 0;
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getEdgeExtent : function(flow){
      flow = flow || this.style.flow;
      return this.edge? this.edge.getExtent(flow) : 0;
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getLayoutMeasure : function(flow){
      flow = flow || this.style.flow;
      if(this.style.isPositionAbsolute()){
	return 0;
      }
      return this.getContentMeasure(flow) + this.getEdgeMeasure(flow);
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @return {int}
    */
    getLayoutExtent : function(flow){
      flow = flow || this.style.flow;
      if(this.style.isPositionAbsolute()){
	return 0;
      }
      return this.getContentExtent(flow) + this.getEdgeExtent(flow);
    },
    /**
       @memberof Nehan.Box
    */
    clearBorderBefore : function(){
      if(this.edge){
	this.edge.clearBorderBefore(this.style.flow);
      }
    },
    /**
       @memberof Nehan.Box
    */
    clearBorderAfter : function(){
      if(this.edge){
	this.edge.clearBorderAfter(this.style.flow);
      }
    },
    /**
       @memberof Nehan.Box
       @param flow {Nehan.BoxFlow}
       @param extent {int}
    */
    resizeExtent : function(flow, extent){
      this.size.setExtent(flow, extent);
      return this;
    }
  };

  return Box;
})();
