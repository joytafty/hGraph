hGraph.Graph.Animation = (function( ) {

var // local hash just like in graph
    localsHash = { };

function Step( ) {
      
};

function Animation( fn ) {
    
    this.uid = createUID( );
    this.done = isFn( fn ) ? false : true;
    
    var local = { callback : fn };
    
    localsHash[this.uid] = local;
};

Animation.prototype = { 
    
    Update : function( dt ) {
        
        var locals = localsHash[this.uid],
            callback = locals['callback'];
        
        if( callback( dt ) )
            this.done = true;
        else 
            this.done = false;
    
    }
    
};

return Animation;

})( );