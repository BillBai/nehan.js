Nehan.ListStyleType = (function(){
  /**
   @memberof Nehan
   @class ListStyleType
   @classdesc abstraction of list-style-type.
   @constructor
   @param pos {String} - "disc", "circle", "square", "lower-alpha" .. etc
   */
  function ListStyleType(type){
    this.type = type || "none";
  }

  var __marker_text = {
    "disc": "&#x2022;", // BULLET
    "circle":"&#x25E6;", // WHITE BULLET
    "square":"&#x25AA;" // BLACK SMALL SQUARE
    //"square":"&#x25AB;" // WHITE SMALL SQUARE
  };

  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isDecimal = function(){
    return (this.type === "decimal" || this.type === "decimal-leading-zero");
  };
  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isNone = function(){
    return this.type === "none";
  };
  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isMark = function(){
    return (this.type === "disc" ||
	    this.type === "circle" ||
	    this.type === "square");
  };
  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isIncremental = function(){
    return (!this.isNone() && !this.isMark());
  };
  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isHankaku = function(){
    return (this.type === "lower-alpha" || this.type === "upper-alpha" ||
	    this.type === "lower-roman" || this.type === "upper-roman" ||
	    this.isMark() || this.isDecimal());
  };
  /**
   @memberof Nehan.ListStyleType
   @return {boolean}
   */
  ListStyleType.prototype.isZenkaku = function(){
    return !this.isHankaku();
  };
  /**
   @memberof Nehan.ListStyleType
   @param flow {Nehan.BoxFlow}
   @param count {int}
   @return {String}
   */
  ListStyleType.prototype.getMarkerHtml = function(flow, count){
    var text = this.getMarkerText(count);
    if(this.isZenkaku()){
      return Nehan.Html.tagWrap("span", text, {
	"class":"tcy"
      });
    }
    if(flow.isTextVertical() && this.isIncremental()){
      return Nehan.Html.tagWrap("::marker", "<word>" + text + "</word>");
    }
    return text;
  };
  /**
   @memberof Nehan.ListStyleType
   @return {String}
   */
  ListStyleType.prototype.getMarkerText = function(count){
    if(this.isNone()){
      return Nehan.Const.space;
    }
    if(this.isMark()){
      return __marker_text[this.type] || "";
    }
    count = Math.max(1, count);
    var digit = this._getMarkerDigitString(count);
    return digit + "."; // add period as postfix.
  };

  ListStyleType.prototype._getMarkerDigitString = function(decimal){
    if(this.type === "decimal"){
      return decimal.toString(10);
    }
    if(this.type === "decimal-leading-zero"){
      if(decimal < 10){
	return "0" + decimal.toString(10);
      }
      return decimal.toString(10);
    }
    return Nehan.Cardinal.getStringByName(this.type, decimal);
  };

  return ListStyleType;
})();

