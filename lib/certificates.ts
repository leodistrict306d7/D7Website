// Certificate generation using jsPDF (client-side) with member name + MyLCI
"use client";
import jsPDF from 'jspdf';

export async function generateCertificate(params: {
  name: string;
  mylci: string;
  courseTitle: string;
  date?: string;
}) {
  const { name, mylci, courseTitle } = params;
  const date = params.date ?? new Date().toLocaleDateString();

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Background
  doc.setFillColor('#faf8f6');
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

  // Watermark/logo (expects /public/logos/district-logo.png)
  try {
    const img = await fetch('/logos/district-logo.png').then(r => r.blob());
    const reader = new FileReader();
    const base64 = await new Promise<string>((res) => { reader.onload = () => res(String(reader.result)); reader.readAsDataURL(img); });
    doc.addImage(base64, 'PNG', 40, 40, 100, 100, undefined, 'FAST');
  } catch {}

  doc.setTextColor('#222');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Certificate of Completion', 420, 120, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text(`This certifies that`, 420, 170, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(name, 420, 210, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`MyLCI: ${mylci}`, 420, 240, { align: 'center' });
  doc.text(`has successfully completed`, 420, 270, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(courseTitle, 420, 300, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Date: ${date}`, 420, 340, { align: 'center' });

  doc.save(`certificate-${name.replace(/\s+/g, '_')}.pdf`);
}