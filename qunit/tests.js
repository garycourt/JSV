JSV = require('./jsv').JSV;

//calls o(true) if no error is thrown
function okNoError(func, msg) {
	try {
		func();
		ok(true, msg);
	} catch (e) {
		ok(false, msg + ': ' + e);
	}
}

//calls ok(true) if an error is thrown
function okError(func, msg) {
	try {
		func();
		ok(false, msg);
	} catch (e) {
		ok(true, msg + ': ' + e);
	}
}

test("Acquire Validator", function () {
	ok(JSV, "JSV is loaded");
});

test("Primitive Validation", function () {
	equal(JSV.validate({}).errors.length, 0, "Object");
	equal(JSV.validate([]).errors.length, 0, "Array");
	equal(JSV.validate('').errors.length, 0, "String");
	equal(JSV.validate(00).errors.length, 0, "Number");
	equal(JSV.validate(false).errors.length, 0, "Boolean");
	equal(JSV.validate(null).errors.length, 0, "Null");
});
	
test("Type Validation", function () {
	//simple type
	equal(JSV.validate({}, { type : 'object' }).errors.length, 0, "Object");
	equal(JSV.validate([], { type : 'array' }).errors.length, 0, "Array");
	equal(JSV.validate('', { type : 'string' }).errors.length, 0, "String");
	equal(JSV.validate(00, { type : 'number' }).errors.length, 0, "Number");
	equal(JSV.validate(00, { type : 'integer' }).errors.length, 0, "Integer");
	equal(JSV.validate(false, { type : 'boolean' }).errors.length, 0, "Boolean");
	equal(JSV.validate(null, { type : 'null' }).errors.length, 0, "Null");
	equal(JSV.validate(true, { type : 'any' }).errors.length, 0, "Any");
	
	notEqual(JSV.validate(null, { type : 'object' }).errors.length, 0, "Object");
	notEqual(JSV.validate(null, { type : 'array' }).errors.length, 0, "Array");
	notEqual(JSV.validate(null, { type : 'string' }).errors.length, 0, "String");
	notEqual(JSV.validate(null, { type : 'number' }).errors.length, 0, "Number");
	notEqual(JSV.validate(0.1, { type : 'integer' }).errors.length, 0, "Integer");
	notEqual(JSV.validate(null, { type : 'boolean' }).errors.length, 0, "Boolean");
	notEqual(JSV.validate(false, { type : 'null' }).errors.length, 0, "Null");
	
	//union type
	equal(JSV.validate({}, { type : ['null', 'boolean', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Object");
	notEqual(JSV.validate({}, { type : ['null', 'boolean', 'number', 'integer', 'string', 'array'] }).errors.length, 0, "Object");
	
	//schema union type
	equal(JSV.validate({}, { type : [{ type : 'string' }, { type : 'object' }] }).errors.length, 0, "Object");
	equal(JSV.validate(55, { type : [{ type : 'string' }, { type : 'object' }, 'number'] }).errors.length, 0, "Object");
	notEqual(JSV.validate([], { type : ['string', { type : 'object' }] }).errors.length, 0, "Array");
});

test("Properties Validation", function () {
	equal(JSV.validate({}, { type : 'object', properties : {} }).errors.length, 0);
	equal(JSV.validate({ a : 1 }, { type : 'object', properties : { a : {}} }).errors.length, 0);
	equal(JSV.validate({ a : 1 }, { type : 'object', properties : { a : { type : 'number' }} }).errors.length, 0);
	equal(JSV.validate({ a : { b : 'two' } }, { type : 'object', properties : { a : { type : 'object', properties : { b : { type : 'string' } } }} }).errors.length, 0);
});

test("Items Validation", function () {
	equal(JSV.validate([], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	equal(JSV.validate(['foo'], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	equal(JSV.validate(['foo', 2], { type : 'array', items : [{ type : 'string' }, { type : 'number' }] }).errors.length, 0);
	
	notEqual(JSV.validate([1], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	notEqual(JSV.validate(['foo', 'two'], { type : 'array', items : [{ type : 'string' }, { type : 'number' }] }).errors.length, 0);
});

test("Optional Validation", function () {
	equal(JSV.validate({}, { properties : { a : { optional : true } } }).errors.length, 0);
	equal(JSV.validate({ a : false }, { properties : { a : { optional : true } } }).errors.length, 0);
	equal(JSV.validate({ a : false }, { properties : { a : { optional : false } } }).errors.length, 0);
	
	notEqual(JSV.validate({}, { properties : { a : { optional : false } } }).errors.length, 0);
	notEqual(JSV.validate({ b : true }, { properties : { a : { optional : false } } }).errors.length, 0);
	notEqual(JSV.validate({ b : true }, { properties : { a : {} } }).errors.length, 0);
});

test("AdditionalProperties Validation", function () {
	//object tests
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, {}).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { additionalProperties : true }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : true }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {}, c : {} }, additionalProperties : false }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {}, c : {} }, additionalProperties : { type : 'string' } }).errors.length, 0);
	
	notEqual(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : false }).errors.length, 0);
	notEqual(JSV.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : { type : 'string' } }).errors.length, 0);
	
	//array tests
	equal(JSV.validate([1, 2, 3], {}).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { additionalProperties : true }).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { additionalProperties : false }).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { additionalProperties : { type : 'string' } }).errors.length, 0);
	equal(JSV.validate(['1', '2'], { items : { type : 'string' }, additionalProperties : false }).errors.length, 0);
	equal(JSV.validate(['1', '2'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : false }).errors.length, 0);
	equal(JSV.validate(['1', '2', 3], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSV.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
	
	notEqual(JSV.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : false }).errors.length, 0);
	notEqual(JSV.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
});

