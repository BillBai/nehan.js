test("unit-size-px", function(){
  var font_size = 16;
  var max_size = 800;
  
  // em
  equal(UnitSize.getUnitSize("1.0em", font_size), 16);
  equal(UnitSize.getUnitSize("1.0", font_size), 1);
  equal(UnitSize.getUnitSize("2", font_size), 2);
  equal(UnitSize.getUnitSize("2.0", font_size), 2);
  equal(UnitSize.getUnitSize("2.0em", font_size), 32);
  equal(UnitSize.getUnitSize("0.5em", font_size), 8);
  equal(UnitSize.getUnitSize("0.5", font_size), 0);
  equal(UnitSize.getUnitSize(".5", font_size), 0);
  equal(UnitSize.getUnitSize(".5em", font_size), 8);

  // pt
  equal(UnitSize.getUnitSize("12pt", font_size), 16);
  equal(UnitSize.getUnitSize("15pt", font_size), 20);

  // px
  equal(UnitSize.getUnitSize("10px", font_size), 10);
  equal(UnitSize.getUnitSize("10", font_size), 10);
  equal(UnitSize.getUnitSize("10em", font_size), 160);
  equal(UnitSize.getUnitSize("2px", font_size), 2);
  equal(UnitSize.getUnitSize("12px", font_size), 12);

  // %
  equal(UnitSize.getBoxSize("10%", font_size, max_size), 80);
  equal(UnitSize.getBoxSize("50%", font_size, max_size), 400);
  equal(UnitSize.getBoxSize("100%", font_size, max_size), 800);
  equal(UnitSize.getBoxSize("200%", font_size, max_size), 800);
});

test("unit-size-edge", function(){
  var font_size = 16;
  var max_size = 800;
  var tmp_metrics = {
    margin:{
      start:"2.0em",
      end:"2.0em",
      before:"3.0em",
      after:"3.0em"
    },
    padding:[0.5, 1, 2, 3],
    border:{
      radius:{
	"start-before":"5px",
	"end-before":"10px",
	"end-after":"15px",
	"start-after":"20px"
      }
    }
  };
  
  var margin = UnitSize.getEdgeSize(tmp_metrics.margin, font_size, max_size);
  equal(margin.start, 32);
  equal(margin.end, 32);
  equal(margin.before, 48);
  equal(margin.after, 48);

  var padding = UnitSize.getEdgeSize(tmp_metrics.padding, font_size, max_size);
  equal(padding[0], 0);
  equal(padding[1], 1);
  equal(padding[2], 2);
  equal(padding[3], 3);

  var border = UnitSize.getEdgeSize(tmp_metrics.border, font_size, max_size);
  equal(border.radius["start-before"], 5);
  equal(border.radius["end-before"], 10);
  equal(border.radius["end-after"], 15);
  equal(border.radius["start-after"], 20);
});

