const {sendEmail} = require("./emailUtils")
const Inverstor = require("../models/Investment")


exports.notifyUsersOfNews = async( companyId, newsTitle, newsContent )=>{
try {

      // Fetch all users who have invested in this company
      const investors = await Inverstor.find({ company: companyId }).populate('user');

      for (const investor of investors){
        const user = investor.user

         // Email content
      const subject = `New Update: ${newsTitle}`;
      const text = `Dear ${user.firstName},\n\nThere is a new update about a company you have invested in: ${newsTitle}\n\n${newsContent}\n\nBest Regards,\nYour Investment Portal Team`;

      // Send email

      await sendEmail(user.email, subject, text);
      }
    
} catch (error) {
    console.error(`Error notifying users: ${error.message}`);  
}
} 