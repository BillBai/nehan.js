/**
 @namespace Nehan.CssEdgeParser
 */
Nehan.CssEdgeParser = (function(){
  var __parse_edge_array = function(ary){
    switch(ary.length){
    case 0:  return {};
    case 1:  return {before:ary[0], end:ary[0], after:ary[0], start:ary[0]};
    case 2:  return {before:ary[0], end:ary[1], after:ary[0], start:ary[1]};
    case 3:  return {before:ary[0], end:ary[1], after:ary[2], start:ary[1]};
    default: return {before:ary[0], end:ary[1], after:ary[2], start:ary[3]};
    }
  };

  return {
    /**
     @memberof Nehan.CssEdgeParser
     @param css_prop {Nehan.CssProp}
     @return {Object} - css value
     */
    formatValue : function(css_prop, value){
      // ("margin-start", "1em") => {start:"1em"}
      if(css_prop.hasAttr()){
	return Nehan.Obj.createOne(css_prop.getAttr(), this.parseUnit(value));
      }
      return this.parseSet(value);
    },
    /**
     @memberof Nehan.CssEdgeParser
     @param value {Object|String|Number|Array|Function}
     @return {Object|String|Function|Number} - css value
     */
    parseUnit: function(value){
      if(typeof value === "number"){
	return String(value);
      }
      if(typeof value === "string"){
	return value;
      }
      if(typeof value === "function"){
	return value;
      }
      console.error("Edge::parseUnit, invalid value:%o", value);
      throw "CssEdgeParser::parseUnit(invalid format)";
    },
    /**
     @memberof Nehan.CssEdgeParser
     @param value {Object|String|Number|Array|Function}
     @return {Object} - css values
     */
    parseSet: function(value){
      if(value instanceof Array){
	return __parse_edge_array(value);
      }
      if(typeof value === "object"){
	return value;
      }
      if(typeof value === "function"){
	return value;
      }
      if(typeof value === "string"){
	value = Nehan.Utils.normalizeCssValueStr(value);
	if(value === ""){
	  return {};
	}
	return __parse_edge_array(Nehan.Utils.splitBySpace(value));
      }
      console.error("Edge::parseSet, invalid value:%o", value);
      throw "CssEdgeParser::parseSet(invalid format)";
    }
  };
})();
