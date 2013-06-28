import "component";

hGraph.Graph.Ring = (function( ) {

var // local hash just like in graph
    localsHash = { };

function Ring( proto ) {
        
    proto.Update = function( mouse ) { 
        var local = localsHash[ this.uid ],
            object = local['object'];
    };
    
    proto.Initialize = function( scene ) {
        var local = localsHash[ this.uid ],
            object = local['object'];
        // add this object into the scene
        scene.add( object );  
    };

};

Ring['constructor'] = function( ) {

    this.uid = createUID( );
    var local = { };
        
    local['geometry'] = new THREE.RingGeometry( __ScoreScale( 50 ), __ScoreScale( 80 ), 45, 1 );
    local['material'] = new THREE.MeshBasicMaterial({ color : HGRAPH_RING_FILL_COLOR, wireframe : false });
    local['object'] = new THREE.Mesh( local['geometry'], local['material'] );

    // save the local variables into the hash
    localsHash[ this.uid ] = local;
    
};

return ComponentFactory( Ring );

})( );