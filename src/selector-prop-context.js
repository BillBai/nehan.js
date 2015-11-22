Nehan.SelectorPropContext = (function(){
  /**
     @memberof Nehan
     @class SelectorPropContext
     @classdesc selector context for functional value of style. see example.
     @constructor
     @param style {Nehan.Style}
     @param layout_context {Nehan.LayoutContext}
     @example
     * Nehan.setStyle("body", {
     *   width:function(context){
     *     return 500;
     *   }
     * });
  */
  function SelectorPropContext(style, layout_context){
    this.style = style;
    this.layoutContext = layout_context;
  }

  /**
   @memberof Nehan.SelectorPropContext
   @return {Nehan.Style}
   */
  SelectorPropContext.prototype.getParentStyle = function(){
    return this.style.parent;
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {Nehan.BoxFlow}
   */
  SelectorPropContext.prototype.getParentFlow = function(){
    var parent = this.getParentStyle();
    return parent? parent.flow : Nehan.Display.getStdBoxFlow();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {Nehan.Tag}
   */
  SelectorPropContext.prototype.getMarkup = function(){
    return this.style.markup;
  };
  /**
   @memberof Nehan.SelectorPropContext
   @method getMarkupContent
   @return {String}
   */
  SelectorPropContext.prototype.getMarkupContent = function(){
    return this.getMarkup().getContent();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @method setMarkupContent
   @param content {String}
   */
  SelectorPropContext.prototype.setMarkupContent = function(content){
    this.getMarkup().setContent(content);
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {int}
   */
  SelectorPropContext.prototype.getRestMeasure = function(){
    return this.layoutContext? this.layoutContext.getInlineRestMeasure() : null;
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {int}
   */
  SelectorPropContext.prototype.getRestExtent = function(){
    return this.layoutContext? this.layoutContext.getBlockRestExtent() : null;
  };
  /**
   index number of nth-child

   @memberof Nehan.SelectorPropContext
   @return {int}
   */
  SelectorPropContext.prototype.getChildIndex = function(){
    return this.style.getChildIndex();
  };
  /**
   index number of nth-child-of-type

   @memberof Nehan.SelectorPropContext
   @return {int}
   */
  SelectorPropContext.prototype.getChildIndexOfType = function(){
    return this.style.getChildIndexOfType;
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isFirstChild = function(){
    return this.style.isFirstChild();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isFirstOfType = function(){
    return this.style.isFirstOfType();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isLastChild = function(){
    return this.style.isLastChild();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isLastOfType = function(){
    return this.style.isLastOfType();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isOnlyChild = function(){
    return this.style.isOnlyChild();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isOnlyOfType = function(){
    return this.style.isOnlyOfType();
  };
  /**
   @memberof Nehan.SelectorPropContext
   @return {bool}
   */
  SelectorPropContext.prototype.isMarkupEmpty = function(){
    return this.style.isMarkupEmpty();
  };

  return SelectorPropContext;
})();

