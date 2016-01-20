/*! nehan-doc.js
  All rights reserved by tategakibunko.
  web: https://github.com/tategakibunko
*/
var Ndoc = Ndoc || {};

$(function(){
  // if IE8 under, show alert message.
  var client = Nehan.Env.client;
  if(client.isIE() && client.version <= 8){
    $(".legacy-browser-alert").show();
  }

  /*
  $("#global-menu").find(".dropdown").dropdown({
    onChange:function(value, text, $choice){
      var href = $choice.attr("href") || $choice.find("a").attr("href");
      location.href = href;
    }
  });*/

  $(".nehan-reader").each(function(i, dom){
    var $dom = $(dom);
    var html = $dom.html();
    var flow = $dom.data("flow");
    new Ndoc.Reader({
      el:dom,
      data:{
	text:html, 
	flow:flow
      }
    });
  });
});




Ndoc.Settings = {
}; // TODO



Nehan.setStyles({
  body:{
    textAlign:"justify",
    width:"90%",
    height:function(){
      return Math.floor(screen.height * 55 / 100);
    }
  }
});

Ndoc.Reader = Vue.extend({
  template: "#tmpl-reader",
  data: function(){
    return {
      flow:"lr-tb",
      text:"text is not defined.",
      pageIndex:0,
      pageCount:0,
      width:700,
      height:500,
      fontSize:16
    }
  },
  computed:{
    pageNo: function(){
      return this.pageIndex + 1;
    },
    leftButtonPopup: function(){
      return this.isVert()? "forward page" : "backward page";
    },
    rightButtonPopup: function(){
      return this.isVert()? "backward page" : "forward page";
    },
    leftButtonLabel: function(){
      return this.isVert()?
	"<i class='flipped play icon'></i>":
	"<i class='backward icon'></i>";
    },
    rightButtonLabel: function(){
      return this.isVert()?
	"<i class='flipped backward icon'></i>":
	"<i class='play icon'></i>";
    },
    leftButtonColor:function(){
      return this.isVert()? "blue" : "red";
    },
    rightButtonColor:function(){
      return !this.isVert()? "blue" : "red";
    }
  },
  ready: function(){
    this.mountReader();
    this.$watch("flow", this.mountReader);
    $(this.$el).find(".popup-enabled").popup();
  },
  methods:{
    createText : function(raw_text){
      return raw_text.replace(/\[math\]([\s|\S]+?)\[\/math\]/g, function(match, p1){
	return "<math>" + p1 + "</math>";
      });
    },
    mountReader: function(){
      this.pageIndex = 0;
      this.pageCount = 0;
      this.element = document.createElement("div");
      this.pages = new Nehan.Document()
	.setStyle("body", {
	  "flow":this.flow,
	  "width":this.width,
	  "height":this.height,
	  "font-size":this.fontSize,
	  "word-break":((this.flow === "tb-rl")? "break-all" : "normal")
	})
	.setContent(this.createText(this.text))
	.render({
	  onPreloadProgress :function(res){
	    //console.log(res);
	  },
	  onProgress: function(tree, ctx){
	    this.pageCount++;
	    if(tree.pageNo === 0){
	      this.setPage(0);
	    }
	  }.bind(this),
	  onComplete: function(time){
	    //console.log("finish %fmsec", time);
	  }
	});

      //this.element.appendChild(this.pages.getPage(0).element);

      $(this.$$.screen).empty().css({
	width:(this.width + 20),
	height:(this.height + 25)
      }).append(this.element);
    },
    isVert: function(){
      return this.flow === "tb-rl";
    },
    setPage : function(index){
      var page = this.pages.getPage(index);
      if(this.element.firstChild){
	this.element.replaceChild(page.element, this.element.firstChild);
      } else {
	this.element.appendChild(page.element);
      }
    },
    setNextPage : function(){
      this.pageIndex = Math.min(this.pageIndex + 1, this.pageCount - 1);
      this.setPage(this.pageIndex);
    },
    setPrevPage : function(){
      this.pageIndex = Math.max(0, this.pageIndex - 1);
      this.setPage(this.pageIndex);
    },
    onClickHori: function(){
      this.flow = "lr-tb";
    },
    onClickVert: function(){
      this.flow = "tb-rl";
    },
    onClickLeft: function(){
      if(this.isVert()){
	this.setNextPage();
      } else {
	this.setPrevPage();
      }
    },
    onClickRight: function(){
      if(this.isVert()){
	this.setPrevPage();
      } else {
	this.setNextPage();
      }
    }
  }
});
