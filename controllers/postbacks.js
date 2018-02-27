var request = require('request');
const APIAI_ACCESS_TOKEN = 'a5be209757574abebb6d0183b2456707';
const FACEBOOK_ACCESS_TOKEN = 'EAAB3sgP0V6MBAHXaCAGZAWeZANPeYcsRlZAg95thW8emHZBrzYXauaYnlnXZBveinnWyG6MlY4tDjuoIJ9WrFpYSH9Yu7VIsL5zz1DZCygsFO7LYLFWOlt3RwO3ILBegMaKAWjX6sy5Wb4ZB9Q60RkDXx6pmRskw5ZAh5uI2mwqp1iC6NPdJKZCO4';
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
var url = 'mongodb://localhost:27017/test'; 


/*const findPostI = (value) => {
    var g=0;
var p=0;
    var i=0;
    var j=0;


    for (i=0; i<listeProduit.length; i++)
    {
        for (j = 0; j<listeProduit[i].length; j++) {
            if (listeProduit[i][j].postIngredient === value){
                g++;
                var obj = [i,j,g,p];
                return obj;
            }
            if (listeProduit[i][j].postPrix === value){
                p++;
                var obj = [i,j,g,p];
                return obj;
            }
        }
    }
}
*/
    function sendmessag (senderId,text){
       return({
            recipient: { id: senderId },
             message: { text }
              });
    };



exports.findPostback =(senderId,str,text1,text2) => {
      var med1;
      var med2;
      var msg={
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
    };

  if(text1=="Prix")
  {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
   var cursor = db.collection(str.metadata.intentName).find({Prix:text2});
    cursor.forEach(function(doc, err) {
     assert.equal(null, err);
      med1=doc.author;
     // console.log(sendmessag(senderId,med1));
      msg.json=sendmessag(senderId ,med1);


     // console.log(msg);
     //console.log(test);
     //console.log(sendTextMessage(senderId,test));
    },function(){
       return request(msg);
        db.close();
   });
});
}
else
{
    mongo.connect(url, function(err, db) {
    assert.equal(null, err);
   var cursor = db.collection(str.metadata.intentName).find({Ingredient:text2});
    cursor.forEach(function(doc, err) {
     assert.equal(null, err);
      med2=doc.content;
      msg.json=sendmessag(senderId ,med2);

     //console.log(test);
     //console.log(sendTextMessage(senderId,test));
    },function(){
             return request(msg);
      // console.log(test);
        db.close();
   });
});
}
};


















/* function(event, prod){

    
    var str = event.postback.payload;
    //console.log(str); 
    
    var i =findPostI(str);  
    
   // console.log(i);
    var x =i[0];
    var y =i[1];
    if(i[2]!==0)
    {
        global.test1 = listeProduit[x][y].Ingredients; 
       // console.log(test1);
    }
    else if (i[3]!==0)
    {
        global.test1 = listeProduit[x][y].Prix; 
       //console.log(test1);
    }
};
*/


