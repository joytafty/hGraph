hGraph.Graph.CircleGeometry = (function( ) {

function CircleGeometry( radius, position ) {
    THREE.Geometry.call( this );
    
    var pos = position || new THREE.Vector3( 0, 0, 0 ),
        face = new hGraph.Graph.CircleFace( radius );
    
    this.vertices = [ pos ];
    this.faces = [ face ];
    
	this.boundingSphere = new THREE.Sphere( new THREE.Vector3(), this.radius );
};

CircleGeometry.prototype = Object.create( THREE.Geometry.prototype );

return CircleGeometry;

})( );