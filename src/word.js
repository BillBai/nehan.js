var Word = (function(){
  function Word(word, devided){
    this.data = word;
    this._type = "word";
    this._devided = devided || false;
  }

  Word.prototype = {
    getCssVertTrans : function(line){
      var css = {};
      css["letter-spacing"] = line.letterSpacing + "px";
      css.width = this.fontSize + "px";
      css.height = this.bodySize + "px";
      css["margin-left"] = css["margin-right"] = "auto";
      return css;
    },
    getCssVertTransIE : function(line){
      var css = {};
      css["float"] = "left";
      css["writing-mode"] = "tb-rl";
      css["letter-spacing"] = line.letterSpacing + "px";
      css["line-height"] = this.fontSize + "px";
      return css;
    },
    getCharCount : function(){
      return 1; // word is count by 1 character.
    },
    getAdvance : function(flow, letter_spacing){
      return this.bodySize + letter_spacing * this.getLetterCount();
    },
    hasMetrics : function(){
      return (typeof this.bodySize !== "undefined") && (typeof this.fontSize != "undefined");
    },
    hasEmpha : function(){
      return (typeof this.empha !== "undefined") && (this.empha !== "");
    },
    setMetrics : function(flow, font_size, is_bold){
      this.fontSize = font_size;
      this.bodySize = this.data.length * Math.floor(font_size / 2);
      if(is_bold){
	var bold_rate = Layout.boldRate;
	this.bodySize += Math.floor(bold_rate * this.bodySize);
      }
    },
    setEmpha : function(empha){
      this.empha = empha;
    },
    getLetterCount : function(){
      return this.data.length;
    },
    setDevided : function(enable){
      this._devided = enable;
    },
    isDevided : function(){
      return this._devided;
    },
    // devide word by measure size and return first half of word.
    cutMeasure : function(measure){
      var half_size = Math.floor(this.fontSize / 2);
      var this_half_count = Math.floor(this.bodySize / half_size);
      var measure_half_count = Math.floor(measure / half_size);
      if(this_half_count <= measure_half_count){
	return this;
      }
      var str_part = this.data.substring(0, measure_half_count);
      var word_part = new Word(str_part, true);
      this.data = this.data.slice(measure_half_count);
      this.setDevided(true);
      return word_part;
    }
  };
  
  return Word;
})();

