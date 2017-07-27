(function ($, window, document) {

	$.fn.lineLoader = function( options ) {


		var options = $.extend( {}, $.fn.lineLoader.defaults, options );

		this.finishLoading = function(){
			options.slowing = false;
			options.speed = 10;
		}

		return this.each(function() {

			var element = $(this);

			window.requestAnimFrame = (function(){
				return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function( callback ){
					window.setTimeout(callback, 1000 / 60);
				};
			})();

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext("2d");

			var grd;
			var path;
			var progres = 0;
			var currentPath = 0;
			var t0 = 0;
			var t1 = 0;
			var height = 38;
			var finish = false;

			function percente(x1,y1, bx1, by1, bx2, by2, x2, y2){
				var u0 = 1 - t0;
				u1 = 1 - t1;

				qxa =  x1*u0*u0 + bx1*2*t0*u0 + bx2*t0*t0;
				qxb =  x1*u1*u1 + bx1*2*t1*u1 + bx2*t1*t1;
				qxc = bx1*u0*u0 + bx2*2*t0*u0 +  x2*t0*t0;
				qxd = bx1*u1*u1 + bx2*2*t1*u1 +  x2*t1*t1;

				qya =  y1*u0*u0 + by1*2*t0*u0 + by2*t0*t0;
				qyb =  y1*u1*u1 + by1*2*t1*u1 + by2*t1*t1;
				qyc = by1*u0*u0 + by2*2*t0*u0 +  y2*t0*t0;
				qyd = by1*u1*u1 + by2*2*t1*u1 +  y2*t1*t1;

				xa = qxa*u0 + qxc*t0;
				xb = qxa*u1 + qxc*t1;
				xc = qxb*u0 + qxd*t0;
				xd = qxb*u1 + qxd*t1;

				ya = qya*u0 + qyc*t0;
				yb = qya*u1 + qyc*t1;
				yc = qyb*u0 + qyd*t0;
				yd = qyb*u1 + qyd*t1;

				return [xa,ya,xb,yb,xc,yc,xd,yd];
			}

			function drawCurve(x1,y1, bx1, by1, bx2, by2, x2, y2) {
				ctx.lineTo(x1, y1);
				ctx.bezierCurveTo(bx1, by1, bx2, by2, x2, y2);
			}

			function drawPath(){
				ctx.beginPath();
				for (var i = 0; i < path.length; i++) {
					if(i == currentPath){
						path[i][8] = path[i][8] >= 1 ? true : path[i][8];
						currentPath = path[i][8] >= 1 ? currentPath += 1 : currentPath;
						t1 = path[i][8] >= 1 ? 0 : t1;
						t1 = path[i][8];
						var v = percente(path[i][0],path[i][1], path[i][2],path[i][3], path[i][4],path[i][5], path[i][6],path[i][7]);
						drawCurve(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
						path[i][8] += options.speed;
					}
					else if(path[i][8]){
						drawCurve(path[i][0], path[i][1], path[i][2], path[i][3], path[i][4], path[i][5], path[i][6], path[i][7]);
					}
				};
				ctx.lineWidth = options.lineSize;
				ctx.lineJoin = options.lineJoin;
				ctx.strokeStyle = options.color;
				ctx.stroke();

				if(options.slowing) {
					options.speed = options.speed/options.slowingSpeed;
				}
			}

			function getStartingX(string) {
				var width = 0;
				for (var i = 0; i < string.length; i++) {
					width += $.fn.lineLoader.map[string[i]].width;
				};
				return canvas.width/2 - width/2;
			}

			function calculateNewX(array, x, y) {
				var newArray = [];
				for (var i = 0; i < array.length; i++) {
					newArray.push(i%2 ? array[i] + y : array[i] + x);
				};
				newArray.push(false);
				return newArray;
			}

			function calculateNewPath(array, x, y) {
				var newArray = [];
				for (var i = 0; i < array.length; i++) {
					newArray.push(calculateNewX(array[i], x, y));
				};
				return newArray;
			}

			function getFirstLine() {
				return [0, canvas.height/2 + height, 0, canvas.height/2 + height, getStartingX(options.text), canvas.height/2 + height, getStartingX(options.text), canvas.height/2 + height, false];
			}

			function getLastLine(string) {
				var width = 0;
				for (var i = 0; i < string.length; i++) {
					width += $.fn.lineLoader.map[string[i]].width;
				};
				var x = canvas.width/2 + width;
				return [x, canvas.height/2 + height, x, canvas.height/2 + height, canvas.width, canvas.height/2 + height, canvas.width, canvas.height/2 + height, false];
			}

			function makePath(string) {
				var x = getStartingX(string);
				var y = canvas.height/2;
				var path = [];
				path.push(getFirstLine())
				for (var i = 0; i < string.length; i++) {
					var newPath = calculateNewPath($.fn.lineLoader.map[string[i]].path, x, y);
					path = path.concat(newPath);
					x += $.fn.lineLoader.map[string[i]].width;
				};
				path.push(getLastLine(string))

				return path;
			}

			function drawBackground(){
				ctx.fillStyle = options.gradientBackground ? grd : options.backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			function trimText(text) {
				var newText = text.replace(/[^\w\s]/gi, '');
				return newText.toLowerCase();
			}

			function resize() {
				var box = canvas.getBoundingClientRect();
				canvas.width = box.width;
				canvas.height = box.height;
				grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.height);
				grd.addColorStop(0, options.gradientColor1);
				grd.addColorStop(1, options.gradientColor2);
			}

			function setFullPath(to) {
				for (var i = 0; i < to; i++) {
					path[i][path[i].length-1] = true;
				};
			}

			function isFinish() {
				if(path[path.length-1][path[path.length-1].length-1] >= 1 && !finish) {
					finish = true;
					if(options.fadeOut) {
						$(canvas).fadeOut(options.fadeOutDuration, function() { 
							$(this).remove();
							if(options.onFinish) {
								options.onFinish.call(); 
							}
							if(options.hideScroll) {
								element.css('overflow', 'auto');
							}
						});
					} else {
						$(canvas).remove();
						if(options.onFinish) {
							options.onFinish.call(); 
						}
						if(options.hideScroll) {
							element.css('overflow', 'auto');
						}
					}
				}
			} 

			function reDraw() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				drawBackground();
				drawPath();
				isFinish();
				requestAnimationFrame(reDraw);
			}

			function start() {
				$(canvas).css(options.canvas.style).appendTo(element);
				if(options.fadeIn) {
					$(canvas).hide().fadeIn(options.fadeInDuration);
				}
				if(options.hideScroll) {
					element.css('overflow', 'hidden');
				}
				options.text = trimText(options.text);
				resize();
				path = makePath(options.text);
				reDraw();
			}

			start();

			$(window).resize(function() {
				resize();
				path = makePath(options.text);
				setFullPath(currentPath)
			});
		});

	}

	$.fn.lineLoader.defaults = {

		text: 'BAY ADVENTURE',
		color: '#2c3e50',
		lineSize: 1.5,
		lineJoin: 'round',

		speed: 1,
		slowing: false,
		slowingSpeed: 1.04,

		hideScroll: false,

		fadeIn: false,
		fadeInDuration: 300,
		fadeOut: true,
		fadeOutDuration: 500,

		backgroundColor: 'transparent',

		gradientBackground: false,
		gradientColor1: '#95a5a6',
		gradientColor2: '#7f8c8d',

		canvas: {
			id: 'line-loader',
			style: {
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				backgroundColor: 'transparent',
				zIndex: 9999999
			}
		}
	}

	$.fn.lineLoader.map = {
		a: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							18.746,2.209,18.746,2.209],
				[18.746,2.209,18.746,2.209,			23.848,2.209,23.848,2.209],
				[23.848,2.209,23.848,2.209,			38.497,38,38.497,38],
				[38.497,38,38.497,38,				43.497,38,43.497,38]
				],
			width: 43.497
		},
		b: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					18.428,2.209,18.428,2.209],
				[18.428,2.209,21.146,2.208,			23.354,2.562,25.007,3.296],
				[25.007,3.296,26.688,4,				27.969,5.094,28.888,6.641],
				[28.888,6.641,29.844,8.125,			29.878,14.313,29.048,15.686],
				[29.048,15.686,28.224,17.029,		26.965,18.124,25.289,18.957],
				[25.289,18.957,27.441,19.588,		29.112,20.676,30.281,22.204],
				[30.281,22.204,31.441,23.724,		32.029,25.535,32.027,27.624],
				[32.027,27.624,32.024,29.294,		31.671,30.853,30.964,32.3],
				[30.964,32.3,30.247,33.735,			29.382,34.847,28.339,35.632],
				[28.339,35.632,27.306,36.412,		26,37,24.421,37.402],
				[24.421,37.402,22.853,37.794,		20.929,38,18.647,38],
				[20.929,38,20.929,38,				25.929,38,25.929,38]
			],
			width: 40
		},
		c: {
			path: [
				[0,38,0,38,							19.821,38,19.821,38],
				[19.821,38,17.938,37.982,			14.824,37.812,12.41,36.255],
				[12.41,36.255,9.994,34.682,			8.153,32.406,6.892,29.431],
				[6.892,29.431,5.635,26.447,			4.994,23.253,5,19.835],
				[5,19.835,5,16.112,					5.718,12.859,7.136,10.083],
				[7.136,10.083,8.553,7.288,			10.582,5.194,13.215,3.76],
				[13.215,3.76,15.835,2.324,			18.729,1.594,21.895,1.599],
				[21.895,1.599,25.471,1.594,			28.494,2.512,30.928,4.333],
				[30.928,4.333,33.371,6.159,			35.071,8.706,36.031,12.024],
				[36.031,12.024,36.031,12.024,		31.367,13.123,31.367,13.123],
				[31.367,13.123,30.535,10.512,		29.335,8.618,27.754,7.434],
				[27.754,7.434,26.171,6.241,			24.188,5.641,21.797,5.652],
				[21.797,5.652,19.053,5.647,			16.747,6.306,14.9,7.629],
				[14.9,7.629,13.053,8.947,			11.747,10.712,11.006,12.939],
				[11.006,12.939,10.265,15.153,		9.882,17.453,9.883,19.812],
				[9.883,19.812,9.876,22.853,			10.318,25.505,11.213,27.783],
				[11.213,27.783,12.1,30.054,			13.488,31.729,15.352,32.873],
				[15.352,32.873,17.212,33.994,		19.247,34.547,21.431,34.558],
				[21.431,34.558,24.082,34.553,		26.329,33.794,28.169,32.263],
				[28.169,32.263,30,30.729,			31.247,28.459,31.904,25.451],
				[31.904,25.451,31.904,25.451,		36.641,26.647,36.641,26.647],
				[36.641,26.647,35.639,30.522,		33.851,33.502,31.281,35.547],
				[31.281,35.547,28.698,37.565,		25.545,38,23.821,38],
				[23.821,38,21.821,38,				41.641,38,41.641,38]
			],
			width: 41.641
		},
		d: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					17.329,2.209,17.329,2.209],
				[17.329,2.209,20.104,2.188,			22.236,2.375,23.701,2.722],
				[23.701,2.722,25.75,3.167,			27.5,4.021,28.951,5.286],
				[28.951,5.286,30.833,6.854,			32.292,8.896,33.186,11.401],
				[33.186,11.401,34.104,13.875,		34.583,16.708,34.59,19.909],
				[34.59,19.909,34.604,22.604,		34.271,25.021,33.639,27.136],
				[33.639,27.136,32.979,29.229,		32.188,30.958,31.197,32.349],
				[31.197,32.349,30.208,33.708,		29.125,34.792,27.938,35.596],
				[27.938,35.596,26.354,36.646,		24.958,37.021,23.664,37.39],
				[23.664,37.39,22.354,37.729,		20.396,38.137,17.915,38],
				[17.915,38,17.915,38,				39.59,38,39.59,38]
			],
			width: 39.59
		},
		e: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					30.878,2.209,30.878,2.209],
				[30.878,2.209,30.878,2.209,			30.878,6.433,30.878,6.433],
				[30.878,6.433,30.878,6.433,			9.736,6.433,9.736,6.433],
				[9.736,6.433,9.736,6.433,			9.736,17.395,9.736,17.395],
				[9.736,17.395,9.736,17.395,			29.537,17.395,29.537,17.395],
				[29.537,17.395,29.537,17.395,		29.537,21.594,29.537,21.594],
				[29.537,21.594,29.537,21.594,		9.736,21.594,9.736,21.594],
				[9.736,21.594,9.736,21.594,			9.736,33.776,9.736,33.776],
				[9.736,33.776,9.736,33.776,			31.708,33.776,31.708,33.776],
				[31.708,33.776,31.708,33.776,		31.708,38,31.708,38],
				[31.708,38,31.708,38,				36.708,38,36.708,38]
			],
			width: 36.708
		},
		f: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					29.146,2.209,29.146,2.209],
				[29.146,2.209,29.146,2.209,			29.146,6.433,29.146,6.433],
				[29.146,6.433,29.146,6.433,			9.736,6.433,9.736,6.433],
				[9.736,6.433,9.736,6.433,			9.736,17.517,9.736,17.517],
				[9.736,17.517,9.736,17.517,			26.533,17.517,26.533,17.517],
				[26.533,17.517,26.533,17.517,		26.533,21.74,26.533,21.74],
				[26.533,21.74,26.533,21.74,			9.736,21.74,9.736,21.74],
				[9.736,21.74,9.736,21.74,			9.736,38,9.736,38],
				[9.736,38,9.736,38,					34.146,38,34.146,38]
			],
			width: 34.146
		},
		g: {
			path: [
				[0,38,0,38,							21.286,38,21.286,38],
				[21.286,38,19.773,37.988,			16.573,37.863,13.704,36.353],
				[13.704,36.353,10.831,34.843,		8.659,32.663,7.197,29.821],
				[7.197,29.821,5.729,26.976,			5,23.776,5,20.275],
				[5,20.275,4.988,16.788,				5.718,13.529,7.185,10.522],
				[7.185,10.522,8.647,7.494,			10.741,5.235,13.472,3.796],
				[13.472,3.796,16.212,2.318,			19.353,1.588,22.92,1.599],
				[22.92,1.599,25.506,1.588,			27.835,2.012,29.939,2.856],
				[29.939,2.856,32.047,3.682,			33.671,4.835,34.859,6.36],
				[34.859,6.36,36.047,7.859,			36.953,9.8,37.568,12.219],
				[37.568,12.219,37.568,12.219,		33.297,13.391,33.297,13.391],
				[33.297,13.391,32.765,11.565,		32.094,10.129,31.295,9.094],
				[31.295,9.094,30.482,8.047,			29.357,7.224,27.876,6.592],
				[27.876,6.592,26.412,5.965,			24.753,5.635,22.944,5.652],
				[22.944,5.652,20.776,5.647,			18.918,5.976,17.329,6.641],
				[17.329,6.641,15.741,7.282,			14.482,8.153,13.508,9.241],
				[13.508,9.241,12.541,10.306,		11.788,11.482,11.25,12.781],
				[11.25,12.781,10.329,14.988,		9.882,17.388,9.883,19.982],
				[9.883,19.982,9.882,23.165,			10.435,25.835,11.531,27.99],
				[11.531,27.99,12.624,30.129,		14.212,31.729,16.328,32.775],
				[16.328,32.775,18.424,33.8,			20.659,34.341,23.018,34.338],
				[23.018,34.338,25.071,34.341,		27.059,33.929,29.023,33.154],
				[29.023,33.154,30.965,32.365,		32.471,31.506,33.467,30.627],
				[33.467,30.627,33.467,30.627,		33.467,23.962,33.467,23.962],
				[33.467,23.962,33.467,23.962,		22.944,23.962,22.944,23.962],
				[22.944,23.962,22.944,23.962,		22.944,19.763,22.944,19.763],
				[22.944,19.763,22.944,19.763,		38.105,19.738,38.105,19.738],
				[38.105,19.738,38.105,19.738,		38.105,33.02,38.105,33.02],
				[38.105,33.02,35.776,34.859,		33.365,36.271,30.903,37.207],
				[30.903,37.207,28.435,38.129,		25.882,38,25.286,38],
				[25.882,38,25.286,38,				43.105,38,43.105,38]
			],
			width: 43.105
		},
		h: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.736,2.209,9.736,2.209],
				[9.736,2.209,9.736,2.209,			9.736,16.906,9.736,16.906],
				[9.736,16.906,9.736,16.906,			28.34,16.906,28.34,16.906],
				[28.34,16.906,28.34,16.906,			28.34,2.209,28.34,2.209],
				[28.34,2.209,28.34,2.209,			33.076,2.209,33.076,2.209],
				[33.076,2.209,33.076,2.209,			33.076,38,33.076,38],
				[33.076,38,33.076,38,				38.076,38,38.076,38]
			],
			width: 38.076
		},
		i: {
			path:[
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.736,2.209,9.736,2.209],
				[9.736,2.209,9.736,2.209,			9.736,38,9.736,38],
				[9.736,38,9.736,38,					14.736,38,14.736,38]
			],
			width: 14.736
		},
		j: {
			path: [
				[0,38,0,38,							12.623,38,12.623,38],
				[12.623,38,11.484,37.984,			9.078,37.672,7.408,35.9],
				[7.408,35.9,5.74,34.063,			4.953,31.375,5.004,27.844],
				[5.004,27.844,5.004,27.844,			9.276,27.258,9.276,27.258],
				[9.276,27.258,9.406,29.984,			9.922,31.844,10.814,32.873],
				[10.814,32.873,11.703,33.875,		12.987,34.391,14.598,34.387],
				[14.598,34.387,15.781,34.375,		16.828,34.094,17.675,33.569],
				[17.675,33.569,18.516,33,			19.125,32.25,19.456,31.348],
				[19.456,31.348,19.797,30.406,		19.938,28.906,19.945,26.867],
				[19.945,26.867,19.945,26.867,		19.945,2.209,19.945,2.209],
				[19.945,2.209,19.945,2.209,			24.681,2.209,24.681,2.209],
				[24.681,2.209,24.681,2.209,			24.681,26.599,24.681,26.599],
				[24.681,26.599,24.688,29.563,		24.313,31.891,23.595,33.557],
				[23.595,33.557,22.875,35.203,		21.723,36.453,20.153,37.316],
				[20.153,37.316,18.576,38.182,		16.737,38,16.623,38],
				[16.623,38,16.623,38,				29.681,38,29.681,38]
			],
			width: 40
		},
		k: {
			path:[
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.736,2.209,9.736,2.209],
				[9.736,2.209,9.736,2.209,			9.736,19.958,9.736,19.958],
				[9.736,19.958,9.736,19.958,			27.509,2.209,27.509,2.209],
				[27.509,2.209,27.509,2.209,			33.931,2.209,33.931,2.209],
				[33.931,2.209,33.931,2.209,			18.916,16.711,18.916,16.711],
				[18.916,16.711,18.916,16.711,		34.589,38,34.589,38],
				[34.589,38,34.589,38,				39.589,38,39.589,38]
			],
			width: 39.589
		},
		l: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.736,2.209,9.736,2.209],
				[9.736,2.209,9.736,2.209,			9.736,33.776,9.736,33.776],
				[9.736,33.776,9.736,33.776,			27.363,33.776,27.363,33.776],
				[27.363,33.776,27.363,33.776,		27.363,38,27.363,38],
				[27.363,38,27.363,38,32.363,		38,32.363,38]
			],
			width: 32.363
		},
		m: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					12.129,2.209,12.129,2.209],
				[12.129,2.209,12.129,2.209,			22.31,32.849,22.31,32.849],
				[22.31,32.849,22.31,32.849,			32.783,2.209,32.783,2.209],
				[32.783,2.209,32.783,2.209,			39.156,2.209,39.156,2.209],
				[39.156,2.209,39.156,2.209,			39.156,38,39.156,38],
				[39.156,38,39.156,38,				44.156,38,44.156,38]
			],
			width: 44.156
		},
		n: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.858,2.209,9.858,2.209],
				[9.858,2.209,9.858,2.209,			28.657,30.31,28.657,30.31],
				[28.657,30.31,28.657,30.31,			28.657,2.209,28.657,2.209],
				[28.657,2.209,28.657,2.209,			33.199,2.209,33.199,2.209],
				[33.199,2.209,33.199,2.209,			33.199,38,33.199,38],
				[33.199,38,33.199,38,				38.199,38,38.199,38]
			],
			width: 38.199
		},
		o: {
			path: [
				[0,38,0,38,							19.114,38,19.114,38],
				[19.114,38,18.75,37.973,			15.725,37.8,13.081,36.169],
				[13.081,36.169,10.424,34.537,		8.417,32.31,7.051,29.504],
				[7.051,29.504,5.667,26.667,			5.021,23.688,5,20.568],
				[5,20.568,5.021,14.625,				6.563,9.979,9.785,6.616],
				[9.785,6.616,12.958,3.229,			17.062,1.562,22.139,1.575],
				[22.139,1.575,25.438,1.562,			28.417,2.333,31.074,3.943],
				[31.074,3.943,33.729,5.479,			35.75,7.687,37.143,10.547],
				[37.143,10.547,38.583,13.354,		39.229,16.563,39.229,20.153],
				[39.229,20.153,39.208,23.771,		38.479,26.979,37.031,29.895],
				[37.031,29.895,35.563,32.729,		33.521,34.917,30.806,36.401],
				[30.806,36.401,28.104,37.875,		25.229,37.979,24.114,38],
				[24.114,38,24.114,38,				44.229,38,44.229,38]
			],
			width: 44.229
		},
		p: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					18.501,2.209,18.501,2.209],
				[18.501,2.209,20.875,2.156,			22.703,2.313,23.945,2.551],
				[23.945,2.551,25.703,2.828,			27.172,3.406,28.364,4.224],
				[28.364,4.224,29.542,5.021,			30.521,6.146,31.233,7.678],
				[31.233,7.678,31.958,9.146,			32.306,10.776,32.319,12.561],
				[32.319,12.561,32.318,15.576,		31.365,18.165,29.415,20.288],
				[29.415,20.288,27.482,22.388,		23.976,23.447,18.916,23.449],
				[18.916,23.449,18.916,23.449,		9.736,23.449,9.736,23.449],
				[9.736,23.449,9.736,23.449,			9.736,38,9.736,38],
				[9.736,38,9.736,38,					37.306,38,37.306,38]
			],
			width: 35
		},
		q: {
			path: [
				[0,38,0,38,							22.041,38,22.041,38],
				[22.041,38,37.988,37.988,			15.847,37.8,13.228,36.267],
				[13.228,36.267,10.576,34.694,		8.565,32.506,7.136,29.675],
				[7.136,29.675,5.718,26.835,			5.012,23.635,5,20.104],
				[5,20.104,5.012,16.565,				5.729,13.353,7.148,10.461],
				[7.148,10.461,8.576,7.576,			10.624,5.353,13.264,3.845],
				[13.264,3.845,15.906,2.318,			18.859,1.576,22.139,1.575],
				[22.139,1.575,25.435,1.576,			28.435,2.365,31.074,3.931],
				[31.074,3.931,33.718,5.482,			35.765,7.694,37.142,10.522],
				[37.142,10.522,38.541,13.318,		39.247,16.506,39.229,20.08],
				[39.229,20.08,39.235,23,			38.776,25.647,37.886,28.027],
				[37.886,28.027,36.988,30.365,		35.647,32.412,33.833,34.167],
				[33.833,34.167,36.024,35.659,		39.835,37.318,41.696,38],
				[41.696,38,41.696,38,				46.696,38,46.696,38]
			],
			width: 40
		},
		r: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,2.209,5,2.209],
				[5,2.209,5,2.209,					20.869,2.209,20.869,2.209],
				[20.869,2.209,24.06,2.188,			26.479,2.521,28.145,3.174],
				[28.145,3.174,29.804,3.808,			31.129,4.945,32.124,6.58],
				[32.124,6.58,33.106,8.2,			33.616,9.996,33.614,11.975],
				[33.614,11.975,33.608,14.514,		32.784,16.655,31.147,18.396],
				[31.147,18.396,29.514,20.129,		26.965,21.243,23.53,21.716],
				[23.53,21.716,24.784,22.302,		25.741,22.906,26.387,23.498],
				[26.387,23.498,27.78,24.749,		29.082,26.349,30.317,28.259],
				[30.317,28.259,30.317,28.259,		36.544,38,36.544,38],
				[36.544,38,36.544,38,				41.544,38,41.544,38]
			],
			width: 41.544
		},
		s: {
			path: [
				[0,38,0,38,							18.259,38,18.259,38],
				[18.259,38,17.042,38,				14.312,38.145,12.117,37.194],
				[12.117,37.194,9.958,36.229,		8.167,34.833,6.965,32.935],
				[6.965,32.935,5.729,31.042,			5.062,28.875,5,26.501],
				[5,26.501,5,26.501,					9.468,26.11,9.468,26.11],
				[9.468,26.11,9.667,27.875,			10.145,29.37,10.945,30.518],
				[10.945,30.518,11.687,31.646,		12.896,32.583,14.546,33.301],
				[14.546,33.301,16.208,33.979,		17.979,34.396,20.039,34.362],
				[20.039,34.362,21.833,34.313,		27.229,32.271,27.913,31.348],
				[27.913,31.348,28.587,30.417,		28.917,29.354,28.925,28.283],
				[28.925,28.283,28.925,27.125,		28.625,26.167,27.949,25.342],
				[27.949,25.342,27.302,24.498,		26.227,23.784,24.726,23.229],
				[24.726,23.229,23.765,22.851,		21.631,22.263,18.354,21.484],
				[18.354,21.484,15.075,20.686,		12.769,19.925,11.445,19.25],
				[11.445,19.25,9.733,18.357,			8.447,17.235,7.625,15.918],
				[7.625,15.918,8.453,17.234,			6.375,13.063,6.367,11.462],
				[6.367,11.462,6.375,9.625,			6.875,7.953,7.905,6.396],
				[7.905,6.396,8.933,4.835,			10.439,3.627,12.397,2.82],
				[12.397,2.82,14.376,2.012,			16.573,1.588,18.965,1.599],
				[18.965,1.599,21.624,1.58,			23.969,2.02,25.984,2.881],
				[25.984,2.881,28,3.737,				29.561,4.992,30.66,6.653],
				[30.66,6.653,31.741,8.294,			32.337,10.184,32.417,12.292],
				[32.417,12.292,32.417,12.292,		27.876,12.634,27.876,12.634],
				[27.876,12.634,27.624,10.349,		26.808,8.639,25.398,7.507],
				[25.398,7.507,23.976,6.341,			21.922,5.769,19.16,5.774],
				[19.16,5.774,16.306,5.769,			14.208,6.302,12.898,7.349],
				[12.898,7.349,11.584,8.388,			10.933,9.667,10.933,11.145],
				[10.933,11.145,10.949,12.42,		11.396,13.478,12.324,14.319],
				[12.324,14.319,13.235,15.141,		15.612,16,19.465,16.87],
				[19.465,16.87,23.318,17.718,		25.941,18.494,27.388,19.152],
				[27.388,19.152,29.471,20.118,		31.012,21.306,32.001,22.803],
				[32.001,22.803,32.988,24.259,		33.494,25.976,33.492,27.893],
				[33.492,27.893,33.492,29.776,		32.929,31.576,31.855,33.276],
				[31.855,33.276,30.753,34.953,		29.2,36.271,27.156,37.207],
				[27.156,37.207,25.129,38.165,		22.8,38,22.259,38],
				[22.259,38,22.259,38,				38.494,38,38.494,38]
			],
			width: 40
		},
		t: {
			path: [
				[0,38,0,38,							16.792,38,16.792,38],
				[16.792,38,16.792,38,				16.792,6.433,16.792,6.433],
				[16.792,6.433,16.792,6.433,			5,6.433,5,6.433],
				[5,6.433,5,6.433,					5,2.209,5,2.209],
				[5,2.209,5,2.209,					33.369,2.209,33.369,2.209],
				[33.369,2.209,33.369,2.209,			33.369,6.433,33.369,6.433],
				[33.369,6.433,33.369,6.433,			21.529,6.433,21.529,6.433],
				[21.529,6.433,21.529,6.433,			21.529,38,21.529,38],
				[21.529,38,21.529,38,				38.369,38,38.369,38]
			],
			width: 38.369
		},
		u: {
			path: [
				[0,38,0,38,							16.16,38,16.16,38],
				[16.16,38,15.813,38,				13.059,38.035,10.933,36.877],
				[10.933,36.877,8.788,35.718,		7.259,34.035,6.367,31.86],
				[6.367,31.86,5.456,29.682,			5,26.682,5,22.888],
				[5,22.888,5,22.888,					5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.736,2.209,9.736,2.209],
				[9.736,2.209,9.736,2.209,			9.736,22.863,9.736,22.863],
				[9.736,22.863,9.729,25.965,			10.012,28.259,10.603,29.736],
				[10.603,29.736,11.165,31.2,			12.176,32.351,13.582,33.142],
				[13.582,33.142,14.988,33.929,		16.706,34.329,18.745,34.338],
				[18.745,34.338,22.228,33.529,		24.707,34.341,26.191,31.97],
				[26.191,31.97,27.659,30.388,		28.413,27.353,28.413,22.863],
				[28.413,22.863,28.413,22.863,		28.413,2.209,28.413,2.209],
				[28.413,2.209,28.413,2.209,			33.149,2.209,33.149,2.209],
				[33.149,2.209,33.149,2.209,			33.149,22.888,33.149,22.888],
				[33.149,22.888,33.149,26.459,		32.743,29.329,31.929,31.457],
				[31.929,31.457,31.106,33.565,		29.646,35.282,27.522,36.621],
				[27.522,36.621,25.388,37.941,		22.612,38,22,38],
				[22.612,38,22,38,				38.149,38,38.149,38]
			],
			width: 38.149
		},
		v: {
			path: [
				[0,38,0,38,							18.867,38,18.867,38],
				[18.867,38,18.867,38,				5,2.209,5,2.209],
				[5,2.209,5,2.209,					10.127,2.209,10.127,2.209],
				[10.127,2.209,10.127,2.209,			21.309,34.069,21.309,34.069],
				[21.309,34.069,21.309,34.069,		32.905,2.209,32.905,2.209],
				[32.905,2.209,32.905,2.209,			37.739,2.209,37.739,2.209],
				[37.739,2.209,37.739,2.209,			23.725,38,23.725,38],
				[23.725,38,23.725,38,				42.739,38,42.739,38]
			],
			width: 42.739
		},
		w: {
			path: [
				[0,38,0,38,							14.497,38,14.497,38],
				[14.497,38,14.497,38,				5,2.209,5,2.209],
				[5,2.209,5,2.209,					9.858,2.209,9.858,2.209],
				[9.858,2.209,9.858,2.209,			16.816,32.995,16.816,32.995],
				[16.816,32.995,16.816,32.995,		25.239,2.209,25.239,2.209],
				[25.239,2.209,25.239,2.209,			30.952,2.209,30.952,2.209],
				[30.952,2.209,30.952,2.209,			38.863,32.995,38.863,32.995],
				[38.863,32.995,38.863,32.995,		46.26,2.209,46.26,2.209],
				[46.26,2.209,46.26,2.209,			51.021,2.209,51.021,2.209],
				[51.021,2.209,51.021,2.209,			41.207,38,41.207,38],
				[41.207,38,41.207,38,				56.021,38,56.021,38]
			],
			width: 56.021
		},
		x: {
			path: [
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							18.843,19.348,18.843,19.348],
				[18.843,19.348,18.843,19.348,		6.636,2.209,6.636,2.209],
				[6.636,2.209,6.636,2.209,			12.275,2.209,12.275,2.209],
				[12.275,2.209,12.275,2.209,			21.65,15.783,21.65,15.783],
				[21.65,15.783,21.65,15.783,			31.684,2.209,31.684,2.209],
				[31.684,2.209,31.684,2.209,			36.836,2.209,36.836,2.209],
				[36.836,2.209,36.836,2.209,			24.262,19.079,24.262,19.079],
				[24.262,19.079,24.262,19.079,		37.813,38,37.813,38],
				[37.813,38,37.813,38,				42.813,38,42.813,38]
			],
			width: 42.813
		},
		y: {
			path:[
				[0,38,0,38,							18.794,38,18.794,38],
				[18.794,38,18.794,38,				18.794,22.839,18.794,22.839],
				[18.794,22.839,18.794,22.839,		5,2.209,5,2.209],
				[5,2.209,5,2.209,					10.762,2.209,10.762,2.209],
				[10.762,2.209,10.762,2.209,			21.455,19.055,21.455,19.055],
				[21.455,19.055,21.455,19.055,		32.296,2.209,32.296,2.209],
				[32.296,2.209,32.296,2.209,			37.813,2.209,37.813,2.209],
				[37.813,2.209,37.813,2.209,			23.53,22.839,23.53,22.839],
				[23.53,22.839,23.53,22.839,			23.53,38,23.53,38],
				[23.53,38,23.53,38,					42.813,38,42.813,38]
			],
			width: 42.813
		},
		z: {
			path:[
				[0,38,0,38,							5,38,5,38],
				[5,38,5,38,							5,33.605,5,33.605],
				[5,33.605,5,33.605,					27.046,6.433,27.046,6.433],
				[27.046,6.433,27.046,6.433,			7.075,6.433,7.075,6.433],
				[7.075,6.433,7.075,6.433,			7.075,2.209,7.075,2.209],
				[7.075,2.209,7.075,2.209,			32.71,2.209,32.71,2.209],
				[32.71,2.209,32.71,2.209,			32.71,6.433,32.71,6.433],
				[32.71,6.433,32.71,6.433,			10.444,33.776,10.444,33.776],
				[10.444,33.776,10.444,33.776,		33.296,33.776,33.296,33.776],
				[33.296,33.776,33.296,33.776,		33.296,38,33.296,38],
				[33.296,38,33.296,38,				38.296,38,38.296,38]
			],
			width: 38.296
		},
		' ': {
			path: [
				[0,38,0,38,							30,38,30,38]
			],
			width: 30
		},
	};

}(jQuery, window, document));


function showLoader() {
  var text = $('#text').val();
  $('body').lineLoader({
    text: text,
    gradientBackground: true,
    speed: 0.6,
    color: '#ecf0f1',
    gradientColor1: '#1abc9c',
    gradientColor2: '#16a085'
  });
}

$('#reload').click(showLoader);

showLoader();