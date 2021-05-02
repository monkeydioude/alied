

function FormulaDrawer(canvas) {

	//var canvas = canvas
	var DBG = false;
	var defaultVarValue = 7;
	var width = 1024;
	var height = 1024;
	var xMax = 256;
	var yMax = 256;
	var cellWidth = 4;
	var cellHeight = 4;
	var defaultOp = function(x, y) { return x ^ y; };
	var reservedVariables = {'x': true, 'y': true};
	var reservedVariablesCount = 2;
	var operatorAliases = {'A': '&', 'D': '/', 'M': '%', 'P': '+'};
	var operatorAliasKeys = Object.keys(operatorAliases).join('');

	// to parse variable values from parameters such as URL query
	/// 0..4 : means from 0 to 4 inclusive.
	var rangeOp = '..';

	var currentFormula = {"code": "x^y", "op": defaultOp };
	var animDelayMax = 10000;
	var animDelayMin = 50;
	var animDelay = 1000;
	var animId = null;
	var animFormula = null;
	var animDelta = 1;

	function parseNum(value, param, defaultValue) {
		var num = parseInt(value)
		if(isNaN(num)) {
			if(DBG) { console.log('cannot parse [%s] as an integer for [%s]', value, param); }
			num = defaultValue;
		}
		return num;
	};

	function anim() {
		internalAnim(animFormula);
	}

	function internalAnim(formula) {
		if(!formula) {
			if(DBG) { console.log('no anim formula, skip animation'); }
			return
		}
		var modified = false;
		if(undefined !== formula.v) {
			var index = reservedVariablesCount - 1;
			var boundFunc = animDelta > -1 ? Math.min : Math.max;
			for(var i in formula.v) {
				var v = formula.v[i];
				index++;

				if(undefined === v.actual || null === v.actual) {
					v.actual = animDelta > -1 ? v.start : v.end;
					if(DBG) { console.log('--anim init actual %s: %s', i, v.actual); }
				}
				else {
					v.actual += animDelta;
					var bound = animDelta > -1 ? v.end : v.start;
					v.actual = boundFunc(bound, v.actual)
					if(formula.vv[index] === v.actual) {
						// not modified skip.
						continue
					}
				}
				formula.vv[index] = v.actual;
				modified = true;
			}
		}
		//if(DBG) { console.log('-- anim: vv [%s]', JSON.stringify(formula.vv, null, 2)); }
		internalDraw(currentFormula);
		if(!modified) {
			if(DBG) { console.log('no more modification for animation, stop'); }
			internalStopAnim();
		}
	}

	function internalStartAnim() {
		internalStopAnim()
		animFormula = currentFormula;
		if(undefined === animFormula.v) {
			if(DBG) { console.log('no variables for animation: skip anim'); }
			return
		}
		var isAnimAbsent = true;
		for(var i in animFormula.v) {
			var v = animFormula.v[i]
			if(v.start === v.end) {
				continue
			}
			v.actual = null;
			isAnimAbsent = false;
		}
		if(isAnimAbsent) {
			if(DBG) { console.log('no range for variables: skip anim'); }
			return
		}
		animId = setInterval(anim, animDelay)
	}
	this.startAnim = function() {
		internalStartAnim();
	}

	function internalStopAnim() {
		if(undefined === animId || null === animId) {
			return;
		}
		clearInterval(animId);
		animId = null;
		animFormula = null;
	}

	this.stopAnim = function() {
		internalStopAnim();
	}

	this.init = function(conf) {
		var p, work;

		p = 'debug';
		DBG = (getFirstParam(conf, p, null) === 'true');
		console.log('DBG %s', DBG);

		p = 'cs';
		work = getFirstParam(conf, p, null)
		if(null !== work) {
			work = parseNum(work, p, -1);
			if(work > 0) {
				var cs = Math.min(yMax, Math.min(xMax, work));
				cellWidth = cs;
				cellHeight = cs;
			}
		}
		p = 'ym';
		work = getFirstParam(conf, p, null);
		if(null !== work) {
			work = parseNum(work, p, -1);
			if(work > 0) { yMax = Math.min(height, work); }
		}
		p = 'xm';
		work = getFirstParam(conf, p, null);
		if(null !== work) {
			work = parseNum(work, p, -1);
			if(work > 0) { xMax = Math.min(width, work); 	}
		}
		p = 'delay';
		work = getFirstParam(conf, p, null);
		if(null !== work) {
			work = parseNum(work, p, -1);
			if(work > 0) {
				animDelay = Math.min(Math.max(animDelayMin, work), animDelayMax);
			}
		}
	}
	
	function replaceOperatorAliases(value) {
		for(var i in operatorAliases) {
			value = value.replaceAll(i, operatorAliases[i]);
		}
		//if (DBG) { console.log('-- replaceOperatorAliases: after : [%s]', value); }
		return value;
	}

	function compile(formula) {
		// vv: array for variables values. The first two positions are reserved for x and y.
		// position 0: x value
		// position 1: y value
		if(undefined === formula.vv) {
			formula.vv = [0,0];
		}
		if('function' === typeof formula.op) {
			if(DBG) { console.log('-- compile: formula already compiled'); }
			return;
		}
		var funkCode = 'formula.op = function(x, y';
		if(undefined !== formula.v) {
			for(var i in formula.v) {
				funkCode += ',' + i;
				var v = formula.v[i];
				formula.vv.push(v.start)
			}
		}
		funkCode += ') { return (' + formula.code + '); }';
		if(DBG) { console.log('-- compile: formula op [%s]', funkCode); }
		try {
			eval(funkCode);
		}
		catch(e) {
			console.error('cannot compile formula [%s]: %s', funckCode, e);
			formula.op = defaultOp;
		}
	};

	function internalDraw(formula) {
		var opParams = formula.vv;
		var op = formula.op;
		context.clearRect(0, 0, width, height);
		for (let x = 0; x < xMax; x++) {
			for (let y = 0; y < yMax; y++) {
				opParams[0] = x;
				opParams[1] = y;

				if(op.apply(this, opParams)) {
					context.fillRect(x*cellWidth, y*cellHeight, cellWidth, cellHeight);
				}
			}
		}
	}

	/**
	 * Draw a formula.
	 * @param formula    a code string or a formula, compiled or not.
	 */
	this.draw = function(formula) {
		//if(DBG) { console.log('-- draw: formula : %s', JSON.stringify(formula, null, 2)); }
		if('string' === typeof formula) {
			formula = { code: formula };
		}
		if(undefined === formula.op) {
			compile(formula);
			if(DBG) { console.log('-- draw: compiled formula'); }
		}

		// should not happen
		if(undefined === formula.op) {
			console.error('formula op is not defined');
			return;
		}
		if(undefined === formula.vv) {
			console.error('formula op params are not defined');
			return;
		}
		internalStopAnim()
		currentFormula = formula
		internalDraw(formula);
	}

	this.parseFormula = function(conf, formulas, defaultFormula) {
		if(DBG) { console.log('-- parseFormula: conf [%s]', JSON.stringify(conf, null,2)); }
		var formula;

		if(undefined !== conf.f) {
			formula = formulas[conf.f];
			if(undefined === formula) {
				if(DBG) { console.error('no formula [%s] in library', conf.f); }
				formula = defaultFormula;
			}
			else {
				if(DBG) { console.log('formula [%s] found in library: %s', conf.f, formula.code); }
			}
		}
		else if(undefined !== conf.code) {
			if(DBG) { console.log('-- parseFormula: from URL [%s]', conf.code); }
			var code = conf.code;
			var codeRegex = new RegExp('^[a-z0-9' + operatorAliasKeys + ' +()%<>^*&|/+-]+$');
			if(codeRegex.test(code)) {
				var parseErrors = [];
				code = replaceOperatorAliases(code);
				formula = { code: code, v:{} };
				code.replace(
					new RegExp( "([a-z]+)", "g"),
					function(token) {
						if(/^[a-z]+$/.test(token)) {
							if(token.length > 1) {
								parseErrors[parseErrors.length] = 'illegal variable [' + token + ']. Must be one letter long.';
							}
							else if(undefined === reservedVariables[token]) {
								// register the variable if not registered.
								if(undefined === formula.v[token]) {
									formula.v[token] = {'name': token};
								}
							}
						}
						else {
							// ignore operators '+*-/^' and statement characters '()'
						}
					}
				);
				if(0 === parseErrors.length) {
					for(var i in formula.v) {
						var pName = 'v.' + i
						var pValue = getFirstParam(conf, pName);
						if(undefined === pValue || null === pValue) {
							var start = defaultVarValue;
							var end = defaultVarValue;
							console.log('-- parseFormula: set default value %s for [%s]', pValue, pName);
						}
						else {
							var index = pValue.indexOf(rangeOp);
							var tokens = index < 0 ? pValue : [pValue.substring(0, index), pValue.substring(index + rangeOp.length)];
							var start = parseNum(tokens[0], pName, defaultVarValue);
							if(tokens.length > 1) {
								var end = parseNum(tokens[1], pName, start);
							}
							else {
								var end = defaultVarValue;
							}
						}
						formula.v[i].start = start;
						formula.v[i].end = end;
					}
				}
				else {
					formula = defaultFormula;
					for(var i = 0; i < parseErrors.length; i++) {
						console.error('formula parse error: ' + parseErrors[i]);
					}
				}
			}
			else {
				console.error('illegal formula code: [%s], pattern [%s]', code, codeRegex.source);
				formula = defaultFormula;
			}
		}
		else {
			formula = defaultFormula;
		}
		compile(formula);
		if(DBG) { console.log('-- parsedFormula: %s', JSON.stringify(formula, null, 2)); }
		return formula;
	}
}
