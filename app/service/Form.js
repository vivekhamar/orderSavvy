var multiparty = require('multiparty');

class Form {

    Parse(request){
        return new Promise((resolve, reject) => {

            let form = new multiparty.Form();
            form.parse(request,(error,fields,files) => {

                if(error) return reject({status:0, message:error});

                let returnformparse = {};
                returnformparse.fields = fields;
                returnformparse.files = files;

                return resolve(returnformparse);
            });
        });

    }

}

module.exports = Form;