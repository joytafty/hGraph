hGraph.Graph.RenderableCircle = (function( ) {

function RenderableCircle( ) {
    this.radius = 10;
    this.center = new THREE.RenderableVertex( );
    this.color = null;
};

RenderableCircle.prototype = { };

return RenderableCircle;

})( );