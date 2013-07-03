var InlineEvaluator = Class.extend({
  init : function(parent_evaluator){
    this.parentEvaluator = parent_evaluator;
  },
  wrapInlineTag : function(markup, body){
    return [markup.getSrc(), body, markup.getCloseSrc()].join("");
  },
  evaluate : function(line){
    throw "InlineEvaluator::evaluate not implemented";
  },
  evalTextLineBody : function(line, tokens){
    var self = this;
    var body = List.fold(tokens, "", function(ret, element){
      return ret + self.evalInlineElement(line, element);
    });
    //return line.isInlineText()? this.wrapInlineTag(line.markup, body) : body;
    return body;
  },
  evalInlineElement : function(line, element){
    if(element._type === "text-line"){
      return this.evaluate(element);
    }
    if(element instanceof Ruby){
      return this.evalRuby(line, element);
    }
    if(Token.isText(element)){
      return this.evalText(line, element);
    }
    if(Token.isTag(element)){
      return this.evalTagSingle(line, element);
    }
    if(element instanceof Box){
      return this.evalInlineBox(element);
    }
    return "";
  },
  evalText : function(line, text){
    switch(text._type){
    case "word":
      return this.evalWord(line, text);
    case "tcy":
      return this.evalTcy(line, text);
    case "char":
      return this.evalChar(line, text);
    default:
      return "";
    }
  },
  evalTagSingle : function(line, tag){
    return tag.getSrc();
  },
  evalInlineBox : function(box, ctx){
    return this.parentEvaluator.evaluate(box);
  },
  evalWord : function(line, word){
    throw "not implemented: evalWord";
  },
  evalTcy : function(line, tcy){
    throw "not implemented: evalTcy";
  },
  evalChar : function(line, tcy){
    throw "not implemented: evalChar";
  }
});
