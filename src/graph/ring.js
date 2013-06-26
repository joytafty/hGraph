import "component";

hGraph.Graph.Ring = (function( ) {

var // local hash just like in graph
    localsHash = { };

function Ring( proto ) {
        
    proto.Update = function( mouse ) { 
        var local = localsHash[ this.uid ],
            object = local['object'];
        
        if( mouse.isDown ) { 
            var add = Math.sin( mouse.downCount ) * 1;
            object.scale.x = object.scale.y = object.scale.z = Math.abs( add );
        }
        
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
        
    local['geometry'] = new THREE.RingGeometry( 150, 200, 3 );
    local['material'] = new THREE.MeshBasicMaterial({ color : 0x97be8c });
    local['object'] = new THREE.Mesh( local['geometry'], local['material'] );
    
    // save the local variables into the hash
    localsHash[ this.uid ] = local;
    
};

return ComponentFactory( Ring );

})( );