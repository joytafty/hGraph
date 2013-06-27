
module.exports = function(grunt) {
    
    // load nifty npm tasks
    grunt.loadNpmTasks('grunt-smash');
    grunt.loadNpmTasks('grunt-yui-compressor');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadTasks('lib/grunt');
    
    // define grunt configuration
    grunt.initConfig({
        
        clean : ['build'],
        
        smash : {
            package : { 
                src: 'src/hgraph.js',
                dest: 'build/hgraph.js'
            }
        },
        
        min : {
            package : {
                src: 'build/hgraph.js',
                dest: 'build/hgraph.min.js'
            }
        },
        
        karma : {
            options : {
                configFile : 'karma.conf.js'  
            },
            unit : { 
                background : true
            }  
        },
        
        watch : {
            karma: {
                files: ['src/**/**/*.js', 'tests/**/*.spec.js'],
                tasks: ['clean','smash','publish:unmin'] 
            }  
        },
        
        
        publish : {
            unmin : { 
                src: 'build/hgraph.js',
                dest: ['examples/canvas/js/']
            },
            min : { 
                src: 'build/hgraph.min.js',
                dest: ['examples/canvas/js/']
            }
        }
        
    });
    
    grunt.registerTask('build', ['clean','smash','publish:unmin']);
    grunt.registerTask('package', ['build','min','publish:min','karma']);
    grunt.registerTask('default', ['package']);
    
};