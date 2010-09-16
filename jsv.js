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
		
		DRAFT_02_ENVIRONMENT,
		DRAFT_02_TYPE_VALIDATORS,
		DRAFT_02_SCHEMA;
	
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
	
	function keys(o) {
		var result = [], key;
		
		switch (typeOf(o)) {
		case "object":
			for (key in o) {
				if (o[key] !== O[key]) {
					result[result.length] = key;
				}
			}
			break;
		case "array":
			for (key = o.length - 1; key >= 0; --key) {
				result[key] = key;
			}
			break;
		}
		
		return result;
	}
	
	function pushUnique(arr, o) {
		if (arr.indexOf(o) === -1) {
			arr.push(o);
		}
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
	
	function formatURI(uri) {
		if (typeof uri === "string" && uri.indexOf("#") === -1) {
			uri += "#";
		}
		return uri;
	}
	
	//
	// Report class
	//
	
	function Report() {
		this.errors = [];
		this.validated = {};
	}
	
	Report.prototype.addError = function (instance, schema, attr, message, details) {
		this.errors.push({
			uri : instance.getURI(),
			schemaUri : schema.getURI(),
			attribute : attr,
			message : message,
			details : details
		});
	};
	
	Report.prototype.registerValidation = function (uri, schemaUri) {
		if (!this.validated[uri]) {
			this.validated[uri] = [ schemaUri ];
		} else {
			this.validated[uri].push(schemaUri);
		}
	};
		
	Report.prototype.isValidatedBy = function (uri, schemaUri) {
		return !!this.validated[uri] && this.validated[uri].indexOf(schemaUri) !== -1;
	};
	
	//
	// JSONInstance class
	//
	
	function JSONInstance(env, json, uri) {
		if (json instanceof JSONInstance) {
			if (typeof uri !== "string") {
				uri = json._uri;
			}
			json = json._value;
		}
		
		if (typeof uri === "string") {
			uri = formatURI(uri);
		} else {
			uri = "urn:uuid:" + randomUUID() + "#";
		}
		
		this._env = env;
		this._value = json;
		this._uri = uri;
	}
	
	JSONInstance.prototype.getEnvironment = function () {
		return this._env;
	};
	
	JSONInstance.prototype.getType = function () {
		return typeOf(this._value);
	};
	
	JSONInstance.prototype.getValue = function () {
		return this._value;
	};
	
	JSONInstance.prototype.getURI = function () {
		return this._uri;
	};
	
	JSONInstance.prototype.resolveURI = function (uri) {
		return uri = formatURI(URL.resolve(this._uri, uri));
	};
	
	JSONInstance.prototype.getPropertyNames = function () {
		return keys(this._value);
	};
	
	JSONInstance.prototype.getProperty = function (key) {
		return new JSONInstance(this._env, (this._value ? this._value[key] : undefined), this._uri + "." + key);
	};
	
	JSONInstance.prototype.getProperties = function () {
		var type = typeOf(this._value),
			self = this;
		
		if (type === 'object') {
			return mapObject(this._value, function (value, key) {
				return new JSONInstance(self._env, value, self._uri + "." + key);
			});
		} else if (type === 'array') {
			return mapArray(this._value, function (value, key) {
				return new JSONInstance(self._env, value, self._uri + "." + key);
			});
		}
	};
	
	JSONInstance.prototype.getValueOfProperty = function (key) {
		return this.getProperty(key).getValue();
	};
	
	JSONInstance.prototype.equals = function (instance) {
		if (instance instanceof JSONInstance) {
			return this._value === instance._value;
		}
		//else
		return this._value === instance;
	};
	
	//
	// JSONSchema class
	//
	
	function JSONSchema(env, json, uri, schema) {
		JSONInstance.call(this, env, json, uri);
		
		if (json instanceof JSONSchema) {
			this._schema = json._schema;  //TODO: Make sure cross environments don't mess everything up
		} else {
			this._schema = schema instanceof JSONSchema ? schema : this._env.getDefaultSchema() || JSONSchema.createEmptySchema();
		}
	}
	
	JSONSchema.prototype = createObject(JSONInstance.prototype);
	
	JSONSchema.createEmptySchema = function (env) {
		var schema = createObject(JSONSchema.prototype);
		JSONInstance.call(schema, env, {}, undefined);
		schema._schema = schema;
		return schema;
	};
	
	JSONSchema.prototype.getSchema = function () {
		//TODO: Check for "describedby" links
		return this._schema;
	};
	
	JSONSchema.prototype.getAttribute = function (key) {
		var schemaProperty = this.getSchema().getProperty("properties").getProperty(key),
			parser = schemaProperty.getValueOfProperty("parser"),
			property = this.getProperty(key);
		if (typeof parser === "function") {
			return parser(property, schemaProperty);
		}
		//else
		return property;
	};
	
	JSONSchema.prototype.validate = function (instance, report, parent, parentSchema) {
		var schemaSchema = this.getSchema(),
			validator = schemaSchema.getValueOfProperty("validator");
		
		if (!(instance instanceof JSONInstance)) {
			instance = this.getEnvironment().createInstance(instance);
		}
		
		if (!(report instanceof Report)) {
			report = new Report();
		}
		
		if (typeof validator === "function" && !report.isValidatedBy(instance.getURI(), this.getURI())) {
			report.registerValidation(instance.getURI(), this.getURI());
			validator(instance, this, schemaSchema, report, parent, parentSchema);
		}
		
		return report;
	};
	
	//
	// Environment class
	//
	
	function Environment() {
		var self = this;
		this._id = randomUUID();
		this._instances = {};
		this._schemas = {};
		this._defaultSchemaURI = "";
	}
	
	Environment.prototype.clone = function () {
		var env = new Environment();
		/*
		env._instances = mapObject(this._instances, function (value) {
			return new JSONInstance(env, value, value._uri);
		});
		env._schemas = mapObject(this._schemas, function (value) {
			return new JSONSchema(env, value, value._uri, value._schema);
		});
		*/
		env._instances = createObject(this._instances);
		env._schemas = createObject(this._schemas);
		env._defaultSchemaURI = this._defaultSchemaURI;
		
		return env;
	};
	
	Environment.prototype.createInstance = function (data, uri) {
		var instance;
		uri = formatURI(uri);
		
		if (data instanceof JSONInstance && (!uri || data.getURI() === uri)) {  //TODO: Worry about environment here?
			return data;
		}
		//else
		instance = new JSONInstance(this, data, uri);
		
		if (typeof uri === "string" && uri.length) {
			this._instances[uri] = instance;
		}
		
		return instance;
	};
	
	Environment.prototype.createSchema = function (data, schema, uri) {
		var instance;
		uri = formatURI(uri);
		
		if (data instanceof JSONSchema && (!uri || data.getURI() === uri) && (!schema || data.getSchema().equals(schema))) {
			return data;
		}
		//else
		instance = new JSONSchema(this, data, uri, schema);
		
		if (typeof uri === "string" && uri.length) {
			this._schemas[uri] = instance;
		}
		
		return instance;
	};
	
	Environment.prototype.createEmptySchema = function () {
		return JSONSchema.createEmptySchema(this);
	};
	
	Environment.prototype.getInstance = function (uri) {
		return this._instances[formatURI(uri)];
	};
	
	Environment.prototype.getSchema = function (uri) {
		return this._schemas[formatURI(uri)];
	};
	
	Environment.prototype.setDefaultSchemaURI = function (uri) {
		if (typeof uri === 'string') {
			this._defaultSchemaURI = formatURI(uri);
		}
	};
	
	Environment.prototype.getDefaultSchema = function () {
		return this.getSchema(this._defaultSchemaURI);
	};
	
	Environment.prototype.validate = function (instanceJSON, schemaJSON) {
		var instance = this.createInstance(instanceJSON),
			schema = this.createSchema(schemaJSON),
			schemaSchema = schema.getSchema(),
			report;
		
		if (schemaJSON && !(schemaJSON instanceof JSONSchema)) {
			report = schemaSchema.validate(schema);
			
			if (report.errors.length) {
				return report;
			}
		}
		
		return schema.validate(instance, report);
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
			//else
			return ENVIRONMENT[id].clone();
		},
		
		Environment : Environment,
		registerEnvironment : function (id, env) {
			id = id || (env || 0)._id;
			if (id && !ENVIRONMENT[id] && env instanceof Environment) {
				env._id = id;
				ENVIRONMENT[id] = env;
			}
		},
		
		ENVIRONMENT : ENVIRONMENT  //TODO: Remove, debugging purposes
	};
	
	this.JSV = JSV;  //set global object
	exports.JSV = JSV;  //export to CommonJS
	
	//
	// json-schema-draft-02 Environment
	//
	
	DRAFT_02_ENVIRONMENT = new JSV.Environment();
	
	DRAFT_02_TYPE_VALIDATORS = {
		"string" : function (instance, report) {
			return instance.getType() === "string";
		},
		
		"number" : function (instance, report) {
			return instance.getType() === "number";
		},
		
		"integer" : function (instance, report) {
			return instance.getType() === "number" && instance.getValue().toString().indexOf(".") === -1;
		},
		
		"boolean" : function (instance, report) {
			return instance.getType() === "boolean";
		},
		
		"object" : function (instance, report) {
			return instance.getType() === "object";
		},
		
		"array" : function (instance, report) {
			return instance.getType() === "array";
		},
		
		"null" : function (instance, report) {
			return instance.getType() === "null";
		},
		
		"any" : function (instance, report) {
			return true;
		}
	};
	
	DRAFT_02_SCHEMA = DRAFT_02_ENVIRONMENT.createSchema({
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
				
				"parser" : function (instance, self) {
					var parser = arguments.callee;
					
					if (instance.getType() === "string") {
						return instance.getValue();
					} else if (instance.getType() === "object") {
						return instance.getEnvironment().createSchema(
							instance, 
							self.getEnvironment().getSchema(self.resolveURI("#"))
						);
					} else if (instance.getType() === "array") {
						return mapArray(instance.getProperties(), function (prop) {
							return parser(prop, self);
						});
					}
					//else
					return "any";
				},
			
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var requiredTypes = toArray(schema.getAttribute("type")),
						x, xl, type, subreport, typeValidators;
					
					//for instances that are required to be a certain type
					if (instance.getType() !== 'undefined' && requiredTypes && requiredTypes.length) {
						typeValidators = self.getValueOfProperty("typeValidators") || {};
						
						//ensure that type matches for at least one of the required types
						for (x = 0, xl = requiredTypes.length; x < xl; ++x) {
							type = requiredTypes[x];
							if (type instanceof JSONSchema) {
								subreport = createObject(report);
								subreport.errors = [];
								if (type.validate(instance, subreport, parent, parentSchema).errors.length === 0) {
									return true;  //instance matches this schema
								}
							} else {
								if (typeValidators[type] !== O[type] && typeof typeValidators[type] === 'function') {
									if (typeValidators[type](instance, report)) {
										return true;  //type is valid
									}
								} else {
									return true;  //unknown types are assumed valid
								}
							}
						}
						
						//if we get to this point, type is invalid
						report.addError(instance, schema, 'type', 'Instance is not a required type', requiredTypes);
						return false;
					}
					//else, anything is allowed if no type is specified
					return true;
				},
				
				"typeValidators" : DRAFT_02_TYPE_VALIDATORS
			},
			
			"properties" : {
				"type" : "object",
				"additionalProperties" : {"$ref" : "#"},
				"optional" : true,
				"default" : {},
				
				"parser" : function (instance, self) {
					var env = instance.getEnvironment(),
						selfEnv = self.getEnvironment(),
						uri = instance.getURI();
					if (instance.getType() === "object") {
						return mapObject(instance.getProperties(), function (instance) {
							return env.createSchema(instance, selfEnv.getSchema(self.resolveURI("#")));
						});
					}
					//else
					return {};
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var propertySchemas, key;
					//this attribute is for object type instances only
					if (instance.getType() === "object") {
						//for each property defined in the schema
						propertySchemas = schema.getAttribute("properties");
						for (key in propertySchemas) {
							if (propertySchemas[key] !== O[key] && propertySchemas[key]) {
								//ensure that instance property is valid
								propertySchemas[key].validate(instance.getProperty(key), report, instance, schema)
							}
						}
					}
				}
			},
			
			"items" : {
				"type" : [{"$ref" : "#"}, "array"],
				"items" : {"$ref" : "#"},
				"optional" : true,
				"default" : {},
				
				"parser" : function (instance, self) {
					if (instance.getType() === "object") {
						return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
					} else if (instance.getType() === "array") {
						return mapArray(instance.getProperties(), function (instance) {
							return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
						});
					}
					//else
					return instance.getEnvironment().createEmptySchema();
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var properties, items, x, xl, itemSchema, additionalProperties;
					
					if (instance.getType() === 'array') {
						properties = instance.getProperties();
						items = schema.getAttribute("items");
						additionalProperties = schema.getAttribute("additionalProperties");
						
						if (typeOf(items) === 'array') {
							for (x = 0, xl = properties.length; x < xl; ++x) {
								itemSchema = items[x] || additionalProperties;
								if (itemSchema !== false) {
									itemSchema.validate(properties[x], report, instance, schema);
								} else {
									report.addError(instance, schema, 'additionalProperties', 'Additional items are not allowed', itemSchema);
								}
							}
						} else {
							itemSchema = items || additionalProperties;
							for (x = 0, xl = properties.length; x < xl; ++x) {
								itemSchema.validate(properties[x], report, instance, schema);
							}
						}
					}
				}
			},
			
			"optional" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false,
				
				"parser" : function (instance, self) {
					return !!instance.getValue();
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					if (instance.getType() === 'undefined' && !schema.getAttribute("optional")) {
						report.addError(instance, schema, 'optional', "Property is required", false);
					}
				},
				
				"validationRequired" : true
			},
			
			"additionalProperties" : {
				"type" : [{"$ref" : "#"}, "boolean"],
				"optional" : true,
				"default" : {},
				
				"parser" : function (instance, self) {
					if (instance.getType() === "object") {
						return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
					} else if (instance.getType() === "boolean" && instance.getValue() === false) {
						return false;
					}
					//else
					return instance.getEnvironment().createEmptySchema();
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var additionalProperties, propertySchemas, properties, key;
					//we only need to check against object types as arrays do their own checking on this property
					if (instance.getType() === 'object') {
						additionalProperties = schema.getAttribute("additionalProperties");
						propertySchemas = schema.getAttribute("properties");
						properties = instance.getProperties();
						for (key in properties) {
							if (properties[key] !== O[key] && properties[key] && !propertySchemas[key]) {
								if (additionalProperties instanceof JSONSchema) {
									additionalProperties.validate(properties[key], report, instance, schema);
								} else if (additionalProperties === false) {
									report.addError(instance, schema, 'additionalProperties', 'Additional properties are not allowed', additionalProperties);
								}
							}
						}
					}
				}
			},
			
			"requires" : {
				"type" : ["string", {"$ref" : "#"}],
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						return instance.getValue();
					} else if (instance.getType() === "object") {
						return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var requires;
					if (instance.getType() !== 'undefined' && parent && parent.getType() !== 'undefined') {
						requires = schema.getAttribute("requires");
						if (typeof requires === 'string') {
							if (parent.getProperty(requires).getType() === "undefined") {
								report.addError(instance, schema, 'requires', 'Property requires sibling property "' + requires + '"', requires);
							}
						} else if (requires instanceof JSONSchema) {
							requires.validate(parent, report);  //WATCH: A "requires" schema does not support the "requires" attribute
						}
					}
				}
			},
			
			"minimum" : {
				"type" : "number",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var minimum, minimumCanEqual;
					if (instance.getType() === 'number') {
						minimum = schema.getAttribute("minimum");
						minimumCanEqual = schema.getAttribute("minimumCanEqual");
						if (instance.getValue() < minimum || (!minimumCanEqual && instance.getValue() === minimum)) {
							report.addError(instance, schema, 'minimum', 'Number is less then the required minimum value', minimum);
						}
					}
				}
			},
			
			"maximum" : {
				"type" : "number",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var maximum, maximumCanEqual;
					if (instance.getType() === 'number') {
						maximum = schema.getAttribute("maximum");
						maximumCanEqual = schema.getAttribute("maximumCanEqual");
						if (instance.getValue() > maximum || (!maximumCanEqual && instance.getValue() === maximum)) {
							report.addError(instance, schema, 'maximum', 'Number is greater then the required maximum value', maximum);
						}
					}
				}
			},
			
			"minimumCanEqual" : {
				"type" : "boolean",
				"optional" : true,
				"requires" : "minimum",
				"default" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "boolean") {
						return instance.getValue();
					}
					//else
					return true;
				}
			},
			
			"maximumCanEqual" : {
				"type" : "boolean",
				"optional" : true,
				"requires" : "maximum",
				"default" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "boolean") {
						return instance.getValue();
					}
					//else
					return true;
				}
			},
			
			"minItems" : {
				"type" : "integer",
				"optional" : true,
				"minimum" : 0,
				"default" : 0,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
					//else
					return 0;
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var minItems;
					if (instance.getType() === 'array') {
						minItems = schema.getAttribute("minItems");
						if (instance.getProperties().length < minItems) {
							report.addError(instance, schema, 'minItems', 'The number of items is less then the required minimum', minItems);
						}
					}
				}
			},
			
			"maxItems" : {
				"type" : "integer",
				"optional" : true,
				"minimum" : 0,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var maxItems;
					if (instance.getType() === 'array') {
						maxItems = schema.getAttribute("maxItems");
						if (instance.getProperties().length > maxItems) {
							report.addError(instance, schema, 'maxItems', 'The number of items is greater then the required maximum', maxItems);
						}
					}
				}
			},
			
			"uniqueItems" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false,
				
				"parser" : function (instance, self) {
					return !!instance.getValue();
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var value, x, xl, y, yl;
					if (instance.getType() === 'array' && schema.getAttribute("uniqueItems")) {
						value = instance.getProperties();
						for (x = 0, xl = value.length - 1; x < xl; ++x) {
							for (y = x + 1, yl = value.length; y < yl; ++y) {
								if (value[x].equals(value[y])) {
									report.addError(instance, schema, 'uniqueItems', 'Array can only contain unique items', { x : x, y : y });
								}
							}
						}
					}
				}
			},
			
			"pattern" : {
				"type" : "string",
				"optional" : true,
				"format" : "regex",
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						try {
							return new RegExp(instance.getValue());
						} catch (e) {
							return e;
						}
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var pattern;
					try {
						pattern = schema.getAttribute("pattern");
						if (pattern instanceof Error) {
							report.addError(instance, schema, 'pattern', 'Invalid pattern', pattern);
						} else if (instance.getType() === 'string' && pattern && !pattern.test(instance.getValue())) {
							report.addError(instance, schema, 'pattern', 'String does not match pattern', pattern.toString());
						}
					} catch (e) {
						report.addError(instance, schema, 'pattern', 'Invalid pattern', e);
					}
				}
			},
			
			"minLength" : {
				"type" : "integer",
				"optional" : true,
				"minimum" : 0,
				"default" : 0,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
					//else
					return 0;
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var minLength;
					if (instance.getType() === 'string') {
						minLength = schema.getAttribute("minLength");
						if (instance.getValue().length < minLength) {
							report.addError(instance, schema, 'minLength', 'String is less then the required minimum length', minLength);
						}
					}
				}
			},
			
			"maxLength" : {
				"type" : "integer",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var maxLength;
					if (instance.getType() === 'string') {
						maxLength = schema.getAttribute("maxLength");
						if (instance.getValue().length > maxLength) {
							report.addError(instance, schema, 'maxLength', 'String is greater then the required maximum length', maxLength);
						}
					}
				}
			},
			
			"enum" : {
				"type" : "array",
				"optional" : true,
				"minItems" : 1,
				"uniqueItems" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "array") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var enums = schema.getAttribute("enums"), x, xl;
					if (enums) {
						for (x = 0, xl = enums.length; x < xl; ++x) {
							if (instance.equals(enums[x])) {
								return true;
							}
						}
						report.addError(instance, schema, 'enum', 'Instance is not one of the possible values', enums);
					}
				}
			},
			
			"title" : {
				"type" : "string",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						return instance.getValue();
					}
				}
			},
			
			"description" : {
				"type" : "string",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						return instance.getValue();
					}
				}
			},
			
			"format" : {
				"type" : "string",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var format, formatValidators;
					if (instance.getType() === 'string') {
						format = schema.getAttribute("format");
						formatValidators = self.getValueOfProperty("formatValidators");
						if (formatValidators[format] !== O[format] && typeof formatValidators[format] === 'function' && !formatValidators[format].call(this, instance, report)) {
							report.addError(instance, schema, 'format', 'String is not in the required format', format);
						}
					}
				},
				
				"formatValidators" : {}
			},
			
			"contentEncoding" : {
				"type" : "string",
				"optional" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string") {
						return instance.getValue();
					}
				}
			},
			
			"default" : {
				"type" : "any",
				"optional" : true,
				
				"parser" : function (instance, self) {
					return instance.getValue();
				}
			},
			
			"divisibleBy" : {
				"type" : "number",
				"minimum" : 0,
				"minimumCanEqual" : false,
				"optional" : true,
				"default" : 1,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "number") {
						return instance.getValue();
					}
					//else
					return 1;
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var divisor;
					if (instance.getType() === 'number') {
						divisor = schema.getAttribute("divisibleBy");
						if (divisor === 0) {
							report.addError(instance, schema, 'divisibleBy', 'Nothing is divisible by 0', divisor);
						} else if (divisor !== 1 && ((instance.getValue() / divisor) % 1) !== 0) {
							report.addError(instance, schema, 'divisibleBy', 'Number is not divisible by ' + divisor, divisor);
						}
					}
				}
			},
			
			"disallow" : {
				"type" : ["string", "array"],
				"items" : {"type" : "string"},
				"optional" : true,
				"uniqueItems" : true,
				
				"parser" : function (instance, self) {
					if (instance.getType() === "string" || instance.getType() === "array") {
						return instance.getValue();
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var disallowedTypes = toArray(schema.getAttribute("disallow")),
						x, xl, key, typeValidators;
					
					//for instances that are required to be a certain type
					if (instance.getType() !== 'undefined' && disallowedTypes && disallowedTypes.length) {
						typeValidators = self.getValueOfProperty("typeValidators") || {};
						
						//ensure that type matches for at least one of the required types
						for (x = 0, xl = disallowedTypes.length; x < xl; ++x) {
							key = disallowedTypes[x];
							if (typeValidators[key] !== O[key] && typeof typeValidators[key] === 'function') {
								if (typeValidators[key](instance, report)) {
									report.addError(instance, schema, 'disallow', 'Instance is a disallowed type', disallowedTypes);
									return false;
								}
							} 
							/*
							else {
								report.addError(instance, schema, 'disallow', 'Instance may be a disallowed type', disallowedTypes);
								return false;
							}
							*/
						}
						
						//if we get to this point, type is valid
						return true;
					}
					//else, everything is allowed if no disallowed types are specified
					return true;
				},
				
				"typeValidators" : DRAFT_02_TYPE_VALIDATORS
			},
		
			"extends" : {
				"type" : [{"$ref" : "#"}, "array"],
				"items" : {"$ref" : "#"},
				"optional" : true,
				"default" : {},
				
				"parser" : function (instance, self) {
					if (instance.getType() === "object") {
						return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
					} else if (instance.getType() === "array") {
						return mapArray(instance.getProperties(), function (instance) {
							return instance.getEnvironment().createSchema(instance, self.getEnvironment().getSchema(self.resolveURI("#")));
						});
					}
				},
				
				"validator" : function (instance, schema, self, report, parent, parentSchema) {
					var extensions = schema.getAttribute('extends'), x, xl;
					if (extensions.getType() === 'object') {
						extensions.validate(instance, report, parent, parentSchema);
					} else if (extensions.getType() === 'array') {
						extensions = extensions.getProperties();
						for (x = 0, xl = extensions.length; x < xl; ++x) {
							extensions[x].validate(instance, report, parent, parentSchema);
						}
					}
				}
			}
		},
		
		"optional" : true,
		"default" : {},
		
		"validator" : function (instance, schema, self, report, parent, parentSchema) {
			var propNames = schema.getPropertyNames(), 
				x, xl,
				attributeSchemas = self.getAttribute("properties"),
				validator;
			
			for (x in attributeSchemas) {
				if (attributeSchemas[x] !== O[x] && attributeSchemas[x].getValueOfProperty("validationRequired")) {
					pushUnique(propNames, x);
				}
			}
			
			for (x = 0, xl = propNames.length; x < xl; ++x) {
				if (attributeSchemas[propNames[x]] !== O[propNames[x]]) {
					validator = attributeSchemas[propNames[x]].getValueOfProperty("validator");
					if (typeof validator === "function") {
						validator(instance, schema, attributeSchemas[propNames[x]], report, parent, parentSchema);
					}
				}
			}
		}
	}, null, "http://json-schema.org/schema#");
	DRAFT_02_SCHEMA._schema = DRAFT_02_SCHEMA;  //TODO: Remove me after "describedby" support
	
	DRAFT_02_ENVIRONMENT.setDefaultSchemaURI("http://json-schema.org/schema#");  //TODO: Change back to "http://json-schema.org/hyper-schema#"
	JSV.registerEnvironment("json-schema-draft-02", DRAFT_02_ENVIRONMENT);
	
	DEFAULT_ENVIRONMENT_ID = "json-schema-draft-02";
	
}());