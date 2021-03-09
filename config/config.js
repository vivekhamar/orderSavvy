module.exports = {
    // db: '/home/bhumi/Desktop/jgooros_my_env/jgooros-api/jgoor/development.db',
    // db: 'mongodb://localhost/OrderSavvy',
    db: 'mongodb://admin:ec0sm0bt@localhost:27017/OrderSavvy?authSource=admin',
    mongoDBOptions: {
        db: { native_parser: true },
        server: { poolSize: 5 },
        user: '',
        pass: ''
    },
    Stripe_PublishableKey: "pk_test_zRXpUsX9aEYPoycsz8yZmnp200wEDBaY3a", ///rohan stripe
    Stripe_SecretKey: "sk_test_ToG3HxCOHmzeitkQ27vjkmoO00V4duB96G", ///rohan stripe
    // ServerURL: 'http://172.16.16.149',
    ServerURL: 'http://52.52.42.152',
    ServerPort: '4040',
    ServerLink: 'http://52.52.42.152:4040',
    SecurityToken: 'OrderSavvy_API',
    ExpiresIn: 361440, //1 day in seconds
    UserForgetPassLink: '/public/ResetPassword.html?token=',
    ResForgetPassLink: '/public/ResResetPassword.html?token=',
    AdminForgetPassLink: 'http://52.52.42.152:5260/#/set-password?token=',
    UserProfileURL: '/upload/ProfileImg/',
    ResProfileURL: '/upload/ResImg/',
    CategoryProfileURL: '/upload/CategoryImg/',
    ComboProfileURL: '/upload/ComboImg/',
    StaffProfileURL: '/upload/StaffProfileImg/',
    ImgProfileURL: '/upload/ItemImg/',
    MenuProfileURL: '/upload/MenuImg/',
    ModProfileURL: '/uploads/ModImg',
    AdminUserURL: '/upload/AdminUsersImg/',
    // Stripe_PublishableKey:"pk_test_eUrar705ULXTKDoBraNTzm0W00cCV8IrZb", ///bhumi stripe
    // Stripe_SecretKey:"sk_test_bSHqA1YRQgUqANf5hmZyUOlF00QAMAHuA8", ///bhumi stripe
}
