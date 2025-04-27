import User from '../../models/PortfolioModel/User.js';
import { verifyEmail ,generateHashPassword,verifyPassword} from '../../utils/utils.js';
import { generateToken ,verifyToken} from '../../utils/generateToken.js';
import jwt from 'jsonwebtoken';


// @desc     Register user
// @method   POST
// @endpoint /api/users
// @access   Public
    const registerUser=async (req, res, next) => {
        try {
            const { firstName, lastName, email, password } = req.body;
    
            if (!firstName || !lastName || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }
    
            if (!verifyEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
    
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // const hashedPassword = await bcrypt.hash(password, 10);
            const hashedPassword = await generateHashPassword(password);
            const newUser = new User({
                 firstName, 
                 lastName, 
                 email, 
                 password:hashedPassword
                });
            await newUser.save();
    
            const token = generateToken({_id: newUser._id });
            res.status(201).json({ message: 'New user created', token });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error registering user' });
            next(error)
        }
    };
    


    const loginUser = async (req, res) => {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
    
            const user = await User.findOne({ email }).lean(); // Lean will boost performance
    
            if (!user) {
                return res.status(404).json({ message: 'Invalid email address. Please check your email and try again.' });
            }
    
            // const match = await bcrypt.compare(password, user.password || '');
            const match=verifyPassword(password,user.password)
    
            if (!match) {
                return res.status(401).json({ message: 'Invalid password. Please check your password and try again.' });
            }
    
            const token = generateToken({ id: user._id });
    
           // **✅ Cookie সেট করা হলো**
        res.cookie("token", token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === "production", // Production হলে Secure হবে
            secure: false, // ✅ localhost এর জন্য false রাখো
            domain: 'localhost',
  sameSite: "lax", // ✅ Cross-site Cookies Allow করো
            // sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // ১ দিন মেয়াদ (1 day)
        });

        // **✅ Response পাঠানো হলো**
        res.status(200).json({
            message: "Login successful",
            user: { id: user._id, email: user.email, name: user.firstName }
        });
    
        } catch (error) {
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };





    // **🔹 Session API**
// /api/auth/session",
    const sessionUser= async(req, res) => {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "Not Authenticated" });
    // console.log("Cookies Received:", token); // ✅ Cookies Check
    try {
        // imprt jwt
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const decoded= await verifyToken(token)
        console.log(decoded,'decode')
        res.json(decoded);
    } catch {
        res.status(401).json({ message: "Invalid Token" });
    }
};
      
// **🔹 Logout API**
// app.post("/api/auth/logout", 
    const logoutUser=(req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Logged out successfully!" });
};

// @desc     Get users
// @method   GET
// @endpoint /api/users
// @access   Private/Admin
    const getUsers = async (req, res, next) => {
        try {
        //   const users = await User.find({ isAdmin: false });
        const users = await User.find();
      
          if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found!' });
          }
      
          res.json(users);
        } catch (error) {
          next(error);
        }
      };
      










    export {
        loginUser,
        registerUser,
        sessionUser,
        logoutUser,
        // getUserProfile,
        getUsers,
        // getUserById,
        // updateUser,
        // updateUserProfile,
        // deleteUser,
        // admins,
        // resetPasswordRequest,
        // resetPassword
      };