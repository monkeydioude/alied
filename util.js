
if(!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}

function getFirstParam(data, key, defaultValue) {
	if(!data.hasOwnProperty(key)) {
		return defaultValue;
	}
	if(Array.isArray(data[key])) {
		return data[key][0];
	}
	return data[key];
}

/**
 * Parses a URL query.
 * @param q   Contains key value pairs. Key and value are separated by an equal sign,
 *   pairs are separated by ampersand. Key and value are decoded with `decodeURIComponent`,
 *   `+` characters are decoded as spaces.
 * @return an object with properties and value as single string or array of string.
 */
function parseUrlQuery(q) {
	function decodeQueryParam(s) {
		return decodeURIComponent(s.replace(/[+]/g, '%20'));
	}
	if(q.length > 0 && q.charAt(0) ==='?') {
		q = q.substring(1);
	}
	if('' === q ) { return []; }
	var params = q.split('&');
	var data = {};
	for(var i = 0; i < params.length; i++) {
		var param = params[i];
		var sepIndex = param.indexOf('=');
		if(sepIndex > -1) {
			var name = decodeQueryParam(param.substring(0, sepIndex));
			var value = decodeQueryParam(param.substring(sepIndex + 1));
		}
		else {
			var name = decodeQueryParam(param);
			var value = null;
		}
		if(data.hasOwnProperty(name)) {
			var v = data[name]
			if(!Array.isArray(v)) {
				data[name] = [v];
				v = data[name]
			}
			v[v.length] = value;
		}
		else {
			data[name] = value;
		}
	}
	return data;
}