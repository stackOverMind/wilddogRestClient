var WilddogRest = require('./index');

var wd = new WilddogRest('https://test123.wilddogio.com/a/b/sessions');
wd.stream(function(ev){
  console.log(ev);
},function(err){
  console.log(err);
})