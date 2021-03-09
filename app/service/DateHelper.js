/****************************
 DATE RELATED OPERATIONS
 ****************************/

class DateHelper {

    // Method to calculate time difference
    static calculateTimeDifference(date1, date2) {

        return new Promise((resolve, reject) => {

            let diff =(date1.getTime() - date2.getTime()) / 1000;
            diff /= 60;
            let hours = Math.abs(Math.round(diff));

            return resolve(hours);

        });
    }
}

module.exports = DateHelper;