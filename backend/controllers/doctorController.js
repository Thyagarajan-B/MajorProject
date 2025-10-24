import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const addPrescription = async (req, res) => {
    try {
        const { appointmentId, docId, text } = req.body;
        const imagePaths = req.files ? req.files.map((f) => f.path) : [];
        console.log("From add", appointmentId);

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment)
            return res.json({ success: false, message: "Appointment not found" });

        if (appointment.docId.toString() !== docId.toString())
            return res.json({ success: false, message: "Unauthorized doctor" });

        const newEntry = {
            text: text || "",
            images: imagePaths,
        };

        if (!appointment.prescription) appointment.prescription = { entries: [] };
        appointment.prescription.entries.push(newEntry);

        await appointment.save();

        res.json({
            success: true,
            message: "New prescription added",
            appointment,
        });
    } catch (error) {
        console.error("Add Prescription Error:", error);
        res.json({ success: false, message: error.message });
    }
};


// Edit Prescpription
const editPrescription = async (req, res) => {
    try {
        const { appointmentId, docId, entryIndex, text } = req.body;
        const imagePaths = req.files ? req.files.map((f) => f.path) : [];

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment)
            return res.json({ success: false, message: "Appointment not found" });

        if (appointment.docId.toString() !== docId.toString())
            return res.json({ success: false, message: "Unauthorized doctor" });

        if (!appointment.prescription || !Array.isArray(appointment.prescription.entries))
            return res.json({ success: false, message: "No prescription entries found" });

        const entries = appointment.prescription.entries;
        const index = parseInt(entryIndex);
        if (isNaN(index) || index < 0 || index >= entries.length)
            return res.json({
                success: false,
                message: `Invalid entry index: ${entryIndex}. Total entries: ${entries.length}`,
            });
            
        if (text && text.trim() !== "") entries[index].text = text.trim();
        if (imagePaths.length > 0) entries[index].images.push(...imagePaths);

        entries[index].isEdited = true;
        entries[index].updatedAt = new Date();

        await appointment.save();

        res.json({
            success: true,
            message: "Prescription updated successfully",
            appointment,
        });
    } catch (error) {
        console.error("Edit Prescription Error:", error);
        res.json({ success: false, message: error.message });
    }
};




// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// DELETE Doctor API
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body; // frontend will send docId in body

        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        await doctorModel.findByIdAndDelete(docId);

        res.json({ success: true, message: "Doctor deleted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    addPrescription,
    editPrescription,
    updateDoctorProfile,
    deleteDoctor
}