hGraph.Graph.CircleFace = (function( ) {
    
function CircleFace( radius, color ) {
    this.radius = radius || 10;
    this.color = color || false;
};

CircleFace.prototype = { };

return CircleFace;
    
})( );