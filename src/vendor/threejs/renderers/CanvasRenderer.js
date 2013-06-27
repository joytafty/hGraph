/**
 * @author mrdoob / http://mrdoob.com/
 * @modified_by dadleyy / 
 */
THREE.CanvasRenderer = function ( parameters ) {

	var smoothstep = THREE.Math.smoothstep;

	parameters = parameters || {};

	var _this = this,
	_renderData, _elements, _lights,
	_projector = new THREE.Projector(),

	_canvas = parameters.canvas !== undefined
			? parameters.canvas
			: document.createElement( 'canvas' ),

	_canvasWidth, _canvasHeight, _canvasWidthHalf, _canvasHeightHalf,
	_context = _canvas.getContext( '2d' ),

	_clearColor = new THREE.Color( 0x000000 ),
	_clearAlpha = 0,

	_contextGlobalAlpha = 1,
	_contextGlobalCompositeOperation = 0,
	_contextStrokeStyle = null,
	_contextFillStyle = null,
	_contextLineWidth = null,
	_contextLineCap = null,
	_contextLineJoin = null,
	_contextDashSize = null,
	_contextGapSize = 0,

	_v1, _v2, _v3, _v4,
	_v5 = new THREE.RenderableVertex(),
	_v6 = new THREE.RenderableVertex(),

	_v1x, _v1y, _v2x, _v2y, _v3x, _v3y,
	_v4x, _v4y, _v5x, _v5y, _v6x, _v6y,

	_color = new THREE.Color(),
	_color1 = new THREE.Color(),
	_color2 = new THREE.Color(),
	_color3 = new THREE.Color(),
	_color4 = new THREE.Color(),

	_diffuseColor = new THREE.Color(),
	_emissiveColor = new THREE.Color(),

	_lightColor = new THREE.Color(),

	_patterns = {}, _imagedatas = {},

	_near, _far,

	_image, _uvs,
	_uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y,

	_clipBox = new THREE.Box2(),
	_clearBox = new THREE.Box2(),
	_elemBox = new THREE.Box2(),

	_ambientLight = new THREE.Color(),
	_directionalLights = new THREE.Color(),
	_pointLights = new THREE.Color(),

	_vector3 = new THREE.Vector3(), // Needed for PointLight

	_pixelMap, _pixelMapContext, _pixelMapImage, _pixelMapData,
	_gradientMap, _gradientMapContext, _gradientMapQuality = 16;

	_pixelMap = document.createElement( 'canvas' );
	_pixelMap.width = _pixelMap.height = 2;

	_pixelMapContext = _pixelMap.getContext( '2d' );
	_pixelMapContext.fillStyle = 'rgba(0,0,0,1)';
	_pixelMapContext.fillRect( 0, 0, 2, 2 );

	_pixelMapImage = _pixelMapContext.getImageData( 0, 0, 2, 2 );
	_pixelMapData = _pixelMapImage.data;

	_gradientMap = document.createElement( 'canvas' );
	_gradientMap.width = _gradientMap.height = _gradientMapQuality;

	_gradientMapContext = _gradientMap.getContext( '2d' );
	_gradientMapContext.translate( - _gradientMapQuality / 2, - _gradientMapQuality / 2 );
	_gradientMapContext.scale( _gradientMapQuality, _gradientMapQuality );

	_gradientMapQuality --; // Fix UVs

	// dash+gap fallbacks for Firefox and everything else

	if ( _context.setLineDash === undefined ) {
		if ( _context.mozDash !== undefined ) {
			_context.setLineDash = function ( values ) {
				_context.mozDash = values[ 0 ] !== null ? values : null;
			}
		} else {
			_context.setLineDash = function () {}
		}
	}

	this.domElement = _canvas;

	this.devicePixelRatio = parameters.devicePixelRatio !== undefined
				? parameters.devicePixelRatio
				: window.devicePixelRatio !== undefined
					? window.devicePixelRatio
					: 1;

	this.autoClear = true;
	this.sortObjects = true;
	this.sortElements = true;

	this.info = {
		render: {
			vertices: 0,
			faces: 0
		}
	}
	
	this.supportsVertexTextures = function () {};
	this.setFaceCulling = function () {};

	this.setSize = function ( width, height, updateStyle ) {

		_canvasWidth = width * this.devicePixelRatio;
		_canvasHeight = height * this.devicePixelRatio;

		_canvasWidthHalf = Math.floor( _canvasWidth / 2 );
		_canvasHeightHalf = Math.floor( _canvasHeight / 2 );

		_canvas.width = _canvasWidth;
		_canvas.height = _canvasHeight;

		if ( this.devicePixelRatio !== 1 && updateStyle !== false ) {

			_canvas.style.width = width + 'px';
			_canvas.style.height = height + 'px';

		}

		_clipBox.set(
			new THREE.Vector2( - _canvasWidthHalf, - _canvasHeightHalf ),
			new THREE.Vector2( _canvasWidthHalf, _canvasHeightHalf )
		);

		_clearBox.set(
			new THREE.Vector2( - _canvasWidthHalf, - _canvasHeightHalf ),
			new THREE.Vector2( _canvasWidthHalf, _canvasHeightHalf )
		);

		_contextGlobalAlpha = 1;
		_contextGlobalCompositeOperation = 0;
		_contextStrokeStyle = null;
		_contextFillStyle = null;
		_contextLineWidth = null;
		_contextLineCap = null;
		_contextLineJoin = null;

	};

	this.setClearColor = function ( color, alpha ) {
		_clearColor.set( color );
		_clearAlpha = alpha !== undefined ? alpha : 1;
		_clearBox.set(
			new THREE.Vector2( - _canvasWidthHalf, - _canvasHeightHalf ),
			new THREE.Vector2( _canvasWidthHalf, _canvasHeightHalf )
		);
	};

	this.getMaxAnisotropy = function () {
		return 0;
	};

	this.clear = function () {

		_context.setTransform( 1, 0, 0, - 1, _canvasWidthHalf, _canvasHeightHalf );

		if ( _clearBox.empty() === false ) {

			_clearBox.intersect( _clipBox );
			_clearBox.expandByScalar( 2 );

			if ( _clearAlpha < 1 ) {

				_context.clearRect(
					_clearBox.min.x | 0,
					_clearBox.min.y | 0,
					( _clearBox.max.x - _clearBox.min.x ) | 0,
					( _clearBox.max.y - _clearBox.min.y ) | 0
				);

			}

			if ( _clearAlpha > 0 ) {

				setBlending( THREE.NormalBlending );
				setOpacity( 1 );

				setFillStyle( 'rgba(' + Math.floor( _clearColor.r * 255 ) + ',' + Math.floor( _clearColor.g * 255 ) + ',' + Math.floor( _clearColor.b * 255 ) + ',' + _clearAlpha + ')' );

				_context.fillRect(
					_clearBox.min.x | 0,
					_clearBox.min.y | 0,
					( _clearBox.max.x - _clearBox.min.x ) | 0,
					( _clearBox.max.y - _clearBox.min.y ) | 0
				);

			}
			_clearBox.makeEmpty( );
		}
	};

	this.render = function ( scene, camera ) {

		if ( this.autoClear === true ) this.clear( );
		_context.setTransform( 1, 0, 0, - 1, _canvasWidthHalf, _canvasHeightHalf );

		_this.info.render.vertices = 0;
		_this.info.render.faces = 0;

		_renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
		_elements = _renderData.elements;
		_lights = _renderData.lights;

		// calculateLights( );

		for ( var e = 0, el = _elements.length; e < el; e++ ) {

			var element = _elements[ e ],
			    material = element.material;

			if ( material === undefined || material.visible === false ) continue;

			_elemBox.makeEmpty( );
            
            if( element instanceof THREE.RenderableFace3 ) {
                
                _v1 = element.v1; _v2 = element.v2; _v3 = element.v3;

				if ( _v1.positionScreen.z < -1 || _v1.positionScreen.z > 1 ) continue;
				if ( _v2.positionScreen.z < -1 || _v2.positionScreen.z > 1 ) continue;
				if ( _v3.positionScreen.z < -1 || _v3.positionScreen.z > 1 ) continue;

				_v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
				_v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;
				_v3.positionScreen.x *= _canvasWidthHalf; _v3.positionScreen.y *= _canvasHeightHalf;

				if ( material.overdraw === true ) {

					expand( _v1.positionScreen, _v2.positionScreen );
					expand( _v2.positionScreen, _v3.positionScreen );
					expand( _v3.positionScreen, _v1.positionScreen );

				}

				_elemBox.setFromPoints([
					_v1.positionScreen,
					_v2.positionScreen,
					_v3.positionScreen
				]);

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {
					renderFace3( _v1, _v2, _v3, 0, 1, 2, element, material );
				}
			} 
			
			_clearBox.union( _elemBox );

		}

		_context.setTransform( 1, 0, 0, 1, 0, 0 );
        
		function renderFace3( v1, v2, v3, uv1, uv2, uv3, element, material ) {

			_this.info.render.vertices += 3;
			_this.info.render.faces ++;

			setOpacity( material.opacity );
			setBlending( material.blending );

			_v1x = v1.positionScreen.x; _v1y = v1.positionScreen.y;
			_v2x = v2.positionScreen.x; _v2y = v2.positionScreen.y;
			_v3x = v3.positionScreen.x; _v3y = v3.positionScreen.y;

			drawTriangle( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y );

            _color.r = material.color.r;
            _color.g = material.color.g;
            _color.b = material.color.b;
            
            fillPath( _color );

		}

		function drawTriangle( x0, y0, x1, y1, x2, y2 ) {

			_context.beginPath();
			_context.moveTo( x0, y0 );
			_context.lineTo( x1, y1 );
			_context.lineTo( x2, y2 );
			_context.closePath();

		}

		function strokePath( color, linewidth, linecap, linejoin ) {

			setLineWidth( linewidth );
			setLineCap( linecap );
			setLineJoin( linejoin );
			setStrokeStyle( color.getStyle() );

			_context.stroke();

			_elemBox.expandByScalar( linewidth * 2 );

		}

		function fillPath( color ) {

			setFillStyle( color.getStyle() );
			_context.fill();

		}

		// Hide anti-alias gaps
		function expand( v1, v2 ) {

			var x = v2.x - v1.x, y = v2.y - v1.y,
			det = x * x + y * y, idet;

			if ( det === 0 ) return;

			idet = 1 / Math.sqrt( det );

			x *= idet; y *= idet;

			v2.x += x; v2.y += y;
			v1.x -= x; v1.y -= y;

		}
	};

	// Context cached methods.
	function setOpacity( value ) {
		if ( _contextGlobalAlpha !== value ) {
			_context.globalAlpha = value;
			_contextGlobalAlpha = value;
		}
	}

	function setBlending( value ) {
		if ( _contextGlobalCompositeOperation !== value ) {
			if ( value === THREE.NormalBlending ) {
				_context.globalCompositeOperation = 'source-over';
			} else if ( value === THREE.AdditiveBlending ) {
				_context.globalCompositeOperation = 'lighter';
			} else if ( value === THREE.SubtractiveBlending ) {
				_context.globalCompositeOperation = 'darker';
			}
			_contextGlobalCompositeOperation = value;
		}
	}

	function setLineWidth( value ) {

		if ( _contextLineWidth !== value ) {

			_context.lineWidth = value;
			_contextLineWidth = value;

		}

	}

	function setLineCap( value ) {

		// "butt", "round", "square"

		if ( _contextLineCap !== value ) {

			_context.lineCap = value;
			_contextLineCap = value;

		}
	}

	function setLineJoin( value ) {

		// "round", "bevel", "miter"

		if ( _contextLineJoin !== value ) {

			_context.lineJoin = value;
			_contextLineJoin = value;

		}

	}

	function setStrokeStyle( value ) {

		if ( _contextStrokeStyle !== value ) {

			_context.strokeStyle = value;
			_contextStrokeStyle = value;

		}

	}

	function setFillStyle( value ) {

		if ( _contextFillStyle !== value ) {

			_context.fillStyle = value;
			_contextFillStyle = value;

		}

	}

	function setDashAndGap( dashSizeValue, gapSizeValue ) {

		if ( _contextDashSize !== dashSizeValue || _contextGapSize !== gapSizeValue ) {

			_context.setLineDash( [ dashSizeValue, gapSizeValue ] );
			_contextDashSize = dashSizeValue;
			_contextGapSize = gapSizeValue;

		}

	}

};
