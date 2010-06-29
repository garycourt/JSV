/* borrowed from nodejs */

(function (exports) {
	
function require(){
	return exports;
}

Object.keys = function (obj) {
	var result = [], key, O = {};
	for (key in obj) {
		if (obj[key] !== O[key]) {
			result[result.length] = key;
		}
	}
	return result;
};

/* path.js */
exports.join = function () {
  return exports.normalize(Array.prototype.join.call(arguments, "/"));
};

exports.normalizeArray = function (parts, keepBlanks) {
  var directories = [], prev;
  for (var i = 0, l = parts.length - 1; i <= l; i++) {
    var directory = parts[i];

    // if it's blank, but it's not the first thing, and not the last thing, skip it.
    if (directory === "" && i !== 0 && i !== l && !keepBlanks) continue;

    // if it's a dot, and there was some previous dir already, then skip it.
    if (directory === "." && prev !== undefined) continue;

    if (
      directory === ".."
      && directories.length
      && prev !== ".."
      && prev !== "."
      && prev !== undefined
      && (prev !== "" || keepBlanks)
    ) {
      directories.pop();
      prev = directories.slice(-1)[0]
    } else {
      if (prev === ".") directories.pop();
      directories.push(directory);
      prev = directory;
    }
  }
  return directories;
};

exports.normalize = function (path, keepBlanks) {
  return exports.normalizeArray(path.split("/"), keepBlanks).join("/");
};

exports.dirname = function (path) {
  return path && path.substr(0, path.lastIndexOf("/")) || ".";
};

exports.basename = function (path, ext) {
  var f = path.substr(path.lastIndexOf("/") + 1);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  var index = path.lastIndexOf('.');
  return index < 0 ? '' : path.substring(index);
};

/* querystring.js */
// Query String Utilities

var QueryString = exports;

QueryString.unescape = function (str, decodeSpaces) {
  return decodeURIComponent(decodeSpaces ? str.replace(/\+/g, " ") : str);
};

QueryString.escape = function (str) {
  return encodeURIComponent(str);
};


var stack = [];
/**
 * <p>Converts an arbitrary value to a Query String representation.</p>
 *
 * <p>Objects with cyclical references will trigger an exception.</p>
 *
 * @method stringify
 * @param obj {Variant} any arbitrary value to convert to query string
 * @param sep {String} (optional) Character that should join param k=v pairs together. Default: "&"
 * @param eq  {String} (optional) Character that should join keys to their values. Default: "="
 * @param munge {Boolean} (optional) Indicate whether array/object params should be munged, PHP/Rails-style. Default: true
 * @param name {String} (optional) Name of the current key, for handling children recursively.
 * @static
 */
QueryString.stringify = function (obj, sep, eq, munge, name) {
  munge = typeof(munge) == "undefined" ? true : munge;
  sep = sep || "&";
  eq = eq || "=";
  if (isA(obj, null) || isA(obj, undefined) || typeof(obj) === 'function') {
    return name ? encodeURIComponent(name) + eq : '';
  }

  if (isBool(obj)) obj = +obj;
  if (isNumber(obj) || isString(obj)) {
    return encodeURIComponent(name) + eq + encodeURIComponent(obj);
  }
  if (isA(obj, [])) {
    var s = [];
    name = name+(munge ? '[]' : '');
    for (var i = 0, l = obj.length; i < l; i ++) {
      s.push( QueryString.stringify(obj[i], sep, eq, munge, name) );
    }
    return s.join(sep);
  }
  // now we know it's an object.

  // Check for cyclical references in nested objects
  for (var i = stack.length - 1; i >= 0; --i) if (stack[i] === obj) {
    throw new Error("querystring.stringify. Cyclical reference");
  }

  stack.push(obj);

  var s = [];
  var begin = name ? name + '[' : '';
  var end = name ? ']' : '';
  var keys = Object.keys(obj);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    var n = begin + key + end;
    s.push(QueryString.stringify(obj[key], sep, eq, munge, n));
  }

  stack.pop();

  s = s.join(sep);
  if (!s && name) return name + "=";
  return s;
};

QueryString.parseQuery = QueryString.parse = function (qs, sep, eq) {
  return (qs || '')
    .split(sep||"&")
    .map(pieceParser(eq||"="))
    .reduce(mergeParams);
};

// Parse a key=val string.
// These can get pretty hairy
// example flow:
// parse(foo[bar][][bla]=baz)
// return parse(foo[bar][][bla],"baz")
// return parse(foo[bar][], {bla : "baz"})
// return parse(foo[bar], [{bla:"baz"}])
// return parse(foo, {bar:[{bla:"baz"}]})
// return {foo:{bar:[{bla:"baz"}]}}
var trimmerPattern = /^\s+|\s+$/g,
  slicerPattern = /(.*)\[([^\]]*)\]$/;
