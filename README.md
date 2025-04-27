mern-backend-boilerplate/
│── node_modules/ # Installed dependencies
│── config/ # Configuration files
│ ├── db.js # MongoDB connection setup
│ ├── passport.js # Passport authentication strategy
│── controllers/ # Business logic for routes
│ ├── authController.js # Authentication logic (Register, Login, Logout)
│ ├── userController.js # User-related operations
│── middlewares/ # Middleware files
│ ├── authMiddleware.js # Protect routes (JWT, RBAC)
│ ├── errorHandler.js # Global error handling
│ ├── rateLimiter.js # Rate limiting
│── models/ # Mongoose models
│ ├── User.js # User model schema
│── routes/ # API Routes
│ ├── authRoutes.js # Authentication routes
│ ├── userRoutes.js # User-related routes
│── services/ # Business logic (Optional, for microservices)
│ ├── authService.js # Authentication service
│ ├── userService.js # User service
│── docs/ # API Documentation
│ ├── swagger.json # Swagger API docs
│── logs/ # Log files
│ ├── error.log # Error logs stored here
│── utils/ # Utility functions (Helper functions)
│ ├── generateToken.js # Generate JWT tokens
│── .env # Environment variables
│── .gitignore # Ignore files
│── package.json # Dependencies and scripts
│── README.md # Project documentation
│── server.js # Main entry point

https://github.com/RishiBakshii/mern-ecommerce/tree/main/backend
https://github.com/ajaybor0/MERN-eCommerce

mongo atlas
user:rimel
pass:rimel
