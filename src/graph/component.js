function ComponentFactory( factory ) {
    
    // create the public scope object 
    var proto = { };
        
    // allow the factory function to change the public scope (by reference) 
    factory( proto );
    
    // create the constructor for this component
    var ComponentConstructor = (function( fn ) {
        // the returned function is used as the constuctor for all component
        // instances. it handles calling the constructor specific to the component
        // defined by the factory function, and setting up all important stuff
        return function( ) {
            fn.apply( this, splice.call( arguments, 0 ) );
        };
    })( hasOwn.call( factory, 'constructor') ? factory['constructor'] : function( ) { } );

    // give the component all the necessary functions for consistency
    ComponentConstructor.prototype = {    
        Initialize : function( ) { },
        Update : function( ) { }
    };
    
    // extend the component's prototype with the modified scope 
    extend( ComponentConstructor.prototype, proto );
    
    return ComponentConstructor;
    
};