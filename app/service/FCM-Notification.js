var FCM = require('fcm-node');
var serverKey = ''; //put your server key here
var serverKeyJSON = require('../../ordersavvy-firebase-adminsdk.json') //put the generated private key path here    
var fcm = new FCM(serverKeyJSON);

class Notification {

    // notification message syntax for fcm-node npm plugin
    // var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //     to: 'registration_token', 
    //     collapse_key: 'your_collapse_key',
        
    //     notification: {
    //         title: 'Title of your push notification', 
    //         body: 'Body of your push notification' 
    //     },
        
    //     data: {  //you can send only notification or only data(or include both)
    //         my_key: 'my value',
    //         my_another_key: 'my another value'
    //     }
    // };

    // send the notification to one deviceToken
    PushNotification(message){
        return new Promise((resolve,reject) => {
            fcm.send(message, (err, response) => {
                if (err) {
                    console.log("Something has gone wrong!",err);
                    return reject(err);
                } else {
                    console.log("Successfully sent with response: ", response);
                    return resolve(response)
                }
            });
        });
    }

}

module.exports = Notification;
