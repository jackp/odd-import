///////////////////////////////////////////////////
//	Requirements
///////////////////////////////////////////////////

var Sequelize = require('sequelize'),
		async = require('async'),
		fs = require('fs'),
		_ = require('underscore'),
		moment = require('moment'),
		Inotify = require('inotify').Inotify,
		inotify = new Inotify();

///////////////////////////////////////////////////
//	File paths
///////////////////////////////////////////////////
var WATCH_PATH = '/home/odd/';

///////////////////////////////////////////////////
//	Inotify event callback
///////////////////////////////////////////////////

var callback = function(event){
	console.log('PROCESSING: ' + event.name);
	var sqlite = new Sequelize('cfrf', null, null, {
		dialect : 'sqlite',
		storage : WATCH_PATH + event.name,
		logging : false,
		define : {
			freezeTableName : true,
			timestamps : false
		}
	});

	var mysql = new Sequelize('cfrf', 'import', 'YRD2ZRTNj35hPwE2', {
		dialect : 'mysql',
		logging : false,
		define : {
			freezeTableName : true,
			timestamps : false
		}
	});

	var sampleModel = {
		"vessel_id" : Sequelize.INTEGER,
		"session_id" : Sequelize.INTEGER,
		"when_sampled" : Sequelize.DATE,
		"length" : Sequelize.INTEGER,
		"sex" : Sequelize.STRING,
		"eggs" : Sequelize.INTEGER,
		"v_notch" : Sequelize.INTEGER,
		"disease" : Sequelize.INTEGER,
		"image" : Sequelize.TEXT,
		"notes" : Sequelize.TEXT,
		"length_type" : Sequelize.STRING
	};

	var randomModel = {
		"vessel_id" : Sequelize.INTEGER,
		"when_sampled" : Sequelize.DATE,
		"lat" : Sequelize.FLOAT,
		"lon" : Sequelize.FLOAT,
		"length" : Sequelize.INTEGER,
		"length_type" : Sequelize.STRING,
		"image" : Sequelize.TEXT,
		"notes" : Sequelize.TEXT,
	};

	var sessionModel = {
		"vessel_id" : Sequelize.INTEGER,
		"when_start" : Sequelize.DATE,
		"when_stop" : Sequelize.DATE,
		"start_lat" : Sequelize.FLOAT,
		"start_lon" : Sequelize.FLOAT,
		"num_traps" : Sequelize.INTEGER,
		"soak_time" : Sequelize.INTEGER,
		"depth" : Sequelize.INTEGER,
		"depth_unit" : Sequelize.STRING,
		"notes" : Sequelize.TEXT,
		"session_type" : Sequelize.STRING,
		"stat_area": Sequelize.INTEGER
	};

	async.parallel({
		sample : function(cb){
			var SampleLite = sqlite.define('sample', sampleModel);
			var Sample = mysql.define('sample', sampleModel);

			SampleLite.all().success(function(results){
				_.each(results, function(result){
					result.selectedValues = _.omit(result.selectedValues, 'id');

					// Format date
					result.selectedValues.when_sampled = moment(result.selectedValues.when_sampled).format('YYYY-MM-DD HH:mm:ss');

					var sample = Sample.build(result.selectedValues);

					sample.save().success(function(){
					}).error(function(error){
						console.log('ERROR');
					});
				});

				cb(null, true);
			});
		},
		random : function(cb){
			var RandomLite = sqlite.define('random', randomModel);
			var Random = mysql.define('random', randomModel);

			RandomLite.all().success(function(results){
				_.each(results, function(result){
					result.selectedValues = _.omit(result.selectedValues, 'id');

					// Format date
					result.selectedValues.when_sampled = moment(result.selectedValues.when_sampled).format('YYYY-MM-DD HH:mm:ss');

					var random = Random.build(result.selectedValues);

					random.save().success(function(){
					}).error(function(error){
						console.log('ERROR');
					});
				});

				cb(null, true);
			});
		},
		session : function(cb){
			var SessionLite = sqlite.define('session', sessionModel);
			var Session = mysql.define('session', sessionModel);

			SessionLite.all().success(function(results){
				_.each(results, function(result){
					// result.selectedValues = _.omit(result.selectedValues, 'id');

					// Format date
					result.selectedValues.when_start = moment(result.selectedValues.when_start).format('YYYY-MM-DD HH:mm:ss');
					result.selectedValues.when_stop = moment(result.selectedValues.when_stop).format('YYYY-MM-DD HH:mm:ss');

					var session = Session.build(result.selectedValues);

					session.save().success(function(){
					}).error(function(error){
						console.log('ERROR');
						console.log(error);
					});
				});

				cb(null, true);
			});
		}
	}, function(err, results){
		console.log(results);
		
		fs.renameSync(WATCH_PATH + event.name, WATCH_PATH + 'processed/' + event.name);
	});
};

///////////////////////////////////////////////////
//	Watch WATCH_PATH for changes
///////////////////////////////////////////////////

inotify.addWatch({
	path: WATCH_PATH,
	watch_for: Inotify.IN_CLOSE_WRITE,
	callback: callback
});
