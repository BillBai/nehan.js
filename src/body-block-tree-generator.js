var BodyBlockTreeGenerator = SectionRootGenerator.extend({
  init : function(data, ctx){
    var context = ctx || new DocumentContext();
    var markup = data;
    if(typeof data === "string"){
      markup = new Tag("<body>", data);
    }
    this._super(markup, context);
  },
  _getBoxSize : function(){
    return Layout.getStdPageSize();
  },
  _createBox : function(size, parent){
    var box = Layout.createRootBox(size, "body");
    this._setBoxStyle(box, null);
    box.percent = this.stream.getSeekPercent();
    box.seekPos = this.stream.getSeekPos();
    box.pageNo = this.context.getPageNo();
    box.charPos = this.context.getCharPos();
    box.css["font-size"] = Layout.fontSize + "px";
    return box;
  },
  _onCompleteTree : function(page){
    // step page no and character count inside this page
    this.context.stepPageNo();
    this.context.addCharPos(page.getCharCount());
  }
});
