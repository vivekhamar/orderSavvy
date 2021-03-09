var fs = require('fs');
var mv = require('mv');
var Path = require('path');
var config = require('../../config/config');

class File {

    StoreProfileImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/ProfileImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.UserProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };

                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    // Store multiple Image at once
    StoreMultiImgFile(reqfiles, pathToStore, filePath) {
        return new Promise((resolve, reject) => {
            if (reqfiles.file) {
                let array = [];
                reqfiles.file.forEach((file, fileindex) => {
                    // set the path for file
                    let appDir = Path.dirname(require.main.filename);
                    let fileName = Date.now().toString() + reqfiles.file[fileindex].originalFilename;
                    let uploadedFilePath = appDir + pathToStore + fileName;
                    let FilePath = Path.resolve(filePath) + "/" + fileName;
                    let profileThumbnailURL = config.ServerLink + config.ResProfileURL + fileName;
                    let fileObject = { "originalFilename": reqfiles.file[fileindex].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                    array.push(fileObject);
                    // Method to write the file on server
                    fs.readFile(reqfiles.file[fileindex].path, (err, data) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        fs.writeFile(uploadedFilePath, data, (err) => {
                            if (err) { return reject({ message: err, status: 0 }); }
                            return resolve(array);
                        });
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }


    StoreResImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/ResImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.ResProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreCategoryImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/CategoryImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.CategoryProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreComboImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/ComboImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.ComboProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreStaffProfileImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/StaffProfileImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.StaffProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreItemImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/ItemImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.ImgProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreMenuImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/MenuImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.MenuProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreModsImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/ModImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.ModProfileURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

    StoreAdminUserImgFile(reqfiles, pathToStore) {
        return new Promise((resolve, reject) => {

            if (reqfiles.file) {
                // set the path for file
                let appDir = Path.dirname(require.main.filename);
                let fileName = Date.now().toString() + reqfiles.file[0].originalFilename;
                let uploadedFilePath = appDir + pathToStore + fileName;
                let FilePath = Path.resolve("/uploads/AdminUsersImg") + "/" + fileName;
                let profileThumbnailURL = config.ServerLink + config.AdminUserURL + fileName;
                let fileObject = { "originalFilename": reqfiles.file[0].originalFilename, "filePath": FilePath, "profileThumbnailURL": profileThumbnailURL };
                // Method to write the file on server
                fs.readFile(reqfiles.file[0].path, (err, data) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    fs.writeFile(uploadedFilePath, data, (err) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(fileObject);
                    });
                });
            }
            else if (!reqfiles.file) {
                return resolve(null);
            }
        });
    }

}

module.exports = File;