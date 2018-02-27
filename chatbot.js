
const apiai = require('apiai');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const request = require('request');
const JSONbig = require('json-bigint');
const async = require('async');


const patron = require('./controllers/sendBoutonPatron');
const product = require('./controllers/sendProduct');
const postbacks = require('./controllers/postbacks');
//const qr = require('./quick_repliers/quick_replies');

const REST_PORT = (process.env.PORT || 5000);
const APIAI_ACCESS_TOKEN = '65bcde83494640f8b8e021dcfcaaa876';
const APIAI_LANG = process.env.APIAI_LANG || 'fr';
const FB_VERIFY_TOKEN = "med";
const FB_PAGE_ACCESS_TOKEN = 'EAAB8YZCE07GIBAPmZAHQbxZA6rjDZAz6Wx6G0OHKIkDhZBZAvGFhNNQ19LCQZAnYvzYaUqe8WRkFshA0YAx1b93kBDCN68FO2iIHkN15TeULrZBam53fr9j5QvSvUxelYObzzUXIaKNkg893Hz6AQE6B31SJZBtDykZCZCTJ8XErKkwvgZDZD';
const FB_TEXT_LIMIT = 640;

const FACEBOOK_LOCATION = "FACEBOOK_LOCATION";
const FACEBOOK_WELCOME = "FACEBOOK_WELCOME";

var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
var url = 'mongodb://localhost:27017/test';
var arr=[];

const sendTextMessage = (senderId, text) => {
   // console.log(text);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FB_PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: { text }
        }
    });
  //  console.log(request);
};



