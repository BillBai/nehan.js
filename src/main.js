Nehan.version = "4.0.3";

Args.copy(Env, __engine_args.env || {});
Args.copy(Layout, __engine_args.layout || {});
Args.copy(Config, __engine_args.config || {});

var __exports = {};

// export only for test
if(__engine_args.test){

  // basics
  __exports.Class = Class;
  __exports.Utils = Utils;
  __exports.MathUtils = MathUtils;
  __exports.Obj = Obj;
  __exports.Css = Css;
  __exports.Html = Html;
  __exports.Closure = Closure;
  __exports.Args = Args;
  __exports.List = List;
  __exports.Color = Color;
  __exports.Colors = Colors;
  __exports.Flow = Flow;
  __exports.InlineFlow = InlineFlow;
  __exports.BlockFlow = BlockFlow;
  __exports.BoxFlow = BoxFlow;
  __exports.BoxFlows = BoxFlows;
  __exports.Edge = Edge;
  __exports.EdgeParser = EdgeParser;
  __exports.CornerParser = CornerParser;
  __exports.CssParser = CssParser;
  __exports.Padding = Padding;
  __exports.Margin = Margin;
  __exports.Border = Border;
  __exports.BorderColor = BorderColor;
  __exports.BorderRadius = BorderRadius;
  __exports.Radius2d = Radius2d;
  __exports.BoxEdge = BoxEdge;
  __exports.BoxSize = BoxSize;
  __exports.BoxSizing = BoxSizing;
  __exports.BoxSizings = BoxSizings;
  __exports.UnitSize = UnitSize;
  __exports.BoxChild = BoxChild;
  __exports.Box = Box;
  __exports.Selector = Selector;
  __exports.SelectorLexer = SelectorLexer;
  __exports.SelectorAttr = SelectorAttr;
  __exports.SelectorPseudo = SelectorPseudo;
  __exports.SelectorType = SelectorType;
  __exports.SelectorCombinator = SelectorCombinator;
  __exports.SelectorStateMachine = SelectorStateMachine;
  __exports.Tag = Tag;
  __exports.Char = Char;
  __exports.Word = Word;
  __exports.Tcy = Tcy;
  __exports.Ruby = Ruby;
  __exports.Lexer = Lexer;
  __exports.Token = Token;
  __exports.TagStack = TagStack;
  __exports.InlineContext = InlineContext;
  __exports.BlockContext = BlockContext;
  __exports.DocumentContext = DocumentContext;
  __exports.TocContext = TocContext;
  __exports.EvalResult = EvalResult;
  __exports.PageGroup = PageGroup;
  __exports.Partition = Partition;
  __exports.Cardinal = Cardinal;
  __exports.ListStyle = ListStyle;
  __exports.ListStyleType = ListStyleType;
  __exports.ListStylePos = ListStylePos;
  __exports.ListStyleImage = ListStyleImage;

  // outline
  __exports.OutlineBuffer = OutlineBuffer;
  __exports.OutlineContext = OutlineContext;
  __exports.OutlineParser = OutlineParser;
  __exports.OutlineConverter = OutlineConverter;

  // stream
  __exports.TokenStream = TokenStream;
  __exports.DocumentTagStream = DocumentTagStream;
  __exports.HtmlTagStream = HtmlTagStream;
  __exports.HeadTagStream = HeadTagStream;
  __exports.ListTagStream = ListTagStream;
  __exports.DefListTagStream = DefListTagStream;
  __exports.TableTagStream = TableTagStream;
  __exports.RubyTagStream = RubyTagStream;

  // generator
  __exports.ElementGenerator = ElementGenerator;
  __exports.InlineTreeGenerator = InlineTreeGenerator;
  __exports.BlockTreeGenerator = BlockTreeGenerator;
  __exports.BodyBlockTreeGenerator = BodyBlockTreeGenerator;
  __exports.ParallelGenerator = ParallelGenerator;
  __exports.ParaChildGenerator = ParaChildGenerator;
  __exports.HtmlGenerator = HtmlGenerator;
  __exports.DocumentGenerator = DocumentGenerator;

  // evaluator
  __exports.PageEvaluator = PageEvaluator;
  __exports.BlockTreeEvaluator = BlockTreeEvaluator;
  __exports.InlineTreeEvaluator = InlineTreeEvaluator;
  __exports.PageGroupEvaluator = PageGroupEvaluator;

  // page stream
  __exports.PageStream = PageStream;
  __exports.PageGroupStream = PageGroupStream;

  // core layouting components
  __exports.Env = Env;
  __exports.Config = Config;
  __exports.Layout = Layout;
  __exports.Style = Style;
  __exports.Selectors = Selectors;
}

__exports.createPageStream = function(text, group_size){
  group_size = Math.max(1, group_size || 1);
  return (group_size === 1)? (new PageStream(text)) : (new PageGroupStream(text, group_size));
};
__exports.getStyle = function(selector_key){
  return Selectors.getValue(selector_key);
};
__exports.setStyle = function(selector_key, value){
  Selectors.setValue(selector_key, value);
};
__exports.setStyles = function(values){
  for(var selector_key in values){
    Selectors.setValue(selector_key, values[selector_key]);
  }
};

return __exports;
