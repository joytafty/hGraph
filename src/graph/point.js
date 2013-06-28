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
        
        var xpos = Math.cos( toRad( startTheta + (thetaInc * index) ) ) * __ScoreScale( this.score ),
            ypos = Math.sin( toRad( startTheta + (thetaInc * index) ) ) * __ScoreScale( this.score );
            
        position.x = object.position.x = xpos;
        position.y = object.position.y = ypos;
        
        // add this object into the scene
        scene.add( local['object'] );  
        // make sure all sub points get initialized as well
        subManager.Initialize( scene );
    };
    
    proto.CheckCollide = function( camera, screenCoordinates ) {
        var local = localsHash[this.uid],
            object = local['object'],
            position = object.position,
            subManager = local['subManager'],
            projector = new THREE.Projector( ),
            projVector = new THREE.Vector3( ),
            dx, dy, d2, dr;
        
        projVector.getPositionFromMatrix( object.matrixWorld );
        
        projector.projectVector( projVector, camera );
        
        projVector.x = ( projVector.x * ( window.innerWidth * 0.5 ) ) + ( window.innerWidth * 0.5 );
        projVector.y = - ( projVector.y * ( window.innerHeight * 0.5 ) ) + ( window.innerHeight * 0.5 );
            
        // distances
        dx = projVector.x - screenCoordinates.x;
        dy = projVector.y - screenCoordinates.y;
        // squared distances
        d2 = ( dx * dx ) + ( dy * dy );
        dr = ( HGRAPH_POINT_RADIUS * HGRAPH_POINT_RADIUS );
        
        if( d2 < dr )
            return this;
        else 
            return subManager.CheckClick( camera, screenCoordinates );
            
    };
    
    proto.GetPointTheta = function( ) {
        var local = localsHash[this.uid],
            manager = local['manager'],
            index = local['index'],
            // get parent degree info
            degreeInfo = manager.GetDegreeRange( ),
            startTheta = degreeInfo.x,
            thetaInc = degreeInfo.z;
        return startTheta + (thetaInc * index);
    };

};

Point['constructor'] = function( parameters, manager, index ) {
    
    this.uid = createUID( );
    // point data properties
    this.name = parameters.name;
    this.value = parameters.value;
    this.score = parameters.score;
    this.healthyRange = parameters.healthyRange;
    
    var local = { },
        subManager
        color = ( this.score > 50 && this.score < 80 ) 
                        ? HGRAPH_POINT_COLOR_HEALTHY 
                        : HGRAPH_POINT_COLOR_UNHEALTHY,
                        
        opacity = manager.subFlag ? 0.0 : 1.0;
        
    local['index'] = index;
    // geometric properties
    local['geometry'] = new THREE.CircleGeometry( HGRAPH_POINT_RADIUS, 10 );
    local['material'] = new THREE.MeshBasicMaterial({ color : color, opacity : opacity, wireframe : false });
    local['object'] = new THREE.Mesh( local['geometry'], local['material'] );
    local['position'] = new THREE.Vector2( 0, 0 );
    local['manager'] = manager;
    
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