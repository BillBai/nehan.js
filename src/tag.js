var Tag = (function (){
  var global_tag_id = 0;
  var rex_first_letter = /(^(<[^>]+>|[\s\n])*)(\S)/mi;
  var is_inline_style_not_allowed = function(name){
    return List.exists(["padding", "margin", "border"], function(prop){
      return name.indexOf(prop) >= 0;
    });
  };

  function Tag(src, content_raw){
    this._type = "tag";
    this._inherited = false; // flag to avoid duplicate inheritance
    this._gtid = global_tag_id++;
    this.src = src;
    this.parent = null;
    this.next = null;
    this.contentRaw = content_raw || "";
    this.name = this._parseName(this.src);
    this.tagAttr = TagAttrParser.parse(this.src);
    this.id = this.tagAttr.id || "";
    this.classes = this._parseClasses(this.tagAttr["class"] || "");
    this.dataset = {}; // set by _parseTagAttr
    this.childs = []; // updated by inherit
    this.cssAttrStatic = this._getSelectorValue(); // initialize css-attr, but updated when 'inherit'.
    this.cssAttrDynamic = {}; // added by setCssAttr

    // initialize inline-style value
    if(this.tagAttr.style){
      this._parseInlineStyle(this.tagAttr.style || "");
    }
    this._parseDataset(); // initialize data-set values
  }

  Tag.prototype = {
    inherit : function(parent_tag, context){
      if(this._inherited || !this.hasLayout()){
	return this; // avoid duplicate initialize
      }
      var self = this;
      this.parent = parent_tag;
      if(this.parent){
	this.parent.addChild(this);
      }
      this.cssAttrStatic = this._getSelectorValue(); // reget css-attr with parent enabled.
      this.applyCallbacks(context);
      this._inherited = true;
      return this;
    },
    applyCallbacks : function(context){
      var css;
      var onload = this.getCssAttr("onload");
      if(onload){
	css = onload(this, context);
	if(css){
	  this.setCssAttrs(css);
	}
      }
      var nth_child = this.getCssAttr("nth-child");
      if(nth_child){
	css = nth_child(this.getChildNth(), this, context);
	if(css){
	  this.setCssAttrs(css);
	}
      }
      var nth_of_type = this.getCssAttr("nth-of-type");
      if(nth_of_type){
	css = nth_of_type(this.getChildOfTypeNth(), this, cotext);
	if(css){
	  this.setCssAttrs(css);
	}
      }
/*
      // TODO:
      // nth-last-child, nth-last-of-type not supported yet,
      // because getting order from tail needs 2-pass parsing,
      // and it consts too much for js engine.
      var nth_last_child = this.getCssAttr("nth-last-child");
      if(nth_last_child){
	css = nth_last_child(this.getLastChildNth());
	if(css){
	  this.setCssAttrs(css);
	}
      }
      var nth_last_of_type = this.getCssAttr("nth-last-of-type");
      if(nth_last_of_type){
	css = nth_last_of_type(this.getLastChildOfTypeNth());
	if(css){
	  this.setCssAttrs(css);
	}
      }
*/
    },
    setContentRaw : function(content_raw){
      this.contentRaw = content_raw;
    },
    setTagAttr : function(name, value){
      this.tagAttr[name] = value;
    },
    setCssAttr : function(name, value){
      this.cssAttrDynamic[name] = value;
    },
    setCssAttrs : function(obj){
      for(var prop in obj){
	this.setCssAttr(prop, obj[prop]);
      }
    },
    setNext : function(tag){
      this.next = tag;
    },
    addChild : function(tag){
      if(this.childs.length > 0){
	List.last(this.childs).setNext(tag);
      }
      this.childs.push(tag);
    },
    addClass : function(klass){
      this.classes.push(klass);
    },
    removeClass : function(klass){
      this.classes = List.filter(this.classes, function(cls){
	return cls != klass;
      });
    },
    iterTagAttr : function(fn){
      List.each(this.tagAttr, fn);
    },
    iterCssAttrDynamic : function(fn){
      List.each(this.cssAttrDynamic, fn);
    },
    iterCssAttrStatic : function(fn){
      List.each(this.cssAttrStatic, fn);
    },
    iterCssAttr : function(fn){
      this.iterCssAttrStatic(fn);
      this.iterCssAttrDynamic(fn); // dynamic attrs prior to static ones.
    },
    iterAttr : function(fn){
      this.iterCssAttr(fn);
      this.iterTagAttr(fn); // inline attrs prior to css attrs.
    },
    getName : function(){
      //return this.alias || this.name;
      return this.name;
    },
    getAttr : function(name, def_value){
      return this.getTagAttr(name) || this.getCssAttr(name) || ((typeof def_value !== "undefined")? def_value : null);
    },
    getParent : function(){
      return this.parent || null;
    },
    getChilds : function(){
      return this.childs;
    },
    getNext : function(){
      return this.next || null;
    },
    getDisplay : function(){
      return this.getCssAttr("display", "block"); // display is block if not defined.
    },
    getParentChilds : function(){
      return this.parent? this.parent.getChilds() : [];
    },
    getParentTypeChilds : function(){
      var name = this.getName();
      return List.filter(this.getParentChilds(), function(tag){
	return tag.getName() === name;
      });
    },
    getOrder : function(){
      return this.order || -1;
    },
    getCssClasses : function(){
      return this.classes.join(" ");
    },
    getTagAttr : function(name, def_value){
      return this.tagAttr[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    getCssAttr : function(name, def_value){
      return this.cssAttrDynamic[name] || this.cssAttrStatic[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    getDataset : function(name, def_value){
      return this.dataset[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    getDatasetAttrs : function(){
      return this.dataset;
    },
    getContentRaw : function(){
      return this.contentRaw;
    },
    getContent : function(){
      var before = this._getPseudoBefore();
      var after = this._getPseudoAfter();
      return this._setPseudoFirst([before, this.contentRaw, after].join(""));
    },
    getSrc : function(){
      return this.src;
    },
    getWrapSrc : function(){
      if(this.isSingleTag()){
	return this.src;
      }
      return this.src + this.contentRaw + "</" + this.name + ">";
    },
    getLogicalFloat : function(){
      return this.getCssAttr("float", "none");
    },
    getHeaderRank : function(){
      if(this.getName().match(/h([1-6])/)){
	return parseInt(RegExp.$1, 10);
      }
      return 0;
    },
    getStaticSize : function(font_size, max_size){
      var width = this.getAttr("width");
      var height = this.getAttr("height");
      if(width && height){
	width = UnitSize.getBoxSize(width, font_size, max_size);
	height = UnitSize.getBoxSize(height, font_size, max_size);
	return new BoxSize(width, height);
      }
      // if size of img is not defined, treat it as character size icon.
      // so, if basic font size is 16px, you can write <img src='/path/to/icon'>
      // instead of writing <img src='/path/to/icon' width='16' height='16'>
      if(this.name === "img"){
	var icon_size = Layout.fontSize;
	return new BoxSize(icon_size, icon_size);
      }
      return null;
    },
    rename : function(name){
      this.name = name;
    },
    regetSelectorValue : function(){
      this.cssAttrStatic = {};
      this._getSelectorValue();
    },
    hasStaticSize : function(){
      return (this.getAttr("width") !== null && this.getAttr("height") !== null);
    },
    hasFlow : function(){
      return this.getCssAttr("flow") !== null;
    },
    hasClass : function(klass){
      return List.exists(this.classes, Closure.eq(klass));
    },
    hasLayout : function(){
      var name = this.getName();
      return (name != "br" && name != "page-break" && name != "end-page");
    },
    isPseudoElement : function(){
      return this.name === "before" || this.name === "after" || this.name === "first-letter" || this.name === "first-line";
    },
    isClassAttrEnable : function(){
      return (typeof this.tagAttr["class"] != "undefined");
    },
    isFloated : function(){
      return this.getLogicalFloat() != "none";
    },
    isPush : function(){
      return (typeof this.tagAttr.push != "undefined");
    },
    isPull : function(){
      return (typeof this.tagAttr.pull != "undefined");
    },
    isClose : function(){
      return this.name.substring(0,1) === "/";
    },
    isAnchorTag : function(){
      return this.name === "a" && this.getTagAttr("name") !== null;
    },
    isAnchorLinkTag : function(){
      var href = this.getTagAttr("href");
      return this.name === "a" && href && href.indexOf("#") >= 0;
    },
    isEmbeddableTag : function(){
      return this.getCssAttr("embeddable") === true;
    },
    isBlock : function(){
      var display = this.getDisplay();
      if(display === "block"){
	return true;
      }
      // floated block with static size is treated as block level floated box.
      if(this.hasStaticSize() && this.isFloated() && display !== "inline-block"){
	return true;
      }
      if(this.isPush() || this.isPull()){
	return true;
      }
      return false;
    },
    isInline : function(){
      var display = this.getDisplay();
      return (display === "inline" || display === "inline-block");
    },
    isInlineBlock : function(){
      return this.getDisplay() === "inline-block";
    },
    isSingleTag : function(){
      return this.getCssAttr("single") === true;
    },
    isTcyTag : function(){
      return this.getCssAttr("text-combine", "") === "horizontal";
    },
    isSectionRootTag : function(){
      return this.getCssAttr("section-root") === true;
    },
    isSectionTag : function(){
      return this.getCssAttr("section") === true;
    },
    isBoldTag : function(){
      var name = this.getName();
      return name === "b" || name === "strong";
    },
    isHeaderTag : function(){
      return this.getHeaderRank() > 0;
    },
    // check if 'single' page-break-tag
    // not see page-break-xxx:'always'
    isPageBreakTag : function(){
      var name = this.getName();
      return name === "end-page" || name === "page-break";
    },
    isMetaTag : function(){
      return this.getCssAttr("meta") === true;
    },
    isSameTag : function(dst){
      return this._gtid === dst._gtid;
    },
    getChildIndexFrom : function(childs){
      var self = this;
      return List.indexOf(childs, function(tag){
	return self.isSameTag(tag);
      });
    },
    getChildNth : function(){
      return this.getChildIndexFrom(this.getParentChilds());
    },
    getLastChildNth : function(){
      return this.getChildIndexFrom(List.reverse(this.getParentChilds()));
    },
    getChildOfTypeNth : function(){
      return this.getChildIndexFrom(this.getParentTypeChilds());
    },
    getLastChildOfTypeNth : function(){
      return this.getChildIndexFrom(this.getParentTypeChilds());
    },
    isFirstChild : function(){
      return this.getChildNth() === 0;
    },
    isLastChild : function(){
      var childs = this.getParentChilds();
      return this.getChildNth() === (childs.length - 1);
    },
    isFirstOfType : function(){
      return this.getChildOfTypeNth() === 0;
    },
    isLastOfType : function(){
      var childs = this.getParentTypeChilds();
      return this.getChildOfTypeNth() === (childs.length - 1);
    },
    isOnlyChild : function(){
      return this.getParentChilds().length === 1;
    },
    isOnlyOfType : function(){
      var childs = this.getParentTypeChilds();
      return (childs.length === 1 && this.isSame(childs[0]));
    },
    isRoot : function(){
      return this.parent === null;
    },
    isEmpty : function(){
      return this.contentRaw === "";
    },
    _getSelectorValue : function(){
      if(this.isPseudoElement()){
	return Selectors.getValuePe(this.parent, this.getName());
      }
      return Selectors.getValue(this);
    },
    _parseName : function(src){
      return src.replace(/</g, "").replace(/\/?>/g, "").split(/\s/)[0].toLowerCase();
    },
    _parseId : function(){
      var id = this.tagAttr.id || "";
      return (id === "")? id : ((this.tagAttr.id.indexOf("nehan-") === 0)? "nehan-" + id : id);
    },
    // <p class='hi hey'>
    // => ["hi", "hey"]
    _parseClasses : function(class_value){
      class_value = Utils.trim(class_value.replace(/\s+/g, " "));
      var classes = (class_value === "")? [] : class_value.split(/\s+/);
      return List.map(classes, function(klass){
	return (klass.indexOf("nehan-") === 0)? klass : "nehan-" + klass;
      });
    },
    // <p class='hi hey'>
    // => [".hi", ".hey"]
    _parseCssClasses : function(classes){
      return List.map(classes, function(class_name){
	return "." + class_name;
      });
    },
    _setPseudoFirst : function(content){
      var first_letter = Selectors.getValuePe(this, "first-letter");
      content = Obj.isEmpty(first_letter)? content : this._setPseudoFirstLetter(content);
      var first_line = Selectors.getValuePe(this, "first-line");
      return Obj.isEmpty(first_line)? content : this._setPseudoFirstLine(content);
    },
    _setPseudoFirstLetter : function(content){
      return content.replace(rex_first_letter, function(match, p1, p2, p3){
	return p1 + Html.tagWrap("first-letter", p3);
      });
    },
    _setPseudoFirstLine : function(content){
      return Html.tagWrap("first-line", content);
    },
    _getPseudoBefore : function(){
      var attr = Selectors.getValuePe(this, "before");
      return Obj.isEmpty(attr)? "" : Html.tagWrap("before", attr.content || "");
    },
    _getPseudoAfter : function(){
      var attr = Selectors.getValuePe(this, "after");
      return Obj.isEmpty(attr)? "" : Html.tagWrap("after", attr.content || "");
    },
    // "border:0; margin:0"
    // => {border:0, margin:0}
    _parseInlineStyle : function(src){
      var dynamic_attr = this.cssAttrDynamic;
      var stmts = (src.indexOf(";") >= 0)? src.split(";") : [src];
      List.iter(stmts, function(stmt){
	var nv = stmt.split(":");
	if(nv.length >= 2){
	  var prop = Utils.trim(nv[0]).toLowerCase();
	  if(!is_inline_style_not_allowed(prop)){
	    var value = Utils.trim(nv[1]);
	    dynamic_attr[prop] = value;
	  }
	}
      });
    },
    _parseDataset : function(){
      for(var name in this.tagAttr){
	if(name.indexOf("data-") === 0){
	  var dataset_name = this._parseDatasetName(name);
	  this.dataset[dataset_name] = this.tagAttr[name];
	}
      }
    },
    // "data-name" => "name"
    // "data-family-name" => "familyName"
    _parseDatasetName : function(prop){
      var hyp_name = prop.slice(5); // 5 is "data-".length
      return Utils.getCamelName(hyp_name);
    }
  };

  return Tag;
})();

