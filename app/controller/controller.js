var Bcrypt = require('bcrypt');

class Controller {

    constructor(collection) {
        this.collection = collection;
    }

    // for encrypting data
    bcryptpass(password) {
        console.log(password)
        return Bcrypt.hashSync(password, Bcrypt.genSaltSync(10));
    }

    // saving the data
    SaveData(DataObj = {}) {
        return new Promise((resolve, reject) => {

            let data = new this.collection(DataObj)

            data.save((err, savedata) => {

                if (err) { return reject({ message: err, status: 0 }); }

                return resolve(savedata);
            });

        });
    }

    // creating the data
    CreateData(data) {
        return new Promise((resolve, reject) => {

            if (data.password) {
                var password = this.bcryptpass(data.password);
                data.password = password;
            }
            this.collection.create(data, function (err, newdata) {
                if (err) { reject({ status: 0, message: "Error in creating. Please try again later.", error: err }) }
                return resolve(newdata);
            });

        });

    }

    // get the data for one
    GetData(filter = {}, projection = {}) {

        return new Promise((resolve, reject) => {

            this.collection.findOne(filter, projection).exec((error, user) => {

                if (error) return reject({ status: 0, message: error });

                return resolve(user);
            });

        });
    }

    // get data for multiple
    GetMultiData(filter = {}, projection = {}) {

        return new Promise((resolve, reject) => {

            this.collection.find(filter, projection).sort({ _id: -1 }).exec((error, user) => {

                if (error) return reject({ status: 0, message: error });

                return resolve(user);
            });

        });
    }

    // find one and update the data
    UpdateData(filter = {}, setdata = {}) {

        return new Promise((resolve, reject) => {

            this.collection.findOneAndUpdate(filter, { $set: setdata }, { new: true }, (error, data) => {
                if (error) return reject({ status: 0, message: error });

                return resolve(data)
            });

        });
    }

    // update many data
    UpdateManyData(filter = {}, setdata = {}) {

        return new Promise((resolve, reject) => {

            this.collection.updateMany(filter, { $set: setdata }, { new: true }, (error, data) => {
                if (error) return reject({ status: 0, message: error });

                return resolve(data)
            });

        });
    }

    // delete the data
    DeleteData(filter = {}) {

        return new Promise((resolve, reject) => {

            this.collection.deleteOne(filter, (err, obj) => {

                if (err) { return reject({ message: err, status: 0 }); }

                return resolve(obj);
            });

        });
    }

    //delete object from array in DB
    DeleteOneObjData(filter = {}, update = {}) {

        return new Promise((resolve, reject) => {

            this.collection.update(filter, update, (err, obj) => {

                if (err) { return reject({ message: err, status: 0 }); }

                return resolve(obj);
            });

        });
    }

    // aggregate the data for multiple lookup
    MultiAggregateData(filter = {}, lookup = {}, lookup1 = {}, unwind, project = {}) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate([
                //1
                {
                    $match: filter
                },

                //2
                {
                    $lookup: lookup
                },

                //3
                {
                    $unwind: { path: unwind, preserveNullAndEmptyArrays: true }
                },

                //4
                {
                    $lookup: lookup1
                },

                //5
                {
                    $project: project
                }

            ], (err, data) => {
                if (err) return reject({ message: err, status: 0 });

                return resolve(data);
            });
        });
    }

    // aggregate data using one lookup
    AggregateData(filter = {}, lookup = {}, unwind, project = {}) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate([
                //1
                {
                    $match: filter
                },

                //2
                {
                    $lookup: lookup
                },

                //3
                {
                    $unwind: unwind
                },

                //4
                {
                    $sort: { createdOn: -1 }
                },

                //5
                {
                    $project: project
                }

            ], (err, data) => {
                if (err) return reject({ message: err, status: 0 });

                return resolve(data);
            });
        })
    }

    // aggregate sum of all orders
    AggregateReportByOrderData(filter = {}, group = {}) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate([
                {
                    $match: filter
                },
                {
                    $group: group
                }
            ], (err, data) => {
                if (err) return reject({ message: err, status: 0 });

                return resolve(data);
            });
        });
    }

    // aggregate report list of all items
    AggregateReportByItemData(filter = {}, project1 = {}, unwind, project2 = {}, group = {}, project3 = {}, lookup = {}, unwind2, project4 = {}) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate([
                {
                    $match: filter
                },
                {
                    $project: project1
                },
                {
                    $unwind: unwind
                },
                {
                    $unwind: unwind
                },
                {
                    $project: project2
                },
                {
                    $group: group
                },
                {
                    $project: project3
                },
                {
                    $lookup: lookup
                },
                {
                    $unwind: unwind2
                },
                {
                    $project: project4
                }
            ], (err, data) => {
                if (err) return reject({ message: err, status: 0 });

                return resolve(data);
            });
        });
    }

    // aggregate report for total earning
    AggregateGetTotalEarning(filter) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate([
                {
                    $match: filter
                },
                {
                    $unwind: '$restaurantInfo'
                },
                {
                    $group: {
                        _id: {
                            resId: '$restaurantInfo.restaurantId',
                            name: '$restaurantInfo.name'
                        },
                        price: {
                            $sum: '$restaurantInfo.totalPrice'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        resId: '$_id.resId',
                        name: '$_id.name',
                        price: 1
                    }
                }
            ], (err, data) => {
                if (err) return reject({ message: err, status: 0 });

                return resolve(data);
            })
        })
    }

}

module.exports = Controller;