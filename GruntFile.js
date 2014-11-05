module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '    License: <%= pkg.license %>\n' +
                '    Author: <%= pkg.author %> */\n'
      },
      build: {
        src: [
          'dist/bind.polyfill.js', // Required for PhantomJS
          'dist/mutationObserver.polyfill.js', // From x-tags
          'dist/matches.polyfill.js', // Remove namespaced versions
          'src/<%= pkg.name %>.js'
        ],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};
