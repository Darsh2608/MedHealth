/*

  filepreview : A file preview generator for node.js

*/

let child_process = require('child_process');
let crypto = require('crypto');
let path = require('path');
let fs = require('fs');
let mimedb = require('./db.json');
const { v4: uuidv4 } = require('uuid');
const rimraf = require('rimraf');
const { mkdirsSync } = require('fs-extra');

module.exports = {
	generate: (input, output, options, callback) => {
		// Normalize arguments

		if (typeof options === 'function') {
			callback = options;
			options = {};
		} else {
			options = options || {};
		}

		// Check for supported output format
		let extOutput = path.extname(output).toLowerCase().replace('.','');
		let extInput = path.extname(input).toLowerCase().replace('.','');

		if (
			extOutput != 'gif' &&
			extOutput != 'jpg' &&
			extOutput != 'png'
		) {
			return callback(true);
		}

		let fileType = 'other';

		root:
			for ( let index in mimedb ) {
				if ( 'extensions' in mimedb[index] ) {
					for ( let indexExt in mimedb[index].extensions ) {
						if ( mimedb[index].extensions[indexExt] == extInput ) {
							if ( index.split('/')[0] == 'image' ) {
								fileType = 'image';
							} else if ( index.split('/')[0] == 'video' ) {
								fileType = 'video';
							} else {
								fileType = 'other';
							}

							break root;
						}
					}
				}
			}

		if ( extInput == 'pdf' ) {
			fileType = 'image';
		}

		fs.lstat(input, function(error, stats) {
			if (error) return callback(error);
			if (!stats.isFile()) {
				return callback(true);
			} else {
				if ( fileType == 'video' ) {
					let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
					if (options.width > 0 && options.height > 0) {
						ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height);
					}
					child_process.execFile('ffmpeg', ffmpegArgs, function(error) {
						if (error) return callback(error);
						return callback();
					});
				}

				if ( fileType == 'image' ) {
					let convertArgs = [input + '[0]', output];
					if (options.width > 0 && options.height > 0) {
						convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
					}
					child_process.execFile('convert', convertArgs, function(error) {
						if (error) return callback(error);
						return callback();
					});
				}

				if ( fileType == 'other' ) {
					let hash = crypto.createHash('sha512');
					hash.update(Math.random().toString());
					hash = hash.digest('hex');

					let tempPDF = '/tmp/'+ hash + '.pdf';

					child_process.execFile('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input], function(error) {
						if (error) return callback(error);
						let convertOtherArgs = [tempPDF + '[0]', output];
						if (options.width > 0 && options.height > 0) {
							convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
						}
						child_process.execFile('convert', convertOtherArgs, function(error) {
							if (error) return callback(error);
							fs.unlink(tempPDF, function(error) {
								if (error) return callback(error);
								return callback();
							});
						});
					});
				}
			}
		});
	},

	// Generate Thumbnail
	generateSync: (input, output, options) => {

		options = options || {};

		// Check for supported output format
		let extOutput = path.extname(output).toLowerCase().replace('.','');
		let extInput = path.extname(input).toLowerCase().replace('.','');
		
		// if (
		// 	extOutput != 'gif' &&
		// 	extOutput != 'jpg' &&
		// 	extOutput != 'png'
		// ) {
		// 	return false;
		// }

		let fileType = 'other';

		root:
			for ( let index in mimedb ) {
				if ( 'extensions' in mimedb[index] ) {
					for ( let indexExt in mimedb[index].extensions ) {
						if ( mimedb[index].extensions[indexExt] == extInput ) {
							if ( index.split('/')[0] == 'image' ) {
								fileType = 'image';
							} else if ( index.split('/')[0] == 'video' ) {
								fileType = 'video';
							} else {
								fileType = 'other';
							}

							break root;
						}
					}
				}
			}

		if ( extInput == 'pdf' ) {
			fileType = 'image';
		}

		try {
			stats = fs.lstatSync(input);

			if (!stats.isFile()) {
				return false;
			}
		} catch (e) {
			console.log('Error',e);
			return false;
		}

		if ( fileType == 'video' ) {
			try {
				let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
				if (options.width > 0 && options.height > 0) {
					ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height)
				}
				child_process.execFileSync('ffmpeg', ffmpegArgs);
				return true;
			} catch (e) {
				return false;
			}
		}

		if ( fileType == 'image' ) {
			try {
				let convertArgs = [input + '[0]', output];
				// convertArgs.splice(0, 0, '-density', 10);
				convertArgs.splice(0, 0, '-colorspace', 'sRGB');
				convertArgs.splice(0, 0, '-alpha', 'remove');
				// convertArgs.splice(0, 0, '-quality', 0.8);
				if (options.width > 0 && options.height > 0) {
					convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);			 
				}
				child_process.execFileSync('convert', convertArgs, options);
				return true;
			} catch (e) {
				return false;
			}
		}

		if ( fileType == 'other' ) {
			try {
				let hash = crypto.createHash('sha512');
				hash.update(Math.random().toString());
				hash = hash.digest('hex');

				let tempPDF = '/tmp/'+ hash + '.pdf';
				
				if (options.pagerange !== undefined && options.pagerange !== null) {
					child_process.execFileSync('unoconv', ['-e', 'PageRange='+options.pagerange, '-o', tempPDF, input]);
				} else {
					child_process.execFileSync('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input]);
				}

				let convertOtherArgs = [tempPDF + '[0]', output];
				convertOtherArgs.splice(0, 0, '-density', 35);
				convertOtherArgs.splice(0, 0, '-colorspace', 'sRGB');
				convertOtherArgs.splice(0, 0, '-alpha', 'remove');
				convertOtherArgs.splice(0, 0, '-quality', 30);
				
				if (options.width > 0 && options.height > 0) {
					convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
				}
				
				child_process.execFileSync('convert', convertOtherArgs);
				fs.unlinkSync(tempPDF);				

				return true;
			} catch (e) {
				console.log('Error',e);
				return false;
			}
		}
	},

	generateSyncNew: (input, output, options) => {

		options = options || {};
	
		// Check for supported output format
		let extOutput = path.extname(output).toLowerCase().replace('.','');
		let extInput = path.extname(input).toLowerCase().replace('.','');
		
		if (
			extOutput != 'gif' &&
			extOutput != 'jpg' &&
			extOutput != 'jpeg' &&
			extOutput != 'png'
		) {
			return false;
		}
	
		let fileType = 'other';
	
		root:
			for ( let index in mimedb ) {
				if ( 'extensions' in mimedb[index] ) {
					for ( let indexExt in mimedb[index].extensions ) {
						if ( mimedb[index].extensions[indexExt] == extInput ) {
							if ( index.split('/')[0] == 'image' ) {
								fileType = 'image';
							} else if ( index.split('/')[0] == 'video' ) {
								fileType = 'video';
							} else {
								fileType = 'other';
							}
	
							break root;
						}
					}
				}
			}
		
		if ( extInput == 'pdf' ) {
			fileType = 'image';
		}
		try {
			stats = fs.lstatSync(input);
	
			if (!stats.isFile()) {
				return false;
			}
		} catch (e) {
			console.log('Error',e);
			return false;
		}
	
		if ( fileType == 'video' ) {
			try {
				let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
				if (options.width > 0 && options.height > 0) {
					ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height)
				}
				child_process.execFileSync('ffmpeg', ffmpegArgs);
				return true;
			} catch (e) {
				return false;
			}
		}
	
		if ( fileType == 'image' ) {
			try {
				let convertArgs = [input + '[0]', output];
				if (options.width > 0 && options.height > 0) {
					convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
				}
				child_process.execFileSync('convert', convertArgs,options);
				return true;
			} catch (e) {
				return false;
			}
		}
	
		if ( fileType == 'other' ) {
			try {
				let hash = crypto.createHash('sha512');
				hash.update(Math.random().toString());
				hash = hash.digest('hex');
	
				let tempPDF = '/tmp/'+ hash + '.pdf';
	
				child_process.execFileSync('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input]);
	
				let convertOtherArgs = [tempPDF + '[0]', output];
				if (options.width > 0 && options.height > 0) {
					convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
				}
				child_process.execFileSync('convert', convertOtherArgs);
				fs.unlinkSync(tempPDF);
	
				return true;
			} catch (e) {
				console.log('Error',e);
				return false;
			}
		}
	},

	generateS3SyncNew: (fileName, input, output, options) => {

		options = options || {};
	
		// Check for supported output format
		let extOutput = path.extname(output).toLowerCase().replace('.','');
		let extInput = path.extname(fileName).toLowerCase().replace('.','');
		
		if (
			extOutput != 'gif' &&
			extOutput != 'jpg' &&
			extOutput != 'jpeg' &&
			extOutput != 'png'
		) {
			return false;
		}
	
		let fileType = 'other';
	
		root:
			for ( let index in mimedb ) {
				if ( 'extensions' in mimedb[index] ) {
					for ( let indexExt in mimedb[index].extensions ) {
						if ( mimedb[index].extensions[indexExt] == extInput ) {
							if ( index.split('/')[0] == 'image' ) {
								fileType = 'image';
							} else if ( index.split('/')[0] == 'video' ) {
								fileType = 'video';
							} else {
								fileType = 'other';
							}
	
							break root;
						}
					}
				}
			}
		
		// if ( extInput == 'pdf' ) {
		// 	fileType = 'image';
		// }
		// try {
		// 	stats = fs.lstatSync(input);
	
		// 	if (!stats.isFile()) {
		// 		return false;
		// 	}
		// } catch (e) {
		// 	console.log('Error',e);
		// 	return false;
		// }
	
		if ( fileType == 'video' ) {
			try {
				let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
				if (options.width > 0 && options.height > 0) {
					ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height)
				}
				child_process.execFileSync('ffmpeg', ffmpegArgs);
				return true;
			} catch (e) {
				return false;
			}
		}
	
		if ( fileType == 'image' ) {
			try {
				let convertArgs = [input + '[0]', output];
				if (options.width > 0 && options.height > 0) {
					convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
				}
				child_process.execFileSync('convert', convertArgs,options);
				return true;
			} catch (e) {
				return false;
			}
		}
	
		if ( fileType == 'other' ) {
			try {
				let hash = crypto.createHash('sha512');
				hash.update(Math.random().toString());
				hash = hash.digest('hex');
	
				let tempPDF = '/tmp/'+ hash + '.pdf';
	
				child_process.execFileSync('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input]);
	
				let convertOtherArgs = [tempPDF + '[0]', output];
				if (options.width > 0 && options.height > 0) {
					convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
				}
				child_process.execFileSync('convert', convertOtherArgs);
				fs.unlinkSync(tempPDF);
	
				return true;
			} catch (e) {
				console.log('Error',e);
				return false;
			}
		}
	},
	/**
	 * Generate preview image from file url
	 * @param {string} filename 
	 * @param {string} input 
	 * @param {string} output 
	 * @param {Object} options 
	 * @returns boolean
	 */
	generatePreviewImageFromUrl: async(filename, input, output, options) => {
		try {
			options = options || {};
			// Check for supported output format
			let extInput = path.extname(filename).toLowerCase().replace('.','');			
			let tempPath = './public/uploads/temp/';

			// check for thumbnails folder if not exist then create.
			if (!fs.existsSync(tempPath)) {
				rimraf.sync(tempPath);
				mkdirsSync(tempPath);
			}

			// create a temprory files
			tempPath = tempPath + uuidv4() + '.' + extInput;

			const got = require('got');
			const response = await got(input, { responseType: 'buffer' });
			fs.writeFileSync(tempPath, response.body);

			// Create preview image files
			module.exports.generateSync(tempPath, output, options);

			// delete temprory file
			fs.unlinkSync(tempPath);
			return true;
		} catch (error) {
			return false;
		}	
	}
};
