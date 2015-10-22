Nehan.BorderColor = (function(){
  /**
     @memberof Nehan
     @class BorderColor
     @classdesc logical border color object
     @constructor
  */
  function BorderColor(){
  }

  /**
   @memberof Nehan.BorderColor
   @method clone
   @return {Nehan.BorderColor}
   */
  BorderColor.prototype.clone = function(){
    var border_color = new BorderColor();
    Nehan.Const.cssBoxDirs.forEach(function(dir){
      if(this[dir]){
	border_color[dir] = this[dir];
      }
    }.bind(this));
    return border_color;
  };
  /**
   @memberof Nehan.BorderColor
   @method setColor
   @param flow {Nehan.BoxFlow}
   @param value {Object} - color values, object or array or string available.
   @param value.before {Nehan.Color}
   @param value.end {Nehan.Color}
   @param value.after {Nehan.Color}
   @param value.start {Nehan.Color}
   */
  BorderColor.prototype.setColor = function(flow, value){
    var self = this;

    // first, set as it is(obj, array, string).
    Nehan.BoxRect.setValue(this, flow, value);

    // second, map as color class.
    Nehan.BoxRect.iter(this, function(dir, val){
      self[dir] = new Nehan.Color(val);
    });
  };
  /**
   get css object of border color

   @memberof Nehan.BorderColor
   @method getCss
   */
  BorderColor.prototype.getCss = function(){
    var css = {};
    Nehan.BoxRect.iter(this, function(dir, color){
      var prop = ["border", dir, "color"].join("-");
      css[prop] = color.getCssValue();
    });
    return css;
  };

  return BorderColor;
})();
