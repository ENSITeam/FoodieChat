var request = require('request');

exports.sendPatron = function(senderId, FACEBOOK_ACCESS_TOKEN){
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message:{
                attachment:{ 
                type: "template",
                payload:{
                template_type:"button",
                text:"Comment voulez vous contacter mon patron?",
                buttons:[
                {
                    "type":"web_url",
                    "url":"https://www.messenger.com",
                    "title":"Visiter son profil"
                },
                {
                    type:"phone_number",
                    title:"Appeler",
                    payload:"+21612345678"
                }]
                }}
            }
        }
    })
}
