var UnitSize = {
  getUnitSize : function(val, unit_size){
    var str = (typeof val === "string")? val : String(val);
    if(str.indexOf("rem") > 0){
      var rem_scale = parseFloat(str.replace("rem",""));
      return Math.floor(Layout.fontSize * rem_scale); // use root font-size
    }
    if(str.indexOf("em") > 0){
      var em_scale = parseFloat(str.replace("em",""));
      return Math.floor(unit_size * em_scale);
    }
    if(str.indexOf("pt") > 0){
      return Math.floor(parseInt(str, 10) * 4 / 3);
    }
    if(str.indexOf("%") > 0){
      return Math.floor(unit_size * parseInt(str, 10) / 100);
    }
    var px = parseInt(str, 10);
    return isNaN(px)? 0 : px;
  },
  getBoxSize : function(val, unit_size, max_size){
    var str = (typeof val === "string")? val : String(val);
    if(str.indexOf("%") > 0){
      var scaled_size = Math.floor(max_size * parseInt(str, 10) / 100);
      return Math.min(max_size, scaled_size); // restrict less than maxMeasure
    }
    return this.getUnitSize(val, unit_size);
  },
  getCornerSize : function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = [0, 0];
      ret[prop][0] = this.getUnitSize(val[prop][0], unit_size);
      ret[prop][1] = this.getUnitSize(val[prop][1], unit_size);
    }
    return ret;
  },
  getEdgeSize : function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = this.getUnitSize(val[prop], unit_size);
    }
    return ret;
  }
};
