/**
 * @author mrdoob / http://mrdoob.com/
 */
var ___i = 0;
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
	x, y, r,

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

	// WebGLRenderer compatibility

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

	this.setClearColorHex = function ( hex, alpha ) {

		console.warn( 'DEPRECATED: .setClearColorHex() is being removed. Use .setClearColor() instead.' );
		this.setClearColor( hex, alpha );

	};

	this.getMaxAnisotropy = function () {

		return 0;

	};

	this.clear = function( ) {
        _context.clearRect( 0, 0, _canvasWidth, _canvasHeight );
	};

	this.render = function ( scene, camera ) {
	
		if ( camera instanceof THREE.Camera === false ) {

			console.error( 'THREE.CanvasRenderer.render: camera is not an instance of THREE.Camera.' );
			return;

		}
        
		if ( this.autoClear === true ) this.clear();

		_context.setTransform( 1, 0, 0, - 1, _canvasWidthHalf, _canvasHeightHalf );

		_this.info.render.vertices = 0;
		_this.info.render.faces = 0;

		_renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
		_elements = _renderData.elements;
		_lights = _renderData.lights;
		
		for ( var e = 0, el = _elements.length; e < el; e++ ) {

			var element = _elements[ e ];

			var material = element.material;

			if ( material === undefined || material.visible === false ) continue;

			_elemBox.makeEmpty();

            if ( element instanceof THREE.RenderableLine ) {

				_v1 = element.v1; _v2 = element.v2;

				_v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
				_v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;

				_elemBox.setFromPoints( [
					_v1.positionScreen,
					_v2.positionScreen
				] );

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

					renderLine( _v1, _v2, element, material );

				}

			} else if ( element instanceof THREE.RenderableFace3 ) {

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

				_elemBox.setFromPoints( [
					_v1.positionScreen,
					_v2.positionScreen,
					_v3.positionScreen
				] );

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

					renderFace3( _v1, _v2, _v3, 0, 1, 2, element, material );

				}

			} else if ( element instanceof THREE.RenderableFace4 ) {

				_v1 = element.v1; _v2 = element.v2; _v3 = element.v3; _v4 = element.v4;

				if ( _v1.positionScreen.z < -1 || _v1.positionScreen.z > 1 ) continue;
				if ( _v2.positionScreen.z < -1 || _v2.positionScreen.z > 1 ) continue;
				if ( _v3.positionScreen.z < -1 || _v3.positionScreen.z > 1 ) continue;
				if ( _v4.positionScreen.z < -1 || _v4.positionScreen.z > 1 ) continue;

				_v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
				_v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;
				_v3.positionScreen.x *= _canvasWidthHalf; _v3.positionScreen.y *= _canvasHeightHalf;
				_v4.positionScreen.x *= _canvasWidthHalf; _v4.positionScreen.y *= _canvasHeightHalf;

				_v5.positionScreen.copy( _v2.positionScreen );
				_v6.positionScreen.copy( _v4.positionScreen );

				if ( material.overdraw === true ) {

					expand( _v1.positionScreen, _v2.positionScreen );
					expand( _v2.positionScreen, _v4.positionScreen );
					expand( _v4.positionScreen, _v1.positionScreen );

					expand( _v3.positionScreen, _v5.positionScreen );
					expand( _v3.positionScreen, _v6.positionScreen );

				}

				_elemBox.setFromPoints([
					_v1.positionScreen,
					_v2.positionScreen,
					_v3.positionScreen,
					_v4.positionScreen
				]);

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

					renderFace4( _v1, _v2, _v3, _v4, _v5, _v6, element, material );

				}

			} else if ( element instanceof hGraph.Graph.RenderableCircle ) {
                
                x = element.center.positionScreen.x * _canvasWidthHalf;
                y = element.center.positionScreen.y * _canvasHeightHalf;
                r = element.radius;

        
                renderCircleFace( x, y, r, element, material );
                    
			}

			_clearBox.union( _elemBox );

		}

		_context.setTransform( 1, 0, 0, 1, 0, 0 );


        function renderCircleFace( x, y, r, element, mat ) {
        
            if( element.color )
                _color.copy( element.color );
            else
                _color.copy( mat.color );
                
            setOpacity( material.opacity );
			setBlending( material.blending );

            if ( material.vertexColors === THREE.FaceColors )
                _color.multiply( element.color );
                
            drawCircle( x, y, r );
            
            if( material.wireframe === true )
                strokePath( _color, mat.wireframeLinewidth, mat.wireframeLinecap, mat.wireframeLinejoin )
            else
                fillPath( _color );
            
        }

		function renderLine( v1, v2, element, material ) {

			setOpacity( material.opacity );
			setBlending( material.blending );

			_context.beginPath();
			_context.moveTo( v1.positionScreen.x, v1.positionScreen.y );
			_context.lineTo( v2.positionScreen.x, v2.positionScreen.y );

			if ( material instanceof THREE.LineBasicMaterial ) {

				setLineWidth( material.linewidth );
				setLineCap( material.linecap );
				setLineJoin( material.linejoin );

				if ( material.vertexColors !== THREE.VertexColors ) {

					setStrokeStyle( material.color.getStyle() );

				} else {

					var colorStyle1 = element.vertexColors[0].getStyle();
					var colorStyle2 = element.vertexColors[1].getStyle();

					if ( colorStyle1 === colorStyle2 ) {

						setStrokeStyle( colorStyle1 );

					} else {

						try {

							var grad = _context.createLinearGradient(
								v1.positionScreen.x,
								v1.positionScreen.y,
								v2.positionScreen.x,
								v2.positionScreen.y
							);
							grad.addColorStop( 0, colorStyle1 );
							grad.addColorStop( 1, colorStyle2 );

						} catch ( exception ) {

							grad = colorStyle1;

						}

						setStrokeStyle( grad );

					}

				}

				_context.stroke();
				_elemBox.expandByScalar( material.linewidth * 2 );

			} else if ( material instanceof THREE.LineDashedMaterial ) {

				setLineWidth( material.linewidth );
				setLineCap( material.linecap );
				setLineJoin( material.linejoin );
				setStrokeStyle( material.color.getStyle() );
				setDashAndGap( material.dashSize, material.gapSize );

				_context.stroke();

				_elemBox.expandByScalar( material.linewidth * 2 );

				setDashAndGap( null, null );

			}

		}

		function renderFace3( v1, v2, v3, uv1, uv2, uv3, element, material ) {

			_this.info.render.vertices += 3;
			_this.info.render.faces ++;

			setOpacity( material.opacity );
			setBlending( material.blending );

			_v1x = v1.positionScreen.x; _v1y = v1.positionScreen.y;
			_v2x = v2.positionScreen.x; _v2y = v2.positionScreen.y;
			_v3x = v3.positionScreen.x; _v3y = v3.positionScreen.y;

			drawTriangle( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y );
				
            _color.copy( material.color );

            if ( material.vertexColors === THREE.FaceColors )
                _color.multiply( element.color );

            if( material.wireframe === true )
                strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
            else
                fillPath( _color );
                
		}

		function renderFace4( v1, v2, v3, v4, v5, v6, element, material ) {

			_this.info.render.vertices += 4;
			_this.info.render.faces ++;

			setOpacity( material.opacity );
			setBlending( material.blending );

			if ( ( material.map !== undefined && material.map !== null ) || ( material.envMap !== undefined && material.envMap !== null ) ) {

				// Let renderFace3() handle this

				renderFace3( v1, v2, v4, 0, 1, 3, element, material );
				renderFace3( v5, v3, v6, 1, 2, 3, element, material );

				return;

			}

			_v1x = v1.positionScreen.x; _v1y = v1.positionScreen.y;
			_v2x = v2.positionScreen.x; _v2y = v2.positionScreen.y;
			_v3x = v3.positionScreen.x; _v3y = v3.positionScreen.y;
			_v4x = v4.positionScreen.x; _v4y = v4.positionScreen.y;
			_v5x = v5.positionScreen.x; _v5y = v5.positionScreen.y;
			_v6x = v6.positionScreen.x; _v6y = v6.positionScreen.y;

			if ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) {

				_diffuseColor.copy( material.color );
				_emissiveColor.copy( material.emissive );

				if ( material.vertexColors === THREE.FaceColors ) {

					_diffuseColor.multiply( element.color );

				}

				if ( material.wireframe === false && material.shading == THREE.SmoothShading && element.vertexNormalsLength == 4 ) {

					_color1.copy( _ambientLight );
					_color2.copy( _ambientLight );
					_color3.copy( _ambientLight );
					_color4.copy( _ambientLight );

					calculateLight( element.v1.positionWorld, element.vertexNormalsModel[ 0 ], _color1 );
					calculateLight( element.v2.positionWorld, element.vertexNormalsModel[ 1 ], _color2 );
					calculateLight( element.v4.positionWorld, element.vertexNormalsModel[ 3 ], _color3 );
					calculateLight( element.v3.positionWorld, element.vertexNormalsModel[ 2 ], _color4 );

					_color1.multiply( _diffuseColor ).add( _emissiveColor );
					_color2.multiply( _diffuseColor ).add( _emissiveColor );
					_color3.multiply( _diffuseColor ).add( _emissiveColor );
					_color4.multiply( _diffuseColor ).add( _emissiveColor );

					_image = getGradientTexture( _color1, _color2, _color3, _color4 );

					// TODO: UVs are incorrect, v4->v3?

					drawTriangle( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y );
					clipImage( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y, 0, 0, 1, 0, 0, 1, _image );

					drawTriangle( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y );
					clipImage( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y, 1, 0, 1, 1, 0, 1, _image );

				} else {

					_color.copy( _ambientLight );

					calculateLight( element.centroidModel, element.normalModel, _color );

					_color.multiply( _diffuseColor ).add( _emissiveColor );

					drawQuad( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _v4x, _v4y );

					material.wireframe === true
						? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
						: fillPath( _color );

				}

			} else if ( material instanceof THREE.MeshBasicMaterial ) {

				_color.copy( material.color );

				if ( material.vertexColors === THREE.FaceColors ) {

					_color.multiply( element.color );

				}

				drawQuad( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _v4x, _v4y );

				material.wireframe === true
					? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
					: fillPath( _color );

			} else if ( material instanceof THREE.MeshNormalMaterial ) {

				var normal;

				if ( material.shading == THREE.FlatShading ) {

					normal = element.normalModelView;
					_color.setRGB( normal.x, normal.y, normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

					drawQuad( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _v4x, _v4y );

					material.wireframe === true
						? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
						: fillPath( _color );

				} else if ( material.shading == THREE.SmoothShading ) {

					normal = element.vertexNormalsModelView[ 0 ];
					_color1.setRGB( normal.x, normal.y, normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

					normal = element.vertexNormalsModelView[ 1 ];
					_color2.setRGB( normal.x, normal.y, normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

					normal = element.vertexNormalsModelView[ 3 ];
					_color3.setRGB( normal.x, normal.y, normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

					normal = element.vertexNormalsModelView[ 2 ];
					_color4.setRGB( normal.x, normal.y, normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

					_image = getGradientTexture( _color1, _color2, _color3, _color4 );

					drawTriangle( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y );
					clipImage( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y, 0, 0, 1, 0, 0, 1, _image );

					drawTriangle( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y );
					clipImage( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y, 1, 0, 1, 1, 0, 1, _image );

				}

			} else if ( material instanceof THREE.MeshDepthMaterial ) {

				_near = camera.near;
				_far = camera.far;

				_color1.r = _color1.g = _color1.b = 1 - smoothstep( v1.positionScreen.z * v1.positionScreen.w, _near, _far );
				_color2.r = _color2.g = _color2.b = 1 - smoothstep( v2.positionScreen.z * v2.positionScreen.w, _near, _far );
				_color3.r = _color3.g = _color3.b = 1 - smoothstep( v4.positionScreen.z * v4.positionScreen.w, _near, _far );
				_color4.r = _color4.g = _color4.b = 1 - smoothstep( v3.positionScreen.z * v3.positionScreen.w, _near, _far );

				_image = getGradientTexture( _color1, _color2, _color3, _color4 );

				// TODO: UVs are incorrect, v4->v3?

				drawTriangle( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y );
				clipImage( _v1x, _v1y, _v2x, _v2y, _v4x, _v4y, 0, 0, 1, 0, 0, 1, _image );

				drawTriangle( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y );
				clipImage( _v5x, _v5y, _v3x, _v3y, _v6x, _v6y, 1, 0, 1, 1, 0, 1, _image );

			}

		}

		//

		function drawTriangle( x0, y0, x1, y1, x2, y2 ) {

			_context.beginPath();
			_context.moveTo( x0, y0 );
			_context.lineTo( x1, y1 );
			_context.lineTo( x2, y2 );
			_context.closePath();

		}
		
		function drawCircle( x, y, r ) {
		
            _context.beginPath( );
			_context.arc( x, y, r, 0, Math.PI * 2 );
			_context.closePath( );
		
		}

		function drawQuad( x0, y0, x1, y1, x2, y2, x3, y3 ) {

			_context.beginPath();
			_context.moveTo( x0, y0 );
			_context.lineTo( x1, y1 );
			_context.lineTo( x2, y2 );
			_context.lineTo( x3, y3 );
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

		function patternPath( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, texture ) {

			if ( texture instanceof THREE.DataTexture || texture.image === undefined || texture.image.width == 0 ) return;

			if ( texture.needsUpdate === true ) {

				var repeatX = texture.wrapS == THREE.RepeatWrapping;
				var repeatY = texture.wrapT == THREE.RepeatWrapping;

				_patterns[ texture.id ] = _context.createPattern(
					texture.image, repeatX === true && repeatY === true
						? 'repeat'
						: repeatX === true && repeatY === false
							? 'repeat-x'
							: repeatX === false && repeatY === true
								? 'repeat-y'
								: 'no-repeat'
				);

				texture.needsUpdate = false;

			}

			_patterns[ texture.id ] === undefined
				? setFillStyle( 'rgba(0,0,0,1)' )
				: setFillStyle( _patterns[ texture.id ] );

			// http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

			var a, b, c, d, e, f, det, idet,
			offsetX = texture.offset.x / texture.repeat.x,
			offsetY = texture.offset.y / texture.repeat.y,
			width = texture.image.width * texture.repeat.x,
			height = texture.image.height * texture.repeat.y;

			u0 = ( u0 + offsetX ) * width;
			v0 = ( 1.0 - v0 + offsetY ) * height;

			u1 = ( u1 + offsetX ) * width;
			v1 = ( 1.0 - v1 + offsetY ) * height;

			u2 = ( u2 + offsetX ) * width;
			v2 = ( 1.0 - v2 + offsetY ) * height;

			x1 -= x0; y1 -= y0;
			x2 -= x0; y2 -= y0;

			u1 -= u0; v1 -= v0;
			u2 -= u0; v2 -= v0;

			det = u1 * v2 - u2 * v1;

			if ( det === 0 ) {

				if ( _imagedatas[ texture.id ] === undefined ) {

					var canvas = document.createElement( 'canvas' )
					canvas.width = texture.image.width;
					canvas.height = texture.image.height;

					var context = canvas.getContext( '2d' );
					context.drawImage( texture.image, 0, 0 );

					_imagedatas[ texture.id ] = context.getImageData( 0, 0, texture.image.width, texture.image.height ).data;

				}

				var data = _imagedatas[ texture.id ];
				var index = ( Math.floor( u0 ) + Math.floor( v0 ) * texture.image.width ) * 4;

				_color.setRGB( data[ index ] / 255, data[ index + 1 ] / 255, data[ index + 2 ] / 255 );
				fillPath( _color );

				return;

			}

			idet = 1 / det;

			a = ( v2 * x1 - v1 * x2 ) * idet;
			b = ( v2 * y1 - v1 * y2 ) * idet;
			c = ( u1 * x2 - u2 * x1 ) * idet;
			d = ( u1 * y2 - u2 * y1 ) * idet;

			e = x0 - a * u0 - c * v0;
			f = y0 - b * u0 - d * v0;

			_context.save();
			_context.transform( a, b, c, d, e, f );
			_context.fill();
			_context.restore();

		}

		function clipImage( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, image ) {

			// http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

			var a, b, c, d, e, f, det, idet,
			width = image.width - 1,
			height = image.height - 1;

			u0 *= width; v0 *= height;
			u1 *= width; v1 *= height;
			u2 *= width; v2 *= height;

			x1 -= x0; y1 -= y0;
			x2 -= x0; y2 -= y0;

			u1 -= u0; v1 -= v0;
			u2 -= u0; v2 -= v0;

			det = u1 * v2 - u2 * v1;

			idet = 1 / det;

			a = ( v2 * x1 - v1 * x2 ) * idet;
			b = ( v2 * y1 - v1 * y2 ) * idet;
			c = ( u1 * x2 - u2 * x1 ) * idet;
			d = ( u1 * y2 - u2 * y1 ) * idet;

			e = x0 - a * u0 - c * v0;
			f = y0 - b * u0 - d * v0;

			_context.save();
			_context.transform( a, b, c, d, e, f );
			_context.clip();
			_context.drawImage( image, 0, 0 );
			_context.restore();

		}

		function getGradientTexture( color1, color2, color3, color4 ) {

			// http://mrdoob.com/blog/post/710

			_pixelMapData[ 0 ] = ( color1.r * 255 ) | 0;
			_pixelMapData[ 1 ] = ( color1.g * 255 ) | 0;
			_pixelMapData[ 2 ] = ( color1.b * 255 ) | 0;

			_pixelMapData[ 4 ] = ( color2.r * 255 ) | 0;
			_pixelMapData[ 5 ] = ( color2.g * 255 ) | 0;
			_pixelMapData[ 6 ] = ( color2.b * 255 ) | 0;

			_pixelMapData[ 8 ] = ( color3.r * 255 ) | 0;
			_pixelMapData[ 9 ] = ( color3.g * 255 ) | 0;
			_pixelMapData[ 10 ] = ( color3.b * 255 ) | 0;

			_pixelMapData[ 12 ] = ( color4.r * 255 ) | 0;
			_pixelMapData[ 13 ] = ( color4.g * 255 ) | 0;
			_pixelMapData[ 14 ] = ( color4.b * 255 ) | 0;

			_pixelMapContext.putImageData( _pixelMapImage, 0, 0 );
			_gradientMapContext.drawImage( _pixelMap, 0, 0 );

			return _gradientMap;

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
