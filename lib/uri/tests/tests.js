//
//
// Tests
//
//

test("Acquire URI", function () {
	URI = require("./uri").URI;
	ok(URI);
});

test("URI Parsing", function () {
	var components;
	
	//scheme
	components = URI.parse("uri:");
	equal(components.scheme, "uri", "scheme");
	equal(components.authority, undefined, "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, undefined, "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, undefined, "fragment");
	
	//userinfo
	components = URI.parse("//@");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, "@", "authority");
	equal(components.userinfo, "", "userinfo");
	equal(components.host, "", "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, undefined, "fragment");
	
	//host
	components = URI.parse("//");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, "", "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, "", "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, undefined, "fragment");
	
	//port
	components = URI.parse("//:");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, ":", "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, "", "host");
	equal(components.port, "", "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, undefined, "fragment");
	
	//path
	components = URI.parse("");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, undefined, "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, undefined, "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, undefined, "fragment");
	
	//query
	components = URI.parse("?");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, undefined, "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, undefined, "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, "", "query");
	equal(components.fragment, undefined, "fragment");
	
	//fragment
	components = URI.parse("#");
	equal(components.scheme, undefined, "scheme");
	equal(components.authority, undefined, "authority");
	equal(components.userinfo, undefined, "userinfo");
	equal(components.host, undefined, "host");
	equal(components.port, undefined, "port");
	equal(components.path, "", "path");
	equal(components.query, undefined, "query");
	equal(components.fragment, "", "fragment");
	
	//all
	components = URI.parse("uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body");
	equal(components.scheme, "uri", "scheme");
	equal(components.authority, "user:pass@example.com:123", "authority");
	equal(components.userinfo, "user:pass", "userinfo");
	equal(components.host, "example.com", "host");
	equal(components.port, 123, "port");
	equal(components.path, "/one/two.three", "path");
	equal(components.query, "q1=a1&q2=a2", "query");
	equal(components.fragment, "body", "fragment");
});

test("URI Serialization", function () {
	var components = {
		scheme : "",
		userinfo : "",
		host : "",
		port : 0,
		path : "",
		query : "",
		fragment : ""
	};
	equal(URI.serialize(components), "//@:0", "Empty Components");
	
	//TODO: NEED MOAR TESTS!!
});

test("URI Resolving", function () {
	//normal examples from RFC 3986
	var base = "http://a/b/c/d;p?q";
	equal(URI.resolve(base, "g:h"), "g:h", "g:h");
	equal(URI.resolve(base, "g:h"), "g:h", "g:h");
	equal(URI.resolve(base, "g"), "http://a/b/c/g", "g");
	equal(URI.resolve(base, "./g"), "http://a/b/c/g", "./g");
	equal(URI.resolve(base, "g/"), "http://a/b/c/g/", "g/");
	equal(URI.resolve(base, "/g"), "http://a/g", "/g");
	equal(URI.resolve(base, "//g"), "http://g", "//g");
	equal(URI.resolve(base, "?y"), "http://a/b/c/d;p?y", "?y");
	equal(URI.resolve(base, "g?y"), "http://a/b/c/g?y", "g?y");
	equal(URI.resolve(base, "#s"), "http://a/b/c/d;p?q#s", "#s");
	equal(URI.resolve(base, "g#s"), "http://a/b/c/g#s", "g#s");
	equal(URI.resolve(base, "g?y#s"), "http://a/b/c/g?y#s", "g?y#s");
	equal(URI.resolve(base, ";x"), "http://a/b/c/;x", ";x");
	equal(URI.resolve(base, "g;x"), "http://a/b/c/g;x", "g;x");
	equal(URI.resolve(base, "g;x?y#s"), "http://a/b/c/g;x?y#s", "g;x?y#s");
	equal(URI.resolve(base, ""), "http://a/b/c/d;p?q", "");
	equal(URI.resolve(base, "."), "http://a/b/c/", ".");
	equal(URI.resolve(base, "./"), "http://a/b/c/", "./");
	equal(URI.resolve(base, ".."), "http://a/b/", "..");
	equal(URI.resolve(base, "../"), "http://a/b/", "../");
	equal(URI.resolve(base, "../g"), "http://a/b/g", "../g");
	equal(URI.resolve(base, "../.."), "http://a/", "../..");
	equal(URI.resolve(base, "../../"), "http://a/", "../../");
	equal(URI.resolve(base, "../../g"), "http://a/g", "../../g");
	
	//abnormal examples from RFC 3986
	equal(URI.resolve(base, "../../../g"), "http://a/g", "../../../g");
	equal(URI.resolve(base, "../../../../g"), "http://a/g", "../../../../g");
	
	equal(URI.resolve(base, "/./g"), "http://a/g", "/./g");
	equal(URI.resolve(base, "/../g"), "http://a/g", "/../g");
	equal(URI.resolve(base, "g."), "http://a/b/c/g.", "g.");
	equal(URI.resolve(base, ".g"), "http://a/b/c/.g", ".g");
	equal(URI.resolve(base, "g.."), "http://a/b/c/g..", "g..");
	equal(URI.resolve(base, "..g"), "http://a/b/c/..g", "..g");
      
	equal(URI.resolve(base, "./../g"), "http://a/b/g", "./../g");
	equal(URI.resolve(base, "./g/."), "http://a/b/c/g/", "./g/.");
	equal(URI.resolve(base, "g/./h"), "http://a/b/c/g/h", "g/./h");
	equal(URI.resolve(base, "g/../h"), "http://a/b/c/h", "g/../h");
	equal(URI.resolve(base, "g;x=1/./y"), "http://a/b/c/g;x=1/y", "g;x=1/./y");
	equal(URI.resolve(base, "g;x=1/../y"), "http://a/b/c/y", "g;x=1/../y");
      
	equal(URI.resolve(base, "g?y/./x"), "http://a/b/c/g?y/./x", "g?y/./x");
	equal(URI.resolve(base, "g?y/../x"), "http://a/b/c/g?y/../x", "g?y/../x");
	equal(URI.resolve(base, "g#s/./x"), "http://a/b/c/g#s/./x", "g#s/./x");
	equal(URI.resolve(base, "g#s/../x"), "http://a/b/c/g#s/../x", "g#s/../x");
      
	equal(URI.resolve(base, "http:g"), "http:g", "http:g");
	equal(URI.resolve(base, "http:g", {tolerant:true}), "http://a/b/c/g", "http:g");
      
});

test("URI Equals", function () {
	//test from RFC 3986
	equal(URI.equal("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d"), true);
});

test("Escape Component", function () {
	var input = "", output = "";
	for (var d = 32; d < 128; ++d) {
		input += String.fromCharCode(d);
		if (String.fromCharCode(d).match(/[0-9A-Za-z\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=]/)) {
			output += String.fromCharCode(d);
		} else {
			output += "%" + d.toString(16).toUpperCase();
		}
	}
	input += "\u00c0\u30a2";
	output += "%C3%80%E3%82%A2";
	
	equal(URI.escapeComponent(input), output);
});

test("Unescape Component", function () {
	var input = "", output = "";
	for (var d = 32; d < 128; ++d) {
		input += String.fromCharCode(d);
		if (String.fromCharCode(d).match(/[0-9A-Za-z\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=]/)) {
			output += String.fromCharCode(d);
		} else {
			output += "%" + d.toString(16).toUpperCase();
		}
	}
	input += "\u00c0\u30a2";
	output += "%C3%80%E3%82%A2";
	
	equal(URI.unescapeComponent(output), input);
});