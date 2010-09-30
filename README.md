JSV: JSON Schema Validator
==========================

JSV is a JavaScript implementation of a extendable, fully compliant JSON Schema validator with the following features:

* The fastest extendable JSON validator available!
* Complete implementation of all current JSON Schema specifications.
* Supports creating individual environments (sandboxes) that validate using a particular schema specification.
* Provides an intuitive API for creating new validating schema attributes, or whole new custom schema schemas.
* Supports `self`, `full` and `describedby` hyper links.
* Validates itself, and is bootstrapped from the JSON Schema schemas.
* Includes over 170 unit tests for testing all parts of the specifications.
* Works in all ECMAScript 3 environments, including all web browsers and Node.js.
* Licensed under the FreeBSD License, a very open license.

## It's a what?

**JSON** (an acronym for **JavaScript Object Notation**) is a lightweight data-interchange format. It is easy for humans to read and write. It is easy for machines to parse and generate. It is based on a subset of the JavaScript Programming Language, Standard ECMA-262 3rd Edition - December 1999. JSON is a text format that is completely language independent but uses conventions that are familiar to programmers of the C-family of languages, including C, C++, C#, Java, JavaScript, Perl, Python, and many others. These properties make JSON an ideal data-interchange language. \[[json.org](http://json.org)\]

**JSON Schema** is a JSON media type for defining the structure of JSON data.  JSON Schema provides a contract for what JSON data is required for a given application and how to interact with it.  JSON Schema is intended to define validation, documentation, hyperlink navigation, and interaction control of JSON data. \[[draft-zyp-json-schema-02](http://tools.ietf.org/html/draft-zyp-json-schema-02)\]

A **JSON validator** is a program that takes JSON data and, with a provided schema, will ensure that the provided JSON is structured in the way defined by the schema. This ensures that if validation has passed, the JSON instance is guaranteed to be in the expected format. It will also provide an explanation on why a particular instance failed validation.

## Example

Here's an example on how to validate some JSON with JSV:

	var JSV = require("./jsv").JSV;
	var json = {};
	var schema = {"type" : "object"};
	var env = JSV.createEnvironment();
	var report = env.validate(json, schema);
	
	if (report.errors.length === 0) {
		//JSON is valid against the schema
	}

## Environments & JSON Schema support

There is no one way to validate JSON, just like there is no one way to validate XML. Even the JSON Schema specification has gone through several revisions which are not 100% backwards compatible with each other. To solve the issue of using numerous schemas already written in older revisions, JSV provides customizable environments to validate your JSON within. 

When creating an environment, you can optionally specify how you want that environment to behave. For example, this allows you to specify which version of the JSON Schema you would like the environment to behave like. JSV already provides the following environments:

*	`json-schema-draft-02`
*	`json-schema-draft-01`

//BELOW IS OUT OF DATE//

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