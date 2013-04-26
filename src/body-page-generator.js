var BodyPageGenerator = SectionRootGenerator.extend({
  init : function(data, ctx){
    var context = ctx || new DocumentContext();
    var markup = data;
    if(typeof data === "string"){
      markup = new Tag("<body>", data);
    }
    this._super(markup, context);
  },
  // create root page, __size and __parent are ignored.
  _createBox : function(__size, __parent){
    var box = Layout.createStdBox("body");
    this._setBoxStyle(box);
    box.percent = this.stream.getSeekPercent();
    box.seekPos = this.stream.getSeekPos();
    box.pageNo = this.context.getPageNo();
    box.charPos = this.context.getCharPos();

    // caution:
    // box.lazy is a flag to see whether this box can be evaluated later.
    // when lazy is enabled, we can evaluate the box at any time, it always yields same html.
    // but this lazy flag at this time is not confirmed, it's temporary.
    // this flag is confirmed when _onCompletePage.
    // if context is 'also' empty when page is completed, lazy flag is confirmed.
    box.lazy = this.context.isEmptyMarkupContext();
    box.css["font-size"] = Layout.fontSize + "px";
    return box;
  },
  _onCompletePage : function(page){
    page.styles = this.context.getPageStyles(page.pageNo);

    // lazy is confirmed when
    // 1. inline level of context is empty when _createBox.
    // 2. inline level of context is 'also' empty when _onCompletePage.
    // in short, if both head and tail are context free, lazy evaluation is enabled.
    page.lazy = page.lazy && this.context.isEmptyMarkupContext();

    // step page no and character count inside this page
    this.context.stepPageNo();
    this.context.addCharPos(page.getCharCount());
  }
});
