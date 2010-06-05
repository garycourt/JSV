"use strict";

(function () {
	
	var O = {},
		GLOBAL_REGISTRY,
		JSONSCHEMA_SCHEMA_JSON,
		JSONSCHEMA_SCHEMA,
		EMPTY_SCHEMA_JSON,
		EMPTY_SCHEMA,
		
		TypeValidators,
		FormatValidators,
		AttributePropertyValidators,
		PropertyAttributeValidators,
		AttributeValidators,
		JSONInstance,
		JSONValidator,
		exports = this;
	
	function typeOf (o) {
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
			path : report.path.join('.'),
			uri : instance && instance.getURI(),
			schemaUri : schema && schema.getURI(),
			attribute : attr,
			message : message,
			details : details
		});
	}
	
	function validateChild(pji, parentSchema, property, cji, childSchema, report) {
		var attributes, attributeName;
		report.path.push(property);
		
		if (cji) {
			//ensure the child is valid against the schema
			childSchema.validate(cji, report);
		}
		
		//for each schema attribute of the parent instance
		attributes = parentSchema.getProperties();
		for (attributeName in attributes) {
			if (attributes[attributeName] !== O[attributeName] && AttributePropertyValidators[attributeName] !== O[attributeName]) {
				AttributePropertyValidators[attributeName](pji, parentSchema, property, cji, childSchema, report);
			}
		}
		
		//for each schema attribute of the child instance
		attributes = childSchema.getProperties();
		for (attributeName in attributes) {
			if (attributes[attributeName] !== O[attributeName] && PropertyAttributeValidators[attributeName] !== O[attributeName]) {
				PropertyAttributeValidators[attributeName](pji, parentSchema, property, cji, childSchema, report);
			}
		}
		
		report.path.pop();
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
			return ji.getPrimitiveType() === 'integer' || (ji.getPrimitiveType() === 'number' && ji.getValue().toString().indexOf('.') === -1);
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
				x, xl, key;
			
			//for instances that are required to be a certain type
			if (requiredTypes && requiredTypes.length) {
				//ensure that type matches for at least one of the required types
				for (x = 0, xl = requiredTypes.length; x < xl; ++x) {
					key = requiredTypes[x];
					if (TypeValidators[key] !== O[key] && typeof TypeValidators[key] === 'function') {
						if (TypeValidators[key](ji, report)) {
							return true;  //type is valid
						}
					} else {
						return true;  //unknown types are assumed valid
					}
				}
				
				//if we get to this point, type is invalid
				error(report, ji, requiredSchema, 'type', 'Instance is not of the required type', requiredTypes);
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
				if (ji.getValue() < range.minimum) {
					error(report, ji, requiredSchema, 'minimum', 'Number is less then the required minimum value', range.minimum);
				}
			}
		},
		
		'maximum' : function (ji, requiredSchema, report) {  //& maximumCanEqual
			var range;
			if (ji.getPrimitiveType() === 'number') {
				range = requiredSchema.range();
				if (ji.getValue() > range.maximum) {
					error(report, ji, requiredSchema, 'minimum', 'Number is greater then the required maximum value', range.maximum);
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
		
		/*
		'pattern' : 0,  //TODO
		
		'minLength' : function (ji) {
			if (ji.getPrimitiveType() === 'string' && ji.getValue().length < ji.getSchema().range().min) {
				return "String is less then the required minimum length";
			}
		},
		
		'maxLength' : function (ji) {
			if (ji.getPrimitiveType() === 'string' && ji.getValue().length > ji.getSchema().range().max) {
				return "String is greater then the required maximum length";
			}
		},
		
		'enum' : function (ji) {
			if (!ji.getSchema().enumerations().some(ji.equals.bind(ji))) {
				return "Instance is not one of the possible enum values";
			}
		},
		
		'format' : function (ji) {
			var format = ji.getSchema().format();
			if (hasProperty(this.FormatValidators, format) && !this.FormatValidators[format].call(this, ji)) {
				return "Instance value is not of format '" + format + "'";
			}
		},
		
		'divisibleBy' : 0,
		'disallow' : 0,
		'extends' : 0  //?
		*/
	};
	
	/*
	 * AttributePropertyValidators
	 */
	
	AttributePropertyValidators = {
		/*
		'uniqueItems' : 0,
		'disallow' : 0
		*/
	};
	
	/*
	 * PropertyAttributeValidators
	 */
	
	PropertyAttributeValidators = {
		
		'optional' : function (pji, parentSchema, property, cji, childSchema, report) {
			if (!childSchema.optional() && !cji) {
				error(report, cji, childSchema, 'optional', "Property is required", false);
			}
		},
		
		'requires' : function (pji, parentSchema, property, cji, childSchema, report) {
			var requires = childSchema.requires();
			if (typeof requires === 'string') {
				if (!pji.getProperty(requires)) {
					error(report, cji, childSchema, 'requires', 'Property requires sibling property "' + requires + '"', requires);
				}
			} else if (requires instanceof JSONInstance && requires.getPrimitiveType() === 'object') {
				requires.validate(pji, report);
			}
		}
		
	};
	
	/*
	 * JSONRegistry
	 */
	
	JSONRegistry = function (parentRegistry) {
		this._value2instanceKey = parentRegistry ? cloneArray(parentRegistry._value2instanceKey) : [];
		this._value2instanceValue = parentRegistry ? cloneArray(parentRegistry._value2instanceValue) : [];
		this._uri2instance = parentRegistry ? createObject(parentRegistry._uri2instance) : {};
	};
	
	JSONRegistry.prototype = {
		registerInstance : function (instance, value, uri) {
			var type = typeOf(value);
			if (type === 'object' || type === 'array') {
				this._value2instanceKey.push(value);
				this._value2instanceValue.push(instance);
			}
			this._uri2instance[uri] = instance;
		},
		
		getInstanceByValue : function (value) {
			var type = typeOf(value),
				index;
			if (type === 'object' || type === 'array') {
				index = this._value2instanceKey.indexOf(value);
				if (index !== -1) {
					return this._value2instanceValue[index];
				}
			}
		},
		
		getInstanceByURI : function (uri) {
			return this._uri2instance[uri];
		}
	};
	
	/*
	 * JSONInstance
	 */
	
	JSONInstance = function (json, uri, registry) {
		var key, x, xl, propertyUri;
		
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
			this._type = this._value = undefined;
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
			var key, value;
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
			return toArray(this.getValueOfProperty('type'));
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
			return this.getValueOfProperty('optional');
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
				minimum : this.getValueOfProperty('minimum') + (typeof minEqual !== 'boolean' || minEqual ? 0 : 1),
				maximum :this.getValueOfProperty('maximum') - (typeof minEqual !== 'boolean' || maxEqual ? 0 : 1),
				minItems : this.getValueOfProperty('minItems') || 0,
				maxItems : this.getValueOfProperty('maxItems')
			};
		},
		
		defaultValue : function () {
			return this.getProperty('default');
		},
		
		extensions : function () {
			return [];  //TODO
		},
		
		isExtensionOf : function (schema, stack) {
			var extensions, x, xl;
			if (schema) {
				if (this.getURI() === schema.getURI()) {
					return true;
				} else {
					stack = stack || [ this ];
					extensions = this.extensions();
					for (x = 0, xl = extensions.length; x < xl; ++x) {
						if (stack.indexOf(extensions[x]) === -1 && extensions[x].isExtensionOf(schema, stack)) {
							return true;
						}
					}
				}
			}
			return false;
		},
		
		validate : function (ji, report) {
			var schemaUri, uri, properties, key;
			schemaUri = this.getURI();
			ji = ji instanceof JSONInstance ? ji : getInstance(ji);
			uri = ji.getURI();
			report = report || {
				path : [],
				validated : {},
				errors : [],
				instance : ji
			};
			
			if (!report.validated[uri] || report.validated[uri].indexOf(schemaUri) === -1) {
				if (!report.validated[uri]) {
					report.validated[uri] = [ schemaUri ];
				} else {
					report.validated[uri].push(schemaUri);
				}
				
				properties = this.getProperties();
				for (key in properties) {
					if (properties[key] !== O[key] && AttributeValidators[key] !== O[key]) {
						AttributeValidators[key](ji, this, report);
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
	
	JSONSCHEMA_SCHEMA = new JSONInstance({}, 'http://json-schema.org/schema', GLOBAL_REGISTRY);
	
	function buildSchema(uri, json, schemaUri) {
		var instance, uriSplit, prop, parentUri;
		uri = 'http://json-schema.org/schema' + uri;
		schemaUri = schemaUri && 'http://json-schema.org/schema' + schemaUri;
		instance = json instanceof JSONInstance ? json : new JSONInstance(json, uri, GLOBAL_REGISTRY);
		uriSplit = uri.split('.');
		prop = uriSplit.pop();
		parentUri = uriSplit.join('.');
		GLOBAL_REGISTRY.getInstanceByURI(parentUri).setProperty(prop, instance);
	}
	
	function buildSchemaRef(uri, schemaUri) {
		var schema, uriSplit, prop, parentUri;
		uri = 'http://json-schema.org/schema' + uri;
		schemaUri = 'http://json-schema.org/schema' + schemaUri;
		schema = GLOBAL_REGISTRY.getInstanceByURI(schemaUri);
		uriSplit = uri.split('.');
		prop = uriSplit.pop();
		parentUri = uriSplit.join('.');
		GLOBAL_REGISTRY.getInstanceByURI(parentUri).setProperty(prop, schema);
	}
	
	//bootstrap JSON Schema schema
	buildSchema('#.type', "object", null);  //#.properties.type
	buildSchema('#.properties', {}, null);  //#.properties.properties
	buildSchema('#.properties.type', {}, '#');
	buildSchema('#.properties.type.items', {}, '#');
	buildSchema('#.properties.type.items.type', "string", '#.properties.type');
	buildSchemaRef('#.properties.type.additionalProperties', '#.properties.type.items');  //needed only by this validator for next rule
	buildSchema('#.properties.type.type', ["string", "array"], '#.properties.type');
	buildSchema('#.properties.type.optional', true, null);  //#.properties.optional
	buildSchema('#.properties.type.default', "any", null);  //#.properties.default
	buildSchema('#.properties.properties', {}, '#');
	buildSchema('#.properties.properties.type', "object", '#.properties.type');
	buildSchemaRef('#.properties.properties.additionalProperties', '#');
	buildSchema('#.properties.properties.optional', true, null);  //#.properties.optional
	buildSchema('#.properties.properties.default', {}, null);  //#.properties.default
	buildSchema('#.properties.items', {}, '#');
	buildSchema('#.properties.items.type', ["object", "array"], '#.properties.type');
	buildSchemaRef('#.properties.items.properties', '#.properties');
	buildSchemaRef('#.properties.items.items', '#');
	buildSchema('#.properties.items.optional', true, null);  //#.properties.optional
	buildSchema('#.properties.items.default', {}, null);  //#.properties.default
	buildSchema('#.properties.optional', {}, '#');
	buildSchema('#.properties.optional.type', "boolean", '#.properties.type');
	buildSchema('#.properties.optional.optional', true, '#.properties.optional');
	buildSchema('#.properties.optional.default', false, null);  //#.properties.default
	buildSchema('#.properties.additionalProperties', {}, '#');
	buildSchema('#.properties.additionalProperties.type', ["object", "boolean"], '#.properties.type');
	buildSchemaRef('#.properties.additionalProperties.properties', '#.properties');
	buildSchema('#.properties.additionalProperties.optional', true, '#.properties.optional');
	buildSchema('#.properties.additionalProperties.default', {}, null);  //#.properties.default
	buildSchema('#.properties.default', {}, '#');
	buildSchema('#.properties.default.type', "any", '#.properties.type');
	buildSchema('#.properties.default.optional', true, '#.properties.optional');
	buildSchema('#.optional', true, '#.properties.optional');
	buildSchema('#.default', {}, '#.properties.default');
	
	EMPTY_SCHEMA = new JSONInstance({}, 'http://json-schema.org/empty-schema', GLOBAL_REGISTRY);
	
	/*
	 * JSONValidator
	 */
	
	JSONValidator = {
		
		JSONInstance : JSONInstance,
		globalRegistry : GLOBAL_REGISTRY,
		JSONSCHEMA_SCHEMA : JSONSCHEMA_SCHEMA,
		EMPTY_SCHEMA : EMPTY_SCHEMA,
		
		validate : function (json, schema) {
			var registry = new JSONRegistry(this.globalRegistry);
			schema = schema instanceof JSONInstance ? schema : (schema ? getInstance(schema, null, registry) : EMPTY_SCHEMA);
			json = json instanceof JSONInstance ? json : getInstance(json, null, registry); 
			
			return schema.validate(json);
		}
		
	};
	
	exports.JSONValidator = JSONValidator;
	
}());