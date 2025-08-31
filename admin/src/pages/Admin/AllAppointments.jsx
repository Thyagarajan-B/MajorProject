import React, { useEffect } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  return (
    <div className='w-full max-w-6xl m-5 '>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {appointments.map((item, index) => (
          <div
            key={index}
            className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
          >
            <p className='max-sm:hidden'>{index + 1}</p>

            {/* Patient */}
            <div className='flex items-center gap-2'>
              <img
                src={item?.userData?.image || assets.default_user}
                className='w-8 h-8 rounded-full bg-gray-200 object-cover'
                alt="user"
              />
              <p>{item?.userData?.name || "Unknown"}</p>
            </div>

            {/* Age */}
            <p className='max-sm:hidden'>
              {item?.userData?.dob ? calculateAge(item.userData.dob) : "-"}
            </p>

            {/* Date & Time */}
            <p>
              {item?.slotDate ? slotDateFormat(item.slotDate) : "-"}, {item?.slotTime || "-"}
            </p>

            {/* Doctor */}
            <div className='flex items-center gap-2'>
              <img
                src={item?.docData?.image || assets.default_doctor}
                className='w-8 h-8 rounded-full bg-gray-200 object-cover'
                alt="doctor"
              />
              <p>{item?.docData?.name || "Unknown Doctor"}</p>
            </div>

            {/* Fees */}
            <p>{currency}{item?.amount || 0}</p>

            {/* Action */}
            {item?.cancelled ? (
              <p className='text-red-400 text-xs font-medium'>Cancelled</p>
            ) : item?.isCompleted ? (
              <p className='text-green-500 text-xs font-medium'>Completed</p>
            ) : (
              <img
                onClick={() => cancelAppointment(item._id)}
                className='w-10 cursor-pointer'
                src={assets.cancel_icon}
                alt="cancel"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllAppointments
