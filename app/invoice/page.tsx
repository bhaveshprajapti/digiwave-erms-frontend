"use client";

import QuotationPDF from "@/components/quotations/quotation-pdf";

export default function InvoicePage() {
  // Sample quotation data for testing
  const sampleQuotation = {
    quotation_no: "QT-DW-18102025-172069",
    date: "2025-10-18",
    valid_until: "2025-10-28",
    client_name: "Test Client",
    client_email: "client@example.com",
    client_phone: "+91 9876543210",
    client_address: "123 Test Street, Test City, Test State - 123456",
    service_items: [
      {
        id: 1,
        category: "Web Development",
        description: "Custom Website Development",
        quantity: 1,
        unit_price: 50000,
      },
      {
        id: 2,
        category: "Mobile App",
        description: "iOS & Android App Development",
        quantity: 1,
        unit_price: 80000,
      },
      {
        id: 3,
        category: "UI/UX Design",
        description: "Complete UI/UX Design Package",
        quantity: 1,
        unit_price: 20000,
      },
    ],
    subtotal: 150000.0,
    tax_amount: 27000.0,
    server_hosting: {
      included: true,
      duration: "1 Year",
      unit_price: 5000,
    },
    domain_registration: {
      included: true,
      duration: "1 Year",
      unit_price: 1000,
    },
    grand_total: 183000.0,
    additional_notes: "Thank you for your business. Payment terms: 50% advance, 50% on completion.",
    payment_terms: "Net 30 days",
    signatory_name: "CEO Naman Doshi",
  };

  return <QuotationPDF quotation={sampleQuotation} showDownloadButton={true} />;
}
