import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib"; // for merging PDFs
import { assets } from "../assets/assets";

const MyAppointments = () => {
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return `${dateArray[0]} ${months[Number(dateArray[1])]} ${dateArray[2]}`;
  };

  // Fetch appointments
  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Razorpay payment
  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Appointment Payment",
      description: "Appointment Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/verifyRazorpay`,
            response,
            { headers: { token } }
          );
          if (data.success) {
            navigate("/my-appointments");
            getUserAppointments();
          }
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-stripe`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        window.location.replace(data.session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  // Generate PDF for text + images + uploaded PDFs
  const handleDownloadPrescription = async (prescription, doctorName, slotDate, slotTime) => {
    const pdf = new jsPDF("p", "pt", "a4");
    const tempDiv = document.createElement("div");
    tempDiv.style.padding = "20px";
    tempDiv.style.width = "500px";
    tempDiv.innerHTML = `
      <h2 style="text-align:center;">Prescription</h2>
      <p><strong>Doctor:</strong> ${doctorName}</p>
      <p><strong>Date:</strong> ${slotDate} | ${slotTime}</p>
      <hr style="margin:10px 0;"/>
      ${prescription.entries.map((entry, idx) => `
        <div style="margin-bottom:15px;">
          <h4>Entry ${idx + 1}</h4>
          <p>${entry.text || "No text provided"}</p>
          ${entry.files && entry.files.length > 0
            ? entry.files
                .filter(f => !f.url.endsWith(".pdf"))
                .map(f => `<img src="${f.url}" style="width:100px;height:100px;object-fit:cover;margin-right:5px;" crossOrigin="anonymous"/>`)
                .join("")
            : ""
          }
          <p style="font-size:11px;color:gray;">
            ${entry.isEdited ? "Edited" : "Added"}: ${new Date(entry.isEdited ? entry.updatedAt : entry.createdAt).toLocaleString()}
          </p>
        </div>
      `).join("")}
    `;
    document.body.appendChild(tempDiv);

    // Capture images + text
    const canvas = await html2canvas(tempDiv, { useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 595;
    const pageHeight = 842;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    document.body.removeChild(tempDiv);

    // Merge uploaded PDFs
    const pdfDoc = await PDFDocument.create();
    const mainPdfBytes = pdf.output("arraybuffer");
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    const copiedPages = await pdfDoc.copyPages(mainDoc, mainDoc.getPageIndices());
    copiedPages.forEach((page) => pdfDoc.addPage(page));

    for (const entry of prescription.entries) {
      if (!entry.files) continue;
      const pdfFiles = entry.files.filter(f => f.url.endsWith(".pdf"));
      for (const pdfFile of pdfFiles) {
        try {
          const existingPdfBytes = await fetch(pdfFile.url).then(res => res.arrayBuffer());
          const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
          const pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
          pages.forEach(page => pdfDoc.addPage(page));
        } catch (err) {
          console.error("Error fetching PDF:", pdfFile.url, err);
        }
      }
    }

    const finalPdfBytes = await pdfDoc.save();
    const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Prescription_${doctorName.replace(/\s/g, "_")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="pb-3 mt-12 text-lg font-medium text-gray-600 border-b">
        My Appointments
      </p>

      <div>
        {appointments.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b">
            <div>
              <img
                className="w-36 bg-[#EAEFFF] rounded"
                src={item.docData.image}
                alt="doctor"
              />
            </div>

            <div className="flex-1 text-sm text-[#5E5E5E]">
              <p className="text-[#262626] text-base font-semibold">{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className="text-[#464646] font-medium mt-1">Address:</p>
              <p>{item.docData.address.line1}</p>
              <p>{item.docData.address.line2}</p>

              <p className="mt-1">
                <span className="text-sm text-[#3C3C3C] font-medium">Date & Time:</span>{" "}
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>

              {item.prescription?.entries?.length > 0 && (
                <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-semibold text-sm text-gray-700 mb-2">Prescription</p>
                  <div className="flex gap-3 mb-2">
                    <button
                      onClick={() => setSelectedPrescription(item.prescription)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        handleDownloadPrescription(
                          item.prescription,
                          item.docData.name,
                          slotDateFormat(item.slotDate),
                          item.slotTime
                        )
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Download PDF (All)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 justify-end text-sm text-center">
              {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                <button
                  onClick={() => setPayment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Pay Online
                </button>
              )}

              {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                <>
                  <button
                    onClick={() => appointmentStripe(item._id)}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                  >
                    <img className="max-w-20 max-h-5" src={assets.stripe_logo} alt="" />
                  </button>

                  <button
                    onClick={() => appointmentRazorpay(item._id)}
                    className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 flex items-center justify-center"
                  >
                    <img className="max-w-20 max-h-5" src={assets.razorpay_logo} alt="" />
                  </button>
                </>
              )}

              {!item.cancelled && item.payment && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border rounded text-[#696969] bg-[#EAEFFF]">
                  Paid
                </button>
              )}

              {item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Completed
                </button>
              )}

              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  Cancel Appointment
                </button>
              )}

              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment Cancelled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg w-[90%] sm:w-[500px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 text-center">Prescription</h3>

            {selectedPrescription.entries.map((entry, idx) => (
              <div key={idx} className="border rounded p-3 mb-3">
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">{entry.text || "No text provided"}</p>

                {entry.files?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {entry.files.map((file, i) => {
                      const ext = file.url.split('.').pop().toLowerCase();
                      if (ext === 'pdf') {
                        return (
                          <a
                            key={i}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                          >
                            Download PDF {i + 1}
                          </a>
                        );
                      } else {
                        return (
                          <img
                            key={i}
                            src={file.url}
                            className="w-24 h-24 object-cover rounded border"
                            alt="prescription"
                          />
                        );
                      }
                    })}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {entry.isEdited
                    ? `Edited on ${new Date(entry.updatedAt).toLocaleString()}`
                    : `Added on ${new Date(entry.createdAt).toLocaleString()}`}
                </p>
              </div>
            ))}

            <button
              onClick={() => setSelectedPrescription(null)}
              className="mt-4 bg-primary text-white px-3 py-1 rounded text-sm w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
