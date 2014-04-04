var ParallelLayoutGenerator = (function(){
  function ParallelLayoutGenerator(style, generators){
    LayoutGenerator.call(this, style, null);
    this.generators = generators;
  }
  Class.extend(ParallelLayoutGenerator, LayoutGenerator);

  ParallelLayoutGenerator.prototype._yield = function(context){
    if(this.hasCache()){
      return this.popCache();
    }
    var blocks = this._yieldParallelBlocks(context);
    if(blocks === null){
      return null;
    }
    var wrap_block = this._wrapBlocks(blocks);
    var wrap_extent = wrap_block.getBoxExtent(this.style.flow);
    if(!context.hasBlockSpaceFor(wrap_extent)){
      this.pushCache(wrap_block);
      return null;
    }
    context.addBlockElement(wrap_block, wrap_extent);
    return wrap_block;
  };

  ParallelLayoutGenerator.prototype.hasNext = function(context){
    if(this._terminate){
      return false;
    }
    if(this.hasCache()){
      return true;
    }
    return List.exists(this.generators, function(gen){
      return gen.hasNext();
    });
  };

  ParallelLayoutGenerator.prototype._yieldParallelBlocks = function(context){
    var blocks = List.map(this.generators, function(gen){
      return gen.yield(context);
    });
    return List.forall(blocks, function(block){ return block === null; })? null : blocks;
  };

  ParallelLayoutGenerator.prototype._findMaxBlock = function(blocks){
    var flow = this.style.flow;
    return List.maxobj(blocks, function(block){
      return block? block.getBoxExtent(flow) : 0;
    });
  };

  ParallelLayoutGenerator.prototype._alignContentExtent = function(blocks, content_extent){
    var flow = this.style.flow;
    var generators = this.generators;
    return List.mapi(blocks, function(i, block){
      if(block === null){
	return generators[i].style.createBlock({elements:[], extent:content_extent});
      }
      return block.resizeExtent(flow, content_extent);
    });
  };

  ParallelLayoutGenerator.prototype._wrapBlocks = function(blocks){
    var flow = this.style.flow;
    var generators = this.generators;
    var max_block = this._findMaxBlock(blocks);
    var uniformed_blocks = this._alignContentExtent(blocks, max_block.getContentExtent(flow));
    return this.style.createBlock({
      elements:uniformed_blocks,
      extent:max_block.getBoxExtent(flow)
    });
  };

  return ParallelLayoutGenerator;
})();


