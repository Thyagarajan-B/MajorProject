import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
    backendUrl,
  } = useContext(DoctorContext);

  const { slotDateFormat, currency } = useContext(AppContext);

  const [activePrescription, setActivePrescription] = useState(null);
  const [tempText, setTempText] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (dToken) getAppointments();
  }, [dToken]);

  const handlePrescriptionSubmit = async (appointment, entryIndex = null) => {
    try {
      if (!appointment?._id) {
        toast.error("Appointment data missing!");
        return;
      }
      if (!tempText.trim()) {
        toast.warning("Please write a prescription before saving!");
        return;
      }

      const endpoint = editMode ? "edit-prescription" : "add-prescription";
      const payload = {
        appointmentId: appointment._id,
        docId: appointment.docId,
        text: tempText,
      };

      if (entryIndex !== null) payload.entryIndex = entryIndex;

      const { data } = await axios.post(
        `${backendUrl}/api/doctor/${endpoint}`,
        payload,
        {
          headers: { "Content-Type": "application/json", dtoken: dToken },
        }
      );

      if (data.success) {
        toast.success(editMode ? "Prescription updated!" : "Prescription added!");
        setActivePrescription(null);
        setTempText("");
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
    <section className="w-full max-w-6xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
          🩺 Appointments Dashboard
        </h1>
      </header>

      {/* Appointments Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-y-auto max-h-[80vh]">
        {/* Header Row */}
        <div className="hidden md:grid grid-cols-[0.5fr_2fr_1.2fr_1fr_1.2fr] gap-2 py-3 px-6 border-b bg-gray-50 font-semibold text-gray-600 text-sm">
          <p>#</p>
          <p>Patient</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {/* Appointment Items */}
        {appointments.map((item, index) => {
          const hasPrescription = item.prescription?.entries?.length > 0;
          const isInactive = item.cancelled || item.isCompleted;

          return (
            <article
              key={item._id}
              className="border-b last:border-none px-4 sm:px-6 py-5 hover:bg-gray-50 transition duration-150"
            >
              {/* Info */}
              <div className="flex flex-col md:grid md:grid-cols-[0.5fr_2fr_1.2fr_1fr_1.2fr] gap-3 md:items-center text-gray-700">
                <p className="hidden md:block font-medium">{index + 1}</p>

                {/* Patient Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={item.userData?.image || assets.default_user}
                    alt={item.userData?.name || "Patient"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.userData?.name || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <p className="text-sm">
                  {slotDateFormat(item.slotDate)},{" "}
                  <span className="text-gray-500">{item.slotTime}</span>
                </p>

                {/* Fees */}
                <p className="font-semibold text-gray-900">
                  {currency}
                  {item.amount ?? 0}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {!isInactive ? (
                    <>
                      <img
                        onClick={() => cancelAppointment(item._id)}
                        src={assets.cancel_icon}
                        alt="Cancel appointment"
                        className="w-8 md:w-9 cursor-pointer hover:scale-110 transition"
                        title="Cancel Appointment"
                      />
                      <img
                        onClick={() => {
                          if (!hasPrescription) {
                            toast.warning(
                              "Please add a prescription before marking as completed!"
                            );
                            return;
                          }
                          completeAppointment(item._id);
                        }}
                        src={assets.tick_icon}
                        alt="Complete appointment"
                        className="w-8 md:w-9 cursor-pointer hover:scale-110 transition"
                        title="Mark Completed"
                      />
                    </>
                  ) : (
                    <span
                      className={`text-sm font-semibold ${item.isCompleted ? "text-green-600" : "text-red-500"
                        }`}
                    >
                      {item.isCompleted ? "✅ Completed" : "❌ Cancelled"}
                    </span>
                  )}
                </div>
              </div>

              {/* Prescription Section */}
              <div className="mt-4 ml-1 md:ml-6">
                {/* Existing Prescriptions */}
                {item.prescription?.entries?.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 mb-4">
                    <p className="font-semibold text-gray-700 mb-3 flex items-center gap-1">
                      📄 <span>Prescriptions</span>
                    </p>

                    {item.prescription.entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition space-y-2"
                      >
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {entry.text || "No text provided"}
                        </p>

                        <p className="text-xs text-gray-400 italic">
                          {entry.isEdited
                            ? `✏️ Edited on ${new Date(
                              entry.updatedAt
                            ).toLocaleString()}`
                            : `🕒 Added on ${new Date(
                              entry.createdAt
                            ).toLocaleString()}`}
                        </p>

                        {!isInactive && (
                          <button
                            onClick={() => {
                              setActivePrescription({
                                appointment: item,
                                entryIndex: idx,
                              });
                              setTempText(entry.text || "");
                              setEditMode(true);
                            }}
                            className="text-blue-600 text-xs font-semibold underline hover:text-blue-800"
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Prescription Button */}
                {!isInactive && !activePrescription && (
                  <button
                    onClick={() => {
                      setActivePrescription({
                        appointment: item,
                        entryIndex: null,
                      });
                      setTempText("");
                      setEditMode(false);
                    }}
                    className="text-green-600 text-sm font-semibold flex items-center gap-2 hover:text-green-800 transition"
                  >
                    <span className="text-lg font-bold">+</span> Add Prescription
                  </button>
                )}

                {/* Prescription Input Section */}
                {activePrescription?.appointment?._id === item._id && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <textarea
                      placeholder="Write prescription details..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      rows="3"
                    ></textarea>

                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        onClick={() =>
                          handlePrescriptionSubmit(
                            activePrescription.appointment,
                            activePrescription.entryIndex
                          )
                        }
                        className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition"
                      >
                        {editMode
                          ? "💾 Update Prescription"
                          : "➕ Save Prescription"}
                      </button>

                      <button
                        onClick={() => {
                          setActivePrescription(null);
                          setTempText("");
                          setEditMode(false);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default DoctorAppointments;
