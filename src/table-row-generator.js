var TableRowGenerator = ParallelPageGenerator.extend({
  init : function(markup, parent, context){
    var partition = parent.partition.getPartition(markup.childs.length);
    var generators = List.map(markup.childs, function(td){
      return new ParaChildPageGenerator(td, context.createInlineRoot());
    });
    this._super(generators, markup, context, partition);
  }
});
