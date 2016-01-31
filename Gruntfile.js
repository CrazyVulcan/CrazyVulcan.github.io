module.exports = function(grunt) {

	grunt.initConfig({
	
		watch: {
			grunt: {
				files: "Gruntfile.js",
				options: { reload: true },
			},
			js: {
				files: ["src/js/*.js", "src/js/common/*.js"],
				tasks: ["build-js"],
			},
			templates: {
				files: ["src/templates/*.html", "src/templates/common/*.html"],
				tasks: ["build-js"],
			},
			css: {
				files: ["src/css/**.css", "src/css/common/*.css"],
				tasks: ["build-css"],
			},
			index: {
				files: "src/*.html",
				tasks: ["build-index"],
			},
			data: {
				files: "src/data/*",
				tasks: ["build-data"],
			}
		},
		
		clean: {
			build: ["build/*"],
			templates: ["build/utopia-templates.js"],
		},
		
		ngtemplates: {
			utopia: {
				cwd: "src/templates",
				src: ["*.html", "common/*.html"],
				dest: "build/utopia-templates.js",
				options: {
					url: function(url) {
						var i = url.lastIndexOf("/");
						if( i >= 0 && i < url.length )
							url = url.substring(i+1);
						return url;
					}
				}
			}
		},
		
		uglify: {
			js: {
				files: {
					"build/js/utopia.min.js": [ "src/js/*.js", "src/js/common/*.js", "<%= ngtemplates.utopia.dest %>" ]
				},
				options: {
					sourceMap: true,
				}
			}
		},
		
		cssmin: {
			css: {
				files: {
					"build/css/utopia.min.css": ["src/css/*.css", "src/css/common/*.css", "!src/css/utopia-print.css"],
				}
			}
		},
		
		copy: {
			misc: {
				expand: true,
				cwd: "src",
				src: [ "js/lib/*", "fonts/*", "img/*" ],
				dest: "build/",
			},
			css: {
				expand: true,
				cwd: "src",
				src: [ "css/utopia-print.css" ],
				dest: "build/",
			},
			csslib: {
				expand: true,
				cwd: "src/css/lib",
				src: [ "*.css" ],
				dest: "build/css/",
			},
			index: {
				expand: true,
				cwd: "src",
				src: [ "*.html" ],
				dest: "build/",
			},
			powertip: {
				expand: true,
				cwd: "node_modules/jquery-powertip/dist",
				src: [ "jquery.powertip.min.js" ],
				dest: "build/js/lib/",
			},
			powertip_css: {
				expand: true,
				cwd: "node_modules/jquery-powertip/dist/css",
				src: [ "jquery.powertip.min.css" ],
				dest: "build/css/",
			}
		},
		
		utopia_data: {
			spacedock: {
				files: {
					"build/data/data.json": "src/data/*",
				},
			},
		}
	
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-utopia-data');
	
	grunt.registerTask('build-js', ["ngtemplates","uglify"]);
	grunt.registerTask('build-css', ["cssmin","copy:css"]);
	grunt.registerTask('build-index', ["copy:index"]);
	grunt.registerTask('build-data', ["utopia_data"]);
	
	//grunt.registerTask('default', ["clean","build-js","build-css","build-index","build-data","copy","clean:templates"]);
	grunt.registerTask('default', ["build-js","build-css","build-index","build-data","copy","clean:templates"]);
};
