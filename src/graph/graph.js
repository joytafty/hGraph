// hGraph.graph
// the graph class that is used to create every graph on the page
// with their canvas (as long as they have the 'hgraph-graph' trigger attribute)
hGraph.Graph = (function( config ){ 

// private: 

var // a hash of private object scopes
    localsHash = { },
    // a private hash of function prototypes
    protoHash = { },
    // update callbacks
    updaters = { },
    // update timeout id
    updateTimeoutID = null;
    
function UpdateAll( ) {
    
    forEach( updaters, function( fn ) {
        if( isFn( fn ) ) { fn( ); }
    });
    
    if( UpdateAll.looping )
        updateTimeoutID = setTimeout( UpdateAll, 10 );
    else
        UpdateAll.Stop( );
};

UpdateAll.looping = false;

UpdateAll.Begin = function( ) {
    UpdateAll.looping = true;
    return UpdateAll( );
};

UpdateAll.Stop = function( ) {
    UpdateAll.looping = false;  
    clearTimeout( updateTimeoutID );
};
    
// GetPayloadData
// function used to search through a graph's container dom and return a parsed
// object representing the hData that will be used in the graph
// @param {DOM object} the container
// @returns {object} a parsed data object that has passed through hGraph.Data.parse
function GetPayloadData( container ) {
    var payload = [ ],
        selectionQuery = DEFAULTS['HGRAPH_PAYLOAD_TRIGGERS'].join(',');
        
    function PushPayloadData( ) {
        if( this.value )
            payload.push( hGraph.Data.Parse( this.value ) );
    };
    
    // find all elements with payload data flags and add their data into the 
    // payaload array 
    d3.select( container ).selectAll( selectionQuery )
        .each( PushPayloadData );
        
    return payload.length > 0 ? payload[0] : { };
};

function Render( ) {
    var locals = localsHash[this.uid],
        camera = locals['camera'],
        scene = locals['scene'],
        renderer = locals['renderer'];
            
    renderer.render( scene, camera );
};

function Update( ) {
    var locals = localsHash[this.uid],
        camera = locals['camera'],
        mouse = locals['mouse'],
        components = locals['components'];
    
    if( mouse.isDown )
        mouse.downCount += 0.15;
    
    for( var i = 0; i < components.length; i++ )
        components[i].Update( mouse );
        
    protoHash[this.uid].Render( );
};

function Initialize( ) {
    var locals = localsHash[this.uid],
        scene = locals['scene'],
        components = locals['components'],
        payload = locals['payload'],
        points = isArr( payload['points'] ) ? payload['points'] : [ ],
        // start creating the components
        ring = new hGraph.Graph.Ring( ),
        rootRange = new THREE.Vector3( 0, 360, 0 ),
        pointManager = new hGraph.Graph.PointManager( points, false, rootRange );
    
    // insert the ring into the components
    components.push( ring );
    components.push( pointManager );
    
    for( var i = 0; i < components.length; i++ )
        components[i].Initialize( scene );
    
    return protoHash[this.uid].Resize( );
};

function Resize( ) {
    var locals = localsHash[this.uid],
        canvas = locals['canvas'],
        camera = locals['camera'],
        renderer = locals['renderer'],
        dimensions = locals['dimensions'];
    
    // store the window dimensions into the local dimension object
    dimensions.x = window.innerWidth;
    dimensions.y = window.innerHeight;
    
    var halfWidth = dimensions.x * 0.5,
        halfHeight = dimensions.y * 0.5;
    
    // update the camera
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix( );
    
    // update the renderer's size
    renderer.setSize( dimensions.x, dimensions.y );
    
    // if this graph's update was not already in the loop, add it now
    if( !updaters[this.uid] )
        updaters[this.uid] = protoHash[this.uid].Update;
};

function ExecuteQueue( ) {
    var fn;
    while( fn = this.invokeQueue.pop( ) )
        if( isFn( fn ) ) { fn( ); }
};

function Graph( config ) {
    this.ready = false;
    
    if( !config )
        throw new hGraph.Error('Graphs must be created with a configuration parameter');
        
    var local = { },
        canvas = document.createElement('canvas');
    
    // make sure this graph knows who it is    
    this.uid = isStr( config.uid ) ? config.uid : createUID( );
    // store the container in the graph's local object hash
    local['container'] = config.container || document.createElement('div');
    // try to find payload data
    local['payload'] = GetPayloadData( local['container'] );
        
    local['renderer'] = new THREE.CanvasRenderer({ canvas : canvas });
    local['dimensions'] = new THREE.Vector2( window.innerWidth, window.innerHeight );
    
    var halfWidth = local['dimensions'].x * 0.5,
        halfHeight = local['dimensions'].y * 0.5;
    
    local['camera'] = new THREE.OrthographicCamera( -halfWidth, halfWidth, halfHeight, -halfHeight, -50, 1000 );
    //local['camera'].position.z = 200;
    
      // try adding the canvas into the container
    try { 
        // remove the payload element by clearing the html
        local['container'].innerHTML = "";
        // append the canvas into the div
        local['container'].appendChild( local['renderer'].domElement );
    } catch( e ) {
        throw new hGraph.Error('Attempted to use an invalid container for graph: ' + local['uid'] );
    };
    
    local['scene'] = new THREE.Scene( );
    local['components'] = [ ];
    local['mouse'] = { isDown : false, downCount : 0 };
     
    // save all the local information in the private local hash
    localsHash[ this.uid ] = local;
    // save injected draw and update functions into the private function storage
    protoHash[ this.uid ] = { 
        Update : inject( Update, [ ], this ),
        Render : inject( Render, [ ], this ),
        Resize : inject( Resize, [ ], this )
    };
    
    function MouseDown( loc ) {
        return (function( ) {
            var m = loc['mouse'];
            m.isDown = true;
            m.downCount = 0;
        });
    };
    
    function MouseUp( loc ) {
        return (function( ) {
            var m = loc['mouse'];
            m.isDown = false;
            m.downCount = 0;
        });
    };
    
    
    d3.select( local['container'] ) 
        .on( 'mousedown', MouseDown( local ) )
        .on( 'mouseup', MouseUp( local ) )
        .on( 'touchstart', MouseDown( local ) )
        .on( 'touchend', MouseUp( local ) );
    
     // add an injected Resize function to the global-private list
    __ResizeCallbacks.push( protoHash[ this.uid ].Resize );
    
    this.ready = true;
    this.invokeQueue = [ inject( Initialize, [ ], this ) ];
};

Graph.prototype = {
        
    constructor : Graph,    
    version : CONFIG['GRAPH_VERSION'],
    Initialize : function( ){
        
        // run the private initialization call
        if( this.uid && this.ready )
            ExecuteQueue.call( this );
            
        if( !UpdateAll.looping )
            UpdateAll.Begin( );
    }
};

return Graph;

window.ShutDown = UpdateAll.Stop;

})( );