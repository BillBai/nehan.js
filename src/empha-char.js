var EmphaChar = (function(){
  function EmphaChar(opt){
    this.data = opt.data || "&#x2022";
    this.startPos = opt.startPos || 0;
    this.parent = opt.parent;
    this.fontSize = this.parent.fontSize;
  }

  EmphaChar.prototype = {
    getCss : function(flow){
      var css = {};
      css.position = "absolute";
      css["text-align"] = "center";
      css.width = css.height = this.fontSize + "px";
      css.display = flow.isTextVertical()? "block" : "inline-block";
      css[flow.getPropStart()] = this.startPos + "px";
      return css;
    },
    getAdvance : function(flow){
      return this.parent.getAdvance(flow);
    }
  };

  return EmphaChar;
})();

