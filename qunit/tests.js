var JSONValidator = this.JSONValidator;

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
	ok(JSONValidator, "JSONValidator is loaded");
});

test("Primitive Validation", function () {
	equal(JSONValidator.validate({}).errors.length, 0, "Object");
	equal(JSONValidator.validate([]).errors.length, 0, "Array");
	equal(JSONValidator.validate('').errors.length, 0, "String");
	equal(JSONValidator.validate(00).errors.length, 0, "Number");
	equal(JSONValidator.validate(false).errors.length, 0, "Boolean");
	equal(JSONValidator.validate(null).errors.length, 0, "Null");
});
	
test("Type Validation", function () {
	equal(JSONValidator.validate({}, { type : 'object' }).errors.length, 0, "Object");
	equal(JSONValidator.validate([], { type : 'array' }).errors.length, 0, "Array");
	equal(JSONValidator.validate('', { type : 'string' }).errors.length, 0, "String");
	equal(JSONValidator.validate(00, { type : 'number' }).errors.length, 0, "Number");
	equal(JSONValidator.validate(00, { type : 'integer' }).errors.length, 0, "Integer");
	equal(JSONValidator.validate(false, { type : 'boolean' }).errors.length, 0, "Boolean");
	equal(JSONValidator.validate(null, { type : 'null' }).errors.length, 0, "Null");
	equal(JSONValidator.validate(true, { type : 'any' }).errors.length, 0, "Any");
	
	notEqual(JSONValidator.validate(null, { type : 'object' }).errors.length, 0, "Object");
	notEqual(JSONValidator.validate(null, { type : 'array' }).errors.length, 0, "Array");
	notEqual(JSONValidator.validate(null, { type : 'string' }).errors.length, 0, "String");
	notEqual(JSONValidator.validate(null, { type : 'number' }).errors.length, 0, "Number");
	notEqual(JSONValidator.validate(0.1, { type : 'integer' }).errors.length, 0, "Integer");
	notEqual(JSONValidator.validate(null, { type : 'boolean' }).errors.length, 0, "Boolean");
	notEqual(JSONValidator.validate(false, { type : 'null' }).errors.length, 0, "Null");
});

test("Properties Validation", function () {
	equal(JSONValidator.validate({}, { type : 'object', properties : {} }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1 }, { type : 'object', properties : { a : {}} }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1 }, { type : 'object', properties : { a : { type : 'number' }} }).errors.length, 0);
	equal(JSONValidator.validate({ a : { b : 'two' } }, { type : 'object', properties : { a : { type : 'object', properties : { b : { type : 'string' } } }} }).errors.length, 0);
});

