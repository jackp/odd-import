var Sequelize = require('sequelize');

var sequelize = new Sequelize('database', null, null, {
	dialect: 'sqlite',
	storage: 'cfrf_v_55_130425092505.db'
});

sequelize.query("SELECT * FROM sample").success(function(myTableRows) {
  console.log(myTableRows)
})