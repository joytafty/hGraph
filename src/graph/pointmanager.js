import "component";

hGraph.Graph.PointManager = (function( ) {

var // local hash just like in graph
    localsHash = { };

function PointManager( proto ) {
        
    proto.Update = function( mouse ) { 
        var local = localsHash[ this.uid ],
            points = local['points'];
        
        for( var i = 0; i < points.length; i++ )
            points[i].Update( mouse );
    };
    
    proto.Initialize = function( scene ) {
        var local = localsHash[ this.uid ],
            points = local['points'];
        
        for( var i = 0; i < points.length; i++ )
            points[i].Initialize( scene );
    };
    
    proto.SetDegreeRange = function( min, max ) {
        var local = localsHash[ this.uid ],
            points = local['points'],
            degreeRange = local['degreeRange'],
            absMin = min,
            absMax = max,
            absSpace = absMax - absMin,
            absInc = absSpace / ( points.length + 1 );
            
        degreeRange.x = absMin + ( absInc );
        degreeRange.y = absMax - ( absInc );
        degreeRange.z = absInc;
    };
    
    
    proto.GetDegreeRange = function( ) {
        var local = localsHash[ this.uid ],
            degreeRange = local['degreeRange'];
        return degreeRange;      
    };
    
    proto.GetPointCount = function( ) {
        var local = localsHash[ this.uid ],
            points = local['points'];
            
        return points.length;
    };

};

PointManager['constructor'] = function( data, subFlag, parentRange ) {
    
    this.uid = createUID( );
    this.subFlag = subFlag;
    
    var local = { points : [ ] },
        points = isArr( data ) ? data : [ ],
        point, 
        degreeRange = new THREE.Vector3( 0, 360, 10 ),
        startDegree = parentRange.x,
        endDegree = parentRange.y,
        degreeSpace = endDegree - startDegree;
    
    // save all of the information in the degree range
    degreeRange.x = parentRange.x;
    degreeRange.y = parentRange.y;
    degreeRange.z = degreeSpace / points.length;
    
    local['degreeRange'] = degreeRange;

    // save the local hash into the private hash
    localsHash[ this.uid ] = local;
    
    while( point = points.pop( ) ){ 
        // create a new point
        var p = new hGraph.Graph.Point( point, this, points.length );
        // add the point into the local hash
        local['points'].push( p );
    }
    
};

return ComponentFactory( PointManager );

})( );