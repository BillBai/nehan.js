var DefListTagStream = FilteredTagStream.extend({
  init : function(src, font_size, max_size){
    this._super(src, function(tag){
      return tag.isSameAs("dt") || tag.isSameAs("dd");
    });
  }
});

