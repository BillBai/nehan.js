var ListStyleType = (function(){
  function ListStyleType(type){
    this.type = type;
  }

  var marker_text = {
    "disc": "&#x2022;",
    "circle":"&#x25CB;",
    "square":"&#x25A0;"
  };

  ListStyleType.prototype = {
    isDecimalList : function(){
      return (this.type === "decimal" || this.type === "decimal-leading-zero");
    },
    isNoneList : function(){
      return this.type === "none";
    },
    isMarkList : function(){
      return (this.type === "disc" ||
	      this.type === "circle" ||
	      this.type === "square");
    },
    isCountableList : function(){
      return (!this.isNoneList() && !this.isMarkList());
    },
    isHankaku : function(){
      return (this.type === "lower-alpha" || this.type === "upper-alpha" ||
	      this.type === "lower-roman" || this.type === "upper-roman" ||
	      this.isDecimalList());
    },
    isZenkaku : function(){
      return !this.isHankaku();
    },
    _getMarkerDigitString : function(decimal){
      if(this.type === "decimal"){
	return decimal.toString(10);
      }
      if(this.type === "decimal-leading-zero"){
	if(decimal < 10){
	  return "0" + decimal.toString(10);
	}
	return decimal.toString(10);
      }
      return Cardinal.getStringByName(this.type, decimal);
    },
    getMarkerHtml : function(count){
      var text = this.getMarkerText(count);
      if(this.isZenkaku()){
	return Html.tagWrap("span", text, {
	  "class":"nehan-tcy"
	});
      }
      return text;
    },
    getMarkerText : function(count){
      if(this.isNoneList()){
	return Const.space;
      }
      if(this.isMarkList()){
	return marker_text[this.type] || "";
      }
      var digit = this._getMarkerDigitString(count);
      return digit + "."; // add period as postfix.
    }
  };

  return ListStyleType;
})();

