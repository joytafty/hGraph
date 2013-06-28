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
    updateTimeoutID = null,
    // last frame time
    lastFrameTime = + new Date( ),
    // other stuff
    PI = Math.PI,
    PI2 = PI * 2;
    
function UpdateAll( ) {
    var curTime = + new Date( ),
        difTime = curTime - lastFrameTime;
    
    if( difTime <= 0 )
        difTime = HGRAPH_MINIMUM_FRAMETIME;
    
    forEach( updaters, function( fn ) {
        if( isFn( fn ) ) { fn( difTime ); }
    });
    
    lastFrameTime = curTime;
    
    if( UpdateAll.looping )
        updateTimeoutID = requestAnimationFrame( UpdateAll );
    else
        UpdateAll.Stop( );
};

UpdateAll.looping = false;

UpdateAll.Begin = function( ) {
    UpdateAll.looping = true;
    lastFrameTime = + new Date( );
    return UpdateAll( );
};

UpdateAll.Stop = function( ) {
    UpdateAll.looping = false;  
    cancelAnimationFrame( updateTimeoutID );
};
    
// GetPayloadData
// function used to search through a graph's container dom and return a parsed
// object representing the hData that will be used in the graph
// @param {DOM object} the container
// @returns {object} a parsed data object that has passed through hGraph.Data.parse
function GetPayloadData( container ) {
    var payload = [ ],
        selectionQuery = HGRAPH_PAYLOAD_TRIGGERS.join(',');
        
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

function Update( dt ) {
    var locals = localsHash[this.uid],
        camera = locals['camera'],
        mouse = locals['mouse'],
        animations = locals['animations'],
        components = locals['components'],
        anName;
    
    if( mouse.isDown )
        mouse.downCount += 0.15;
    
    for( anName in animations ) {
        if( animations[anName] ) { 
            animations[anName].Update( dt ); 
            if( animations[anName].done ) { animations[anName] = null; }
        }
    }
    
    for( var i = 0; i < components.length; i++ )
        components[i].Update( dt );
        
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
    local['components'].GetComponent = function( Class ) {
        if( !isFn( Class ) ) { return false; }
        
        for( var i = 0; i < this.length; i++ )
            if( this[i] instanceof Class ) { return this[i]; }
            
        return false;
    };
    
    
    local['mouse'] = { 
        isDown : false, 
        wasDragged : false,
        downCount : 0,
        startTime : 0,
        currentScreenPosition : new THREE.Vector2( ),
        currentWorldPosition : new THREE.Vector2( ),
        lastScreenPosition : new THREE.Vector2( ),
        startScreenPosition : new THREE.Vector2( )
    };
    local['animations'] = { rotation : null };
     
    // save all the local information in the private local hash
    localsHash[ this.uid ] = local;
    // save injected draw and update functions into the private function storage
    protoHash[ this.uid ] = { 
        Update : inject( Update, [ ], this ),
        Render : inject( Render, [ ], this ),
        Resize : inject( Resize, [ ], this )
    };
        
    function BroadcastClick( loc ) {
        var mouse = loc['mouse'],
            components = loc['components'],
            camera = loc['camera'],
            animations = loc['animations'],
            pointMan = components.GetComponent( hGraph.Graph.PointManager ),
            targeted = pointMan && pointMan.CheckClick( camera, mouse.currentScreenPosition );
        
        if( targeted !== false ) {
            var _startRotation = camera.rotation.z,
                _endingRotation = toRad( targeted.GetPointTheta( ) ),
                _rotationDiff = ( _endingRotation % PI2 ) - ( _startRotation % PI2 ),
                _rotationInc = abs( _rotationDiff / 10 ),
                _rotationStep = _rotationDiff < 0 ? -_rotationInc : _rotationInc,
                _anCount = 0;
            
            
            animations['rotation'] = new hGraph.Graph.Animation(function( ) {
                camera.rotation.z += _rotationStep;
                _rotationDiff = abs( _endingRotation - camera.rotation.z ) * 180 / PI;
                return _rotationDiff < 1;
            });
            
        } else
            console.log( 'no point clicked' );
        
    };
    
    function BroadcastGesture( loc ) {
        
    };
    
    function MouseDown( loc ) {
        var _self = this;
        return (function( ) {
            var m = loc['mouse'],
                e = d3.event['touches'] ? d3.event['touches'][0] : d3.event,
                // event page coordinates
                px = e.pageX,
                py = e.pageY,
                // screen coordinates
                sx = px - loc['container'].offsetLeft,
                sy = py - loc['container'].offsetTop;
            
            // save the screen coordinates    
            m.startScreenPosition.x = sx;
            m.startScreenPosition.y = sy;
            // initialize the other state variables
            m.isDown = true;
            m.downCount = 0;
            m.startTime = + new Date( );
        });
    };
    
    function MouseUp( loc ) {
        var  _self = this;
        return (function( ) {
            var m = loc['mouse'],
                ct = + new Date( ), // current time
                // calculate differences
                dt = ct- m.startTime,
                dx = m.lastScreenPosition.x - m.startScreenPosition.x,
                dy = m.lastScreenPosition.y - m.startScreenPosition.y;
                
            m.isDown = false;
            m.downCount = 0;
            m.startTime = 0;
            
            if( !m.wasDragged )
                BroadcastClick.call( _self, loc );
            else if( ( dx > HGRAPH_GESTURE_THRESHOLD || dy > HGRAPH_GESTURE_THRESHOLD ) && dt < 400 )
                BroadcastGesture.call( _self, loc );
            
            
            // save the screen coordinates    
            m.startScreenPosition.x = 0;
            m.startScreenPosition.y = 0;
            
            setTimeout(function ( ){
                m.wasDragged = false;
            }, 100 );
        });
    };
    
    function MouseMove( loc ) {
        var  _self = this;
        return (function( ) { 
            var m = loc['mouse'],
                e = d3.event['touches'] ? d3.event['touches'][0] : d3.event,
                // page coordinates:
                px = e.pageX,
                py = e.pageY,
                // screen coordinates:
                sx = px - local['container'].offsetLeft,
                sy = py - local['container'].offsetTop,
                // relative coordinates: 
                rx = ( local['container'].offsetWidth / 2 ) - sx,
                ry = ( local['container'].offsetHeight / 2 ) - sy,
                // difference amount
                dx = m.lastScreenPosition.x - sx,
                dy = m.lastScreenPosition.y - sy;
                
            m.currentScreenPosition.x = sx;
            m.currentScreenPosition.y = sy;
            
            m.currentWorldPosition.x = -rx;
            m.currentWorldPosition.y = ry;
            
            if( ( abs( dx ) > 0 || abs( dy ) > 0 ) && m.isDown )
                if( !m.wasDragged ) { m.wasDragged = true; }
            
            // update the last position reference
            m.lastScreenPosition.x = m.currentScreenPosition.x;
            m.lastScreenPosition.y = m.currentScreenPosition.y;
            
            return e.preventDefault && e.preventDefault( );
        });
    };
    
    
    d3.select( local['container'] ) 
        .on( 'mousedown', MouseDown.call( this, local ) )
        .on( 'mouseup', MouseUp.call( this, local ) )
        .on( 'mousemove', MouseMove.call( this, local ) )
        .on( 'touchstart', MouseDown.call( this, local ) )
        .on( 'touchmove', MouseMove.call( this, local ) );
    
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