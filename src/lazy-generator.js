Nehan.LazyGenerator = (function(){
  /**
     @memberof Nehan
     @class LazyGenerator
     @classdesc lazy generator holds pre-yielded output in construction, and yields it once.
     @constructor
     @extends {Nehan.LayoutGenerator}
     @param style {Nehan.Style}
     @param output {Nehan.Box} - pre yielded output
   */
  function LazyGenerator(context){
    Nehan.LayoutGenerator.call(this, context);
  }
  Nehan.Class.extend(LazyGenerator, Nehan.LayoutGenerator);

  /**
     @memberof Nehan.LazyGenerator
     @method hasNext
     @override
     @return {boolean}
  */
  LazyGenerator.prototype.hasNext = function(){
    return this.context.terminate !== true;
  };

  /**
     @memberof Nehan.LazyGenerator
     @method yield
     @override
     @return {Nehan.Box}
  */
  LazyGenerator.prototype.yield = function(context){
    if(this.context.terminate){
      return null;
    }
    this.context.setTerminate(true);
    return this.context.lazyOutput;
  };

  return LazyGenerator;
})();
