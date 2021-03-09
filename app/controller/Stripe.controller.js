var config = require('../../config/config');
const stripe = require('stripe')(config.Stripe_SecretKey);

class StripeController {

    constructor(collection) {
        this.collection = collection;
    }

    // generate the ephemeral Keys for StripeCustomer 
    StripeEphemeralkey(data) {
        return new Promise((resolve, reject) => {
            if (!data.stripe_version) return reject({ status: 0, message: "invalid Stripe_version" });

            // This function assumes that some previous middleware has determined the
            // correct customerId for the session and saved it on the request object.
            stripe.ephemeralKeys.create(
                { customer: data.customerId },
                { stripe_version: data.stripe_version }
            ).then((key) => {
                return resolve(key);
            }).catch((err) => {
                return reject({ status: 0, message: err });
            });
        });
    }

    // creating the stripe customer
    CreateStripeCustomer(mail) {
        return new Promise((resolve, reject) => {
            stripe.customers.create({
                description: 'Customer for ' + mail,
                // source: "tok_amex" // obtained with Stripe.js //beacause it shows default card
            }, (err, customer) => {
                if (err) reject({ status: 0, message: err });
                resolve(customer);
            });
        });
    }

    // checking the stripe customerid for validation
    CheckStripeId(id, mail) {
        return new Promise((resolve, reject) => {
            stripe.customers.retrieve(id, (error, customer) => {
                // if(error) return reject(error);
                if (customer) {
                    if (!customer.deleted) {
                        return resolve(customer)
                    }
                    if (customer.deleted) {
                        this.CreateStripeCustomer(mail).then(data => {
                            return resolve(data);
                        }).catch(error => {
                            return reject(error);
                        });
                    }
                }
                if (error) {
                    this.CreateStripeCustomer(mail).then(data => {
                        return resolve(data);
                    }).catch(error => {
                        return reject(error);
                    });
                }
            });
        });
    }

    // generate paymentintents for payment in stripe
    PaymentIntents(data) {
        return new Promise((resolve, reject) => {
            stripe.paymentIntents.create({
                amount: data.amount,
                currency: data.currency,
                payment_method_types: ['card'],
                customer: data.customerId,
            }, (err, paymentIntent) => {
                if (err) return reject({ status: 0, message: err });

                return resolve(paymentIntent);
            });
        });
    }

    // list payment_method for StripeCustomer
    ListPaymentMethod(id) {
        return new Promise((resolve, reject) => {
            stripe.paymentMethods.list({ customer: id, type: 'card' }, (err, paymentMethods) => {
                if (err) return reject(err);
                stripe.customers.retrieve(id, (error, customer) => {
                    if (error) return reject(err);
                    paymentMethods.default = customer.invoice_settings.default_payment_method;
                    resolve(paymentMethods);
                });
            });
        });
    }

    // attach the payment_method for StripeCustomer
    AttachPaymentMethod(id, paymentMethod_id) {
        return new Promise((resolve, reject) => {
            stripe.paymentMethods.attach(paymentMethod_id, { customer: id }, (err, paymentMethod) => {
                if (err) return reject({ status: 0, message: err });
                resolve(paymentMethod);
            });
        });
    }

    // add default payment_method for StripeCustomer
    DefaultPaymentMethod(id, paymentMethod_id) {
        return new Promise((resolve, reject) => {
            stripe.customers.update(id, { invoice_settings: { default_payment_method: paymentMethod_id } }, (err, customer) => {
                if (err) reject({ status: 0, message: err });
                resolve(customer);
            });
        });
    }

}

module.exports = StripeController;

    // // get card details per customer id in stripe
    // GetCards(id){
    //     return new Promise((resolve,reject) => {
    //         stripe.customers.listSources(id,{
    //             limit: 6,
    //             object: 'card',
    //         },(error, cards) => {
    //             if(error) return reject(error);
    //             stripe.customers.retrieve(id,(error, customer) => {
    //                 if(error) return reject(err);
    //                 cards.default = customer.default_source
    //                 resolve(cards)
    //             });
    //         });
    //     });
    // }

    // // save card for per customer in stripe
    // SaveCards(id,token){
    //     return new Promise(async (resolve,reject) => {
    //         stripe.customers.createSource(id,{source: token,},(err, card) => {
    //             if(err) reject({status:0, message:err});
    //             resolve(card)
    //         });
    //     })
    // }