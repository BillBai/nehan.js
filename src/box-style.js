// style setting from markup to box
var BoxStyle = {
  set : function(markup, box, parent){
    this._setDisplay(markup, box, parent);
    this._setColor(markup, box, parent);
    this._setFont(markup, box, parent);
    this._setBoxSizing(markup, box, parent);
    this._setEdge(markup, box, parent);
    this._setLineRate(markup, box, parent);
    this._setTextAlign(markup, box, parent);
    this._setTextIndent(markup, box, parent);
    this._setTextEmphasis(markup, box, parent);
    this._setFlowName(markup, box, parent);
    this._setFloat(markup, box, parent);
    this._setLetterSpacing(markup, box, parent);
    this._setBackground(markup, box, parent);
    this._setClasses(markup, box, parent);
  },
  _setDisplay : function(markup, box, parent){
    box.display = markup.getCssAttr("display", "block");
  },
  _setClasses : function(markup, box, parent){
    List.iter(markup.classes, function(klass){
      box.addClass(klass);
    });
  },
  _setColor : function(markup, box, parent){
    var color = markup.getCssAttr("color");
    if(color){
      box.color = new Color(color);
    }
  },
  _setFont : function(markup, box, parent){
    var font_family = markup.getCssAttr("font-family");
    if(font_family){
      box.font.family = font_family;
    }
    var font_weight = markup.getCssAttr("font-weight");
    if(font_weight){
      box.font.weight = font_weight;
    }
    var font_style = markup.getCssAttr("font-style");
    if(font_style){
      box.font.style = font_style;
    }
    var font_size = markup.getCssAttr("font-size", "inherit");
    if(font_size !== "inherit"){
      box.font.size = UnitSize.getFontSize(font_size, box.getFontSize());
    }
  },
  _setBoxSizing : function(markup, box, parent){
    var box_sizing = markup.getCssAttr("box-sizing");
    if(box_sizing){
      box.sizing = BoxSizings.getByName(box_sizing);
    }
  },
  _setEdge : function(markup, box, parent){
    var padding = markup.getCssAttr("padding");
    var margin = markup.getCssAttr("margin");
    var border_width = markup.getCssAttr("border-width");
    var border_radius = markup.getCssAttr("border-radius");
    if(padding === null && margin === null && border_width === null && border_radius === null){
      return null;
    }
    var edge = new BoxEdge();
    if(padding){
      edge.setSize("padding", box.flow, UnitSize.getEdgeSize(padding, box.getFontSize()));
    }
    if(margin){
      edge.setSize("margin", box.flow, UnitSize.getEdgeSize(margin, box.getFontSize()));
    }
    if(border_width){
      edge.setSize("border", box.flow, UnitSize.getEdgeSize(border_width, box.getFontSize()));
    }
    if(border_radius){
      edge.setBorderRadius(box.flow, UnitSize.getCornerSize(border_radius, box.getFontSize()));
    }
    var border_color = markup.getCssAttr("border-color");
    if(border_color){
      edge.setBorderColor(box.flow, border_color);
    }
    var border_style = markup.getCssAttr("border-style");
    if(border_style){
      edge.setBorderStyle(box.flow, border_style);
    }
    box.setEdge(edge);
  },
  _setLineRate : function(markup, box, parent){
    var line_rate = markup.getCssAttr("line-rate", "inherit");
    if(line_rate !== "inherit"){
      box.lineRate = line_rate;
    }
  },
  _setTextAlign : function(markup, box, parent){
    var text_align = markup.getCssAttr("text-align");
    if(text_align){
      box.textAlign = text_align;
    }
  },
  _setTextIndent : function(markup, box, parent){
    var text_indent = markup.getCssAttr("text-indent", "inherit");
    if(text_indent !== "inherit"){
      box.textIndent = Math.max(0, UnitSize.getUnitSize(text_indent, box.getFontSize()));
    }
  },
  _setTextEmphasis : function(markup, box, parent){
    var empha_style = markup.getCssAttr("text-emphasis-style");
    if(empha_style){
      var empha_pos = markup.getCssAttr("text-emphasis-position", "over");
      var empha_color = markup.getCssAttr("text-emphasis-color", "black");
      var text_empha = new TextEmpha();
      text_empha.setStyle(empha_style);
      text_empha.setPos(empha_pos);
      text_empha.setColor(empha_color);
      box.textEmpha = text_empha;
    }
  },
  _setFlowName : function(markup, box, parent){
    var flow_name = markup.getCssAttr("flow", "inherit");
    if(flow_name === "flip"){
      box.setFlow(parent.getFlipFlow());
    } else if(flow_name !== "inherit"){
      box.setFlow(BoxFlows.getByName(flow_name));
    }
  },
  _setFloat : function(markup, box, parent){
    var logical_float = markup.getCssAttr("float", "none");
    if(logical_float != "none"){
      box.logicalFloat = logical_float;
    }
  },
  _setLetterSpacing : function(markup, box, parent){
    var letter_spacing = markup.getCssAttr("letter-spacing");
    if(letter_spacing){
      box.letterSpacing = UnitSize.getUnitSize(letter_spacing, box.getFontSize());
    }
  },
  _setBackground : function(markup, box, parent){
    var color = markup.getCssAttr("background-color");
    var image = markup.getCssAttr("background-image");
    var pos = markup.getCssAttr("background-position");
    var repeat = markup.getCssAttr("background-repeat");
    if(color === null && image === null && pos === null && repeat === null){
      return;
    }
    var background = new Background();
    if(color){
      background.color = color;
    }
    if(image){
      background.image = image;
    }
    if(pos){
      background.pos = new BackgroundPos2d(
	new BackgroundPos(pos.inline, pos.offset),
	new BackgroundPos(pos.block, pos.offset)
      );
    }
    if(repeat){
      background.repeat = new BackgroundRepeat2d(
	new BackgroundRepeat(repeat.inline),
	new BackgroundRepeat(repeat.block)
      );
    }
    box.background = background;
  }
};

