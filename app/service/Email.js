var mail = require('nodemailer').mail;
var nodemailer = require('nodemailer');

class Email {

    SendMail(Mail) {
        return new Promise((resolve, reject) => {

            // mail({
            //     from: 'bhumi.shah@ecosmob.com',
            //     to: Mail.to,
            //     subject: Mail.subject,
            //     text: Mail.text,
            //     html: Mail.html
            // });
            // return resolve();

            var smtptransporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                auth: {
                    user: "ordersavvy.ecosmob@gmail.com",
                    pass: "neel@123"
                },
                tls: { rejectUnauthorized: false },
                debug: true
            });
            smtptransporter.sendMail(Mail, (error, info) => {
                console.log(error);
                if (error) return reject(error);
                return resolve(info)
            });
        });
    }
}

module.exports = Email;