module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			scripts: {
				files: ['../templates/*.kit'],
				tasks: ['codekit'],
			},
		},
		codekit: {
//			explicit_output_names: {
//				files : {
//					'../build/index.html' : '../templates/index.kit',
//					'../build/donna.html' : '../templates/donna.kit'
//				}
//			},
			dynamic_file_object: {
				files: [{
					expand: true,
					cwd: '../templates/',
					src: ['*.kit'],
					dest: '../build',
					ext: '.html'
				}]
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-codekit');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['watch']);

};