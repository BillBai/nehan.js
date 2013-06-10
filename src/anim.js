var reqAnimationFrame = (function(){
  var default_wait = 1000 / 60;
  return window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function(callback, wait){
      var _wait = (typeof wait === "undefined")? default_wait : wait;
      window.setTimeout(callback, _wait);
    };
})();

