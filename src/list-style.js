Nehan.ListStyle = (function(){
  /**
     @memberof Nehan
     @class ListStyle
     @classdesc abstraction of list-style.
     @constructor
     @param opt {Object}
     @param opt.type {Nehan.ListStyleType}
     @param opt.position {Nehan.ListStylePos}
     @param opt.image {Nehan.ListStyleImage}
  */
  function ListStyle(opt){
    this.type = new Nehan.ListStyleType(opt.type || "none");
    this.position = new Nehan.ListStylePos(opt.position || "outside");
    this.image = (opt.image !== "none")? new Nehan.ListStyleImage(opt.image) : null;
  }

  /**
   @memberof Nehan.ListStyle
   @return {boolean}
   */
  ListStyle.prototype.isMultiCol = function(){
    return this.position.isOutside();
  };
  /**
   @memberof Nehan.ListStyle
   @return {boolean}
   */
  ListStyle.prototype.isInside = function(){
    return this.position.isInside();
  };
  /**
   @memberof Nehan.ListStyle
   @return {boolean}
   */
  ListStyle.prototype.isImageList = function(){
    return (this.image !== null);
  };
  /**
   @memberof Nehan.ListStyle
   @param count {int}
   @return {String}
   */
  ListStyle.prototype.getMarkerHtml = function(count){
    if(this.image !== null){
      return this.image.getMarkerHtml(count);
    }
    return this.type.getMarkerHtml(count);
  };

  return ListStyle;
})();
