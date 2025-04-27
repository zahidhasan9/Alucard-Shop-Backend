import Project from"../../models/PortfolioModel/Project.js"



const createProjects = async (req, res, next) => {
    try {
      // Destructuring input and adding validation
      const {  title,  description, logMail, logPass,  } = req.body;
 
      // Optional: Check if image is provided, if not return default image URL or handle accordingly
    //   if (!image) {
    //     return res.status(400).json({ message: 'Product image is required.' });
    //   }
  
      // Create new product object
      const project = new Project({
         title,
        // image,  // Assuming image is either URL or file path or handled elsewhere
        description,
        logMail,
        logPass,
    
      });
  
      // Save product in database
      const createdProject = await project.save();
      // Return response with created product
      res.status(201).json({
        message: 'Project created successfully.',
        project: createdProject,
      });
  
    } catch (error) {
      console.error(error);
      next(error); // Pass the error to the global error handler
    }
  };


  const getAllProject = async (req, res, next) => {
    try {
    //   const users = await User.find({ isAdmin: false });
    const project = await Project.find();
  
      if (!project || project.length === 0) {
        return res.status(404).json({ message: 'No Projects found!' });
      }
  
      res.json(project);
    } catch (error) {
      next(error);
    }
  };
  
  

  export {
  createProjects,
  getAllProject
  }