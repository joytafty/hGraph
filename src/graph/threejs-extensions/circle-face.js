hGraph.Graph.CircleFace = (function( ) {
    
function CircleFace( radius, color ) {
    this.radius = radius || 10;
    this.color = color || new THREE.Color( );
};

CircleFace.prototype = { };

return CircleFace;
    
})( );