Nehan.Padding = (function(){
  /**
     @memberof Nehan
     @class Padding
     @classdesc abstraction of padding.
     @extends {Nehan.Edge}
  */
  function Padding(){
    Nehan.Edge.call(this, "padding");
  }
  Nehan.Class.extend(Padding, Nehan.Edge);

  /**
     @memberof Nehan.Padding
     @override
     @return {Nehan.Padding}
  */
  Padding.prototype.clone = function(){
    return this.copyTo(new Padding());
  };

  return Padding;
})();

