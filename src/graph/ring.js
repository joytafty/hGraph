import "component";

hGraph.Graph.Ring = (function( ) {

var // local hash just like in graph
    localsHash = { };

function Ring( proto ) {
        
    proto.Update = function( mouse ) { 
        var local = localsHash[ this.uid ],
            object = local['object'];
            
        object.position.x = 0 + ( Math.sin( mouse.downCount ) * 10 );
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
        
    local['geometry'] = new hGraph.Graph.RingGeometry( 150, 200, 25 );
    local['material'] = new THREE.MeshBasicMaterial({ color : 0x97be8c, wireframe : false });
    local['object'] = new THREE.Mesh( local['geometry'], local['material'] );

    // save the local variables into the hash
    localsHash[ this.uid ] = local;
    
};

return ComponentFactory( Ring );

})( );