test("Requires Validation", function () {
	equal(JSV.validate({ a : 1 }, { properties : { a : { requires : 'a' } } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2 }, { properties : { a : {}, b : { requires : 'a' } } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2 }, { properties : { a : { requires : 'b' }, b : { requires : 'a' } } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2 }, { properties : { b : { requires : { properties : { a : { type : 'number' } } } } } }).errors.length, 0);
	
	notEqual(JSV.validate({ b : 2 }, { properties : { b : { requires : 'a' } } }).errors.length, 0);
	notEqual(JSV.validate({ a : 1, b : 2 }, { properties : { a : { requires : 'b' }, b : { requires : 'c' } } }).errors.length, 0);
	notEqual(JSV.validate({ b : 2 }, { properties : { b : { requires : { properties : { b : { type : 'string' } } } } } }).errors.length, 0);
});

test("Minimum/Maximum Validation", function () {
	equal(JSV.validate(0, {}).errors.length, 0);
	equal(JSV.validate(1, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSV.validate(5, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSV.validate(10, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSV.validate(1, { minimum : 1, maximum : 1 }).errors.length, 0);
	
	notEqual(JSV.validate(0, { minimum : 1, maximum : 10 }).errors.length, 0);
	notEqual(JSV.validate(11, { minimum : 1, maximum : 10 }).errors.length, 0);
});

test("MinimumCanEqual/MaximumCanEqual Validation", function () {
	//true
	notEqual(JSV.validate(0, { minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);  //illegal
	equal(JSV.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);
	equal(JSV.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSV.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSV.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	notEqual(JSV.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	notEqual(JSV.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	//false
	notEqual(JSV.validate(0, { minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);  //illegal
	equal(JSV.validate(1.0001, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	equal(JSV.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	equal(JSV.validate(9.9999, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	
	notEqual(JSV.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);
	notEqual(JSV.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSV.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSV.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSV.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
});

test("MinItems/MaxItems Validation", function () {
	equal(JSV.validate([], {}).errors.length, 0);
	equal(JSV.validate([1], { minItems : 1, maxItems : 1 }).errors.length, 0);
	equal(JSV.validate([1], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSV.validate([1, 2], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { minItems : 1, maxItems : 3 }).errors.length, 0);
	
	notEqual(JSV.validate([], { minItems : 1, maxItems : 0 }).errors.length, 0);
	notEqual(JSV.validate([], { minItems : 1, maxItems : 3 }).errors.length, 0);
	notEqual(JSV.validate([1, 2, 3, 4], { minItems : 1, maxItems : 3 }).errors.length, 0);
});

test("UniqueItems Validation", function () {
	equal(JSV.validate([], {}).errors.length, 0);
	equal(JSV.validate([], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([null], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([true, false], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([1, 2, 3], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate(['a', 'b'], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([[], []], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([{}, {}], { uniqueItems : true }).errors.length, 0);
	equal(JSV.validate([JSV.JSONSCHEMA_SCHEMA, JSV.EMPTY_SCHEMA], { uniqueItems : true }).errors.length, 0);
	
	notEqual(JSV.validate([null, null], { uniqueItems : true }).errors.length, 0);
	notEqual(JSV.validate([false, false], { uniqueItems : true }).errors.length, 0);
	notEqual(JSV.validate([1, 2, 1], { uniqueItems : true }).errors.length, 0);
	notEqual(JSV.validate(['a', 'b', 'b'], { uniqueItems : true }).errors.length, 0);
	notEqual(JSV.validate([JSV.JSONSCHEMA_SCHEMA, JSV.JSONSCHEMA_SCHEMA], { uniqueItems : true }).errors.length, 0);
});

test("Pattern Validation", function () {
	equal(JSV.validate('', {}).errors.length, 0);
	equal(JSV.validate('', { pattern : '^$' }).errors.length, 0);
	equal(JSV.validate('today', { pattern : 'day' }).errors.length, 0);
	
	notEqual(JSV.validate('', { pattern : '^ $' }).errors.length, 0);
	notEqual(JSV.validate('today', { pattern : 'dam' }).errors.length, 0);
	notEqual(JSV.validate('aaaaa', { pattern : 'aa(a' }).errors.length, 0);
});

test("MinLength/MaxLength Validation", function () {
	equal(JSV.validate('', {}).errors.length, 0);
	equal(JSV.validate('1', { minLength : 1, maxLength : 1 }).errors.length, 0);
	equal(JSV.validate('1', { minLength : 1, maxLength : 3 }).errors.length, 0);
	equal(JSV.validate('12', { minLength : 1, maxLength : 3 }).errors.length, 0);
	equal(JSV.validate('123', { minLength : 1, maxLength : 3 }).errors.length, 0);
	
	notEqual(JSV.validate('', { minLength : 1, maxLength : 0 }).errors.length, 0);
	notEqual(JSV.validate('', { minLength : 1, maxLength : 3 }).errors.length, 0);
	notEqual(JSV.validate('1234', { minLength : 1, maxLength : 3 }).errors.length, 0);
});

test("Enum Validation", function () {
	equal(JSV.validate(null, {}).errors.length, 0);
	equal(JSV.validate(true, { 'enum' : [false, true] }).errors.length, 0);
	equal(JSV.validate(2, { 'enum' : [1, 2, 3] }).errors.length, 0);
	equal(JSV.validate('a', { 'enum' : ['a'] }).errors.length, 0);
	
	notEqual(JSV.validate(true, { 'enum' : ['false', 'true'] }).errors.length, 0);
	notEqual(JSV.validate(4, { 'enum' : [1, 2, 3, '4'] }).errors.length, 0);
	notEqual(JSV.validate('', { 'enum' : [] }).errors.length, 0);
});

test("Format Validation", function () {
	//TODO
});

test("DivisibleBy Validation", function () {
	equal(JSV.validate(0, {}).errors.length, 0);
	equal(JSV.validate(0, { divisibleBy : 1 }).errors.length, 0);
	equal(JSV.validate(10, { divisibleBy : 5 }).errors.length, 0);
	equal(JSV.validate(10, { divisibleBy : 10 }).errors.length, 0);
	equal(JSV.validate(0, { divisibleBy : 2.5 }).errors.length, 0);
	equal(JSV.validate(5, { divisibleBy : 2.5 }).errors.length, 0);
	equal(JSV.validate(7.5, { divisibleBy : 2.5 }).errors.length, 0);
	
	notEqual(JSV.validate(0, { divisibleBy : 0 }).errors.length, 0);
	notEqual(JSV.validate(7, { divisibleBy : 5 }).errors.length, 0);
	notEqual(JSV.validate(4.5, { divisibleBy : 2 }).errors.length, 0);
	notEqual(JSV.validate(7.5, { divisibleBy : 1.8 }).errors.length, 0);
});

test("Disallow Validation", function () {
	equal(JSV.validate({}, { disallow : ['null', 'boolean', 'number', 'integer', 'string', 'array'] }).errors.length, 0, "Object");
	equal(JSV.validate([], { disallow : ['null', 'boolean', 'number', 'integer', 'string', 'object'] }).errors.length, 0, "Array");
	equal(JSV.validate('', { disallow : ['null', 'boolean', 'number', 'integer', 'array', 'object'] }).errors.length, 0, "String");
	equal(JSV.validate(0.1, { disallow : ['null', 'boolean', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Number");
	equal(JSV.validate(00, { disallow : ['null', 'boolean', 'string', 'array', 'object'] }).errors.length, 0, "Integer");
	equal(JSV.validate(false, { disallow : ['null', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Boolean");
	equal(JSV.validate(null, { disallow : ['boolean', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Null");
	
	notEqual(JSV.validate({}, { disallow : 'object' }).errors.length, 0, "Object");
	notEqual(JSV.validate([], { disallow : 'array' }).errors.length, 0, "Array");
	notEqual(JSV.validate('', { disallow : 'string' }).errors.length, 0, "String");
	notEqual(JSV.validate(00, { disallow : 'integer' }).errors.length, 0, "Number");
	notEqual(JSV.validate(0.1, { disallow : 'number' }).errors.length, 0, "Integer");
	notEqual(JSV.validate(false, { disallow : 'boolean' }).errors.length, 0, "Boolean");
	notEqual(JSV.validate(null, { disallow : 'null' }).errors.length, 0, "Null");
	notEqual(JSV.validate(null, { disallow : 'any' }).errors.length, 0, "Any");
});

test("Extends Validation", function () {
	equal(JSV.validate({}, { 'extends' : {} }).errors.length, 0);
	equal(JSV.validate({}, { 'extends' : { type : 'object' } }).errors.length, 0);
	equal(JSV.validate(1, { type : 'integer', 'extends' : { type : 'number' } }).errors.length, 0);
	equal(JSV.validate({ a : 1, b : 2 }, { properties : { a : { type : 'number' } }, additionalProperties : false, 'extends' : { properties : { b : { type : 'number' } } } }).errors.length, 0);
	
	notEqual(JSV.validate(1, { type : 'number', 'extends' : { type : 'string' } }).errors.length, 0);
	
	//TODO: More tests
});

test("JSON Schema Validation", function () {
	equal(JSV.JSONSCHEMA_SCHEMA.validate(JSV.JSONSCHEMA_SCHEMA).errors.length, 0);
});

test("Links Validation", function () {
	//full
	equal(JSV.validate({ 'a' : {} }, { 'type' : 'object', 'additionalProperties' : { '$ref' : '#' } }).errors.length, 0);
	notEqual(JSV.validate({ 'a' : 1 }, { 'type' : 'object', 'additionalProperties' : { '$ref' : '#' } }).errors.length, 0);
	
	//describedby
	/* "describedby" currently only works for schemas
	equal(JSV.validate(
		{ 'a' : { '$schema' : { 'type' : 'object' } } }, 
		{ 'type' : 'object', 'additionalProperties' : { 'type' : 'string', 'links' : [{"href" : "{$schema}", "rel" : "describedby"}] } }
	).errors.length, 0);
	*/
	
	//self
});

test("Register Schemas", function () {
	equal(JSV.registerSchema({'type' : 'string'}, 'http://test.example.com/1').errors.length, 0);
	equal(JSV.validate('', { '$ref' : 'http://test.example.com/1' }).errors.length, 0);
	notEqual(JSV.validate({}, { '$ref' : 'http://test.example.com/1' }).errors.length, 0);
});

//test("", function () {});