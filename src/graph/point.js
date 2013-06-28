import "component";

hGraph.Graph.Point = (function( ) {

var // local hash just like in graph
    localsHash = { };

function Point( proto ) {
        
    proto.Update = function( mouse ) { 
        var local = localsHash[this.uid],
            object = local['object'],
            position = local['position'],
            subManager = local['subManager'];
        
        object.position.x = position.x;
        object.position.y = position.y;
        
        // make sure all sub points are updated as well
        subManager.Update( mouse );
    };
    
    proto.Initialize = function( scene ) {
        var local = localsHash[this.uid],
            object = local['object'],
            position = local['position'],
            subManager = local['subManager'],
            manager = local['manager'],
            index = local['index'],
            // get parent degree info
            degreeInfo = manager.GetDegreeRange( ),
            startTheta = degreeInfo.x,
            thetaInc = degreeInfo.z;
            
        var subStart = startTheta + (thetaInc * index),
            subEnd = subStart + thetaInc;
            
        subManager.SetDegreeRange( subStart, subEnd );
        
        var xpos = Math.cos( toRad( startTheta + (thetaInc * index) ) ) * 150,
            ypos = Math.sin( toRad( startTheta + (thetaInc * index) ) ) * 150;
            
        position.x = object.position.x = xpos;
        position.y = object.position.y = ypos;
    
        // add this object into the scene
        scene.add( local['object'] );  
        // make sure all sub points get initialized as well
        subManager.Initialize( scene );
    };

};

Point['constructor'] = function( parameters, manager, index ) {
    
    this.uid = createUID( );
    
    var local = { },
        subManager
        color = manager.subFlag ? 0x555555 : 0x454545,
        opacity = manager.subFlag ? 0.0 : 1.0;
        
    local['index'] = index;
    // geometric properties
    local['geometry'] = new hGraph.Graph.CircleGeometry( 10 );
    local['material'] = new THREE.MeshBasicMaterial({ color : color, opacity : opacity, wireframe : false });
    local['object'] = new THREE.Mesh( local['geometry'], local['material'] );
    local['position'] = new THREE.Vector2( 0, 0 );
    local['manager'] = manager;
    
    
    // point data properties
    this.name = parameters.name;
    this.value = parameters.value;
    this.score = parameters.score;
    this.healthyRange = parameters.healthyRange;
    
    local['object'].name = 'whoa';
   
    local['dependencies'] = parameters.dependencies || [ ];
    
    // create a sub manager with the points that this point depends on
    subManager = new hGraph.Graph.PointManager( local['dependencies'], true, manager.GetDegreeRange( ) );
    subManager.subFlag = true;
    
    local['subManager'] = subManager;
    
    localsHash[this.uid] = local;
};

return ComponentFactory( Point );

})( );