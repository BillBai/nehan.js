var Env = (function(){
  var nav = navigator.appName;
  var ua = navigator.userAgent.toLowerCase();
  var matched = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/);
  var browser, version, is_transform_enable;
  if(matched){
    tmp_match = ua.match(/version\/([\.\d]+)/i);
    if(tmp_match){
      matched[2] = tmp_match[1];
    }
    browser = matched[1].toLowerCase();
    version = parseInt(matched[2], 10);
  } else {
    browser = nav.toLowerCase();
    version = parseInt(navigator.appVersion, 10);
  }

  var is_trident = ua.indexOf("trident") >= 0;
  var is_ie = browser === "msie" || is_trident;
  var is_win = ua.indexOf("windows") >= 0;
  var is_mac = ua.indexOf("macintosh") >= 0;
  var is_chrome = browser.indexOf("chrome") >= 0;
  var is_iphone = ua.indexOf("iphone") != -1;
  var is_ipod = ua.indexOf("ipod") != -1;
  var is_ipad = ua.indexOf("ipad") != -1;
  var is_iphone_family = (is_iphone || is_ipod || is_ipad);
  var is_android_family = ua.indexOf("android") != -1;
  var is_smart_phone = is_iphone_family || is_android_family;
  var is_webkit = ua.indexOf("webkit") != -1;
  var is_transform_enable = is_trident || !(is_ie && version <= 8);
  var is_vertical_glyph_enable = is_chrome && (is_win || is_mac) && version >= 24;

  return {
    version : version,
    isIE : is_ie,
    isTrident : is_trident,
    isChrome : is_chrome,
    isWebkit : is_webkit,
    isIphone : is_iphone,
    isIpod : is_ipod,
    isIpad : is_ipad,
    isIphoneFamily : is_iphone_family,
    isAndroidFamily : is_android_family,
    isSmartPhone : is_smart_phone,
    isTransformEnable : is_transform_enable,
    isVerticalGlyphEnable : is_vertical_glyph_enable
  };
})();

