JSV: JSON Schema (Revision 2) Validator
=======================================

JSV is a JavaScript implementation of a extendable, fully compliant [revision 2 JSON Schema](http://tools.ietf.org/html/draft-zyp-json-schema-02) validator with the following features:

* Full implementation of the revision 2 JSON Schema specification; will validate any JSON Schema written to this specification.
* Supports `full` and `describedby` hyper links.
* Easily extendable to include new schema attributes, value types, and string formats.
* Validates itself, and is bootstrapped from the JSON Schema schema.
* Includes over 170 unit tests to test all parts of the specification & validator.
* Includes rewritten and validated schemas from the JSON Schema specification.

JSV is currently in beta; use at your own risk as there still may be bugs present, and APIs are subject to change.

## JSON Schema

The revision 2 specification of JSON Schema can be found at 
[http://tools.ietf.org/html/draft-zyp-json-schema-02](http://tools.ietf.org/html/draft-zyp-json-schema-02).

## Example

Here's an example on how to validate some JSON with the JSON Schema Validator:

	var JSV = require("./jsv").JSV;
	var json = {};
	var schema = {"type" : "object"};
	var report = JSV.validate(json, schema);
	
	if (report.errors.length === 0) {
		//JSON is valid against the schema
	}

## APIs

### JSV.validate(json, schema)

Validates the provided JSON object with the provided schema object, returns a report object.
If your JSON or schema are a string, they must be first convert them to a native JavaScript object
using `JSON.parse`.

	JSV.validate(["foo"], { type : "array", items : { type : "string" } });

### JSV.validateWithURI(json, jsonURI, schema, schemaURI)

Works the same as `JSV.validate`, except you can specify URIs for both the JSON and schema to be
used in the report.

	JSV.validate("", "http://json.example.com/1", {}, "http://schema.example.com/1");

### JSV.registerSchema(schema, schemaURI)

Registers the provided schema under the provided URI. This then allows this schema to be referenced
by other schemas. This method returns a report object on the schema's validation.

	JSV.registerSchema({ "type" : "string" }, "http://schema.example.com/2");
	JSV.validate("", { "$ref" : "http://schema.example.com/2" });  //validates
	JSV.validate({}, { "$ref" : "http://schema.example.com/2" });  //does not validate

### Reports

Report objects have the following schema:

	{
		"title" : "Validation Report",
		"type" : "object",
		"properties" : {
			"errors" : {
				"title" : "Validation Errors",
				"description" : "An array of error objects from the validation process. Each object represents a restriction check that failed.",
				"type" : "array",
				"items" : {
					"type" : "object",
					"properties" : {
						"message" : {
							"description" : "A user-friendly error message about what failed to validate.",
							"type" : "string"
						},
						"uri" : {
							"description" : "URI of instance that failed to validate.",
							"type" : "string",
							"format" : "uri"
						},
						"schemaUri" : {
							"description" : "URI of schema instance that reported the error.",
							"type" : "string",
							"format" : "uri"
						},
						"attribute" : {
							"description" : "The attribute of the schema instance that failed to validate.",
							"type" : "string"
						},
						"details" : {
							"description" : "The value of the schema attribute that failed to validate.",
							"type" : "any"
						}
					}
				}
			},
			"instance" : {
				"title" : "JSON Instance",
				"description" : "The node representing the root instance of the provided JSON.",
				"type" : "object"
			},
			"schema" : {
				"title" : "JSON Schema Instance",
				"description" : "The node representing the root instance of the provided JSON Schema.",
				"type" : "object"
			}
		}
	}

For the following test:

	JSV.validate({ a : 1 }, { type : 'object', properties : { a : { type : 'string' }} });

The generated report would look like:

	{
		errors : [
			{
				message : "Instance is not a required type",
				uri : "urn:uuid:74b843b5-3aa4-44e9-b7bc-f555936fa823#.a",
				schemaUri : "urn:uuid:837fdefe-3bd4-4993-9a20-38a6a0624d5a#.properties.a",
				attribute : "type",
				details : ["string"]
			}
		],
		instance : [JSONInstance object],
		schema : [JSONInstance object]
	}

## Running unit tests

Open `qunit/index.html` in your web browser to run the unit tests.

## Requirements

JSV is written assuming the JavaScript environment uses CommonJS's Module/1.0 system (or, more specifically, a Node.js environment).
If this system is not available (such as the case in a web browser), the library will attempt to emulate it as best as possible;
However, the code in `url.js` must be in the same global environment as the validator for the module emulation to work. 

## License

JSV is licensed under the FreeBSD License. 