var pieceParser = function (eq) {
  return function parsePiece (key, val) {
    if (arguments.length !== 2) {
      // key=val, called from the map/reduce
       key = key.split(eq);
      return parsePiece(
        QueryString.unescape(key.shift(), true),
        QueryString.unescape(key.join(eq), true)
      );
    }
    key = key.replace(trimmerPattern, '');
    if (isString(val)) {
      val = val.replace(trimmerPattern, '');
      // convert numerals to numbers
      if (!isNaN(val)) {
        var numVal = +val;
        if (val === numVal.toString(10)) val = numVal;
      }
    }
    var sliced = slicerPattern.exec(key);
    if (!sliced) {
      var ret = {};
      if (key) ret[key] = val;
      return ret;
    }
    // ["foo[][bar][][baz]", "foo[][bar][]", "baz"]
    var tail = sliced[2], head = sliced[1];

    // array: key[]=val
    if (!tail) return parsePiece(head, [val]);

    // obj: key[subkey]=val
    var ret = {};
    ret[tail] = val;
    return parsePiece(head, ret);
  };
};

// the reducer function that merges each query piece together into one set of params
function mergeParams (params, addition) {
  return (
    // if it's uncontested, then just return the addition.
    (!params) ? addition
    // if the existing value is an array, then concat it.
    : (isA(params, [])) ? params.concat(addition)
    // if the existing value is not an array, and either are not objects, arrayify it.
    : (!isA(params, {}) || !isA(addition, {})) ? [params].concat(addition)
    // else merge them as objects, which is a little more complex
    : mergeObjects(params, addition)
  );
};

// Merge two *objects* together. If this is called, we've already ruled
// out the simple cases, and need to do a loop.
function mergeObjects (params, addition) {
  var keys = Object.keys(addition);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    if (key) {
      params[key] = mergeParams(params[key], addition[key]);
    }
  }
  return params;
};

// duck typing
function isA (thing, canon) {
  return (
    // truthiness. you can feel it in your gut.
    (!thing === !canon)
    // typeof is usually "object"
    && typeof(thing) === typeof(canon)
    // check the constructor
    && Object.prototype.toString.call(thing) === Object.prototype.toString.call(canon)
  );
};
function isBool (thing) {
  return (
    typeof(thing) === "boolean"
    || isA(thing, new Boolean(thing))
  );
};
function isNumber (thing) {
  return (
    typeof(thing) === "number"
    || isA(thing, new Number(thing))
  ) && isFinite(thing);
};
function isString (thing) {
  return (
    typeof(thing) === "string"
    || isA(thing, new String(thing))
  );
};

/* url.js */
exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

// define these here so at least they only have to be compiled once on the first module load.
var protocolPattern = /^([a-z0-9]+:)/,
  portPattern = /:[0-9]+$/,
  nonHostChars = ["/", "?", ";", "#"],
  hostlessProtocol = {
    "file":true,
    "file:":true
  },
  slashedProtocol = {
    "http":true, "https":true, "ftp":true, "gopher":true, "file":true,
    "http:":true, "https:":true, "ftp:":true, "gopher:":true, "file:":true
  },
  path = require("path"), // internal module, guaranteed to be loaded already.
  querystring = require('querystring');

function urlParse (url, parseQueryString) {
  if (url && typeof(url) === "object" && url.href) return url;

  var out = { href : url },
    rest = url;

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    out.protocol = proto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  var slashes = rest.substr(0, 2) === "//";
  if (slashes && !(proto && hostlessProtocol[proto])) {
    rest = rest.substr(2);
    out.slashes = true;
  }
  if (!hostlessProtocol[proto] && (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.
    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i ++) {
      var index = rest.indexOf(nonHostChars[i]);
      if (index !== -1 && (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }
    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = "";
    }

    // pull out the auth and port.
    var p = parseHost(out.host);
    var keys = Object.keys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }
    // we've indicated that there is a hostname, so even if it's empty, it has to be present.
    out.hostname = out.hostname || "";
  }

  // now rest is set to the post-host stuff.
  // chop off from the tail first.
  var hash = rest.indexOf("#");
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf("?");
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm+1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  }
  if (rest) out.pathname = rest;

  return out;
};

