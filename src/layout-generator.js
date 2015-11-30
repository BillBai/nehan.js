Nehan.LayoutGenerator = (function(){
  /**
   @memberof Nehan
   @class LayoutGenerator
   @classdesc abstract super class for all generator
   @constructor
   @param context {Nehan.RenderingContext}
   */
  function LayoutGenerator(context){
    this.context = context;
    this.context.setOwnerGenerator(this);
  }

  /**
   @memberof Nehan.LayoutGenerator
   @method hasNext
   @return {bool}
   */
  LayoutGenerator.prototype.hasNext = function(){
    return this.context.hasNext();
  };

  /**
   @memberof Nehan.LayoutGenerator
   @method yield
   @param parent_context {Nehan.LayoutContext} - cursor context from parent generator
   @return {Nehan.Box}
   */
  LayoutGenerator.prototype.yield = function(){
    console.group("%s _yield:%o", this.context.getName(), this.context);

    this.context.initLayoutContext();

    // call _yield implemented in subclass.
    var box = this._yield();

    // called for each output
    this._onCreate(box);

    // called for final output
    if(!this.hasNext()){
      this._onComplete(box);
    }

    // increment yield count
    this.context.yieldCount++;

    // to avoid infinite loop, raise error if too many yielding.
    if(this.context.yieldCount > Nehan.Config.maxYieldCount){
      console.error("[%s]too many yield!:%o", this.context._name, this);
      throw "too many yield";
    }
    console.groupEnd();
    return box;
  };

  LayoutGenerator.prototype._yield = function(){
    throw "LayoutGenerator::_yield must be implemented in child class";
  };

  // called for each output
  LayoutGenerator.prototype._onCreate = function(output){
  };

  // called for final output
  LayoutGenerator.prototype._onComplete = function(output){
  };

  return LayoutGenerator;
})();

