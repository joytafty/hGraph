/*! 
 * HGraph.js (Canvas Version)
 * Author:
 *     Danny Hadley <danny@goinvo.com>
 * License:
 *     Copyright 2013, Involution Studios <http://goinvo.com>
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *	   you may not use this file except in compliance with the License.
 * 	   You may obtain a copy of the License at
 *      
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
*/
(function( global ) {

var // hGraph namespace definition
    hGraph = { },
    
    // THREE and d3 namespaces defined in vendor
    THREE = THREE || { REVISION: '58' },
    d3 = { },
    
    // script-wide accessable private variables
    __RootElement = false,
    __GraphInstances = { },
    __ResizeCallbacks = [ ];

import "vendor/"
import "config/"
import "helpers/"
import "error/"
import "data/"
import "graph/"

// hWindowResize
// loops through the resize callbacks firing them with the new width and
// height of the window
function hWindowResize( ) { 
    forEach( __ResizeCallbacks, function( fn )  {
        return isFn( fn ) && fn( ); 
    });
};

// ----------------------------------------
// hGraph bootstrapping

// hCreateGraph
// creates the hgraph inside the container parameter
function hCreateGraph( container ){
    var uid = createUID( );
    __GraphInstances[uid] = new hGraph.Graph({ uid : uid, container : container });
};

// hGraphInit
// called once the root element has been found during the bootstrapping
// function call. takes care of populating the graphs on the page
function hGraphInit( ) {
    
    d3.select( DEFAULTS['HGRAPH_GRAPH_BOOTSTRAPS'].join(',') ).each(function( ){
        hCreateGraph( this );
    });
    
    for( var uid in __GraphInstances )
        __GraphInstances[uid].Initialize( );
};

// hGraphBootStrap
// document ready callback. will search the page for an element with either
// a 'data-hgraph-app' or 'hgraph-app' attribute and save it as the root element
function hGraphBootStrap( ) {
    // an array of matches
    var matches = [ ];
    d3.select( DEFAULTS['HGRAPH_APP_BOOTSTRAPS'].join(',') ).each(function( ){
        matches.push( this );
    });
    
    // do not proceed if more than one 
    if( matches.length > 1 )
        throw new hGraph.Error('Too many root elements found on the page');
        
    __RootElement = matches[0];
    
    // if the 'hgraph-app' attribute was found, we can initialize
    if( __RootElement )
        return hGraphInit( );
};

d3.select( document ).on( 'DOMContentLoaded', hGraphBootStrap );
d3.select( window ).on( 'resize', hWindowResize );

// expose hGraph to the window
global.hGraph = hGraph;

})( window );