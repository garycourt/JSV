JSON Schema (Revision 2) Validator
==================================

JSV is a JavaScript implementation of a extendable, fully compliant revision 2 JSON Schema validator with the following features:

* Full implementation of the revision 2 JSON Schema specification; will validate any JSON Schema written to this specification.
* Supports `full` and `describedby` hyper links.
* Easily extendable to include new schema attributes, value types, and string formats.
* Validates itself, and is bootstrapped from the JSON Schema schema.
* Includes over 170 unit tests to test all parts of the specification & validator.
* Includes rewritten and validated schemas from the JSON Schema specification.

JSV is currently in beta; use at your own risk as there still may be bugs present, and APIs are subject to change.

## Example

Here's an example on how to validate some JSON with the JSON Schema Validator:

`
var JSONValidator = require("./jsv").JSONValidator;
var json = {};
var schema = {"type" : "object"};
var report = JSONValidator.validate(json, schema);

if (report.errors.length === 0) {
	//JSON is valid against the schema
}
`

## APIs

*This still needs to be written*

## Running unit tests

Open `quint/index.html` in your web browser to run the unit tests.

## Requirements

The JSON Schema Validator is written assuming the JavaScript environment uses CommonJS's Module/1.0 system (or, more specifically, a Node.js environment).
If this system is not available (such as the case in a web browser), the library will attempt to emulate it as best as possible;
However, the code in `url.js` must be in the same global environment as the validator for the module emulation to work. 

## License

The JSON Schema Validator is licensed under the FreeBSD License.