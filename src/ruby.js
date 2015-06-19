var Ruby = (function(){
  /**
     @memberof Nehan
     @class Ruby
     @classdesc abstraction of ruby text.
     @constructor
     @param rbs {Array<Nehan.Char>} - characters of &lt;rb&gt; tag.
     @param rt {Nehan.Tag}
  */
  function Ruby(rbs, rt){
    this._type = "ruby";
    this.rbs = rbs;
    this.rt = rt;
  }

  Ruby.prototype = {
    /**
       @memberof Nehan.Ruby
       @return {boolean}
    */
    hasMetrics : function(){
      return (typeof this.advanceSize !== "undefined");
    },
    /**
       @memberof Nehan.Ruby
       @return {int}
    */
    getCharCount : function(){
      return this.rbs? this.rbs.length : 0;
    },
    /**
       @memberof Nehan.Ruby
       @return {int}
    */
    getAdvance : function(flow){
      return this.advanceSize;
    },
    /**
       @memberof Nehan.Ruby
       @return {Array<Nehan.Char>}
    */
    getRbs : function(){
      return this.rbs;
    },
    /**
       @memberof Nehan.Ruby
       @return {String}
    */
    getRbString : function(){
      return Nehan.List.map(this.rbs, function(rb){
	return rb.data || "";
      }).join("");
    },
    /**
       @memberof Nehan.Ruby
       @return {String}
    */
    getRtString : function(){
      return this.rt? this.rt.getContent() : "";
    },
    /**
       @memberof Nehan.Ruby
       @return {int}
    */
    getRtFontSize : function(){
      return this.rtFontSize;
    },
    /**
       @memberof Nehan.Ruby
       @param line {Nehan.Box}
       @return {Object}
    */
    getCssVertRt : function(line){
      var css = {};
      css["css-float"] = "left";
      return css;
    },
    /**
       @memberof Nehan.Ruby
       @param line {Nehan.Box}
       @return {Object}
    */
    getCssHoriRt : function(line){
      var css = {};
      var offset = Math.floor((line.style.getFontSize() - this.getRtFontSize()) / 3);
      css["font-size"] = this.getRtFontSize() + "px";
      css["line-height"] = "1em";
      return css;
    },
    /**
       @memberof Nehan.Ruby
       @param line {Nehan.Box}
       @return {Object}
    */
    getCssVertRb : function(line){
      var css = {};
      css["css-float"] = "left";
      if(this.padding){
	Args.copy(css, this.padding.getCss());
      }
      return css;
    },
    /**
       @memberof Nehan.Ruby
       @param line {Nehan.Box}
       @return {Object}
    */
    getCssHoriRb : function(line){
      var css = {};
      if(this.padding){
	Args.copy(css, this.padding.getCss());
      }
      css["text-align"] = "center";
      css["line-height"] = "1em";
      return css;
    },
    /**
       @memberof Nehan.Ruby
       @param flow {Nehan.BoxFlow}
       @param font {Nehan.Font}
       @param letter_spacing {int}
    */
    setMetrics : function(flow, font, letter_spacing){
      this.rtFontSize = Display.getRtFontSize(font.size);
      var advance_rbs = Nehan.List.fold(this.rbs, 0, function(ret, rb){
	rb.setMetrics(flow, font);
	return ret + rb.getAdvance(flow, letter_spacing);
      });
      var advance_rt = this.rtFontSize * this.getRtString().length;
      this.advanceSize = advance_rbs;
      if(advance_rt > advance_rbs){
	var ctx_space = Math.ceil((advance_rt - advance_rbs) / 2);
	if(this.rbs.length > 0){
	  this.padding = new Padding();
	  this.padding.setStart(flow, ctx_space);
	  this.padding.setEnd(flow, ctx_space);
	}
	this.advanceSize += ctx_space + ctx_space;
      }
    }
  };

  return Ruby;
})();

