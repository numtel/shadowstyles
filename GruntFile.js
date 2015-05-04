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
          'src/<%= pkg.name %>.js'
        ],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    nightwatch: {
      options: {
        standalone: true,
        custom_commands_path: 'test/helpers',
        chrome_driver_path: __dirname + '/chromedriver',
        download: {},
        firefox: {
          desiredCapabilities: {
            browserName: 'firefox'
          }
        },
        chrome: {
          desiredCapabilities: {
            browserName: 'chrome'
          }
        }
      },
      saucelabs: {
        standalone: false
      },
      local: {
        jar_path: __dirname + '/selenium-server-standalone-2.45.0.jar'
      },
      cli: {
        standalone: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nightwatch');

  grunt.registerTask('default', ['uglify']);

};
