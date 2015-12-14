describe("Nehan.Obj", function(){
  it("Obj::copy", function(){
    expect(Nehan.Obj.copy({}, {name:"taro", age:10})).toEqual({name:"taro", age:10});
    expect(Nehan.Obj.copy({name:"jiro"}, {name:"taro", age:10})).toEqual({name:"taro", age:10});
  });

  it("Obj::merge", function(){
    expect(Nehan.Obj.merge({}, {name:"taro", age:10}, {name:"jiro"}))
      .toEqual({name:"jiro", age:10});
    expect(Nehan.Obj.merge({extra:"info"}, {name:"taro", age:10}, {age:20}))
      .toEqual({name:"taro", age:20, extra:"info"});
  });
});
