import nodemailer from "nodemailer"
export const sendAppointmentConfirmation = async(email,appointmentData)=>{
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS,
        },
    });
    const mailOptions = {
        from:process.env.EMAIL_USER,
        to:email,
        subject:"Appointment Confirmation",
        text:`Hello ${appointmentData.userData.name} , Your appointment with Dr. ${appointmentData.name} is confirmed on ${appointmentData.slotDate} at ${appointmentData.slotTime}.`
    }

    await transporter.sendMail(mailOptions);
}
