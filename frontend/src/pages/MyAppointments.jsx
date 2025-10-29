import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const toBase64 = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(file);
};

const MyAppointments = () => {
  const { backendUrl, token, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    fetch("/image.jpg")
      .then((res) => res.blob())
      .then((blob) => toBase64(blob, (res) => setLogoBase64(res)))
      .catch(() => console.warn("Logo image not found or failed to load."));
  }, []);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    // if already formatted (contains space and month name), return as-is
    if (typeof slotDate === "string" && slotDate.includes(" ")) return slotDate;

    // expected raw format: "DD_MM_YYYY" or "DD_M_YYYY"
    const dateArray = String(slotDate).split("_");
    const day = dateArray[0] || "";
    const monthNum = Number(dateArray[1]); // 1..12
    const year = dateArray[2] || "";

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthName = months[(monthNum || 1) - 1] || dateArray[1] || "";
    return `${day} ${monthName} ${year}`;
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch appointments");
    }
  };

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  // 🔹 Cancel Appointment Handler
  const handleCancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId, userId: userData._id },
        { headers: { token } }
      );

      if (data.success) {
        toast.success("Appointment cancelled successfully");
        getUserAppointments();
      } else {
        toast.error(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error cancelling appointment");
    }
  };

  // -------------------- CLEAN PDF DOWNLOAD --------------------
  const handleDownloadPrescription = async (
    prescription,
    doctorName,
    slotDate /* can be raw like "30_11_2025" or already formatted "30 Nov 2025" */,
    slotTime,
    patientData = {}
  ) => {
    // build the HTML content (same as before, but we'll compute displayDate and filenameDate safely)
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "700px";
    tempDiv.style.padding = "20px 40px 40px";
    tempDiv.style.fontFamily = "'Segoe UI', Helvetica, Arial, sans-serif";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#1a1a1a";
    tempDiv.style.border = "1px solid #dbe3ec";
    tempDiv.style.borderRadius = "16px";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";

    const safe = (text) =>
      (text || "-")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

    // compute a display date (readable) and a filename-safe ISO date (YYYY-MM-DD)
    let displayDate = slotDateFormat(slotDate);
    let filenameDate = "";

    if (String(slotDate).includes("_")) {
      const parts = String(slotDate).split("_");
      const dd = parts[0].padStart(2, "0");
      const mm = String((Number(parts[1]) || 1)).padStart(2, "0");
      const yyyy = parts[2] || "";
      // make ISO like YYYY-MM-DD (if we can)
      filenameDate = yyyy ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`;
    } else {
      // attempt to parse formatted date (like "30 Nov 2025")
      const m = new Date(displayDate);
      if (!isNaN(m)) {
        const yyyy = m.getFullYear();
        const mm = String(m.getMonth() + 1).padStart(2, "0");
        const dd = String(m.getDate()).padStart(2, "0");
        filenameDate = `${yyyy}-${mm}-${dd}`;
      } else {
        // fallback: sanitize displayDate
        filenameDate = displayDate.replace(/\s+/g, "_");
      }
    }

    // safe filename for doctor name
    const safeDoc = (doctorName || "Doctor").replace(/\s+/g, "_").replace(/[^\w-]/g, "");

    tempDiv.innerHTML = `
    <div style="text-align:center; margin-bottom:24px;">
      ${logoBase64
        ? `<img src="${logoBase64}" alt="Logo" style="height:60px; margin-bottom:6px; display:block; margin-left:auto; margin-right:auto;">`
        : ""
      }
      <h1 style="margin:0; font-size:30px; color:#0A3D62; font-weight:700;">CareBridge</h1>
      <p style="margin:4px 0 0; color:#3C6382; font-size:13px;">Digital E-Prescription Platform</p>
      <hr style="border:none; border-top:3px solid #0A3D62; margin:16px auto 0; width:90%;">
    </div>

    <div style="display:flex; justify-content:space-between; margin-top:18px; background:#EAF0F6; padding:16px 20px; border-radius:10px;">
      <div style="width:48%;">
        <h3 style="margin:0; font-size:15px; color:#0A3D62;">Doctor Information</h3>
        <p><strong>Name:</strong> ${safe(doctorName)}</p>
        <p><strong>Speciality:</strong> ${safe(prescription.speciality || "General Physician")}</p>
        <p><strong>Date:</strong> ${safe(displayDate)}</p>
        <p><strong>Time:</strong> ${safe(slotTime)}</p>
      </div>
      <div style="width:48%;">
        <h3 style="margin:0; font-size:15px; color:#0A3D62;">Patient Information</h3>
        <p><strong>Name:</strong> ${safe(patientData?.name || userData?.name)}</p>
        <p><strong>Age / Gender:</strong> ${safe(patientData?.age || userData?.age)} / ${safe(patientData?.gender || userData?.gender)}</p>
      </div>
    </div>

    <div style="margin-top:32px;">
      <h2 style="font-size:18px; color:#0A3D62; border-bottom:2px solid #0A3D62; padding-bottom:6px;">Prescription Details</h2>
      <div style="margin-top:16px; font-size:14px; color:#2f3a4c; line-height:1.7;">
        ${prescription.entries.map(e => `<p style="margin-bottom:10px;">${safe(e.text)}</p>`).join("")}
      </div>
    </div>
  `;

    document.body.appendChild(tempDiv);

    // Render canvas at higher scale for quality, then paginate correctly
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    // jsPDF units in points for A4: width ~595.28, height ~841.89
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // first page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // final filename: Prescription_DoctorName_YYYY-MM-DD.pdf (fallback if date not parseable)
    const filename = `Prescription_${safeDoc}_${filenameDate || "date"}.pdf`;

    pdf.save(filename);
    document.body.removeChild(tempDiv);
  };

  // handling AI summary 
  const handleAISummary = async (prescription) => {
    try {
      setLoadingAi(true);
      setShowAiModal(true);
      const fullText = prescription.entries.map((e) => e.text).join("\n\n");
      const { data } = await axios.post(
        `${backendUrl}/api/ai/explain-prescription`,
        { prescriptionText: fullText }
      );
      const explanation = data.explanation || "No summary generated.";
      setAiSummary(formatSummary(explanation));
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate AI summary");
    } finally {
      setLoadingAi(false);
    }
  };

  const formatSummary = (text) => {
    if (!text) return "No summary available.";
    const cleaned = text.replace(/[*_#>-]/g, "").replace(/\n{2,}/g, "\n").trim();
    const points = cleaned
      .split(/\n|\•|\-/)
      .map((p) => p.trim())
      .filter(Boolean);
    return `
      <ul class="list-disc pl-4 space-y-1 text-sm text-gray-700">
        ${points.map((p) => `<li>${p}</li>`).join("")}
      </ul>
    `;
  };

  return (
    <div>
      <p className="pb-3 mt-12 text-lg font-medium text-gray-600 border-b">
        My Appointments
      </p>

      {appointments.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
        >
          <img
            className="w-36 bg-[#EAEFFF] rounded"
            src={item.docData.image}
            alt="doctor"
          />
          <div className="flex-1 text-sm text-[#5E5E5E]">
            <p className="text-[#262626] text-base font-semibold">
              {item.docData.name}
            </p>
            <p>{item.docData.speciality}</p>
            <p className="mt-1">
              <span className="font-medium text-[#3C3C3C]">Date & Time:</span>{" "}
              {slotDateFormat(item.slotDate)} | {item.slotTime}
            </p>

            {/* 🔹 Action Buttons */}
            <div className="mt-3 flex gap-3 items-center">
              {item.cancelled ? (
                <span className="text-red-500 font-semibold text-sm">❌ Cancelled</span>
              ) : item.isCompleted ? (
                <span className="text-green-600 font-semibold text-sm">✅ Completed</span>
              ) : item.prescription?.entries?.length > 0 ? (
                <span className="text-purple-600 font-semibold text-sm">
                  Prescription Provided
                </span>
              ) : (
                <button
                  onClick={() => handleCancelAppointment(item._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                >
                  Cancel Appointment
                </button>
              )}
            </div>


            {/* Prescription Section */}
            {item.prescription?.entries?.length > 0 && (
              <div className="mt-3 bg-gray-50 p-3 rounded border">
                <p className="font-semibold text-sm text-gray-700 mb-2">
                  Prescription
                </p>
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
                        item.slotTime,
                        item.patientData || userData
                      )
                    }
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg w-[90%] sm:w-[500px] max-h-[80vh] overflow-y-auto shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 text-center">
              Prescription
            </h3>

            <div className="bg-gray-50 p-3 rounded border whitespace-pre-line text-sm text-gray-700 leading-relaxed">
              {selectedPrescription.entries.map((entry, idx) => (
                <p key={idx} className="mb-1">
                  {entry.text}
                </p>
              ))}
            </div>

            <button
              onClick={() => handleAISummary(selectedPrescription)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm w-full"
            >
              Generate AI Summary
            </button>

            <button
              onClick={() => setSelectedPrescription(null)}
              className="mt-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded text-sm w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}



      {/* AI Summary Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg w-[90%] sm:w-[450px] max-h-[70vh] overflow-y-auto shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-center text-purple-700">
              AI Prescription Summary
            </h3>
            {loadingAi ? (
              <p className="text-center text-gray-500">
                🧠 Analyzing prescription...
              </p>
            ) : (
              <div
                className="text-gray-700 text-sm"
                dangerouslySetInnerHTML={{ __html: aiSummary }}
              />
            )}
            <button
              onClick={() => setShowAiModal(false)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm w-full"
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
