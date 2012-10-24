#!/usr/bin/env node
var fs = require("fs");
var JSV = require("jsv").JSV;

var env = JSV.createEnvironment();
var baseURI = "schema";
var userURI = "user";
var userData, schemaData;

if (process.argv.length < 4) {
    console.error("Usage: JSV.js [schema.js] [userdata.js]");
    return;
}

var schemaData = JSON.parse(fs.readFileSync(process.argv[2]));
var userData = JSON.parse(fs.readFileSync(process.argv[3]));

var instance = env.createInstance(userData, "urn:jsv:data");
var schema = env.createSchema(schemaData, null, "urn:jsv:schema");

var report = env.validate(instance, schema);

if (report.errors.length) {
    for (var x = 0, xl = report.errors.length; x < xl; x++) {
        var err = report.errors[x];
        console.log('Problem with ' + err.uri + ': ' + err.message);
        console.log('    Reported by ' + err.schemaUri);
        console.log('    Attribute "' + err.attribute + '" (' + JSON.stringify(err.details) + ')');
    }
} else {
    console.log("Input is valid!");
}
