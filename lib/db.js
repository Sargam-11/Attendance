var mysql=require('mysql');
var connection=mysql.createConnection({
  host:'localhost',

  user:'root',
  // password:'your_password',
  password:'',
  database:'nodelogin'
});
connection.connect(function(error){
  if(!!error){
    console.log(error);
  }else{
    console.log('Connected!:)');
  }
});  
module.exports = connection; 