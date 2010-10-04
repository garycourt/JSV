/**
 * JSV: JSON Schema (Revision 2) Validator
 * 
 * @fileOverview A JavaScript implementation of a extendable, fully compliant revision 2 JSON Schema validator.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @version 2.0.2
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
		I2H = '0123456789abcdef'.split(''),
		GLOBAL_REGISTRY,
		JSONSCHEMA_SCHEMA,
		HYPERSCHEMA_SCHEMA,
		LINKS_SCHEMA,
		EMPTY_SCHEMA,
		
		TypeValidators,
		FormatValidators,
		AttributeValidators,
		RequiredAttributeValidators,
		PropertyAttributeValidators,
		SchemaTransformers,
		JSONRegistry,
		JSONInstance,
		JSV;
	
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
	/*
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
	*/
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
	
	function searchArray(arr, o) {
		var x = 0, xl = arr.length;
		for (; x < xl; ++x) {
			if (arr[x] === o) {
				return x;
			}
		}
		return -1;
	}
		
	if (Array.prototype.indexOf) {
		searchArray = function (arr, o) {
			return Array.prototype.indexOf.call(arr, o);
		};
	}
	
	function toArray(o) {
		return o !== undefined && o !== null ? (o instanceof Array && !o.callee ? o : (typeof o.length !== 'number' || o.split || o.setInterval || o.call ? [ o ] : Array.prototype.slice.call(o))) : [];
	}
	
	function randomUUID() {
		return [
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			'-',
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			'-4',  //set 4 high bits of time_high field to version
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			'-',
			I2H[(Math.floor(Math.random() * 0x10) & 0x3) | 0x8],  //specify 2 high bits of clock sequence
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			'-',
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)],
			I2H[Math.floor(Math.random() * 0x10)]
		].join('');
	}
	
	function escapeURIComponent(str) {
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
	}
	
	function getInstance(json, uri, registry) {
		var instance, type;
		if (registry) {
			type = typeOf(json);
			instance = (uri && registry.getInstanceByURI(uri)) || ((type === 'object' || type === 'array') && registry.getInstanceByValue(json));
			if (instance) {
				return instance;
			}
		}
		
		return new JSONInstance(json, uri, registry);
	}
	
	function error(report, instance, schema, attr, message, details) {
		report.errors.push({
			uri : instance && instance.getURI(),
			schemaUri : schema && schema.getURI(),
			attribute : attr,
			message : message,
			details : details
		});
	}
	
	function validateChild(pji, parentSchema, property, cji, childSchema, report) {
		if (!cji) {
			//create undefined instance
			cji = getInstance(undefined, pji.getURI() + '.' + property, pji.getRegistry());
		}
		
		//ensure the child is valid against the schema
		childSchema.validate(cji, report, pji);
	}
	
	/*
	 * TypeValidators
	 */
	
	TypeValidators = {
		
		'string' : function (ji, report) {
			return ji.getPrimitiveType() === 'string';
		},
		
		'number' : function (ji, report) {
			return ji.getPrimitiveType() === 'number';
		},
		
		'integer' : function (ji, report) {
			return ji.getPrimitiveType() === 'number' && ji.getValue().toString().indexOf('.') === -1;
		},
		
		'boolean' : function (ji, report) {
			return ji.getPrimitiveType() === 'boolean';
		},
		
		'object' : function (ji, report) {
			return ji.getPrimitiveType() === 'object';
		},
		
		'array' : function (ji, report) {
			return ji.getPrimitiveType() === 'array';
		},
		
		'null' : function (ji, report) {
			return ji.getPrimitiveType() === 'null';
		},
		
		'any' : function (ji, report) {
			return true;
		}
		
	};
	
	/*
	 * FormatValidators
	 */
	
	FormatValidators = {};
	
	/*
	 * AttributeValidators
	 */
	
	AttributeValidators = {
		
		'type' : function (ji, requiredSchema, report) {
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
		
		'properties' : function (ji, requiredSchema, report) {
			var propertySchemas, key;
			//this attribute is for object type instances only
			if (ji.getPrimitiveType() === 'object') {
				//for each property defined in the schema
				propertySchemas = requiredSchema.properties();
				for (key in propertySchemas) {
					if (propertySchemas[key] !== O[key] && propertySchemas[key]) {
						//ensure that instance property is valid
						validateChild(ji, requiredSchema, key, ji.getProperty(key), propertySchemas[key], report);
					}
				}
			}
		},
		
		'items' : function (ji, requiredSchema, report) {
			var properties, items, x, xl, schema, additionalProperties;
			
			if (ji.getPrimitiveType() === 'array') {
				properties = ji.getProperties();
				items = requiredSchema.items();
				additionalProperties = requiredSchema.additionalProperties();
				
				if (typeOf(items) === 'array') {
					for (x = 0, xl = properties.length; x < xl; ++x) {
						schema = items[x] || additionalProperties;
						if (schema !== false) {
							validateChild(ji, requiredSchema, x, properties[x], schema, report);
						} else {
							error(report, ji, requiredSchema, 'additionalProperties', 'Additional items are not allowed', schema);
						}
					}
				} else {
					schema = items || additionalProperties;
					for (x = 0, xl = properties.length; x < xl; ++x) {
						validateChild(ji, requiredSchema, x, properties[x], schema, report);
					}
				}
			}
		},
		
		'additionalProperties' : function (ji, requiredSchema, report) {
			var additionalProperties, propertySchemas, properties, key;
			//we only need to check against object types as arrays do their own checking on this property
			if (ji.getPrimitiveType() === 'object') {
				additionalProperties = requiredSchema.additionalProperties();
				propertySchemas = requiredSchema.properties();
				properties = ji.getProperties();
				for (key in properties) {
					if (properties[key] !== O[key] && properties[key] && !propertySchemas[key]) {
						if (additionalProperties !== false) {
							validateChild(ji, requiredSchema, key, ji.getProperty(key), additionalProperties, report);
						} else {
							error(report, ji, requiredSchema, 'additionalProperties', 'Additional properties are not allowed', additionalProperties);
						}
					}
				}
			}
		},
		
		'minimum' : function (ji, requiredSchema, report) {  //& minimumCanEqual
			var range;
			if (ji.getPrimitiveType() === 'number') {
				range = requiredSchema.range();
				if (ji.getValue() < range.minimum || (!range.minimumCanEqual && ji.getValue() === range.minimum)) {
					error(report, ji, requiredSchema, 'minimum', 'Number is less then the required minimum value', range.minimum);
				}
			}
		},
		
		'maximum' : function (ji, requiredSchema, report) {  //& maximumCanEqual
			var range;
			if (ji.getPrimitiveType() === 'number') {
				range = requiredSchema.range();
				if (ji.getValue() > range.maximum || (!range.maximumCanEqual && ji.getValue() === range.maximum)) {
					error(report, ji, requiredSchema, 'maximum', 'Number is greater then the required maximum value', range.maximum);
				}
			}
		},
		
		'minItems' : function (ji, requiredSchema, report) {
			var range;
			if (ji.getPrimitiveType() === 'array') {
				range = requiredSchema.range();
				if (ji.getProperties().length < range.minItems) {
					error(report, ji, requiredSchema, 'minItems', 'The number of items is less then the required minimum', range.minItems);
				}
			}
		},
		
		'maxItems' : function (ji, requiredSchema, report) {
			var range;
			if (ji.getPrimitiveType() === 'array') {
				range = requiredSchema.range();
				if (ji.getProperties().length > range.maxItems) {
					error(report, ji, requiredSchema, 'minItems', 'The number of items is greater then the required maximum', range.maxItems);
				}
			}
		},
		
		'uniqueItems' : function (ji, requiredSchema, report) {
			var value, x, xl, y, yl;
			if (ji.getPrimitiveType() === 'array' && requiredSchema.uniqueItems()) {
				value = ji.getProperties();
				for (x = 0, xl = value.length - 1; x < xl; ++x) {
					for (y = x + 1, yl = value.length; y < yl; ++y) {
						if (value[x].equals(value[y])) {
							error(report, ji, requiredSchema, 'uniqueItems', 'Array can only contain unique items', { x : x, y : y });
						}
					}
				}
			}
		},
		
		'pattern' : function (ji, requiredSchema, report) {
			var pattern;
			try {
				pattern = requiredSchema.pattern();
				if (ji.getPrimitiveType() === 'string' && pattern && !pattern.test(ji.getValue())) {
					error(report, ji, requiredSchema, 'pattern', 'String does not match pattern', pattern.toString());
				}
			} catch (e) {
				error(report, ji, requiredSchema, 'pattern', 'Invalid pattern', e);
			}
		},
		
		'minLength' : function (ji, requiredSchema, report) {
			var range;
			if (ji.getPrimitiveType() === 'string') {
				range = requiredSchema.range();
				if (ji.getValue().length < range.minLength) {
					error(report, ji, requiredSchema, 'minLength', 'String is less then the required minimum length', range.minLength);
				}
			}
		},
		
		'maxLength' : function (ji, requiredSchema, report) {
			var range;
			if (ji.getPrimitiveType() === 'string') {
				range = requiredSchema.range();
				if (ji.getValue().length > range.maxLength) {
					error(report, ji, requiredSchema, 'maxLength', 'String is greater then the required maximum length', range.maxLength);
				}
			}
		},
		
		'enum' : function (ji, requiredSchema, report) {
			var enums = requiredSchema.enums(), x, xl;
			if (ji.getPrimitiveType() !== 'undefined' && enums) {
				for (x = 0, xl = enums.length; x < xl; ++x) {
					if (ji.equals(enums[x])) {
						return true;
					}
				}
				error(report, ji, requiredSchema, 'enum', 'Instance is not one of the possible values', requiredSchema.getValueOfProperty('enum'));
			}
		},
		
		'format' : function (ji, requiredSchema, report) {
			var format;
			if (ji.getPrimitiveType() === 'string') {
				format = requiredSchema.format();
				if (FormatValidators[format] !== O[format] && typeof FormatValidators[format] === 'function' && !FormatValidators[format].call(this, ji, report)) {
					error(report, ji, requiredSchema, 'format', 'String is not in the required format', format);
				}
			}
		},
		
		'divisibleBy' : function (ji, requiredSchema, report) {
			var divisor;
			if (ji.getPrimitiveType() === 'number') {
				divisor = requiredSchema.divisibleBy();
				if (divisor === 0) {
					error(report, ji, requiredSchema, 'divisibleBy', 'Nothing is divisible by 0', divisor);
				} else if (divisor !== 1 && ((ji.getValue() / divisor) % 1) !== 0) {
					error(report, ji, requiredSchema, 'divisibleBy', 'Number is not divisible by ' + divisor, divisor);
				}
			}
		},
		
		
		'disallow' : function (ji, requiredSchema, report) {
			var disallowedTypes = requiredSchema.disallows(),
				x, xl, key;
			
			//for instances that are required to be a certain type
			if (ji.getPrimitiveType() !== 'undefined' && disallowedTypes && disallowedTypes.length) {
				//ensure that type matches for at least one of the required types
				for (x = 0, xl = disallowedTypes.length; x < xl; ++x) {
					key = disallowedTypes[x];
					if (TypeValidators[key] !== O[key] && typeof TypeValidators[key] === 'function') {
						if (TypeValidators[key](ji, report)) {
							error(report, ji, requiredSchema, 'disallow', 'Instance is a disallowed type', disallowedTypes);
							return false;
						}
					} 
					/*
					else {
						error(report, ji, requiredSchema, 'disallow', 'Instance may be a disallowed type', disallowedTypes);
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
		
		'extends' : function (ji, requiredSchema, report) {
			var extensions = requiredSchema.getProperty('extends'), x, xl;
			if (extensions.getPrimitiveType() === 'object') {
				extensions.validate(ji, report);
			} else if (extensions.getPrimitiveType() === 'array') {
				extensions = extensions.getProperties();
				for (x = 0, xl = extensions.length; x < xl; ++x) {
					extensions[x].validate(ji, report);
				}
			}
		}
		
	};
	
	/*
	 * RequiredAttributeValidators
	 */
	
	RequiredAttributeValidators = [
		'optional'
	];
	
	/*
	 * PropertyAttributeValidators
	 */
	
	PropertyAttributeValidators = {
		
		'optional' : function (cji, childSchema, pji, report) {
			if (cji.getPrimitiveType() === 'undefined' && !childSchema.optional()) {
				error(report, cji, childSchema, 'optional', "Property is required", false);
			}
		},
		
		'requires' : function (cji, childSchema, pji, report) {
			var requires;
			if (cji.getPrimitiveType() !== 'undefined') {
				requires = childSchema.requires();
				if (typeof requires === 'string') {
					if (!pji.getProperty(requires)) {
						error(report, cji, childSchema, 'requires', 'Property requires sibling property "' + requires + '"', requires);
					}
				} else if (requires instanceof JSONInstance && requires.getPrimitiveType() === 'object') {
					requires.validate(pji, report);
				}
			}
		}
		
	};
	
	/*
	 * SchemaTransformers
	 */
	
	SchemaTransformers = [
		
		/* ji.$schema */
		function (ji, schema, report) {
			return schema.getInstanceByLinkRel(ji, 'describedby');
		},
		
		/* schema.$ref */
		function (ji, schema, report) {
			return HYPERSCHEMA_SCHEMA.getFull(schema);
		},
		
		/* schema.extends */
		function (ji, schema, report) {
			var extendsProperty = schema.getProperty('extends');
			if (extendsProperty && extendsProperty.getPrimitiveType() === 'object') {
				return schema.getExtendedSchema();
			}
		}
		
	];
	
	/*
	 * JSONRegistry
	 */
	
	JSONRegistry = function (parentRegistry) {
		this._value2instanceKey = parentRegistry ? cloneArray(parentRegistry._value2instanceKey) : [];
		this._value2instanceValue = parentRegistry ? cloneArray(parentRegistry._value2instanceValue) : [];
		this._uri2instance = parentRegistry ? createObject(parentRegistry._uri2instance) : {};
		this._validated = parentRegistry ? createObject(parentRegistry._validated) : {};
	};
	
	JSONRegistry.prototype = {
		registerInstance : function (instance, value, uri) {
			var type = typeOf(value);
			if (type !== 'undefined') {
				if (type === 'object' || type === 'array') {
					this._value2instanceKey.push(value);
					this._value2instanceValue.push(instance);
				}
				this._uri2instance[uri] = instance;
			}
		},
		
		getInstanceByValue : function (value) {
			var type = typeOf(value),
				index;
			if (type === 'object' || type === 'array') {
				index = searchArray(this._value2instanceKey, value);
				if (index !== -1) {
					return this._value2instanceValue[index];
				}
			}
		},
		
		getInstanceByURI : function (uri) {
			return this._uri2instance[uri];
		},
		
		registerValidation : function (uri, schemaUri) {
			if (!this._validated[uri]) {
				this._validated[uri] = [ schemaUri ];
			} else {
				this._validated[uri].push(schemaUri);
			}
		},
		
		isValidatedBy : function (uri, schemaUri) {
			return !!this._validated[uri] && searchArray(this._validated[uri], schemaUri) !== -1;
		},
		
		getSchemaOfURI : function (uri) {
			var schemaUri = this._validated[uri] && this._validated[uri][0];
			if (schemaUri) {
				return this._uri2instance[schemaUri];
			}
		}
	};
	
	/*
	 * JSONInstance
	 */
	
	JSONInstance = function (json, uri, registry) {
		var key, x, xl;
		
		this._type = typeOf(json);
		this._uri = uri ? (uri.indexOf('#') !== -1 ? uri : uri + '#') : 'urn:uuid:' + randomUUID() + '#';
		this._registry = registry || new JSONRegistry();
		
		//register instance
		this._registry.registerInstance(this, json, this._uri);
		
		switch (this._type) {
		case 'object':
			this._value = {};
			for (key in json) {
				if (json[key] !== O[key] && json[key] !== undefined) {
					this._value[key] = getInstance(json[key], this._uri + '.' + key, this._registry);
				}
			}
			break;
			
		case 'array':
			this._value = [];
			for (x = 0, xl = json.length; x < xl; ++x) {
				if (json[x] !== undefined) {
					this._value[x] = getInstance(json[x], this._uri + '.' + x, this._registry);
				}
			}
			break;
			
		case 'string':
		case 'number':
		case 'boolean':
		case 'null':
			this._value = json;
			break;
			
		default:
			this._type = 'undefined';
			this._value = undefined;
		}
	};
	
	JSONInstance.prototype = {
		
		/*
		 * Instance methods
		 */
		
		getPrimitiveType : function () {
			return this._type;
		},
		
		getValue : function () {
			var result, key, x, xl;
			
			switch (this._type) {
			case 'object':
				result = {};
				for (key in this._value) {
					if (this._value[key] !== O[key] && this._value[key]) {
						result[key] = this._value[key].getValue();
					}
				}
				return result;
				
			case 'array':
				result = [];
				for (x = 0, xl = this._value.length; x < xl; ++x) {
					if (this._value[x] !== undefined) {
						result[x] = this._value[x].getValue();
					}
				}
				return result;
				
			case 'string':
			case 'number':
			case 'boolean':
			case 'null':
				return this._value;
			}
		},
		
		getProperties : function () {
			if (this._type === 'object') {
				return createObject(this._value);
			} else if (this._type === 'array') {
				return cloneArray(this._value);
			}
		},
		
		getProperty : function (key) {
			if (this._type === 'object' || this._type === 'array') {
				return this._value[key];
			}
		},
		
		getPropertyByPath : function (path) {
			var key, value;
			path = path.split('.');
			if (path.length === 1) {
				return this.getProperty(path[0], value);
			} else {
				key = path.shift();
				value = this.getProperty(key);
				if (value) {
					return value.getPropertyByPath(path.join('.'));
				}
			}
		},
		
		setProperty : function (key, value) {
			if (value instanceof JSONInstance) {
				this._value[key] = value;
			}
		},
		
		setPropertyByPath : function (path, value) {
			var key;
			path = path.split('.');
			if (path.length === 1) {
				return this.setProperty(path[0], value);
			} else {
				key = path.shift();
				value = this.getProperty(key);
				if (value) {
					return value.setPropertyByPath(path.join('.'));
				}
			}
		},
		
		getValueOfProperty : function (key) {
			if ((this._type === 'object' || this._type === 'array') && this._value[key]) {
				return this._value[key].getValue();
			}
		},
		
		getURI : function () {
			return this._uri;
		},
		
		getRegistry : function () {
			return this._registry;
		},
		
		equals : function (o) {
			var type = this.getPrimitiveType(),
				instance = o instanceof JSONInstance ? o : this._registry.getInstanceByValue(o),
				instanceType = instance ? instance.getPrimitiveType() : typeOf(o);
			
			if (this === instance) {
				return true;
			} else if (type !== instanceType) {
				return false;
			} else if (instance && this.getURI() === instance.getURI()) {
				return true;
			} else if (type !== 'object' && type !== 'array') {
				return this.getValue() === (instance ? instance.getValue() : o);
			} else {
				return false;
			}
		},
	
		/*
		 * Schema methods
		 */
		
		getSchemaOfInstanceProperty : function (ji, key) {
			var type = ji.getPrimitiveType(),
				additionalProperties = this.additionalProperties(),  //schema or false
				items;
			
			if (type === 'object') {
				return this.properties()[key] || additionalProperties;
			} else if (type === 'array') {
				items = this.items();
				if (typeOf(items) === 'array') {
					return items[key] || additionalProperties;
				} else {
					return items || additionalProperties;
				}
			}
		},
		
		types : function () {
			var type = this.getProperty('type'),
				primitiveType = type.getPrimitiveType();
			if (primitiveType === 'string') {
				return [ type.getValue() ];
			} else if (primitiveType === 'array') {
				type = type.getProperties();
				return mapArray(type, function (instance) {
					if (instance.getPrimitiveType() !== 'object') {
						return instance.getValue();
					} else {
						return instance;
					}
				});
			} else if (primitiveType === 'object') {
				return [ type ];
			}
		},
		
		properties : function () {
			var prop = this.getProperty('properties');
			return prop ? prop.getProperties() : {};
		},
		
		items : function () {
			var items = this.getProperty('items');
			if (items && items.getPrimitiveType() === 'array') {
				return items.getProperties();
			} else {
				return items || EMPTY_SCHEMA;
			}
		},
		
		additionalProperties : function () {
			var ap = this.getProperty('additionalProperties');
			if (ap && ap.getPrimitiveType() === 'boolean') {
				if (ap.getValue() === false) {
					return false;
				} else {
					return EMPTY_SCHEMA;
				}
			} else {
				return ap || EMPTY_SCHEMA;
			}
		},
		
		optional : function () {
			return !!this.getValueOfProperty('optional');
		},
		
		requires : function () {
			var requires = this.getProperty('requires');
			if (requires && requires.getPrimitiveType() === 'string') {
				return requires.getValue();
			}
			return requires;
		},
		
		range : function () {
			var minEqual = this.getValueOfProperty('minimumCanEqual'),
				maxEqual = this.getValueOfProperty('maximumCanEqual');
			return {
				minimum : this.getValueOfProperty('minimum'),
				maximum : this.getValueOfProperty('maximum'),
				minimumCanEqual : typeof minEqual !== 'boolean' || minEqual,
				maximumCanEqual : typeof maxEqual !== 'boolean' || maxEqual,
				minItems : this.getValueOfProperty('minItems') || 0,
				maxItems : this.getValueOfProperty('maxItems'),
				minLength : this.getValueOfProperty('minLength') || 0,
				maxLength : this.getValueOfProperty('maxLength')
			};
		},
		
		uniqueItems : function () {
			return this.getValueOfProperty('uniqueItems');
		},
		
		pattern : function () {
			var pattern = this.getValueOfProperty('pattern');
			if (pattern) {
				return new RegExp(pattern);
			}
		},
		
		enums : function () {
			var enums = this.getProperty('enum');
			if (enums && enums.getPrimitiveType() === 'array') {
				return enums.getProperties();
			}
		},
		
		title : function () {
			return this.getValueOfProperty('title');
		},
		
		description : function () {
			return this.getValueOfProperty('description');
		},
		
		format : function () {
			return this.getValueOfProperty('format');
		},
		
		contentEncoding : function () {
			return this.getValueOfProperty('contentEncoding');
		},
		
		defaultValue : function () {
			return this.getValueOfProperty('default');
		},
		
		divisibleBy : function () {
			var divisor = this.getValueOfProperty('divisibleBy');
			return typeof divisor === 'number' ? divisor : 1;
		},
		
		disallows : function () {
			return toArray(this.getValueOfProperty('disallow'));
		},
		
		getExtendedSchema : function () {
			var extendsProperty = this.getProperty('extends'),
				extendedSchema,
				extendedUri, 
				extended,
				thisValue,
				instance;
			
			function merge(base, extra, isSchema) {
				var key;
				for (key in extra) {
					if (extra[key] !== O[key]) {
						if (isSchema && key === 'extends') {
							base[key] = toArray(base[key]).concat(toArray(extra[key]));
						} else if (typeOf(base[key]) === 'object' && typeOf(extra[key]) === 'object') {
							merge(base[key], extra[key], !isSchema || key !== 'properties');  //FIXME: An attribute other then "properties" may be a plain object
						} else {
							base[key] = extra[key];
						}
					}
				}
			}
			
			if (this.getPrimitiveType() === 'object' && extendsProperty && extendsProperty.getPrimitiveType() === 'object') {
				extendedSchema = HYPERSCHEMA_SCHEMA.getFull(extendsProperty).getExtendedSchema();
				extendedUri = this.getURI() + '(' + escapeURIComponent(extendedSchema.getURI()) + ')';
				
				instance = this.getRegistry().getInstanceByURI(extendedUri);
				if (instance) {
					return instance;
				}
				
				extended = extendedSchema.getValue();
				thisValue = this.getValue();
				
				merge(extended, thisValue, true);
				instance = getInstance(extended, extendedUri, this.getRegistry());
				return instance;
			}
			
			return this;
		},
		
		links : function () {
			var links = this.getProperty('links');
			return links && links.getProperties();
		},
		
		linkByRel : function (rel) {
			var links = this.links(), x, xl;
			if (typeOf(links) === 'array') {
				for (x = 0, xl = links.length; x < xl; ++x) {
					if (links[x].getValueOfProperty('rel') === rel) {
						return links[x];
					}
				}
			}
		},
		
		getInstanceByLinkRel : function (instance, rel) {
			var link = this.linkByRel(rel), 
				href, 
				uri;
			
			if (link) {
				href = link.getValueOfProperty('href');
				href = href.replace(/\{(.+)\}/g, function (str, p1, offset, s) {
					var value = instance.getValueOfProperty(p1);
					return value !== undefined ? String(value) : '';
				});
				if (href) {
					uri = URL.resolve(instance.getURI(), href);
					if (uri.indexOf('#') === -1) {
						uri += '#';  //HACK
					}
					return instance.getRegistry().getInstanceByURI(uri);
				}
			}
		},
		
		getFull : function (instance) {
			return this.getInstanceByLinkRel(instance, 'full') || instance;
		},
		/*
		getSchema : function () {
			return HYPERSCHEMA_SCHEMA.getInstanceByLinkRel(this, 'describedby') || this.getRegistry().getSchemaOfURI(this.getURI());
		},
		*/
		validate : function (ji, report, pji) {
			var schema, schemaUri, uri, registry, x, xl, properties, key;
			schema = this;
			
			for (x = 0, xl = SchemaTransformers.length; x < xl; ++x) {
				schema = SchemaTransformers[x](ji, schema, report) || schema;
			}
				
			schemaUri = schema.getURI();
			ji = ji instanceof JSONInstance ? ji : getInstance(ji);
			uri = ji.getURI();
			registry = ji.getRegistry();
			report = report || {
				errors : [],
				instance : ji,
				schema : schema
			};
			
			if (!registry.isValidatedBy(uri, schemaUri)) {
				registry.registerValidation(uri, schemaUri);
				
				if (!schema.equals(this)) {
					HYPERSCHEMA_SCHEMA.validate(schema, report);
				}

				properties = schema.getProperties();
				
				for (x = 0, xl = RequiredAttributeValidators.length; x < xl; ++x) {
					properties[RequiredAttributeValidators[x]] = true;
				}
				
				for (key in properties) {
					if (properties[key] !== O[key]) {
						if (AttributeValidators[key] !== O[key]) {
							AttributeValidators[key](ji, schema, report);
						}
						if (pji && PropertyAttributeValidators[key] !== O[key]) {
							PropertyAttributeValidators[key](ji, schema, pji, report);
						}
					}
				}
			}
			
			return report;
		}
		
	};
	
	/*
	 * Constants
	 */
	
	GLOBAL_REGISTRY = new JSONRegistry();
	
	JSONSCHEMA_SCHEMA = new JSONInstance({
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
				"default" : "any"
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
	}, 'http://json-schema.org/schema', GLOBAL_REGISTRY);
	
	HYPERSCHEMA_SCHEMA = new JSONInstance({
		"$schema" : "http://json-schema.org/hyper-schema#",
		"id" : "http://json-schema.org/hyper-schema#",
	
		"properties" : {
			"links" : {
				"type" : "array",
				"items" : {"$ref" : "http://json-schema.org/links#"},
				"optional" : true
			},
			
			"fragmentResolution" : {
				"type" : "string",
				"optional" : true,
				"default" : "slash-delimited"
			},
			
			"root" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false
			},
			
			"readonly" : {
				"type" : "boolean",
				"optional" : true,
				"default" : false
			},
			
			"pathStart" : {
				"type" : "string",
				"optional" : true,
				"format" : "uri"
			},
			
			"mediaType" : {
				"type" : "string",
				"optional" : true,
				"format" : "media-type"
			},
			
			"alternate" : {
				"type" : "array",
				"items" : {"$ref" : "#"},
				"optional" : true
			}
		},
		
		"links" : [
			{
				"href" : "{$ref}",
				"rel" : "full"
			},
			
			{
				"href" : "{$schema}",
				"rel" : "describedby"
			},
			
			{
				"href" : "{id}",
				"rel" : "self"
			}
		],
		
		"fragmentResolution" : "dot-delimited",
		"extends" : {"$ref" : "http://json-schema.org/schema#"}
	}, 'http://json-schema.org/hyper-schema', GLOBAL_REGISTRY);
	
	LINKS_SCHEMA = new JSONInstance({
		"$schema" : "http://json-schema.org/hyper-schema#",
		"id" : "http://json-schema.org/links#",
		"type" : "object",
		
		"properties" : {
			"href" : {
				"type" : "string"
			},
			
			"rel" : {
				"type" : "string"
			},
			
			"targetSchema" : {"$ref" : "http://json-schema.org/hyper-schema#"},
			
			"method" : {
				"type" : "string",
				"default" : "GET",
				"optional" : true
			},
			
			"enctype" : {
				"type" : "string",
				"requires" : "method",
				"optional" : true
			},
			
			"properties" : {
				"type" : "object",
				"additionalProperties" : {"$ref" : "http://json-schema.org/hyper-schema#"},
				"optional" : true
			}
		}
	}, 'http://json-schema.org/links', GLOBAL_REGISTRY);
	
	EMPTY_SCHEMA = new JSONInstance({}, 'http://json-schema.org/empty-schema', GLOBAL_REGISTRY);
	
	/*
	 * JSV
	 */
	
	JSV = {
		
		JSONInstance : JSONInstance,
		globalRegistry : GLOBAL_REGISTRY,
		JSONSCHEMA_SCHEMA : JSONSCHEMA_SCHEMA,
		HYPERSCHEMA_SCHEMA : HYPERSCHEMA_SCHEMA,
		LINKS_SCHEMA : LINKS_SCHEMA,
		EMPTY_SCHEMA : EMPTY_SCHEMA,
		
		registerSchema : function (json, uri) {
			return HYPERSCHEMA_SCHEMA.validate(getInstance(json, uri, GLOBAL_REGISTRY));
		},
		
		validateWithURI : function (json, jsonURI, schema, schemaURI) {
			var registry = new JSONRegistry(this.globalRegistry),
				report,
				schemaSchema = HYPERSCHEMA_SCHEMA;  //TODO: Make validator more generic
			
			schema = schema instanceof JSONInstance ? schema : (schema ? getInstance(schema, jsonURI, registry) : EMPTY_SCHEMA);
			report = schemaSchema.validate(schema);
			report.schema = schema;
			
			json = json instanceof JSONInstance ? json : getInstance(json, schemaURI, registry);
			report.instance = json;
			return schema.validate(json, report);
		},
		
		validate : function (json, schema) {
			return JSV.validateWithURI(json, null, schema, null);
		}
		
	};
	
	this.JSV = JSV;  //set global object
	exports.JSV = JSV;  //export to CommonJS
	
	function assertNoErrors(report, uri) {
		if (report.errors.length) {
			throw new Error('Schema ' + uri + ' did not validate');
		}
	}
	
	assertNoErrors(JSV.validate(JSV.HYPERSCHEMA_SCHEMA, JSV.HYPERSCHEMA_SCHEMA), JSV.HYPERSCHEMA_SCHEMA.getURI());
	assertNoErrors(JSV.validate(JSV.JSONSCHEMA_SCHEMA, JSV.HYPERSCHEMA_SCHEMA), JSV.JSONSCHEMA_SCHEMA.getURI());
	assertNoErrors(JSV.validate(JSV.LINKS_SCHEMA, JSV.HYPERSCHEMA_SCHEMA), JSV.LINKS_SCHEMA.getURI());
	assertNoErrors(JSV.validate(JSV.EMPTY_SCHEMA, JSV.HYPERSCHEMA_SCHEMA), JSV.EMPTY_SCHEMA.getURI());
	
}());