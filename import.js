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
		"session_id" : {
			type: Sequelize.INTEGER,
			primaryKey: true
		},
		"when_sampled" : Sequelize.DATE,
		"length" : Sequelize.INTEGER,
		"sex" : Sequelize.STRING,
		"eggs" : Sequelize.INTEGER,
		"v_notch" : Sequelize.INTEGER,
		"disease" : Sequelize.INTEGER,
		"discard": {
			type: Sequelize.INTEGER,
			defaultValue: 0
		},
		"soft": {
			type: Sequelize.INTEGER,
			defaultValue: 0
		},
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
		"stat_area": Sequelize.INTEGER,
		"empty_traps": {
			type: Sequelize.INTEGER,
			defaultValue: 0
		}
	};

	var tempSessionModel = {
		"id": Sequelize.STRING,
		"vessel_id": Sequelize.INTEGER,
		"latitude": Sequelize.FLOAT,
		"longitude": Sequelize.FLOAT,
		"logger_id": Sequelize.INTEGER,
		"depth": Sequelize.INTEGER,
		"notes": Sequelize.TEXT,
		"when_offloaded": Sequelize.DATE,
		"when_acquired": Sequelize.DATE,
		"when_start": Sequelize.DATE,
		"when_end": Sequelize.DATE
	};

	var tempSampleModel = {
		"vessel_id": Sequelize.INTEGER,
		"session_id": Sequelize.STRING,
		"when_sampled": Sequelize.DATE,
		"temp_adc": Sequelize.INTEGER,
		"temp_c": Sequelize.FLOAT,
		"temp_f": Sequelize.FLOAT
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
						console.log('SAMPLE ERROR');
						console.log(error);
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
						console.log(' RANDOM ERROR');
						console.log(error);
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
						console.log('SESSION ERROR');
						console.log(error);
					});
				});

				cb(null, true);
			});
		},
		tempSession: function(cb){
			var TempSessionLite = sqlite.define('temp_sessions', tempSessionModel);
			var TempSession = mysql.define('temp_sessions', tempSessionModel);

			TempSessionLite.all().success(function(results){
				_.each(results, function(result){
					// Format Dates
					result.selectedValues.when_offloaded = moment(result.selectedValues.when_offloaded).format('YYYY-MM-DD HH:mm:ss');
					result.selectedValues.when_acquired = moment(result.selectedValues.when_acquired).format('YYYY-MM-DD HH:mm:ss');
					result.selectedValues.when_start = moment(result.selectedValues.when_start).format('YYYY-MM-DD HH:mm:ss');
					result.selectedValues.when_end = moment(result.selectedValues.when_end).format('YYYY-MM-DD HH:mm:ss');

					var tempSession = TempSession.build(result.selectedValues);

					tempSession.save().success(function(){
					}).error(function(error){
						console.log('TEMP SESSION ERROR');
						console.log(error);
					});
				});

				cb(null, true);
			});
		},
		tempSample: function(cb){
			var TempSampleLite = sqlite.define('temp_samples', tempSampleModel);
			var TempSample = mysql.define('temp_samples', tempSampleModel);

			TempSampleLite.all().success(function(results){
				_.each(results, function(result){
					result.selectedValues = _.omit(result.selectedValues, 'id');

					// Format Dates
					result.selectedValues.when_sampled = moment(result.selectedValues.when_sampled).format('YYYY-MM-DD HH:mm:ss');

					var tempSample = TempSample.build(result.selectedValues);

					tempSample.save().success(function(){
					}).error(function(error){
						console.log('TEMP SAMPLE ERROR');
						console.log(error);
					});
				});

				cb(null, true);
			});
		}
	}, function(err, results){
		if(err){
			console.log(err);
		}
		fs.renameSync(WATCH_PATH + event.name, WATCH_PATH + 'processed/' + event.name);
	});
};

///////////////////////////////////////////////////
//	Watch WATCH_PATH for changes
///////////////////////////////////////////////////
console.log('SETTING UP WATCH');

inotify.addWatch({
	path: WATCH_PATH,
	watch_for: Inotify.IN_CLOSE_WRITE,
	callback: callback
});
