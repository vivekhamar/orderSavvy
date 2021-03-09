module.exports = {
    db: 'mongodb://localhost/OrderSavvy',
    // db: '',
    mongoDBOptions: {
        db: { native_parser: true },
        server: { poolSize: 5 },
        user: '',
        pass: ''
    },
    // ServerURL: '',
    ServerURL: '',
    ServerPort: '4040',
    ServerLink: '',
    SecurityToken: 'OrderSavvy_API',
    ExpiresIn: 361440, //1 day in seconds
    UserForgetPassLink: '/public/ResetPassword.html?token=',
    ResForgetPassLink: '/public/ResResetPassword.html?token=',
    AdminForgetPassLink: 'localhost:3000/#/set-password?token=',
    UserProfileURL: '/upload/ProfileImg/',
    ResProfileURL: '/upload/ResImg/',
    CategoryProfileURL: '/upload/CategoryImg/',
    ComboProfileURL: '/upload/ComboImg/',
    StaffProfileURL: '/upload/StaffProfileImg/',
    ImgProfileURL: '/upload/ItemImg/',
    MenuProfileURL: '/upload/MenuImg/',
    ModProfileURL: '/uploads/ModImg',
    AdminUserURL: '/upload/AdminUsersImg/'
}
