/**
 * JSV: JSON Schema (Revision 2) Validator
 * 
 * @fileOverview A JavaScript implementation of a extendable, fully compliant revision 2 JSON Schema validator.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @version 2.0
 * @see http://github.com/garycourt/JSV
 */

/*
 * Copyright 2010 Gary Court. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 * 
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 * 
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Gary Court or the JSON Schema specification.
 */

/*jslint white: true, onevar: true, undef: true, eqeqeq: true, newcap: true, immed: true */

var exports = exports || this,
	require = require || function () {
		return exports;
	};

(function () {
	
	var URL = require('url'),
		O = {},
		
		ENVIRONMENT = {},
		DEFAULT_ENVIRONMENT_ID,
		JSV,
		
		DRAFT_02_ENVIRONMENT;
	
	//
	// Utility functions
	//
	
	function typeOf(o) {
		return o === undefined ? 'undefined' : (o === null ? 'null' : Object.prototype.toString.call(o).split(' ').pop().split(']').shift().toLowerCase());
	}
	
	function F() {}
	
	function createObject(proto) {
		F.prototype = proto || {};
		return new F();
	}
	
	function cloneArray(o) {
		return Array.prototype.slice.call(o);
	}
	
	function mixin(obj, props) {
		var key;
		for (key in props) {
			if (props[key] !== O[key]) {
				obj[key] = props[key];
			}
		}
		return obj;
	}
	
	function mapObject(obj, func, scope) {
		var newObj = {}, key;
		for (key in obj) {
			if (obj[key] !== O[key]) {
				newObj[key] = func.call(scope, obj[key], key, obj);
			}
		}
		return newObj;
	}
	
	function mapArray(arr, func, scope) {
		var x = 0, xl = arr.length, newArr = new Array(xl);
		for (; x < xl; ++x) {
			newArr[x] = func.call(scope, arr[x], x, arr);
		}
		return newArr;
	}
		
	if (Array.prototype.map) {
		mapArray = function (arr, func, scope) {
			return Array.prototype.map.call(arr, func, scope);
		};
	}
	
	function toArray(o) {
		return o !== undefined && o !== null ? (o instanceof Array && !o.callee ? o : (typeof o.length !== 'number' || o.split || o.setInterval || o.call ? [ o ] : Array.prototype.slice.call(o))) : [];
	}
	
	function randomUUID() {
		var i2h = '0123456789abcdef';
		return [
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			'-',
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			'-4',  //set 4 high bits of time_high field to version
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			'-',
			i2h[(Math.floor(Math.random() * 0x10) & 0x3) | 0x8],  //specify 2 high bits of clock sequence
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			'-',
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)]
		].join('');
	}
	
	function escapeURIComponent(str) {
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
	}
	
	function error(report, instanceURI, schemaURI, attr, message, details) {
		report.errors.push({
			uri : instanceURI,
			schemaUri : schemaURI,
			attribute : attr,
			message : message,
			details : details
		});
	}
	
	//
	// JSONInstance class
	//
	
	function JSONInstance(env, json) {}
	
	//
	// JSONSchema class
	//
	
	function JSONSchema(env, json, schema) {}
	
	JSONSchema.prototype.validate = function (instance) {};
	
	//
	// Environment class
	//
	
	function Environment(id) {
		this._id = id || DEFAULT_ENVIRONMENT_ID;
		this._instances = ENVIRONMENT[this._id] ? createObject(ENVIRONMENT[this._id]._instances) : {};
		this._schemas = ENVIRONMENT[this._id] ? createObject(ENVIRONMENT[this._id]._schemas) : {};
		this._defaultSchema = "";
	}
	
	Environment.prototype.createInstance = function (data, schema) {};
	Environment.prototype.createSchema = Environment.prototype.createInstance;
	Environment.prototype.registerInstance = function (uri, instance) {};
	Environment.prototype.registerSchema = function (uri, schema) {};
	
	Environment.prototype.getInstance = function (uri) {
		return this._instances[uri];
	};
	
	Environment.prototype.getSchema = function (uri) {
		return this._schemas[uri];
	};
	
	Environment.prototype.setDefaultSchema = function (uri) {
		if (typeof uri === 'string') {
			this._defaultSchema = uri;
		}
	};
	
	//
	// JSV namespace
	//
	
	JSV = {
		createEnvironment : function (id) {
			id = id || DEFAULT_ENVIRONMENT_ID;
			if (!ENVIRONMENT[id]) {
				throw new Error("Unknown Environment ID");
			}
			
			return new Environment(id);
		},
		
		Environment : Environment,
		registerEnvironment : function (id, env) {
			id = id || (env || 0)._id;
			if (id && !ENVIRONMENT[id] && env instanceof Environment) {
				env._id = id;
				ENVIRONMENT[id] = env;
			}
		}
	};
	
	this.JSV = JSV;  //set global object
	exports.JSV = JSV;  //export to CommonJS
	
	//
	// json-schema-draft-02 Environment
	//
	
	DRAFT_02_ENVIRONMENT = new JSV.Environment("json-schema-draft-02");
	
	DRAFT_02_ENVIRONMENT.registerSchema("http://json-schema.org/schema", {
		"$schema" : "http://json-schema.org/hyper-schema#",
		"id" : "http://json-schema.org/schema#",
		"type" : "object",
		
		"properties" : {
			"type" : {
				"type" : ["string", "array"],
				"items" : {
					"type" : ["string", {"$ref" : "#"}]
				},
				"optional" : true,
				"uniqueItems" : true,
				"default" : "any",
				
				"validator" : function (ji, requiredSchema, report) {
					var requiredTypes = requiredSchema.types(),
						x, xl, key, subreport;
					
					//for instances that are required to be a certain type
					if (ji.getPrimitiveType() !== 'undefined' && requiredTypes && requiredTypes.length) {
						//ensure that type matches for at least one of the required types
						for (x = 0, xl = requiredTypes.length; x < xl; ++x) {
							key = requiredTypes[x];
							if (key instanceof JSONInstance) {
								subreport = createObject(report);
								subreport.errors = [];
								if (key.validate(ji, subreport).errors.length === 0) {
									return true;  //instance matches this schema
								}
							} else {
								if (TypeValidators[key] !== O[key] && typeof TypeValidators[key] === 'function') {
									if (TypeValidators[key](ji, report)) {
										return true;  //type is valid
									}
								} else {
									return true;  //unknown types are assumed valid
								}
							}
						}
						
						//if we get to this point, type is invalid
						error(report, ji, requiredSchema, 'type', 'Instance is not a required type', requiredTypes);
						return false;
					}
					//else, anything is allowed if no type is specified
					return true;
				},
				
				"typeValidators" : {
					"string" : function (ji, report) {
						return ji.getPrimitiveType() === "string";
					},
					
					"number" : function (ji, report) {
						return ji.getPrimitiveType() === "number";
					},
					
					"integer" : function (ji, report) {
						return ji.getPrimitiveType() === "number" && ji.getValue().toString().indexOf(".") === -1;
					},
					
					"boolean" : function (ji, report) {
						return ji.getPrimitiveType() === "boolean";
					},
					
					"object" : function (ji, report) {
						return ji.getPrimitiveType() === "object";
					},
					
					"array" : function (ji, report) {
						return ji.getPrimitiveType() === "array";
					},
					
					"null" : function (ji, report) {
						return ji.getPrimitiveType() === "null";
					},
					
					"any" : function (ji, report) {
						return true;
					}
				}
			},
			
			"properties" : {
				"type" : "object",
				"additionalProperties" : {"$ref" : "#"},
				"optional" : true,
				"default" : {}
			},
			
			"items" : {
				"type" : [{"$ref" : "#"}, "array"],
				"items" : {"$ref" : "#"},
				"optional" : true,
				"default" : {}
			},
			
			"optional" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false
			},
			
			"additionalProperties" : {
				"type" : [{"$ref" : "#"}, "boolean"],
				"optional" : true,
				"default" : {}
			},
			
			"requires" : {
				"type" : ["string", {"$ref" : "#"}],
				"optional" : true
			},
			
			"minimum" : {
				"type" : "number",
				"optional" : true
			},
			
			"maximum" : {
				"type" : "number",
				"optional" : true
			},
			
			"minimumCanEqual" : {
				"type" : "boolean",
				"optional" : true,
				"requires" : "minimum",
				"default" : true
			},
			
			"maximumCanEqual" : {
				"type" : "boolean",
				"optional" : true,
				"requires" : "maximum",
				"default" : true
			},
			
			"minItems" : {
				"type" : "integer",
				"optional" : true,
				"minimum" : 0,
				"default" : 0
			},
			
			"maxItems" : {
				"type" : "integer",
				"optional" : true
			},
			
			"uniqueItems" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false
			},
			
			"pattern" : {
				"type" : "string",
				"optional" : true,
				"format" : "regex"
			},
			
			"minLength" : {
				"type" : "integer",
				"optional" : true,
				"minimum" : 0,
				"default" : 0
			},
			
			"maxLength" : {
				"type" : "integer",
				"optional" : true
			},
			
			"enum" : {
				"type" : "array",
				"optional" : true,
				"minItems" : 1,
				"uniqueItems" : true
			},
			
			"title" : {
				"type" : "string",
				"optional" : true
			},
			
			"description" : {
				"type" : "string",
				"optional" : true
			},
			
			"format" : {
				"type" : "string",
				"optional" : true
			},
			
			"contentEncoding" : {
				"type" : "string",
				"optional" : true
			},
			
			"default" : {
				"type" : "any",
				"optional" : true
			},
			
			"divisibleBy" : {
				"type" : "number",
				"minimum" : 0,
				"minimumCanEqual" : false,
				"optional" : true,
				"default" : 1
			},
			
			"disallow" : {
				"type" : ["string", "array"],
				"items" : {"type" : "string"},
				"optional" : true,
				"uniqueItems" : true
			},
			
			"extends" : {
				"type" : [{"$ref" : "#"}, "array"],
				"items" : {"$ref" : "#"},
				"optional" : true,
				"default" : {}
			}
		},
		
		"optional" : true,
		"default" : {}
	});
	
	DRAFT_02_ENVIRONMENT.setDefaultSchema("http://json-schema.org/hyper-schema");
	JSV.registerEnvironment("json-schema-draft-02", DRAFT_02_ENVIRONMENT);
	
	DEFAULT_ENVIRONMENT_ID = "json-schema-draft-02";
	
}());