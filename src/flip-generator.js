var FlipGenerator = (function(){
  function FlipGenerator(style, stream, outline_context){
    BlockGenerator.call(this, style, stream, outline_context);
  }
  Class.extend(FlipGenerator, BlockGenerator);

  // content size varies in flip-generator, so use FloatRestGenerator::popCache.
  FlipGenerator.prototype.popCache = function(context){
    return FloatRestGenerator.prototype.popCache.call(this, context);
  };

  FlipGenerator.prototype.yield = function(context){
    // [measure of this.style] -> [extent of this.style.parent]
    // [extent of this.style]  -> [measure of this.style.parent]
    this.style.updateContextSize(context.getBlockRestExtent(), context.getInlineMaxMeasure());
    return BlockGenerator.prototype.yield.call(this);
  };

  return FlipGenerator;
})();

