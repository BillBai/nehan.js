var DocumentGenerator = (function(){
  function DocumentGenerator(text){
    this.stream = new DocumentTokenStream(text);
    this.generator = this._createGenerator();
  }

  DocumentGenerator.prototype = {
    yield : function(){
      return this.generator.yield();
    },
    hasNext : function(){
      return this.generator.hasNext();
    },
    _createGenerator : function(){
      while(this.stream.hasNext()){
	var tag = this.stream.get();
	switch(tag.getName()){
	case "!doctype":
	  DocumentContext.setDocumentType(tag);
	  break;
	case "html":
	  return this._createHtmlGenerator(tag);
	}
      }
      var html_tag = new Tag("<html>", this.context.getStreamSrc());
      return this._createHtmlGenerator(html_tag);
    },
    _createHtmlGenerator : function(html_tag){
      return HtmlGenerator(html_tag.getContent());
    }
  };

  return DocumentGenerator;
})();

