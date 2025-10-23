import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, backendUrl } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  const [activePrescription, setActivePrescription] = useState(null)
  const [tempText, setTempText] = useState('')
  const [tempImages, setTempImages] = useState([])
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (dToken) getAppointments()
  }, [dToken])

  // Add or Edit Prescription Handler
  const handlePrescriptionSubmit = async (appointment, entryIndex = null) => {
    try {
      if (!appointment?._id) {
        console.error("❌ Missing appointment:", appointment);
        toast.error("Appointment data missing!");
        return;
      }
      const endpoint = editMode ? "edit-prescription" : "add-prescription";
      const formData = new FormData();
      formData.append("appointmentId", appointment._id);
      formData.append("docId", appointment.docId);
      formData.append("text", tempText);
      if (entryIndex !== null) formData.append("entryIndex", entryIndex);
      if (tempImages.length > 0) {
        tempImages.forEach((img) => formData.append("images", img));
      }

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/${endpoint}`,
        formData,
        { headers: { dtoken: dToken } }
      );

      if (data.success) {
        toast.success(editMode ? "Prescription updated!" : "Prescription added!");
        setActivePrescription(null);
        setTempText("");
        setTempImages([]);
        setEditMode(false);
        getAppointments();
      } else {
        toast.error(data.message || "Failed to save prescription");
      }
    } catch (error) {
      console.error("Prescription Error:", error);
      toast.error("Error saving prescription");
    }
  };



  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        {/* Header Row */}
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {appointments.map((item, index) => {
          const hasUser = item.userData
          const hasPrescription = item.prescription.entries.length

          return (
            <div key={item._id} className="border-b py-3 px-6 hover:bg-gray-50">
              <div className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500">
                <p className="max-sm:hidden">{index + 1}</p>

                {/* Patient Info */}
                <div className="flex items-center gap-2">
                  {hasUser ? (
                    <>
                      <img src={item.userData.image || assets.default_user} className="w-8 h-8 rounded-full object-cover" alt="patient" />
                      <p>{item.userData.name}</p>
                    </>
                  ) : (
                    <p className="italic text-gray-400">N/A</p>
                  )}
                </div>

                <p className="text-xs inline border border-primary px-2 rounded-full">{item.payment ? 'Online' : 'Cash'}</p>
                <p className="max-sm:hidden">{hasUser ? calculateAge(item.userData.dob) : 'N/A'}</p>
                <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                <p>{currency}{item.amount ?? 0}</p>

                {/* Action Buttons */}
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">Completed</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <img onClick={() => cancelAppointment(item._id)} className="w-7 cursor-pointer" src={assets.cancel_icon} alt="cancel" />

                    {/* ✅ Disable Complete if no prescription */}
                    <img
                      onClick={() => {
                        if (!hasPrescription) {
                          toast.warning("Add a prescription before marking as completed!")
                          return
                        }
                        completeAppointment(item._id)
                      }}
                      className={`w-7 cursor-pointer ${!hasPrescription ? 'opacity-40 cursor-not-allowed' : ''}`}
                      src={assets.tick_icon}
                      alt="complete"
                    />
                  </div>
                )}
              </div>

              {/* ✅ Prescription Section */}
              <div className="mt-3 pl-3">
                {console.log("each item::", item._id)}
                {item.prescription?.entries?.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded mb-2">
                    <p className="font-medium text-gray-700 mb-2">Prescriptions:</p>
                    {item.prescription.entries.map((entry, idx) => (
                      <div key={idx} className="border rounded p-2 mb-2 bg-white">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {entry.text || "No text provided"}
                        </p>

                        {entry.images?.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {entry.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="prescription"
                                className="w-20 h-20 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-400 mt-1">
                          {entry.isEdited
                            ? `Edited on ${new Date(entry.updatedAt).toLocaleString()}`
                            : `Added on ${new Date(entry.createdAt).toLocaleString()}`}
                        </div>

                        {!item.cancelled && !item.isCompleted && (
                          <button
                            onClick={() => {
                              setActivePrescription({ appointment: item, entryIndex: idx });
                              setTempText(entry.text || "");
                              setTempImages([]);
                              setEditMode(true);
                            }}
                            className="text-blue-600 text-xs font-medium underline mt-1"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new prescription */}
                {!item.cancelled && !item.isCompleted && !activePrescription && (
                  <button
                    onClick={() => {
                      // Store full appointment for consistency
                      setActivePrescription({ appointment: item, entryIndex: null });
                      setTempText("");
                      setTempImages([]);
                      setEditMode(false);
                    }}
                    className="text-green-600 text-xs font-medium flex items-center gap-1"
                  >
                    <span className="text-lg font-bold">+</span> Add Prescription
                  </button>
                )}

                {/* Prescription Input (for both Add and Edit) */}
                {activePrescription?.appointment?._id === item._id && (
                  <div className="mt-2">
                    <textarea
                      placeholder="Write prescription..."
                      className="w-full border p-2 rounded mb-2 text-sm"
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                    ></textarea>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setTempImages([...e.target.files])}
                      className="mb-2"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handlePrescriptionSubmit(
                            activePrescription.appointment,
                            activePrescription.entryIndex
                          )
                        }
                        className="bg-primary text-white text-xs px-3 py-1 rounded"
                      >
                        {editMode ? "Update Prescription" : "Save Prescription"}
                      </button>

                      <button
                        onClick={() => {
                          setActivePrescription(null);
                          setTempText("");
                          setTempImages([]);
                          setEditMode(false);
                        }}
                        className="bg-gray-300 text-black text-xs px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DoctorAppointments
