/**
   system configuration
   @namespace Nehan.Config
*/
Nehan.Config = {
  /**
     language setting
     @memberof Nehan.Config
     @type {string}
     @default "ja-JP"
  */
  lang:"ja-JP",

  /**
     is debug mode?
     @memberof Nehan.Config
     @type {boolean}
     @default false
  */
  debug:false,

  /**
     is kerning enabled?
     @memberof Nehan.Config
     @type {boolean}
     @default true
  */
  kerning:true,

  /**
     is hyphenation enabled?
     @memberof Nehan.Config
     @type {boolean}
     @default true
  */
  hyphenate:true,

  /**
     is dangling hyphenate enable?
     Note that this property is enabled only when Nehan.Config.hyphenate is enabled.
     @memberof Nehan.Config
     @type {boolean}
     @default true
  */
  danglingHyphenate:true,

  /**
     force justify line if vertical writing mode.
     @memberof Nehan.Config
     @type {boolean}
     @default true
  */
  forceJustifyIfVert:true,

  /**
     max rety count when something troubles.
     @memberof Nehan.Config
     @type {int}
     @default 20
  */
  maxRollbackCount:20,

  /**
     max yield count to block infinite loop.
     @memberof Nehan.Config
     @type {int}
     @default 20000
  */
  maxYieldCount:20000,

  /**
     max available page count for each engine.
     @memberof Nehan.Config
     @type {int}
     @default 5000
  */
  maxPageCount:5000,

  /**
     use vertical glyph if browser support 'writing-mode'.
     @memberof Nehan.Config
     @type {boolean}
     @default true
  */
  useVerticalGlyphIfEnable:true,

  /**
     enable ommiting element by start tag.
     @memberof Nehan.Config
     @type {boolean}
     @default false
  */
  enableAutoCloseTag:false,

  /**
     allowed inline style properties.
     allow all properties if not defined or list is empty.

     @memberof Nehan.Config
     @type {Array.<string>}
     @default []
  */
  allowedInlineStyleProps:[]
};
