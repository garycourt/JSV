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
	//simple type
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
	
	//union type
	equal(JSONValidator.validate({}, { type : ['null', 'boolean', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Object");
	notEqual(JSONValidator.validate({}, { type : ['null', 'boolean', 'number', 'integer', 'string', 'array'] }).errors.length, 0, "Object");
	
	//schema union type
	equal(JSONValidator.validate({}, { type : [{ type : 'string' }, { type : 'object' }] }).errors.length, 0, "Object");
	equal(JSONValidator.validate(55, { type : [{ type : 'string' }, { type : 'object' }, 'number'] }).errors.length, 0, "Object");
	notEqual(JSONValidator.validate([], { type : ['string', { type : 'object' }] }).errors.length, 0, "Array");
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
	notEqual(JSONValidator.validate({ b : true }, { properties : { a : {} } }).errors.length, 0);
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
	notEqual(JSONValidator.validate(0, { minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);  //illegal
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true }).errors.length, 0);
	equal(JSONValidator.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSONValidator.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	equal(JSONValidator.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	notEqual(JSONValidator.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	notEqual(JSONValidator.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : true, maximumCanEqual : true  }).errors.length, 0);
	
	//false
	notEqual(JSONValidator.validate(0, { minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);  //illegal
	equal(JSONValidator.validate(1.0001, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	equal(JSONValidator.validate(5, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	equal(JSONValidator.validate(9.9999, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	
	notEqual(JSONValidator.validate(1, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false }).errors.length, 0);
	notEqual(JSONValidator.validate(10, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(1, { minimum : 1, maximum : 1, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(0, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
	notEqual(JSONValidator.validate(11, { minimum : 1, maximum : 10, minimumCanEqual : false, maximumCanEqual : false  }).errors.length, 0);
});

test("MinItems/MaxItems Validation", function () {
	equal(JSONValidator.validate([], {}).errors.length, 0);
	equal(JSONValidator.validate([1], { minItems : 1, maxItems : 1 }).errors.length, 0);
	equal(JSONValidator.validate([1], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSONValidator.validate([1, 2], { minItems : 1, maxItems : 3 }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { minItems : 1, maxItems : 3 }).errors.length, 0);
	
	notEqual(JSONValidator.validate([], { minItems : 1, maxItems : 0 }).errors.length, 0);
	notEqual(JSONValidator.validate([], { minItems : 1, maxItems : 3 }).errors.length, 0);
	notEqual(JSONValidator.validate([1, 2, 3, 4], { minItems : 1, maxItems : 3 }).errors.length, 0);
});

test("UniqueItems Validation", function () {
	equal(JSONValidator.validate([], {}).errors.length, 0);
	equal(JSONValidator.validate([], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([null], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([true, false], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([1, 2, 3], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate(['a', 'b'], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([[], []], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([{}, {}], { uniqueItems : true }).errors.length, 0);
	equal(JSONValidator.validate([JSONValidator.JSONSCHEMA_SCHEMA, JSONValidator.EMPTY_SCHEMA], { uniqueItems : true }).errors.length, 0);
	
	notEqual(JSONValidator.validate([null, null], { uniqueItems : true }).errors.length, 0);
	notEqual(JSONValidator.validate([false, false], { uniqueItems : true }).errors.length, 0);
	notEqual(JSONValidator.validate([1, 2, 1], { uniqueItems : true }).errors.length, 0);
	notEqual(JSONValidator.validate(['a', 'b', 'b'], { uniqueItems : true }).errors.length, 0);
	notEqual(JSONValidator.validate([JSONValidator.JSONSCHEMA_SCHEMA, JSONValidator.JSONSCHEMA_SCHEMA], { uniqueItems : true }).errors.length, 0);
});

test("Pattern Validation", function () {
	equal(JSONValidator.validate('', {}).errors.length, 0);
	equal(JSONValidator.validate('', { pattern : '^$' }).errors.length, 0);
	equal(JSONValidator.validate('today', { pattern : 'day' }).errors.length, 0);
	
	notEqual(JSONValidator.validate('', { pattern : '^ $' }).errors.length, 0);
	notEqual(JSONValidator.validate('today', { pattern : 'dam' }).errors.length, 0);
	notEqual(JSONValidator.validate('aaaaa', { pattern : 'aa(a' }).errors.length, 0);
});

test("MinLength/MaxLength Validation", function () {
	equal(JSONValidator.validate('', {}).errors.length, 0);
	equal(JSONValidator.validate('1', { minLength : 1, maxLength : 1 }).errors.length, 0);
	equal(JSONValidator.validate('1', { minLength : 1, maxLength : 3 }).errors.length, 0);
	equal(JSONValidator.validate('12', { minLength : 1, maxLength : 3 }).errors.length, 0);
	equal(JSONValidator.validate('123', { minLength : 1, maxLength : 3 }).errors.length, 0);
	
	notEqual(JSONValidator.validate('', { minLength : 1, maxLength : 0 }).errors.length, 0);
	notEqual(JSONValidator.validate('', { minLength : 1, maxLength : 3 }).errors.length, 0);
	notEqual(JSONValidator.validate('1234', { minLength : 1, maxLength : 3 }).errors.length, 0);
});

test("Enum Validation", function () {
	equal(JSONValidator.validate(null, {}).errors.length, 0);
	equal(JSONValidator.validate(true, { 'enum' : [false, true] }).errors.length, 0);
	equal(JSONValidator.validate(2, { 'enum' : [1, 2, 3] }).errors.length, 0);
	equal(JSONValidator.validate('a', { 'enum' : ['a'] }).errors.length, 0);
	
	notEqual(JSONValidator.validate(true, { 'enum' : ['false', 'true'] }).errors.length, 0);
	notEqual(JSONValidator.validate(4, { 'enum' : [1, 2, 3, '4'] }).errors.length, 0);
	notEqual(JSONValidator.validate('', { 'enum' : [] }).errors.length, 0);
});

test("Format Validation", function () {
	//TODO
});

test("DivisibleBy Validation", function () {
	equal(JSONValidator.validate(0, {}).errors.length, 0);
	equal(JSONValidator.validate(0, { divisibleBy : 1 }).errors.length, 0);
	equal(JSONValidator.validate(10, { divisibleBy : 5 }).errors.length, 0);
	equal(JSONValidator.validate(10, { divisibleBy : 10 }).errors.length, 0);
	equal(JSONValidator.validate(0, { divisibleBy : 2.5 }).errors.length, 0);
	equal(JSONValidator.validate(5, { divisibleBy : 2.5 }).errors.length, 0);
	equal(JSONValidator.validate(7.5, { divisibleBy : 2.5 }).errors.length, 0);
	
	notEqual(JSONValidator.validate(0, { divisibleBy : 0 }).errors.length, 0);
	notEqual(JSONValidator.validate(7, { divisibleBy : 5 }).errors.length, 0);
	notEqual(JSONValidator.validate(4.5, { divisibleBy : 2 }).errors.length, 0);
	notEqual(JSONValidator.validate(7.5, { divisibleBy : 1.8 }).errors.length, 0);
});

test("Disallow Validation", function () {
	equal(JSONValidator.validate({}, { disallow : ['null', 'boolean', 'number', 'integer', 'string', 'array'] }).errors.length, 0, "Object");
	equal(JSONValidator.validate([], { disallow : ['null', 'boolean', 'number', 'integer', 'string', 'object'] }).errors.length, 0, "Array");
	equal(JSONValidator.validate('', { disallow : ['null', 'boolean', 'number', 'integer', 'array', 'object'] }).errors.length, 0, "String");
	equal(JSONValidator.validate(0.1, { disallow : ['null', 'boolean', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Number");
	equal(JSONValidator.validate(00, { disallow : ['null', 'boolean', 'string', 'array', 'object'] }).errors.length, 0, "Integer");
	equal(JSONValidator.validate(false, { disallow : ['null', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Boolean");
	equal(JSONValidator.validate(null, { disallow : ['boolean', 'number', 'integer', 'string', 'array', 'object'] }).errors.length, 0, "Null");
	
	notEqual(JSONValidator.validate({}, { disallow : 'object' }).errors.length, 0, "Object");
	notEqual(JSONValidator.validate([], { disallow : 'array' }).errors.length, 0, "Array");
	notEqual(JSONValidator.validate('', { disallow : 'string' }).errors.length, 0, "String");
	notEqual(JSONValidator.validate(00, { disallow : 'integer' }).errors.length, 0, "Number");
	notEqual(JSONValidator.validate(0.1, { disallow : 'number' }).errors.length, 0, "Integer");
	notEqual(JSONValidator.validate(false, { disallow : 'boolean' }).errors.length, 0, "Boolean");
	notEqual(JSONValidator.validate(null, { disallow : 'null' }).errors.length, 0, "Null");
	notEqual(JSONValidator.validate(null, { disallow : 'any' }).errors.length, 0, "Any");
});

test("Extends Validation", function () {
	equal(JSONValidator.validate({}, { 'extends' : {} }).errors.length, 0);
	equal(JSONValidator.validate({}, { 'extends' : { type : 'object' } }).errors.length, 0);
	equal(JSONValidator.validate(1, { type : 'integer', 'extends' : { type : 'number' } }).errors.length, 0);
	equal(JSONValidator.validate({ a : 1, b : 2 }, { properties : { a : { type : 'number' } }, additionalProperties : false, 'extends' : { properties : { b : { type : 'number' } } } }).errors.length, 0);
	
	notEqual(JSONValidator.validate(1, { type : 'number', 'extends' : { type : 'string' } }).errors.length, 0);
	
	//TODO: More tests
});

test("JSON Schema Validation", function () {
	equal(JSONValidator.JSONSCHEMA_SCHEMA.validate(JSONValidator.JSONSCHEMA_SCHEMA).errors.length, 0);
});

test("Links Validation", function () {
	
});

//test("", function () {});