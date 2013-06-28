hGraph.Graph.RingGeometry = (function( ) {

function RingGeometry( position, innerRadius, outerRadius ) {

    var pos = position || new THREE.Vector3( 0, 0, 0 ),
        face1 = new hGraph.Graph.CircleFace( innerRadius ),
        face2 =  new hGraph.Graph.CircleFace( outerRadius );
    
    this.vertices = [ pos ];
    this.faces = [ face1, face2 ];
    
	this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), this.radius );	
};

RingGeometry.prototype = Object.create( THREE.Geometry.prototype );

RingGeometry.prototype.SetRadius = function( inner, outer ) { }

return RingGeometry;

})( );