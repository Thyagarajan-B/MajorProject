import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-6xl m-5 '>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        {/* Header Row */}
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {/* Rows */}
        {appointments.map((item, index) => {
          const hasUser = item.userData !== null && item.userData !== undefined
          return (
            <div
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={index}
            >
              <p className='max-sm:hidden'>{index + 1}</p>

              {/* Patient Info */}
              <div className='flex items-center gap-2'>
                {hasUser && (
                  <>
                    <img
                      src={item.userData.image || assets.default_user}
                      className='w-8 h-8 rounded-full object-cover'
                      alt="patient"
                    />
                    <p>{item.userData.name}</p>
                  </>
                )}
                {!hasUser && <p className="italic text-gray-400">Ram</p>}
              </div>

              {/* Payment */}
              <div>
                <p className='text-xs inline border border-primary px-2 rounded-full'>
                  {item.payment ? 'Online' : 'Cash'}
                </p>
              </div>

              {/* Age */}
              <p className='max-sm:hidden'>
                {hasUser ? calculateAge(item.userData.dob) : 'N/A'}
              </p>

              {/* Date & Time */}
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

              {/* Fees */}
              <p>{currency}{item.amount}</p>

              {/* Action */}
              {item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              ) : item.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Completed</p>
              ) : (
                <div className='flex'>
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-10 cursor-pointer'
                    src={assets.cancel_icon}
                    alt="cancel"
                  />
                  <img
                    onClick={() => completeAppointment(item._id)}
                    className='w-10 cursor-pointer'
                    src={assets.tick_icon}
                    alt="complete"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DoctorAppointments
