var request = require('request');
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
var url = 'mongodb://localhost:27017/test';

//var pizza = require('../jsonDataBase/pizza'); //Ajouter votre fichier json 




  /* var resultArray = [];
    var produit= [];  
        mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection("pizza").find();
    cursor.forEach(function(doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
    
    },function(){
   // console.log(resultArray);
    produit=resultArray;*/
 
      
exports.sendAllGeneric = function(senderId,res,FACEBOOK_ACCESS_TOKEN){
//    if (prod === 'Pizza'){ // Pizza doit être écrite comme dans l'intent 
     // console.log(JSON.stringify(res));
               var card = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: []

        
                    }
                }
            }
        }

    };
        mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection(res).find();
    //console.log(cursor);
    cursor.forEach(function(doc, err) {
      assert.equal(null, err);
    var gen = {
            title:'',
            subtitle: '',
            image_url:'',
            buttons: [{
                type: "postback",
                title: "Ingredient",
                payload:''  //JSON.stringify(produit[i].postIngredient)
            },
            {
                type: "postback",
                title: "Prix", /// link for call to action
                payload:'' //JSON.stringify(produit[i].postPrix)
            }]

        };
      gen.title=doc.title;
      gen.image_url =doc.image;
      gen.buttons[0].payload=doc.Ingredient;
      gen.buttons[1].payload=doc.Prix;
      // console.log(gen);
      card.json.message.attachment.payload.elements.push(gen);

    
    },function(){
    return request(card);
    db.close();
       // return request(card);
});
});    

  /*  for(var i = 0; i< produit.length ; i++){
        var gen = {
            title:produit[i].title,
            subtitle: "Découvrez plus sur "+ produit[i].title,
            image_url:produit[i].image,
            buttons: [{
                type: "postback",
                title: "Ingredients",
                payload:produit[i].postIngredient  //JSON.stringify(produit[i].postIngredient)
            },
            {
                type: "postback",
                title: "Prix", /// link for call to action
                payload:produit[i].postPrix //JSON.stringify(produit[i].postPrix)
            }]

        };*/
    //console.log("gen");
    //console.log(JSON.stringify(produit[i].image));
       // console.log(gen);
      //  card.json.message.attachment.payload.elements.push(gen);
   // };
   // console.log(gen);
   // console.log(card);

  //  return request(card);

}


    
  
exports.sendGenericProduct = function(senderId,intent, param,FACEBOOK_ACCESS_TOKEN){
    var card = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: []

        
                    }
                }
            }
        }

    };

        mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection(intent).find({title:param});
    cursor.forEach(function(doc, err) {
      assert.equal(null, err);
      
          var gen = {
            title:'',
            subtitle: '',
            image_url:'',
            buttons: [{
                type: "postback",
                title: "Ingredient",
                payload:''  //JSON.stringify(produit[i].postIngredient)
            },
            {
                type: "postback",
                title: "Prix", /// link for call to action
                payload:'' //JSON.stringify(produit[i].postPrix)
            }]

        };
      gen.title=doc.title;
      gen.image_url =doc.image;
      gen.buttons[0].payload=doc.Ingredient;
      gen.buttons[1].payload=doc.Prix;
     // console.log(gen);
      card.json.message.attachment.payload.elements.push(gen);

    
    },function(){
        return request(card);
        db.close();
    });
});



}