class FacebookBot {
    constructor() {
        this.apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: APIAI_LANG, requestSource: "fb"});
        this.sessionIds = new Map();
        this.messagesDelay = 200;
    }


    doDataResponse(sender, facebookResponseData) {
    	console.log("doDataResponse");
        if (!Array.isArray(facebookResponseData)) {
            console.log('Response as formatted message');
            this.sendFBMessage(sender, facebookResponseData)
                .catch(err => console.error(err));
        } else {
            async.eachSeries(facebookResponseData, (facebookMessage, callback) => {
                if (facebookMessage.sender_action) {
                    console.log('Response as sender action');
                    this.sendFBSenderAction(sender, facebookMessage.sender_action)
                        .then(() => callback())
                        .catch(err => callback(err));
                }
                else {
                    console.log('Response as formatted message');
                    this.sendFBMessage(sender, facebookMessage)
                        .then(() => callback())
                        .catch(err => callback(err));
                }
            }, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Data response completed');
                }
            });
        }
    }

    doRichContentResponse(sender, messages) {
        let facebookMessages = []; // array with result messages

        for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
            let message = messages[messageIndex];

            switch (message.type) {
                //message.type 0 means text message
                case 0:
                                	console.log("i am here");

                    // speech: ["hi"]
                    // we have to get value from fulfillment.speech, because of here is raw speech
                    if (message.speech) {

                        let splittedText = this.splitResponse(message.speech);

                        splittedText.forEach(s => {
                            facebookMessages.push({text: s});
                        });
                    }

                    break;
                //message.type 1 means card message
                case 1: {
                	                	console.log("i am here2");

                    let carousel = [message];

                    for (messageIndex++; messageIndex < messages.length; messageIndex++) {
                        if (messages[messageIndex].type == 1) {
                            carousel.push(messages[messageIndex]);
                        } else {
                            messageIndex--;
                            break;
                        }
                    }

                    let facebookMessage = {};
                    carousel.forEach((c) => {
                        // buttons: [ {text: "hi", postback: "postback"} ], imageUrl: "", title: "", subtitle: ""

                        let card = {};

                        card.title = c.title;
                        card.image_url = c.imageUrl;
                        if (this.isDefined(c.subtitle)) {
                            card.subtitle = c.subtitle;
                        }
                        //If button is involved in.
                        if (c.buttons.length > 0) {
                            let buttons = [];
                            for (let buttonIndex = 0; buttonIndex < c.buttons.length; buttonIndex++) {
                                let button = c.buttons[buttonIndex];

                                if (button.text) {
                                    let postback = button.postback;
                                    if (!postback) {
                                        postback = button.text;
                                    }

                                    let buttonDescription = {
                                        title: button.text
                                    };

                                    if (postback.startsWith("http")) {
                                        buttonDescription.type = "web_url";
                                        buttonDescription.url = postback;
                                    } else {
                                        buttonDescription.type = "postback";
                                        buttonDescription.payload = postback;
                                    }

                                    buttons.push(buttonDescription);
                                }
                            }

                            if (buttons.length > 0) {
                                card.buttons = buttons;
                            }
                        }

                        if (!facebookMessage.attachment) {
                            facebookMessage.attachment = {type: "template"};
                        }

                        if (!facebookMessage.attachment.payload) {
                            facebookMessage.attachment.payload = {template_type: "generic", elements: []};
                        }

                        facebookMessage.attachment.payload.elements.push(card);
                    });

                    facebookMessages.push(facebookMessage);
                }

                    break;
                //message.type 2 means quick replies message
                case 2: {
                    if (message.replies && message.replies.length > 0) {
                        let facebookMessage = {};

                        facebookMessage.text = message.title ? message.title : 'Choose an item';
                        facebookMessage.quick_replies = [];

                        message.replies.forEach((r) => {
                            facebookMessage.quick_replies.push({
                                content_type: "text",
                                title: r,
                                payload: r
                            });
                        });

                        facebookMessages.push(facebookMessage);
                    }
                }

                    break;
                //message.type 3 means image message
                case 3:

                    if (message.imageUrl) {
                        let facebookMessage = {};

                        // "imageUrl": "http://example.com/image.jpg"
                        facebookMessage.attachment = {type: "image"};
                        facebookMessage.attachment.payload = {url: message.imageUrl};

                        facebookMessages.push(facebookMessage);
                    }

                    break;
                //message.type 4 means custom payload message
                case 4:
                    if (message.payload && message.payload.facebook) {
                        facebookMessages.push(message.payload.facebook);
                    }
                    break;

                default:
                    break;
            }
        }

        return new Promise((resolve, reject) => {
            async.eachSeries(facebookMessages, (msg, callback) => {
                    this.sendFBSenderAction(sender, "typing_on")
                        .then(() => this.sleep(this.messagesDelay))
                        .then(() => this.sendFBMessage(sender, msg))
                        .then(() => callback())
                        .catch(callback);
                },
                (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.log('Messages sent!!!');
                        if(arr[(arr.length)-1]==='oui')
                        {console.log(arr);
                         if(arr.length === 7){




                             var item = {
                                   name: arr[1],
                                    phone: arr[2] ,
                                    nbr_places: arr[3],
                                    temps: arr[4],
                                    commantaire : arr[5]
                                         };

                                  mongo.connect(url, function(err, db) {
                                   assert.equal(null, err);
                                  db.collection("reservaton").insertOne(item, function(err, result) {
                                  assert.equal(null, err);
                                  console.log('Item inserted');
                                  db.close();
                                  });
                                 });
                        sendTextMessage(sender,'votre reservation est bien recu')
                        arr=[];
                         }
                         else{
                            arr=[];
                            var msg1='dsl la reservation est echoué ressaiez et verifiez vootre donnez';
                            console.log("reservation invalide");
                            sendTextMessage(sender,msg1);
                               }




                        }
                        resolve();
                    }
                });
        });

    }

    doTextResponse(sender, responseText) {
        console.log('Response as text message');
        // facebook API limit for text length is 640,
        // so we must split message if needed
        let splittedText = this.splitResponse(responseText);

        async.eachSeries(splittedText, (textPart, callback) => {
            this.sendFBMessage(sender, {text: textPart})
                .then(() => callback())
                .catch(err => callback(err));
        });
    }

    //which webhook event
    getEventText(event) {
        if (event.message) {
            if (event.message.quick_reply && event.message.quick_reply.payload) {
                return event.message.quick_reply.payload;
            }

            if (event.message.text) {
                return event.message.text;
            }
        }

        if (event.postback && event.postback.payload) {
            return event.postback.payload;
        }

        return null;

    }

    getFacebookEvent(event) {
        if (event.postback && event.postback.payload) {

            let payload = event.postback.payload;

            switch (payload) {
                case FACEBOOK_WELCOME:
                    return {name: FACEBOOK_WELCOME};

                case FACEBOOK_LOCATION:
                    return {name: FACEBOOK_LOCATION, data: event.postback.data}
            }
        }

        return null;
    }

    processFacebookEvent(event) {
        const sender = event.sender.id.toString();
        const eventObject = this.getFacebookEvent(event);
        console.log("i am fb evt");


        if (eventObject) {

            // Handle a text message from this sender
            if (!this.sessionIds.has(sender)) {
                this.sessionIds.set(sender, uuid.v4());
            }

            let apiaiRequest = this.apiAiService.eventRequest(eventObject,
                {
                    sessionId: this.sessionIds.get(sender),
                    originalRequest: {
                        data: event,
                        source: "facebook"
                    }
                });
            this.doApiAiRequest(apiaiRequest, sender);
        }
    }

    processMessageEvent(event) {
        const sender = event.sender.id.toString();
        const text = this.getEventText(event);
        console.log("i am in mess even");


        if (text) {

            // Handle a text message from this sender
            if (!this.sessionIds.has(sender)) {
                this.sessionIds.set(sender, uuid.v4());
            }

            console.log("Text", text);
            //send user's text to api.ai service
            let apiaiRequest = this.apiAiService.textRequest(text,
                {
                    sessionId: this.sessionIds.get(sender),
                    originalRequest: {
                        data: event,
                        source: "facebook"
                    }
                });

            this.doApiAiRequest(apiaiRequest, sender,text);
        }
    }
    doApiAiRequest(apiaiRequest, sender,text) {
        apiaiRequest.on('response', (response) => {
            if (this.isDefined(response.result) && this.isDefined(response.result.fulfillment)) {
                let responseText = response.result.fulfillment.speech;
                let responseData = response.result.fulfillment.data;
                let responseMessages = response.result.fulfillment.messages;

                if (this.isDefined(responseData) && this.isDefined(responseData.facebook)) {
                	                	console.log("i am dat");
                    let facebookResponseData = responseData.facebook;
                    this.doDataResponse(sender, facebookResponseData);
                } else if (this.isDefined(responseMessages) && responseMessages.length > 0) {
                	                	console.log("i am rich fama 5edma hnii!!");





         if (response.result.metadata.intentName === 'pizza'){
            if (response.result.parameters.PizzaType === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.PizzaType,FB_PAGE_ACCESS_TOKEN);
            }
        }



           if (response.result.metadata.intentName === 'boisson'){
            if (response.result.parameters.boissontype === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.boissontype,FB_PAGE_ACCESS_TOKEN);
            }
        }
           if (response.result.metadata.intentName === 'PetitDej'){
            if (response.result.parameters.Petitdejtype === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.Petitdejtype,FB_PAGE_ACCESS_TOKEN);
            }
        }
            if (response.result.metadata.intentName === 'Crepe'){
            if (response.result.parameters.Crepetype === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.Crepetype,FB_PAGE_ACCESS_TOKEN);
            }
        }
               if (response.result.metadata.intentName === 'Gaufre'){
            if (response.result.parameters.Gaufretype === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.Gaufretype,FB_PAGE_ACCESS_TOKEN);
            }
        }
               if (response.result.metadata.intentName === 'sandwich'){
            if (response.result.parameters.sandwichtype === ''){
                global.str = response.result;
                product.sendAllGeneric(sender,response.result.metadata.intentName,FB_PAGE_ACCESS_TOKEN);
            }
            else {
                global.str = response.result;
               // console.log(str);
                product.sendGenericProduct(sender,str.metadata.intentName, str.parameters.sandwichType,FB_PAGE_ACCESS_TOKEN);
            }
        } //Ajouter la même structure avec le nom de votre produit. LES NOMS DOIVENT ÊTRE EXACTEMENT COMME LES INTENTS ET LES ENTITIES
        else if (response.result.metadata.intentName === 'Patron'){
            patron.sendPatron(sender,FB_PAGE_ACCESS_TOKEN);
        }
        else if (response.result.metadata.intentName === 'reservation'){
            if(text ==='annule'){
               arr=[];
               this.doRichContentResponse(sender, responseMessages);
            }
            else{
                arr.push(text);
            //console.log(arr);
            this.doRichContentResponse(sender, responseMessages);
        }
        }
        else{
            this.doRichContentResponse(sender,responseMessages);
        }
       }

            else if (this.isDefined(responseText)) {
                	                	console.log("i am nrml");
                
    
            this.doTextResponse(sender, responseText);


                }

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
    }

    splitResponse(str) {
    	
        if (str.length <= FB_TEXT_LIMIT) {
            return [str];
        }

        return this.chunkString(str, FB_TEXT_LIMIT);
    }

    chunkString(s, len) {
        let curr = len, prev = 0;

        let output = [];

        while (s[curr]) {
            if (s[curr++] == ' ') {
                output.push(s.substring(prev, curr));
                prev = curr;
                curr += len;
            }
            else {
                let currReverse = curr;
                do {
                    if (s.substring(currReverse - 1, currReverse) == ' ') {
                        output.push(s.substring(prev, currReverse));
                        prev = currReverse;
                        curr = currReverse + len;
                        break;
                    }
                    currReverse--;
                } while (currReverse > prev)
            }
        }
        output.push(s.substr(prev));
        return output;
    }

    sendFBMessage(sender, messageData) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {access_token: FB_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: {
                    recipient: {id: sender},
                    message: messageData
                }
            }, (error, response) => {
                if (error) {
                    console.log('Error sending message: ', error);
                    reject(error);
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                    reject(new Error(response.body.error));
                }

                resolve();
            });
        });
    }

    sendFBSenderAction(sender, action) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {access_token: FB_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: {
                    recipient: {id: sender},
                    sender_action: action
                }
            }, (error, response) => {
                if (error) {
                    console.error('Error sending action: ', error);
                    reject(error);
                } else if (response.body.error) {
                    console.error('Error: ', response.body.error);
                    reject(new Error(response.body.error));
                }

                resolve();
            });
        });
    }

    doSubscribeRequest() {
        request({
                method: 'POST',
                uri: `https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=${FB_PAGE_ACCESS_TOKEN}`
            },
            (error, response, body) => {
                if (error) {
                    console.error('Error while subscription: ', error);
                } else {
                    console.log('Subscription result: ', response.body);
                }
            });
    }

    configureGetStartedEvent() {
        request({
                method: 'POST',
                uri: `https://graph.facebook.com/v2.6/me/thread_settings?access_token=${FB_PAGE_ACCESS_TOKEN}`,
                json: {
                    setting_type: "call_to_actions",
                    thread_state: "new_thread",
                    call_to_actions: [
                        {
                            payload: FACEBOOK_WELCOME
                        }
                    ]
                }
            },
            (error, response, body) => {
                if (error) {
                    console.error('Error while subscription', error);
                } else {
                    console.log('Subscription result', response.body);
                }
            });
    }

    isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }

    sleep(delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(), delay);
        });
    }

}


