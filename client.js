var ref = require("ref-napi");
var ffi = require("ffi-napi");
var weak = require('weak-napi');
// var Struct = require("ref-struct")
var Struct = require('ref-struct-di')(ref)
// var ArrayType = require("ref-array")
var ArrayType = require('ref-array-di')(ref)
var Union = require('ref-union-di')(ref)


var longlong = ref.types.longlong;
var LongArray = ArrayType(longlong);

////// start union map
// a couple typedefs
var int = ref.types.int
var float = ref.types.float
var string = ref.types.CString

// define a Union type with 3 data fields
var u_tag = new Union({
    ival: int
  , fval: float
  , sval: string
})

// the size of the union matches the largest data type in the union type
console.log('1.client.js union tag:',u_tag.size , string.size ,u_tag.size === string.size)

// and you can create new instances of the union type
var tag = new u_tag
tag.ival = 5

console.log('2.client.js union tag.ival:',tag.ival)

////// end union map
////// start weak referencing
// we are going to "monitor" this Object and invoke "cleanup"
// before the object is garbage collected
var obj = {
    a: true
  , foo: 'bar'
}

// Here's where we set up the weak reference
var ref = weak(obj, function () {
  // `this` inside the callback is the EventEmitter.
  console.log('1.client.js weak "obj" has been garbage collected!')
})

console.log('2.client.js weak ref.foo:',typeof ref.foo)
// While `obj` is alive, `ref` proxies everything to it, so:
console.log('3.client.js weak ref.a:',ref.a, obj.a, ref.a   === obj.a)
console.log('4.client.js weak ref.foo:',ref.foo, obj.foo, ref.foo === obj.foo)

// Clear out any references to the object, so that it will be GC'd at some point...
obj = null

//
//// Time passes, and the garbage collector is run
//

// `callback()` above is called, and `ref` now acts like an empty object.
console.log('5.client.js weak ref.foo(undefined):',typeof ref.foo)
/////// end weak referencing

// define object GoSlice to map to:
// C type struct { void *data; GoInt len; GoInt cap; }
var GoSlice = Struct({
  data: LongArray,
  len:  "longlong",
  cap: "longlong"
});

// define object GoString to map:
// C type struct { const char *p; GoInt n; }
var GoString = Struct({
  p: "string",
  n: "longlong"
});

// define foreign functions
var awesome = ffi.Library("./awesome.so", {
  Add: ["longlong", ["longlong", "longlong"]],
  Cosine: ["double", ["double"]], 
  Sort: ["void", [GoSlice]],
  Log: ["longlong", [GoString]]
});

// call Sort
nums = LongArray([12,54,0,423,9]);
var slice = new GoSlice();
slice["data"] = nums;
slice["len"] = 5;
slice["cap"] = 5;
awesome.Sort(slice);
console.log("1.client.js awesome.Sort([12,54,9,423,9] = ", nums.toArray());

// call Add
console.log("2.client.js awesome.Add(12, 99) = ", awesome.Add(12, 99));

// call Cosine
console.log("3.client.js awesome.Cosine(1) = ", awesome.Cosine(1));

// call Log
str = new GoString();
str["p"] = "4.client.js awesome.Log = Hello Node!";
str["n"] = str["p"].length;
awesome.Log(str);
//////