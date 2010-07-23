JSON Schema (Revision 2) Validator
==================================

## Requirements

The JSON Schema Validator is written assuming the JavaScript environment uses CommonJS's Module/1.0 system (or, more specifically, a Node.js environment).
If this system is not available (such as the case in a web browser), the library will attempt to emulate it as best as possible;
However, the code in `url.js` must be in the same global environment as the validator for the module emulation to work. 

## Usage

Here's an example on how to validate some JSON with the JSON Schema Validator:

`
var json = {};
var schema = {"type" : "object"};
var report = JSONValidator.validate(json, schema);
if (report.errors.length === 0) {
	//JSON is valid against the schema
}
`

## Running unit tests

Open `quint/index.html` in your web browser to run the unit tests.