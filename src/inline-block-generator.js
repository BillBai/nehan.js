Nehan.InlineBlockGenerator = (function (){
  /**
   @memberof Nehan
   @class InlineBlockGenerator
   @classdesc generator of element with display:'inline-block'.
   @extends {Nehan.BlockGenerator}
   @param context {Nehan.RenderingContext}
  */
  function InlineBlockGenerator(context){
    Nehan.BlockGenerator.call(this, context);
  }
  Nehan.Class.extend(InlineBlockGenerator, Nehan.BlockGenerator);

  InlineBlockGenerator.prototype._onCreate = function(block){
    var max_inline = Nehan.List.maxobj(block.elements, function(element){
      return element.getContentMeasure();
    });
    if(max_inline){
      block.size.setMeasure(this.context.style.flow, max_inline.getContentMeasure());
    }
    return block;
  };

  return InlineBlockGenerator;
})();
