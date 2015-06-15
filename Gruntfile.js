module.exports = function(grunt) {

	grunt.initConfig({
	
		watch: {
			grunt: {
				files: "Gruntfile.js",
				options: { reload: true },
			},
			js: {
				files: "src/js/*.js",
				tasks: ["build-js"],
			},
			html: {
				files: "src/templates/*.html",
				tasks: ["build-templates"],
			}
		},
		
		clean: {
			build: ["build/**"],
			templates: ["build/utopia-templates.js"],
		},
		
		ngtemplates: {
			utopia: {
				cwd: "src/templates",
				src: "*.html",
				dest: "build/utopia-templates.js",
			}
		},
		
		uglify: {
			js: {
				files: {
					"build/js/utopia.min.js": [ "src/js/*.js", "<%= ngtemplates.utopia.dest %>" ]
				},
				options: {
					sourceMap: true,
					mangle: {
						except: ["$filter"],
					}
				}
			}
		},
		
		cssmin: {
			css: {
				files: {
					"build/css/utopia.min.css": ["src/css/*.css", "!src/css/utopia-print.css"],
				}
			}
		},
		
		copy: {
			all: {
				expand: true,
				cwd: "src",
				src: [ "index.html", "js/lib/*", "fonts/*", "img/*", "data/*", "css/utopia-print.css" ],
				dest: "build/",
			},
		},
	
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
};
