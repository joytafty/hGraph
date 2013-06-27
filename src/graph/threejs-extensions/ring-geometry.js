hGraph.Graph.RingGeometry = (function( ) {

function ComputeVerts( innerRadius, outerRadius ) {

    var i, o, 
        uvs = [], 
        innerRadius = this.innerRadius,
        outerRadius = this.outerRadius,
        radius = this.outerRadius, 
        thetaSegments = this.thetaSegments,
        thetaStart = this.thetaStart,
        thetaLength = this.thetaLength,
        phiSegments = 1,
        radiusStep = ( ( outerRadius - innerRadius ) / phiSegments );
    
    this.vertices = [ ];
        
	for ( i = 0; i <= phiSegments; i ++ ) { 
		for ( o = 0; o <= thetaSegments; o ++ ) {
			var vertex = new THREE.Vector3();
			var segment = thetaStart + o / thetaSegments * thetaLength;

			vertex.x = radius * Math.cos( segment );
			vertex.y = radius * Math.sin( segment );

			this.vertices.push( vertex );
			uvs.push( new THREE.Vector2( ( vertex.x / radius + 1 ) / 2, - ( vertex.y / radius + 1 ) / 2 + 1 ) );
		}
		radius += radiusStep;
	}
	
	var n = new THREE.Vector3( 0, 0, 1 );
    
    this.faces = [ ];
	for ( i = 0; i < phiSegments; i ++ ) {
	
		var thetaSegment = i * thetaSegments;
		for ( o = 0; o <= thetaSegments; o ++ ) { 
			var segment = o + thetaSegment;
			var v1 = segment + i;
			var v2 = segment + thetaSegments + i;
			var v3 = segment + thetaSegments + 1 + i;
			this.faces.push( new THREE.Face3( v1, v2, v3, [ n, n, n ] ) );
			this.faceVertexUvs[ 0 ].push( [ uvs[ v1 ], uvs[ v2 ], uvs[ v3 ] ]);
			v1 = segment + i;
			v2 = segment + thetaSegments + 1 + i;
			v3 = segment + 1 + i;
			this.faces.push( new THREE.Face3( v1, v2, v3, [ n, n, n ] ) );
			this.faceVertexUvs[ 0 ].push( [ uvs[ v1 ], uvs[ v2 ], uvs[ v3 ] ]);
		}
	}
    
	this.computeCentroids( );
	this.computeFaceNormals( );  
};

function RingGeometry( innerRadius, outerRadius, thetaSegments, thetaStart, thetaLength ) {
    THREE.Geometry.call( this );
    
    this.innerRadius = innerRadius || 0;
	this.outerRadius = outerRadius || 50;
	
    this.thetaStart = thetaStart !== undefined ? thetaStart : 0;
	this.thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

	this.thetaSegments = thetaSegments !== undefined ? Math.max( 3, thetaSegments ) : 8;
	
    ComputeVerts.call( this );
    
	this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), outerRadius );
	
};

RingGeometry.prototype = Object.create( THREE.Geometry.prototype );

RingGeometry.prototype.SetRadius = function( inner, outer ) {
    this.innerRadius = inner || this.innerRadius;
    this.outerRadius = outer || this.outerRadius;
    ComputeVerts.call( this );
    return true;
};

return RingGeometry;

})( );