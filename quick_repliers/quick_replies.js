var request = require('request');

exports.sendQr = function(senderId, message, result, FACEBOOK_ACCESS_TOKEN){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json : {
        	recipient: { id: senderId },
        	message: {
                text:result,
                quick_replies:[
                    {
                        content_type: "text",
                        title: "Visiter notre menu",
                        payload: "a"
                    },
                    {
                        content_type :"text",
                        title :"Voir disponibilités ",
                        payload :"h"
                    },
                    {
                        content_type :"text",
                        title :"Contacter mon patron",
                        payload :"h"
                    }]
            }
        }	
	})
}

exports.sendQrMenu = function(senderId,result, FACEBOOK_ACCESS_TOKEN){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json : {
            recipient: { id: senderId },
            message: {
                text:result,
                quick_replies:[
                    {
                        content_type: "text",
                        title: "Pizza",
                        payload: "a"
                    },
                    {
                        content_type :"text",
                        title :"Sandwich",
                        payload :"h"
                    },
                    {
                        content_type :"text",
                        title :"Boisson",
                        payload :"h"
                    }]
            }
        }   
    })
}

