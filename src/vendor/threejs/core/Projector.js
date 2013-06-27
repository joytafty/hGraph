/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author julianwa / https://github.com/julianwa
 */

THREE.Projector = function () {

	var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
	_vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
	_face, _face3Count, _face3Pool = [], _face3PoolLength = 0,
	_face4Count, _face4Pool = [], _face4PoolLength = 0,
	_line, _lineCount, _linePool = [], _linePoolLength = 0,
	_particle, _particleCount, _particlePool = [], _particlePoolLength = 0,
	_circle, _circlePool = [ ], _circlePoolLength = 0, _circleCount = 0,

	_renderData = { objects: [], sprites: [], lights: [], elements: [] },

	_vector3 = new THREE.Vector3(),
	_vector4 = new THREE.Vector4(),

	_clipBox = new THREE.Box3( new THREE.Vector3( -1, -1, -1 ), new THREE.Vector3( 1, 1, 1 ) ),
	_boundingBox = new THREE.Box3(),
	_points3 = new Array( 3 ),
	_points4 = new Array( 4 ),

	_viewMatrix = new THREE.Matrix4(),
	_viewProjectionMatrix = new THREE.Matrix4(),

	_modelMatrix,
	_modelViewProjectionMatrix = new THREE.Matrix4(),

	_normalMatrix = new THREE.Matrix3(),
	_normalViewMatrix = new THREE.Matrix3(),

	_centroid = new THREE.Vector3(),

	_frustum = new THREE.Frustum(),

	_clippedVertex1PositionScreen = new THREE.Vector4( ),
	_clippedVertex2PositionScreen = new THREE.Vector4( );
	
	var projectGraph = function ( root, sortObjects ) {

		_objectCount = 0;

		_renderData.objects.length = 0;
		_renderData.sprites.length = 0;
		_renderData.lights.length = 0;

		var projectObject = function ( parent ) {

			for ( var c = 0, cl = parent.children.length; c < cl; c ++ ) {

				var object = parent.children[ c ];

				if ( object.visible === false ) continue;
                
                _object = getNextObjectInPool( );
				_object.object = object;
				_renderData.objects.push( _object );
				
				projectObject( object );

			}

		};

		projectObject( root );

		return _renderData;

	};

	this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

		var visible = false,
		o, ol, v, vl, f, fl, n, nl, c, cl, u, ul, object,
		geometry, vertices, faces, face, faceVertexNormals, faceVertexUvs, uvs,
		v1, v2, v3, v4, isFaceMaterial, objectMaterials;

		_face3Count = 0;
		_face4Count = 0;
		_lineCount = 0;
		_particleCount = 0;

		_renderData.elements.length = 0;

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld( );
		if ( camera.parent === undefined ) camera.updateMatrixWorld( );

		_viewMatrix = camera.matrixWorldInverse.getInverse( camera.matrixWorld );
		_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );
		_frustum.setFromMatrix( _viewProjectionMatrix );
		_renderData = projectGraph( scene, sortObjects );

		for ( o = 0, ol = _renderData.objects.length; o < ol; o ++ ) {

			object = _renderData.objects[ o ].object;
			
			_modelMatrix = object.matrixWorld;

			_vertexCount = 0;
			
			geometry = object.geometry;

			vertices = geometry.vertices;
			faces = geometry.faces;
			faceVertexUvs = geometry.faceVertexUvs;
            
			//_normalMatrix.getNormalMatrix( _modelMatrix );
			
			for ( v = 0, vl = vertices.length; v < vl; v ++ ) {
                        
				_vertex = getNextVertexInPool( );
                
                _vertex.positionWorld.x = vertices[ v ].x;
                _vertex.positionWorld.y = vertices[ v ].y;
                _vertex.positionWorld.z = vertices[ v ].z;
				_vertex.positionWorld.applyMatrix4( _modelMatrix );
				
                _vertex.positionScreen.x = _vertex.positionWorld.x;
                _vertex.positionScreen.y = _vertex.positionWorld.y;
                _vertex.positionScreen.z = _vertex.positionWorld.z;
				_vertex.positionScreen.applyMatrix4( _viewProjectionMatrix );

				_vertex.positionScreen.x /= _vertex.positionScreen.w;
				_vertex.positionScreen.y /= _vertex.positionScreen.w;
				_vertex.positionScreen.z /= _vertex.positionScreen.w;

				_vertex.visible = ! ( _vertex.positionScreen.x < -1 || _vertex.positionScreen.x > 1 ||
						      _vertex.positionScreen.y < -1 || _vertex.positionScreen.y > 1 ||
						      _vertex.positionScreen.z < -1 || _vertex.positionScreen.z > 1 );

			}

			for ( f = 0, fl = faces.length; f < fl; f ++ ) {

				face = faces[ f ];

				var material = isFaceMaterial === true
					? objectMaterials.materials[ face.materialIndex ]
					: object.material;

				if ( material === undefined ) continue;

				var side = material.side;
                
                
                if( face instanceof hGraph.Graph.CircleFace ) { 
                    
                    // there should only be one vertex in the vertex pool
                    v1 = _vertexPool[0];
                    
                    // get a new renderable circle
                    _face = getNextCircleInPool( );
                    
                    _face.center.positionWorld.x = v1.positionWorld.x;
                    _face.center.positionWorld.y = v1.positionWorld.y;
                    _face.center.positionWorld.z = v1.positionWorld.z;
                    
                    _face.center.positionScreen.x = v1.positionScreen.x;
                    _face.center.positionScreen.y = v1.positionScreen.y;
                    _face.center.positionScreen.z = v1.positionScreen.z;
                    
                } else if ( face instanceof THREE.Face3 ) {

					v1 = _vertexPool[ face.a ];
					v2 = _vertexPool[ face.b ];
					v3 = _vertexPool[ face.c ];

					_points3[ 0 ] = v1.positionScreen;
					_points3[ 1 ] = v2.positionScreen;
					_points3[ 2 ] = v3.positionScreen;

					if ( v1.visible === true || v2.visible === true || v3.visible === true ||
						_clipBox.isIntersectionBox( _boundingBox.setFromPoints( _points3 ) ) ) {

						visible = true;

						if ( side === THREE.DoubleSide || visible === ( side === THREE.FrontSide ) ) {
                            
							_face = getNextFace3InPool( );
                            
                            var faceVerts = [
                                { dest : _face.v1, source : v1 },
                                { dest : _face.v2, source : v2 },
                                { dest : _face.v3, source : v3 }
                            ];
                            
                            var cVertPair;
                            while( cVertPair = faceVerts.pop( ) ){ 
                                
                                cVertPair['dest'].positionWorld.x = cVertPair['source'].positionWorld.x;
                                cVertPair['dest'].positionWorld.y = cVertPair['source'].positionWorld.y;
                                cVertPair['dest'].positionWorld.z = cVertPair['source'].positionWorld.z;
                                
                                cVertPair['dest'].positionScreen.x = cVertPair['source'].positionScreen.x;
                                cVertPair['dest'].positionScreen.y = cVertPair['source'].positionScreen.y;
                                cVertPair['dest'].positionScreen.z = cVertPair['source'].positionScreen.z;
                            }

						} else {
							continue;
						}
					} else {
						continue;
					}
				}
				
				_face.color = face.color;
				_face.material = material;
				_renderData.elements.push( _face );
			}
		}

		return _renderData;

	};

	// Pools

	function getNextObjectInPool() {

		if ( _objectCount === _objectPoolLength ) {

			var object = new THREE.RenderableObject();
			_objectPool.push( object );
			_objectPoolLength ++;
			_objectCount ++;
			return object;

		}

		return _objectPool[ _objectCount ++ ];

	}

	function getNextVertexInPool() {

		if ( _vertexCount === _vertexPoolLength ) {

			var vertex = new THREE.RenderableVertex();
			_vertexPool.push( vertex );
			_vertexPoolLength ++;
			_vertexCount ++;
			return vertex;

		}

		return _vertexPool[ _vertexCount ++ ];

	}
	
	function getNextCircleInPool( ) {
        var circle = new hGraph.Graph.RenderableCircle( );
		_circlePool.push( circle );
		_circlePoolLength ++;
		_circleCount ++;
		return circle;
	}

	function getNextFace3InPool() {

		if ( _face3Count === _face3PoolLength ) {

			var face = new THREE.RenderableFace3();
			_face3Pool.push( face );
			_face3PoolLength ++;
			_face3Count ++;
			return face;

		}

		return _face3Pool[ _face3Count ++ ];


	}

	function getNextFace4InPool() {

		if ( _face4Count === _face4PoolLength ) {

			var face = new THREE.RenderableFace4();
			_face4Pool.push( face );
			_face4PoolLength ++;
			_face4Count ++;
			return face;

		}

		return _face4Pool[ _face4Count ++ ];

	}

	function getNextLineInPool() {

		if ( _lineCount === _linePoolLength ) {

			var line = new THREE.RenderableLine();
			_linePool.push( line );
			_linePoolLength ++;
			_lineCount ++
			return line;

		}

		return _linePool[ _lineCount ++ ];

	}

	function getNextParticleInPool() {

		if ( _particleCount === _particlePoolLength ) {

			var particle = new THREE.RenderableParticle();
			_particlePool.push( particle );
			_particlePoolLength ++;
			_particleCount ++
			return particle;

		}

		return _particlePool[ _particleCount ++ ];

	}

	function clipLine( s1, s2 ) {

		var alpha1 = 0, alpha2 = 1,

		// Calculate the boundary coordinate of each vertex for the near and far clip planes,
		// Z = -1 and Z = +1, respectively.
		bc1near =  s1.z + s1.w,
		bc2near =  s2.z + s2.w,
		bc1far =  - s1.z + s1.w,
		bc2far =  - s2.z + s2.w;

		if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

			// Both vertices lie entirely within all clip planes.
			return true;

		} else if ( ( bc1near < 0 && bc2near < 0) || (bc1far < 0 && bc2far < 0 ) ) {

			// Both vertices lie entirely outside one of the clip planes.
			return false;

		} else {

			// The line segment spans at least one clip plane.

			if ( bc1near < 0 ) {

				// v1 lies outside the near plane, v2 inside
				alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

			} else if ( bc2near < 0 ) {

				// v2 lies outside the near plane, v1 inside
				alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

			}

			if ( bc1far < 0 ) {

				// v1 lies outside the far plane, v2 inside
				alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

			} else if ( bc2far < 0 ) {

				// v2 lies outside the far plane, v2 inside
				alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

			}

			if ( alpha2 < alpha1 ) {

				// The line segment spans two boundaries, but is outside both of them.
				// (This can't happen when we're only clipping against just near/far but good
				//  to leave the check here for future usage if other clip planes are added.)
				return false;

			} else {

				// Update the s1 and s2 vertices to match the clipped line segment.
				s1.lerp( s2, alpha1 );
				s2.lerp( s1, 1 - alpha2 );

				return true;

			}

		}

	}

};