let facebookBot = new FacebookBot();

const app = express();

app.use(bodyParser.text({type: 'application/json'}));

app.get('/chatbot', (req, res) => {
    if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);

        setTimeout(() => {
            facebookBot.doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/chatbot', (req, res) => {
    try {
        const data = JSONbig.parse(req.body);

        if (data.entry) {
            let entries = data.entry;
            entries.forEach((entry) => {
                let messaging_events = entry.messaging;
                if (messaging_events) {
                    messaging_events.forEach((event) => {
                        if (event.message && !event.message.is_echo) {

                            if (event.message.attachments) {
                                let locations = event.message.attachments.filter(a => a.type === "location");

                                // delete all locations from original message
                                event.message.attachments = event.message.attachments.filter(a => a.type !== "location");

                                if (locations.length > 0) {
                                    locations.forEach(l => {
                                        let locationEvent = {
                                         sender: event.sender,
                                            postback: {
                                                payload: "FACEBOOK_LOCATION",
                                                data: l.payload.coordinates
                                            }
                                        };

                                        facebookBot.processFacebookEvent(locationEvent);
                                    });
                                }
                            }

                            facebookBot.processMessageEvent(event);
                        } else if (event.postback && event.postback.payload) {
                            if (event.postback.payload === "FACEBOOK_WELCOME") {
                                facebookBot.processFacebookEvent(event);
                            } else {
                                //facebookBot.processMessageEvent(event);
                                var postback1= event.postback.title;
                                var postback2= event.postback.payload;
                                postbacks.findPostback(event.sender.id,str,postback1,postback2);
                            }
                        }
                    });
                }
            });
        }

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        return res.status(400).json({
            status: "error",
            error: err
        });
    }

});

app.listen(REST_PORT, () => {
    console.log('Rest service ready on port ' + REST_PORT);
});
facebookBot.doSubscribeRequest();
