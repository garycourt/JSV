# Changelog

## 4.0 (2011/08/23)

*	Added referencing to JSONSchema, allows for soft-linking to other schemas.
*	Environment option "validateReferences" now validates references at validation time for any environment.
*	Environment option "enforceReferences" will cause invalid references to throw an error at creation time for any environment.
*	Fixed floating point errors with "divisibleBy" attribute.
*	Fixed typo in JSV.clone.
*	Fixed typo in draft-03 hyper-schema.json.
*	Updated uri.js to latest version.
*	Fixed bug with Report#addError. (Identified by cellog)
*	Added example HTML page

## 3.5 (2011/03/07)

*	Links to unregistered schemas will now throw an error. This can be disabled by setting the environment option "validateReferences" to false.
*	Environment#validate now catches errors (such as InitializationErrors) and adds them to it's returned report. 
*	Report#addError now accepts instance/schema URI strings.
*	Fixed bug where empty schemas would not be registered.
*	Added private method Environment#_checkForInvalidInstances, for testing the reliability of circular schemas.
*	Fixed bug where schemas in the "disallow" attribute would not validate. (Identified by henchan)

## 3.4 (2011/03/06)

*	Fixed bug with "id", "$ref", "$schema" attributes not resolving properly under the "http://json-schema.org/draft-03/schema#" schema. (Identified by dougtreder)
*	Added dougtreder's referencing tests.

## Older

Older releases were not documented. See git commit history for more information.