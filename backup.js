#!/usr/bin/env node

// Create mysql backup
var path = require('path'),
		fs = require('fs'),
		exec = require('child_process').exec;

// var command = execSync('mysqldump -u jack -pj6286ipp cfrf > tmp/backup.sql', true);
var child = exec('mysqldump -u jack -pj6286ipp cfrf > tmp/backup.sql', function(error, stdout, stderr){
	if(!stderr){
		var date = new Date();
		// Upload to rackspace
		var rackspace = require('pkgcloud').storage.createClient({
			provider: 'rackspace',
			username: 'cfrfoundation',
			apiKey: '6fbea9df8e8e957e4fafe2f6e95f342f',
			region: 'ORD'
		});

		rackspace.upload({
			container: 'oddbackups',
			remote: 'backup_' + (date.getMonth()+1) + '_' + (date.getDate()) + '_' + date.getHours() + "_" + date.getFullYear() + '.sql',
			local: '/home/jack/tmp/backup.sql',
			headers: {
				contentType: 'application/sql'
			}
		}, function(err, result){
			if(err){
				console.log(err);
			} else if (result){
				fs.unlink('tmp/backup.sql');
			}
		});
	}
});

