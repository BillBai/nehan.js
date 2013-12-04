var StaticBlockGenerator = (function(){
  function StaticBlockGenerator(context){
    ElementGenerator.call(this, context);
  }
  Class.extend(StaticBlockGenerator, ElementGenerator);

  StaticBlockGenerator.prototype._getBoxSize = function(parent){
    return this.context.getMarkupStaticSize(parent);
  };

  StaticBlockGenerator.prototype._createBox = function(size, parent){
    var box = ElementGenerator.prototype._createBox.call(this, size, parent);
    box.sizing = BoxSizings.getByName("content-box"); // use normal box model
    return box;
  };

  StaticBlockGenerator.prototype._findLineParent = function(line){
    var parent = line.parent;
    while(parent && parent.isTextLine()){
      parent = parent.parent;
    }
    return parent;
  };

  StaticBlockGenerator.prototype.yield = function(parent){
    if(parent.isTextLine()){
      parent = this._findLineParent(parent);
    }
    return this._yield(parent);
  };

  StaticBlockGenerator.prototype._yield = function(parent){
    var size = this._getBoxSize(parent);
    var box = this._createBox(size, parent);
    if(box.isDisplayNone()){
      return Exceptions.IGNORE;
    }
    if(this.context.markup.isPush()){
      box.backward = true;
    }
    if(this.context.markup.isPull()){
      box.forward = true;
    }
    // get rest size without edge of box.
    var rest_size = parent.getRestSize();
    rest_size.width -= box.getEdgeWidth();
    rest_size.height -= box.getEdgeHeight();
    
    // even if edge can't be included, retry.
    if(!rest_size.isValid()){
      return Exceptions.SINGLE_RETRY;
    }
    // if rest size has prenty of space for this box, just return as it it.
    if(rest_size.canInclude(box.size)){
      return box;
    }
    var root_page_size = Layout.getStdPageSize();
    var reduced_size = box.size.resizeWithin(parent.flow, rest_size);

    // use reduced size if
    // 1. even root size of page can't include this box
    // 2. or reduced box size is within Config.minBlockScaleDownRate of original
    if(!root_page_size.canInclude(box.size) ||
       reduced_size.percentFrom(box.size) >= Config.minBlockScaleDownRate){
      box.size = reduced_size;
      return box;
    }
    return Exceptions.SINGLE_RETRY;
  };

  return StaticBlockGenerator;
})();

