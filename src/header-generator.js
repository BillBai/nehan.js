Nehan.HeaderGenerator = (function(){
  /**
     @memberof Nehan
     @class HeaderGenerator
     @classdesc generator of header tag(h1 - h6) conetnt, and create header context when complete.
     @constructor
     @extends {Nehan.BlockGenerator}
     @param style {Nehan.Style}
     @param stream {Nehan.TokenStream}
  */
  function HeaderGenerator(style, stream){
    Nehan.BlockGenerator.call(this, style, stream);
  }
  Nehan.Class.extend(HeaderGenerator, Nehan.BlockGenerator);

  HeaderGenerator.prototype._getHeaderRank = function(block){
    if(this.style.getMarkupName().match(/h([1-6])/)){
      return parseInt(RegExp.$1, 10);
    }
    return 0;
  };

  HeaderGenerator.prototype._onComplete = function(context, block){
    var header_id = this.style.startHeaderContext({
      type:this.style.getMarkupName(),
      rank:this._getHeaderRank(),
      title:this.style.getMarkupContent()
    });
    block.id = Nehan.Css.addNehanHeaderPrefix(header_id);
  };
  
  return HeaderGenerator;
})();

