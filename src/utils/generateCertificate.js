import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import supabase from "../supabaseClient";

export async function generateCertificate(user, course) {
  if (!user) throw new Error("User not found");
  if (!course) throw new Error("Course not found");

  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Border
    doc.setLineWidth(2);
    doc.rect(20, 20, 795, 555); // outer border

    // Title
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate of Completion", 420, 100, { align: "center" });

    // Subtitle
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text("This certifies that", 420, 150, { align: "center" });

    // Name
    doc.setFontSize(28);
    doc.setFont("times", "bolditalic");
    doc.text(`${user.user_metadata.full_name || "Student"}`, 420, 200, { align: "center" });

    // Completion info
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(`has successfully completed the course`, 420, 240, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`${course.title_en || course.name}`, 420, 270, { align: "center" });

    // Date
    const today = new Date().toLocaleDateString();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text(`Date: ${today}`, 650, 550);

    // Signature placeholder
    doc.setFontSize(14);
    doc.text("Instructor Signature: ____________________", 50, 550);

    // QR Code for verification
    const qrDataUrl = await QRCode.toDataURL(`https://your-platform.com/verify/${user.id}_${course.id}`);
    doc.addImage(qrDataUrl, "PNG", 50, 50, 100, 100);

    const pdfBlob = doc.output("blob");
    const fileName = `${user.id}_${course.id}_${Date.now()}.pdf`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, pdfBlob, { upsert: true });
    if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from("certificates")
      .getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) throw new Error("Failed to get public URL");

    // Upsert into database
    const { error: dbError } = await supabase
      .from("certificates")
      .upsert(
        { user_id: user.id, course_id: course.id, certificate_link: publicUrl },
        { onConflict: ["user_id", "course_id"] }
      );
    if (dbError) throw new Error("Database upsert error: " + dbError.message);

    return publicUrl;
  } catch (err) {
    console.error("Certificate generation error:", err);
    throw err;
  }
}