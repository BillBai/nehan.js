var BorderRadius = (function(){
  /**
     @memberof Nehan
     @class BorderRadius
     @classdesc logical border radius object
     @constructor
  */
  function BorderRadius(){
    this.topLeft = new Radius2d();
    this.topRight = new Radius2d();
    this.bottomRight = new Radius2d();
    this.bottomLeft = new Radius2d();
  }

  BorderRadius.prototype = {
    /**
       @memberof Nehan.BorderRadius
       @method getArray
       @return {Array.<Nehan.Radius2d>}
    */
    getArray : function(){
      return [
	this.topLeft,
	this.topRight,
	this.bottomRight,
	this.bottomLeft
      ];
    },
    /**
       get css value of border-radius for horizontal direction
       @memberof Nehan.BorderRadius
       @method getCssValueHroi
       @return {Object}
    */
    getCssValueHori : function(){
      return List.map(this.getArray(), function(radius){
	return radius.getCssValueHori();
      }).join(" ");
    },
    /**
       get css value of border-radius for vertical direction
       @memberof Nehan.BorderRadius
       @method getCssValueVert
       @return {Object}
    */
    getCssValueVert : function(){
      return List.map(this.getArray(), function(radius){
	return radius.getCssValueVert();
      }).join(" ");
    },
    /**
       get css value of border-radius for both vert and horizontal direction
       @memberof Nehan.BorderRadius
       @method getCssValue
       @return {Object}
    */
    getCssValue : function(){
      return [this.getCssValueHori(), this.getCssValueVert()].join("/");
    },
    /**
       get css object of border-radius
       @memberof Nehan.BorderRadius
       @method getCss
       @return {Object}
    */
    getCss : function(){
      var css = {};
      var css_value = this.getCssValue();
      css["border-radius"] = css_value; // without vender prefix
      List.iter(Const.cssVenderPrefixes, function(prefix){
	var prop = [prefix, "border-radius"].join("-"); // with vender prefix
	css[prop] = css_value;
      });
      return css;
    },
    /**
       get corner value
       @memberof Nehan.BorderRadius
       @method getCorner
       @param dir1 {string} - physical direction of logical start or end
       @param dir2 {string} - physical direction of logical before or after
       @return {Nehan.Radius2d}
    */
    getCorner : function(dir1, dir2){
      var name = BoxCorner.getCornerName(dir1, dir2);
      return this[name];
    },
    /**
       set corner size
       @memberof Nehan.BorderRadius
       @method setSize
       @param flow {Nehan.BoxFlow} - base layout flow
       @param size {Object} - size values for each logical corner
       @param size.start-before {int}
       @param size.start-after {int}
       @param size.end-before {int}
       @param size.end-after {int}
    */
    setSize : function(flow, size){
      if(typeof size["start-before"] != "undefined"){
	this.setStartBefore(flow, size["start-before"]);
      }
      if(typeof size["start-after"] != "undefined"){
	this.setStartAfter(flow, size["start-after"]);
      }
      if(typeof size["end-before"] != "undefined"){
	this.setEndBefore(flow, size["end-before"]);
      }
      if(typeof size["end-after"] != "undefined"){
	this.setEndAfter(flow, size["end-after"]);
      }
    },
    /**
       set corner of logical "start-before"
       @memberof Nehan.BorderRadius
       @method setStartBefore
       @param flow {Nehan.BoxFlow} - base layout flow
       @param value {Array<int>} - 2d radius value
       @example
       new BorderRadius().setStartBefore(BoxFlows.getByName("lr-tb"), [5, 10]); // horizontal 5px, vertical 10px
    */
    setStartBefore : function(flow, value){
      var radius = this.getCorner(flow.getPropStart(), flow.getPropBefore());
      radius.setSize(value);
    },
    /**
       set corner of logical "start-after"
       @memberof Nehan.BorderRadius
       @method setStartAfter
       @param flow {Nehan.BoxFlow} - base layout flow
       @param value {Array<int>} - 2d radius value
    */
    setStartAfter : function(flow, value){
      var radius = this.getCorner(flow.getPropStart(), flow.getPropAfter());
      radius.setSize(value);
    },
    /**
       set corner of logical "end-before"
       @memberof Nehan.BorderRadius
       @method setEndBefore
       @param flow {Nehan.BoxFlow} - base layout flow
       @param value {Array<int>} - 2d radius value
    */
    setEndBefore : function(flow, value){
      var radius = this.getCorner(flow.getPropEnd(), flow.getPropBefore());
      radius.setSize(value);
    },
    /**
       set corner of logical "end-after"
       @memberof Nehan.BorderRadius
       @method setEndAfter
       @param flow {Nehan.BoxFlow} - base layout flow
       @param value {Array<int>} - 2d radius value
    */
    setEndAfter :  function(flow, value){
      var radius = this.getCorner(flow.getPropEnd(), flow.getPropAfter());
      radius.setSize(value);
    },
    /**
       clear corner values of logical before direction("start-before" and "end-before")
       @memberof Nehan.BorderRadius
       @method clearBefore
       @param flow {Nehan.BoxFlow} - base layout flow
    */
    clearBefore : function(flow){
      this.setStartBefore(flow, [0, 0]);
      this.setEndBefore(flow, [0, 0]);
    },
    /**
       clear corner values of logical before direction("start-after" and "end-after")
       @memberof Nehan.BorderRadius
       @method clearAfter
       @param flow {Nehan.BoxFlow} - base layout flow
    */
    clearAfter : function(flow){
      this.setStartAfter(flow, [0, 0]);
      this.setEndAfter(flow, [0, 0]);
    }
  };

  return BorderRadius;
})();