test("Items Validation", function () {
	equal(JSONValidator.validate([], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	equal(JSONValidator.validate(['foo'], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	equal(JSONValidator.validate(['foo', 2], { type : 'array', items : [{ type : 'string' }, { type : 'number' }] }).errors.length, 0);
	
	notEqual(JSONValidator.validate([1], { type : 'array', items : { type : 'string' } }).errors.length, 0);
	notEqual(JSONValidator.validate(['foo', 'two'], { type : 'array', items : [{ type : 'string' }, { type : 'number' }] }).errors.length, 0);
});

test("Optional Validation", function () {
	equal(JSONValidator.validate({}, { properties : { a : { optional : true } } }).errors.length, 0);
	equal(JSONValidator.validate({ a : false }, { properties : { a : { optional : true } } }).errors.length, 0);
	equal(JSONValidator.validate({ a : false }, { properties : { a : { optional : false } } }).errors.length, 0);
	
	notEqual(JSONValidator.validate({}, { properties : { a : { optional : false } } }).errors.length, 0);
	notEqual(JSONValidator.validate({ b : true }, { properties : { a : { optional : false } } }).errors.length, 0);
	
	//according to spec, this should fail; but the validator passes this
	equals(JSONValidator.validate({ b : true }, { properties : { a : {} } }).errors.length, 0);
});

test("AdditionalProperties Validation", function () {
	//object tests
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, {}).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { additionalProperties : true }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : true }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {}, c : {} }, additionalProperties : false }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {}, c : {} }, additionalProperties : { type : 'string' } }).errors.length, 0);
	
	notEqual(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : false }).errors.length, 0);
	notEqual(JSONValidator.validate({ a : 1, b : 2, c : 3 }, { properties : { a : {}, b : {} }, additionalProperties : { type : 'string' } }).errors.length, 0);
	
	//array tests
	equal(JSONValidator.validate([1, 2, 3], {}).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { additionalProperties : true }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { additionalProperties : false }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { additionalProperties : { type : 'string' } }).errors.length, 0);
	equal(JSONValidator.validate(['1', '2'], { items : { type : 'string' }, additionalProperties : false }).errors.length, 0);
	equal(JSONValidator.validate(['1', '2'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : false }).errors.length, 0);
	equal(JSONValidator.validate(['1', '2', 3], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
	equal(JSONValidator.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
	
	notEqual(JSONValidator.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : false }).errors.length, 0);
	notEqual(JSONValidator.validate(['1', '2', '3'], { items : [ { type : 'string' }, { type : 'string' } ], additionalProperties : { type : 'number' } }).errors.length, 0);
});

test("Requires Validation", function () {
	equal(JSONValidator.validate({ a : 1 }, { properties : { a : { requires : 'a' } } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2 }, { properties : { a : {}, b : { requires : 'a' } } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2 }, { properties : { a : { requires : 'b' }, b : { requires : 'a' } } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2 }, { properties : { b : { requires : { properties : { a : { type : 'number' } } } } } }).errors.length, 0);
	
	notEqual(JSONValidator.validate({ b : 2 }, { properties : { b : { requires : 'a' } } }).errors.length, 0);
	notEqual(JSONValidator.validate({ a : 1, b : 2 }, { properties : { a : { requires : 'b' }, b : { requires : 'c' } } }).errors.length, 0);
	notEqual(JSONValidator.validate({ b : 2 }, { properties : { b : { requires : { properties : { b : { type : 'string' } } } } } }).errors.length, 0);
});

test("Minimum/Maximum Validation", function () {
	equal(JSONValidator.validate(0, {}).errors.length, 0);
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSONValidator.validate(5, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSONValidator.validate(10, { minimum : 1, maximum : 10 }).errors.length, 0);
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 1 }).errors.length, 0);
	
	notEqual(JSONValidator.validate(0, { minimum : 1, maximum : 10 }).errors.length, 0);
	notEqual(JSONValidator.validate(11, { minimum : 1, maximum : 10 }).errors.length, 0);
});

test("MinimumCanEqual/MaximumCanEqual Validation", function () {
	//true
	equal(JSONValidator.validate(0, { minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);
	equal(JSONValidator.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSONValidator.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	notEqual(JSONValidator.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	notEqual(JSONValidator.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	//false
	equal(JSONValidator.validate(0, { minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);
	equal(JSONValidator.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	
	notEqual(JSONValidator.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);
	notEqual(JSONValidator.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
});

test("MinItems/MaxItems Validation", function () {
	equal(JSONValidator.validate([], {}).errors.length, 0);
	equal(JSONValidator.validate([1], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSONValidator.validate([1, 2], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { minItems : 1, maxItems : 3 }).errors.length, 0);
	
	notEqual(JSONValidator.validate([], { minItems : 1, maxItems : 3 }).errors.length, 0);
	notEqual(JSONValidator.validate([1, 2, 3, 4], { minItems : 1, maxItems : 3 }).errors.length, 0);
});

test("JSON Schema Validation", function () {
	equal(JSONValidator.JSONSCHEMA_SCHEMA.validate(JSONValidator.JSONSCHEMA_SCHEMA).errors.length, 0);
});

//test("", function () {});