// format a parsed object into a url string
function urlFormat (obj) {
  // ensure it's an object, and not a string url. If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings to clean up potentially wonky urls.
  if (typeof(obj) === "string") obj = urlParse(obj);

  var protocol = obj.protocol || "",
    host = (obj.host !== undefined) ? obj.host
      : obj.hostname !== undefined ? (
        (obj.auth ? obj.auth + "@" : "")
        + obj.hostname
        + (obj.port ? ":" + obj.port : "")
      )
      : false,
    pathname = obj.pathname || "",
    search = obj.search || (
      obj.query && ( "?" + (
        typeof(obj.query) === "object"
        ? querystring.stringify(obj.query)
        : String(obj.query)
      ))
    ) || "",
    hash = obj.hash || "";

  if (protocol && protocol.substr(-1) !== ":") protocol += ":";

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = "//" + (host || "");
    if (pathname && pathname.charAt(0) !== "/") pathname = "/" + pathname;
  } else if (!host) host = "";

  if (hash && hash.charAt(0) !== "#") hash = "#" + hash;
  if (search && search.charAt(0) !== "?") search = "?" + search;

  return protocol + host + pathname + search + hash;
};

function urlResolve (source, relative) {
  return urlFormat(urlResolveObject(source, relative));
};

function urlResolveObject (source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source));
  relative = urlParse(urlFormat(relative));

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === "") return source;

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing the protocol does weird things
    // first, if it's not file:, then we MUST have a host, and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped, because that's known to be hostless.
    // anything else is assumed to be absolute.

    if (!slashedProtocol[relative.protocol]) return relative;

    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || "").split("/");
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = "";
      if (relPath[0] !== "") relPath.unshift("");
      if (relPath.length < 2) relPath.unshift("");
      relative.pathname = relPath.join("/");
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || "";
    delete source.auth;
    delete source.hostname;
    source.port = relative.port;
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === "/"),
    isRelAbs = (
      relative.host !== undefined
      || relative.pathname && relative.pathname.charAt(0) === "/"
    ),
    mustEndAbs = (isRelAbs || isSourceAbs || (source.host && relative.pathname)),
    removeAllDots = mustEndAbs,
    srcPath = source.pathname && source.pathname.split("/") || [],
    relPath = relative.pathname && relative.pathname.split("/") || [],
    psychotic = source.protocol && !slashedProtocol[source.protocol] && source.host !== undefined;

  // if the url is a non-slashed url, then relative links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if ( psychotic ) {

    delete source.hostname;
    delete source.auth;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === "") srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;

    if (relative.protocol) {
      delete relative.hostname;
      delete relative.auth;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === "") relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "");
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === "") ? relative.host : source.host;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ("search" in relative) {
    // just pull out the search.
    // like href="?foo".
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.host = srcPath.shift();
    }
    source.search = relative.search;
    source.query = relative.query;
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    return source;
  }

  // resolve dots.
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy, then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
    (source.host || relative.host) && (last === "." || last === "..")
    || last === ""
  );

  // Figure out if this has to end up as an absolute url, or should continue to be relative.
  srcPath = path.normalizeArray(srcPath, true);
  if (srcPath.length === 1 && srcPath[0] === ".") srcPath = [];
  if (mustEndAbs || removeAllDots) {
    // all dots must go.
    var dirs = [];
    srcPath.forEach(function (dir, i) {
      if (dir === "..") dirs.pop();
      else if (dir !== ".") dirs.push(dir);
    });

    if (mustEndAbs && dirs[0] !== "") {
      dirs.unshift("");
    }
    srcPath = dirs;
  }
  if (hasTrailingSlash && (srcPath.length < 2 || srcPath.slice(-1)[0] !== "")) srcPath.push("");

  // put the host back
  if ( psychotic ) source.host = srcPath[0] === "" ? "" : srcPath.shift();

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && srcPath[0] !== "") srcPath.unshift("")

  source.pathname = srcPath.join("/");

  return source;
};

function parseHost (host) {
  var out = {};
  var at = host.indexOf("@");
  if (at !== -1) {
    out.auth = host.substr(0, at);
    host = host.substr(at+1); // drop the @
  }
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

}(this.URL = this.URL || {}));