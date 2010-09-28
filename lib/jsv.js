/**
 * JSV: JSON Schema (Revision 2) Validator
 * 
 * @fileOverview A JavaScript implementation of a extendable, fully compliant revision 2 JSON Schema validator.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @version 3.0beta
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

/*jslint white: true, sub: true, onevar: true, undef: true, eqeqeq: true, newcap: true, immed: true, indent: 4 */

var exports = exports || this,
	require = require || function () {
		return exports;
	};

(function () {
	
	var URL = require("url"),
		O = {},
		mapArray, filterArray,
		
		JSV;
	
	//
	// Utility functions
	//
	
	function typeOf(o) {
		return o === undefined ? "undefined" : (o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase());
	}
	
	function F() {}
	
	function createObject(proto) {
		F.prototype = proto || {};
		return new F();
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
	
	mapArray = function (arr, func, scope) {
		var x = 0, xl = arr.length, newArr = new Array(xl);
		for (; x < xl; ++x) {
			newArr[x] = func.call(scope, arr[x], x, arr);
		}
		return newArr;
	};
		
	if (Array.prototype.map) {
		mapArray = function (arr, func, scope) {
			return Array.prototype.map.call(arr, func, scope);
		};
	}
	
	filterArray = function (arr, func, scope) {
		var x = 0, xl = arr.length, newArr = [];
		for (; x < xl; ++x) {
			if (func.call(scope, arr[x], x, arr)) {
				newArr[newArr.length] = arr[x];
			}
		}
		return newArr;
	};
	
	if (Array.prototype.filter) {
		filterArray = function (arr, func, scope) {
			return Array.prototype.filter.call(arr, func, scope);
		};
	}
	
	function toArray(o) {
		return o !== undefined && o !== null ? (o instanceof Array && !o.callee ? o : (typeof o.length !== "number" || o.split || o.setInterval || o.call ? [ o ] : Array.prototype.slice.call(o))) : [];
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
	
	//Warning: Not a generic clone function
	//Produces a JSV acceptable clone
	function clone(obj, deep) {
		var newObj, x;
		
		switch (typeOf(obj)) {
		case "object":
			if (deep) {
				newObj = {};
				for (x in obj) {
					if (obj[x] !== O[x]) {
						newObj[x] = clone(obj[x], deep);
					}
				}
				return newObj;
			} else {
				return createObject(obj);
			}
			break;
		case "array":
			if (deep) {
				newObj = new Array(obj.length);
				x = obj.length;
				while (--x >= 0) {
					newObj[x] = clone(obj[x], deep);
				}
				return newObj;
			} else {
				return Array.pototype.slice.call(obj);
			}
			break;
		default:
			return obj;
		}
	}
	
	function randomUUID() {
		var i2h = "0123456789abcdef";
		return [
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			"-",
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			"-4",  //set 4 high bits of time_high field to version
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			"-",
			i2h[(Math.floor(Math.random() * 0x10) & 0x3) | 0x8],  //specify 2 high bits of clock sequence
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			i2h[Math.floor(Math.random() * 0x10)],
			"-",
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
		].join("");
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
	
	//merge two objects together that is (roughly) extends compliant
	function mergeSchemas(base, extra, isSchema) {
		var key;
		for (key in extra) {
			if (extra[key] !== O[key]) {
				if (isSchema && key === "extends") {
					base[key] = toArray(base[key]).concat(toArray(extra[key]));
				} else if (typeOf(base[key]) === "object" && typeOf(extra[key]) === "object") {
					mergeSchemas(base[key], extra[key], !isSchema || key !== "properties");  //FIXME: An attribute other then "properties" may be a plain object
				} else {
					base[key] = extra[key];
				}
			}
		}
		return base;
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
	
	function JSONInstance(env, json, uri, fd) {
		if (json instanceof JSONInstance) {
			if (typeof fd !== "string") {
				fd = json._fd;
			}
			if (typeof uri !== "string") {
				uri = json._uri;
			}
			json = json._value;
		}
		
		if (typeof uri !== "string") {
			uri = "urn:uuid:" + randomUUID() + "#";
		}
		
		this._env = env;
		this._value = json;
		this._uri = uri;
		this._fd = fd || this._env._defaultFragmentDelimiter;
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
		return formatURI(URL.resolve(this._uri, uri));
	};
	
	JSONInstance.prototype.getPropertyNames = function () {
		return keys(this._value);
	};
	
	JSONInstance.prototype.getProperty = function (key) {
		var value = this._value ? this._value[key] : undefined;
		if (value instanceof JSONInstance) {
			return value;
		}
		//else
		return new JSONInstance(this._env, value, this._uri + this._fd + escapeURIComponent(key), this._fd);
	};
	
	JSONInstance.prototype.getProperties = function () {
		var type = typeOf(this._value),
			self = this;
		
		if (type === "object") {
			return mapObject(this._value, function (value, key) {
				if (value instanceof JSONInstance) {
					return value;
				}
				return new JSONInstance(self._env, value, self._uri + self._fd + escapeURIComponent(key), self._fd);
			});
		} else if (type === "array") {
			return mapArray(this._value, function (value, key) {
				if (value instanceof JSONInstance) {
					return value;
				}
				return new JSONInstance(self._env, value, self._uri + self._fd + escapeURIComponent(key), self._fd);
			});
		}
	};
	
	JSONInstance.prototype.getValueOfProperty = function (key) {
		if (this._value) {
			if (this._value[key] instanceof JSONInstance) {
				return this._value[key]._value;
			}
			return this._value[key];
		}
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
		var fr;
		JSONInstance.call(this, env, json, uri);
		
		if (schema === true) {
			this._schema = this;
		} else if (json instanceof JSONSchema && !(schema instanceof JSONSchema)) {
			this._schema = json._schema;  //TODO: Make sure cross environments don't mess everything up
		} else {
			this._schema = schema instanceof JSONSchema ? schema : this._env.getDefaultSchema() || JSONSchema.createEmptySchema(this._env);
		}
		
		//determine fragment delimiter from schema
		fr = this._schema.getValueOfProperty("fragmentResolution");
		if (fr === "dot-delimited") {
			this._fd = ".";
		} else if (fr === "slash-delimited") {
			this._fd = "/";
		}
	}
	
	JSONSchema.prototype = createObject(JSONInstance.prototype);
	
	JSONSchema.createEmptySchema = function (env) {
		var schema = createObject(JSONSchema.prototype);
		JSONInstance.call(schema, env, {}, undefined, undefined);
		schema._schema = schema;
		return schema;
	};
	
	JSONSchema.prototype.getSchema = function () {
		return this._schema;
	};
	
	JSONSchema.prototype.getAttribute = function (key, arg) {
		if (this._attributes && !arg) {
			return this._attributes[key];
		}
		
		var schemaProperty = this._schema.getProperty("properties").getProperty(key),
			parser = schemaProperty.getValueOfProperty("parser"),
			property = this.getProperty(key);
		if (typeof parser === "function") {
			return parser(property, schemaProperty, arg);
		}
		//else
		return property.getValue();
	};
	
	JSONSchema.prototype.getLink = function (href, instance) {
		var schemaLinks = this.getAttribute("links", [href, instance]);
		if (schemaLinks && schemaLinks.length && schemaLinks[schemaLinks.length - 1]) {
			return schemaLinks[schemaLinks.length - 1];
		}
	};
	
	JSONSchema.prototype.validate = function (instance, report, parent, parentSchema) {
		var validator = this._schema.getValueOfProperty("validator");
		
		if (!(instance instanceof JSONInstance)) {
			instance = this.getEnvironment().createInstance(instance);
		}
		
		if (!(report instanceof Report)) {
			report = new Report();
		}
		
		if (typeof validator === "function" && !report.isValidatedBy(instance.getURI(), this.getURI())) {
			report.registerValidation(instance.getURI(), this.getURI());
			validator(instance, this, this._schema, report, parent, parentSchema);
		}
		
		return report;
	};
	
	//
	// Environment class
	//
	
	function Environment() {
		this._id = randomUUID();
		this._schemas = {};
		this._defaultSchemaURI = "";
		this._defaultFragmentDelimiter = "/";
	}
	
	Environment.prototype.clone = function () {
		var env = new Environment();
		env._schemas = createObject(this._schemas);
		env._defaultSchemaURI = this._defaultSchemaURI;
		env._defaultFragmentDelimiter = this._defaultFragmentDelimiter;
		
		return env;
	};
	
	Environment.prototype.createInstance = function (data, uri) {
		var instance;
		uri = formatURI(uri);
		
		if (data instanceof JSONInstance && (!uri || data.getURI() === uri)) {
			return data;
		}
		//else
		instance = new JSONInstance(this, data, uri);
		
		return instance;
	};
	
	Environment.prototype.createSchema = function (data, schema, uri) {
		var instance, 
			initializer,
			instanceProperties,
			schemaProperties,
			schemaProperty,
			parser;
		uri = formatURI(uri);
		
		if (data instanceof JSONSchema && (!uri || data._uri === uri) && (!schema || data._schema.equals(schema))) {
			return data;
		}
		
		instance = new JSONSchema(this, data, uri, schema);
		
		initializer = instance.getSchema().getValueOfProperty("initializer");
		if (typeof initializer === "function") {
			instance = initializer(instance);
		}
		
		//register schema
		this._schemas[instance._uri] = instance;
		
		//build & cache the rest of the schema
		if (!instance._attributes && instance.getType() === "object") {
			instanceProperties = instance.getProperties();
			schemaProperties = instance._schema.getProperty("properties");
			instance._attributes = {};
			for (key in instanceProperties) {
				if (instanceProperties[key] !== O[key]) {
					schemaProperty = schemaProperties && schemaProperties.getProperty(key);
					parser = schemaProperty && schemaProperty.getValueOfProperty("parser");
					if (typeof parser === "function") {
						instance._attributes[key] = parser(instanceProperties[key], schemaProperty);
					} else {
						instance._attributes[key] = instanceProperties[key].getValue();
					}
				}
			}
		}
		
		return instance;
	};
	
	Environment.prototype.createEmptySchema = function () {
		return JSONSchema.createEmptySchema(this);
	};
	
	Environment.prototype.findSchema = function (uri) {
		return this._schemas[formatURI(uri)];
	};
	
	Environment.prototype.setDefaultFragmentDelimiter = function (fd) {
		if (typeof fd === "string" && fd.length > 0) {
			this._defaultFragmentDelimiter = fd;
		}
	};
	
	Environment.prototype.getDefaultFragmentDelimiter = function () {
		return this._defaultFragmentDelimiter;
	};
	
	Environment.prototype.setDefaultSchemaURI = function (uri) {
		if (typeof uri === "string") {
			this._defaultSchemaURI = formatURI(uri);
		}
	};
	
	Environment.prototype.getDefaultSchema = function () {
		return this.findSchema(this._defaultSchemaURI);
	};
	
	Environment.prototype.validate = function (instanceJSON, schemaJSON) {
		var instance = this.createInstance(instanceJSON),
			schema = this.createSchema(schemaJSON),
			schemaSchema = schema.getSchema(),
			report = new Report();
		
		report.instance = instance;
		report.schema = schema;
		report.schemaSchema = schemaSchema;
		
		if (schemaJSON && !(schemaJSON instanceof JSONSchema)) {
			schemaSchema.validate(schema, report);
			
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
		_environments : {},
		_defaultEnvironmentID : "",
		
		isJSONInstance : function (o) {
			return o instanceof JSONInstance;
		},
		
		isJSONSchema : function (o) {
			return o instanceof JSONSchema;
		},
		
		createEnvironment : function (id) {
			id = id || this._defaultEnvironmentID;
			
			if (!this._environments[id]) {
				throw new Error("Unknown Environment ID");
			}
			//else
			return this._environments[id].clone();
		},
		
		Environment : Environment,
		registerEnvironment : function (id, env) {
			id = id || (env || 0)._id;
			if (id && !this._environments[id] && env instanceof Environment) {
				env._id = id;
				this._environments[id] = env;
			}
		},
		
		setDefaultEnvironmentID : function (id) {
			if (typeof id === "string") {
				if (!this._environments[id]) {
					throw new Error("Unknown Environment ID");
				}
				
				this._defaultEnvironmentID = id;
			}
		},
		
		getDefaultEnvironmentID : function () {
			return this._defaultEnvironmentID;
		},
		
		//utility functions
		typeOf : typeOf,
		createObject : createObject,
		mapObject : mapObject,
		mapArray : mapArray,
		filterArray : filterArray,
		toArray : toArray,
		keys : keys,
		pushUnique : pushUnique,
		clone : clone,
		randomUUID : randomUUID,
		escapeURIComponent : escapeURIComponent,
		formatURI : formatURI,
		mergeSchemas : mergeSchemas
	};
	
	this.JSV = JSV;  //set global object
	exports.JSV = JSV;  //export to CommonJS
	
}());