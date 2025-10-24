import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, backendUrl } =
    useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  const [activePrescription, setActivePrescription] = useState(null)
  const [tempText, setTempText] = useState('')
  const [tempImages, setTempImages] = useState([])
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (dToken) getAppointments()
  }, [dToken])

  // ✅ Add or Edit Prescription Handler
  const handlePrescriptionSubmit = async (appointment, entryIndex = null) => {
    try {
      if (!appointment?._id) {
        toast.error('Appointment data missing!')
        return
      }

      const endpoint = editMode ? 'edit-prescription' : 'add-prescription'
      const formData = new FormData()
      formData.append('appointmentId', appointment._id)
      formData.append('docId', appointment.docId)
      formData.append('text', tempText)
      if (entryIndex !== null) formData.append('entryIndex', entryIndex)
      tempImages.forEach((file) => formData.append('images', file))

      const { data } = await axios.post(`${backendUrl}/api/doctor/${endpoint}`, formData, {
        headers: { dtoken: dToken },
      })

      if (data.success) {
        toast.success(editMode ? 'Prescription updated!' : 'Prescription added!')
        setActivePrescription(null)
        setTempText('')
        setTempImages([])
        setEditMode(false)
        getAppointments()
      } else {
        toast.error(data.message || 'Failed to save prescription')
      }
    } catch (error) {
      console.error('Prescription Error:', error)
      toast.error('Error saving prescription')
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto my-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          🩺 Appointments Dashboard
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-y-auto max-h-[80vh]">
        {/* Header Row */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_3fr_1fr_1fr] gap-2 py-3 px-6 border-b bg-gray-50 font-semibold text-gray-600 text-sm">
          <p>#</p>
          <p>Patient</p>
          <p>Date & Time</p>
          <p className='ml-28'>Fees</p>
          <p>Action</p>
        </div>

        {appointments.map((item, index) => {
          const hasPrescription = item.prescription?.entries?.length > 0

          return (
            <div
              key={item._id}
              className="border-b last:border-none px-4 sm:px-6 py-5 hover:bg-gray-50 transition duration-150 ease-in-out"
            >
              {/* Appointment Info */}
              <div className="flex flex-wrap justify-between sm:grid grid-cols-[0.5fr_2fr_1fr_3fr_1fr_1fr] gap-2 items-center text-gray-600">
                <p className="hidden sm:block text-sm font-medium">{index + 1}</p>

                {/* Patient */}
                <div className="flex items-center gap-3">
                  <img
                    src={item.userData?.image || assets.default_user}
                    alt="patient"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{item.userData?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">#{item._id.slice(-6)}</p>
                  </div>
                </div>

                <p className="text-sm">
                  {slotDateFormat(item.slotDate)}, <span className="text-gray-500">{item.slotTime}</span>
                </p>

                <p className="font-medium text-gray-900 ml-28">
                  {currency}
                  {item.amount ?? 0}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {!item.cancelled && (
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      src={assets.cancel_icon}
                      alt="cancel"
                      className="w-10 cursor-pointer hover:scale-110 transition"
                      title="Cancel Appointment"
                    />
                  )}
                  <img
                    onClick={() => {
                      if (!hasPrescription) {
                        toast.warning('Add a prescription before marking as completed!')
                        return
                      }
                      completeAppointment(item._id)
                    }}
                    src={assets.tick_icon}
                    alt="complete"
                    title="Mark Completed"
                    className={`w-10 cursor-pointer hover:scale-110 transition ${!hasPrescription ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                  />
                </div>
              </div>

              {/* Prescription Section */}
              <div className="mt-4 ml-2 sm:ml-6">
                {item.prescription?.entries?.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 mb-4">
                    <p className="font-semibold text-gray-700 mb-3 flex items-center gap-1">
                      📄 <span>Prescriptions</span>
                    </p>

                    <div className="space-y-3">
                      {item.prescription.entries.map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition"
                        >
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {entry.text || 'No text'}
                          </p>

                          {entry.images?.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-3">
                              {entry.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="prescription"
                                  className="w-24 h-24 object-cover rounded-lg border shadow-sm hover:scale-105 transition"
                                />
                              ))}
                            </div>
                          )}

                          <div className="text-xs text-gray-400 mt-2 italic">
                            {entry.isEdited
                              ? `✏️ Edited on ${new Date(entry.updatedAt).toLocaleString()}`
                              : `🕒 Added on ${new Date(entry.createdAt).toLocaleString()}`}
                          </div>

                          {!item.cancelled && (
                            <button
                              onClick={() => {
                                setActivePrescription({ appointment: item, entryIndex: idx })
                                setTempText(entry.text || '')
                                setTempImages([])
                                setEditMode(true)
                              }}
                              className="text-blue-600 text-xs font-semibold underline mt-2 hover:text-blue-800"
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Prescription */}
                {!item.cancelled && !activePrescription && (
                  <button
                    onClick={() => {
                      setActivePrescription({ appointment: item, entryIndex: null })
                      setTempText('')
                      setTempImages([])
                      setEditMode(false)
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

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setTempImages([...e.target.files])}
                      className="mt-2 text-sm"
                    />

                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() =>
                          handlePrescriptionSubmit(activePrescription.appointment, activePrescription.entryIndex)
                        }
                        className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg shadow-sm"
                      >
                        {editMode ? '💾 Update Prescription' : '➕ Save Prescription'}
                      </button>

                      <button
                        onClick={() => {
                          setActivePrescription(null)
                          setTempText('')
                          setTempImages([])
                          setEditMode(false)
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg"
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
