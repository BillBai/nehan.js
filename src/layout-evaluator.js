var LayoutEvaluator = (function(){
  function LayoutEvaluator(){
  }

  LayoutEvaluator.prototype = {
    evaluate : function(box){
      //console.log("evaluate:%o", box);
      if(box === null || typeof box === "undefined"){
	//console.warn("error box:%o", box);
	return "";
      }
      // caution: not box.style.display but box.display
      switch(box.display){
      case "block": return this.evalBlock(box);
      case "inline": return this.evalInline(box);
      case "inline-block": return this.evalInlineBlock(box);
      default: return "";
      }
    },
    evalBlock : function(block){
      return Html.tagWrap("div", this.evalBlockElements(block, block.elements), {
	"style":Css.toString(block.css),
	"class":block.classes.join(" ")
      });
    },
    evalBlockElements : function(parent, elements){
      var self = this;
      return List.fold(elements, "", function(ret, child){
	return ret + self.evaluate(child);
      });
    },
    evalInline : function(line){
      return Html.tagWrap("div", this.evalInlineElements(line, line.elements), {
	"style":Css.toString(line.css),
	"class":line.classes.join(" ")
      });
    },
    evalInlineElements : function(line, elements){
      var self = this;
      return List.fold(elements, "", function(ret, element){
	return ret + self.evalInlineElement(line, element);
      });
    },
    evalInlineElement : function(line, element){
      if(element instanceof Box){
	return this.evalInlineChild(line, element);
      }
      var text = this.evalTextElement(line, element);
      return line.style.isTextEmphaEnable()? this.evalEmpha(line, element, text) : text;
    },
    evalTextElement : function(line, text){
      switch(text._type){
      case "word": return this.evalWord(line, text);
      case "char": return this.evalChar(line, text);
      case "tcy": return this.evalTcy(line, text);
      case "ruby": return this.evalRuby(line, text);
      default: return "";
      }
    }
  };

  return LayoutEvaluator;
})();

