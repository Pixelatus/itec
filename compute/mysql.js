var mysql = require('mysql');

var connection = mysql.createConnection({ 
  host     : 'localhost',
  user     : 'root',
  password : 'modelismo',
  database : 'itec'
});


module.exports = connection;
