"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadQuotationPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";

interface QuotationPDFProps {
  quotation: any;
  showDownloadButton?: boolean;
}

export default function QuotationPDF({ quotation, showDownloadButton = true }: QuotationPDFProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });
      await downloadQuotationPDF(quotation?.quotation_no || "quotation");
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };
  const serviceItems = quotation?.service_items || [];
  const subtotal = quotation?.subtotal || 0;
  const taxAmount = quotation?.tax_amount || 0;
  const serverCharge = quotation?.server_hosting?.unit_price || 0;
  const domainCharge = quotation?.domain_registration?.unit_price || 0;
  const grandTotal = quotation?.grand_total || 0;
  const paid = 0;
  const amountDue = grandTotal - paid;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 0' }}>
      {showDownloadButton && (
        <div style={{ maxWidth: '595px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}
      <div
        id="quotation-pdf-content"
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          height: '842px',
          width: '595px',
          margin: '0 auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          pageBreakAfter: 'always',
          fontFamily: 'Jaldi, sans-serif'
        }}
      >
        <style>{`
          #quotation-pdf-content .bg-neutral-50 {
            background-color: #fafafa !important;
          }
          #quotation-pdf-content .bg-white {
            background-color: #ffffff !important;
          }
          #quotation-pdf-content .bg-black {
            background-color: #000000 !important;
          }
          /* Fix text visibility - override bg-clip-text and text-transparent */
          #quotation-pdf-content .bg-white.bg-clip-text.text-transparent {
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          #quotation-pdf-content .bg-black.bg-clip-text.text-transparent {
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          #quotation-pdf-content .bg-\\[rgba\\(44\\,219\\,217\\,1\\.00\\)\\].bg-clip-text.text-transparent {
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
            color: #2cdbd9 !important;
            -webkit-text-fill-color: #2cdbd9 !important;
          }
        `}</style>
        <img
          id="_420_420__Rectangle_3463274"
          src="/assets/images/rectangle_3463274.svg"
          alt="Rectangle_3463274"
          className="absolute left-[calc(50%-297.50px)] top-[0.00px]"
        />
        <span
          id="_420_424__401_medani_jain_host"
          className="flex justify-end text-right items-start h-[54.00px] w-[177.00px] absolute left-[378.00px] top-[28.00px]"
        >
          <span
            className="text-white not-italic text-[12.0px] font-normal leading-[18.00px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            401 medani jain hostel, navjivan press road, income tax cross road,
            Ahmedabad, gujarat, india-380009
          </span>
        </span>
        <span
          id="_420_462__401_medani_jain_host"
          className="flex justify-end text-right items-start h-auto w-[177.00px] absolute left-[378.00px] top-[272.00px]"
        >
          <span
            className="text-black not-italic text-[12.0px] font-normal leading-[18.00px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            {quotation?.client_name || "N/A"}
            {quotation?.client_email && <><br />{quotation.client_email}</>}
            {quotation?.client_phone && <><br />{quotation.client_phone}</>}
            {quotation?.client_address && <><br />{quotation.client_address}</>}
          </span>
        </span>
        <span
          id="_420_455__Invoice"
          className="flex justify-center text-center items-start h-[18.00px] w-[177.00px] absolute left-[calc(50%-88.50px)] top-[155.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[22.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            Quotation
          </span>
        </span>
        <div
          id="_1009_1117__Frame_1618875059"
          className="absolute h-[75.00px] w-[223.00px] flex flex-row justify-start items-center flex-nowrap gap-2 left-[40.00px] top-[18.00px]"
        >
          <div
            id="_1009_1116__Frame_1618875058"
            className="relative overflow-hidden bg-white h-[55.00px] w-[55.00px] rounded-[40px]"
          >
            <img
              id="_1009_1119__Group_36820"
              src="/assets/images/group_36820.svg"
              alt="Group_36820"
              className="absolute left-[calc(100%_*_-0.18)] top-[calc(100%_*_-0.13)]"
            />
          </div>
          <div
            id="_420_454__Frame_1618874962"
            className="relative h-[75.00px] w-[160.00px] flex flex-col justify-start items-center flex-nowrap"
          >
            <span
              id="_420_423__DIGIWAVE"
              className="flex justify-start text-left items-start h-[49.00px] relative"
            >
              <span
                className="whitespace-nowrap text-white not-italic text-[40.42249298095703px] font-normal"
                style={{
                  fontFamily: "Jaldi",
                }}
              >
                DIGIWAVE
              </span>
            </span>
            <span
              id="_420_453__TECHNOLOGIES"
              className="flex justify-center text-center items-start h-[26.00px] w-[160.00px] relative"
            >
              <span
                className="whitespace-nowrap text-white not-italic text-[15.307071685791016px] font-normal tracking-[4px]"
                style={{
                  fontFamily: "Jaldi",
                }}
              >
                TECHNOLOGIES
              </span>
            </span>
          </div>
        </div>
        <img
          id="_420_456__Vector_1"
          src="/assets/images/vector_1.svg"
          alt="Vector_1"
          className="absolute left-[calc(50%-257.50px)] top-[258.00px]"
        />
        <span
          id="_420_457__Date_"
          className="flex justify-start text-left items-start h-[18.00px] w-[30.00px] absolute left-[40.00px] top-[203.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            Date:
          </span>
        </span>
        <span
          id="_420_459__22_August__2025"
          className="flex justify-start text-left items-start h-[18.00px] w-auto absolute left-[82.00px] top-[203.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            {formatDate(quotation?.date)}
          </span>
        </span>
        <span
          id="_421_450__22_September__2025"
          className="flex justify-start text-left items-start h-[18.00px] w-auto absolute left-[108.00px] top-[228.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            {formatDate(quotation?.valid_until)}
          </span>
        </span>
        <span
          id="_421_449___123456789231456"
          className="flex justify-start text-left items-start h-[18.00px] w-auto absolute left-[calc(50%-54.50px)] top-[179.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            #{quotation?.quotation_no || "N/A"}
          </span>
        </span>
        <span
          id="_421_402__Lorem_ipsum_dolor_si"
          className="flex justify-start text-left items-start h-auto w-[198.00px] absolute left-[40.00px] top-[504.00px]"
        >
          <span
            className="text-black not-italic text-[12.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            {quotation?.additional_notes || quotation?.payment_terms || "Thank you for your business!"}
          </span>
        </span>
        <span
          id="_420_458__Due_Date_"
          className="flex justify-start text-left items-start h-[18.00px] w-[56.00px] absolute left-[40.00px] top-[228.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            Due Date:
          </span>
        </span>
        <span
          id="_420_461__To_"
          className="flex justify-start text-left items-start h-[18.00px] w-[17.00px] absolute left-[538.00px] top-[228.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{
              fontFamily: "Jaldi",
            }}
          >
            To:
          </span>
        </span>
        {/* Table Header */}
        <div
          id="_420_479__Frame_1618874970"
          className="absolute bg-[rgba(243,255,254,1.00)] h-[32.00px] w-[515.00px] flex flex-row justify-start items-center flex-nowrap border-[#2cdbd9ff] border-solid border-[0.0px_0.0px_2.0px_0.0px] left-[40.00px] top-[345.00px]"
        >
          <div
            id="_420_471__Frame_1618874964"
            className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[184.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
          >
            <span
              id="_420_464__Name"
              className="flex justify-start text-left items-start h-[18.00px] w-[34.00px] relative"
            >
              <span
                className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                style={{
                  fontFamily: "Jaldi",
                }}
              >
                Name
              </span>
            </span>
          </div>
          <div
            id="_420_470__Frame_1618874963"
            className="relative h-[34.00px] w-[309.00px] flex flex-row justify-start items-center flex-nowrap"
          >
            <div
              id="_420_472__Frame_1618874965"
              className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[49.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
            >
              <span
                id="_420_465__Quantity"
                className="flex justify-start text-left items-start h-[18.00px] w-[49.00px] relative"
              >
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{
                    fontFamily: "Jaldi",
                  }}
                >
                  Quantity
                </span>
              </span>
            </div>
            <div
              id="_420_473__Frame_1618874966"
              className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[29.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
            >
              <span
                id="_420_466__Price"
                className="flex justify-start text-left items-start h-[18.00px] w-[29.00px] relative"
              >
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{
                    fontFamily: "Jaldi",
                  }}
                >
                  Price
                </span>
              </span>
            </div>
            <div
              id="_420_474__Frame_1618874967"
              className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[50.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
            >
              <span
                id="_420_467__Discount"
                className="flex justify-start text-left items-start h-[18.00px] w-[50.00px] relative"
              >
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{
                    fontFamily: "Jaldi",
                  }}
                >
                  Discount
                </span>
              </span>
            </div>
            <div
              id="_420_475__Frame_1618874968"
              className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[20.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
            >
              <span
                id="_420_468__Tax"
                className="flex justify-start text-left items-start h-[18.00px] w-[20.00px] relative"
              >
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{
                    fontFamily: "Jaldi",
                  }}
                >
                  Tax
                </span>
              </span>
            </div>
            <div
              id="_420_476__Frame_1618874969"
              className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[51.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2"
            >
              <span
                id="_420_469__Linetotal"
                className="flex justify-start text-left items-start h-[18.00px] w-[51.00px] relative"
              >
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{
                    fontFamily: "Jaldi",
                  }}
                >
                  Linetotal
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Table Rows - Dynamic Service Items - Limited to 3 items to fit on one page */}
        {serviceItems.slice(0, 3).map((item: any, index: number) => (
          <div
            key={index}
            className="absolute bg-neutral-50 h-[32.00px] w-[515.00px] flex flex-row justify-start items-center flex-nowrap left-[40.00px]"
            style={{ top: `${380 + index * 32}px` }}
          >
            <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[184.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
              <span className="flex justify-start text-left items-start h-[18.00px] w-[102.00px] relative">
                <span
                  className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                  style={{ fontFamily: "Jaldi" }}
                >
                  {item.description || item.category || "N/A"}
                </span>
              </span>
            </div>
            <div className="relative h-[34.00px] w-[309.00px] flex flex-row justify-start items-center flex-nowrap">
              <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[49.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
                <span className="flex justify-start text-left items-start h-[18.00px] w-[7.00px] relative">
                  <span
                    className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                    style={{ fontFamily: "Jaldi" }}
                  >
                    {item.quantity || 0}
                  </span>
                </span>
              </div>
              <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[29.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
                <span className="flex justify-start text-left items-start h-[18.00px] w-[27.00px] relative">
                  <span
                    className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                    style={{ fontFamily: "Jaldi" }}
                  >
                    {item.unit_price || 0}
                  </span>
                </span>
              </div>
              <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[50.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
                <span className="flex justify-start text-left items-start h-[18.00px] w-[4.00px] relative">
                  <span
                    className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                    style={{ fontFamily: "Jaldi" }}
                  >
                    -
                  </span>
                </span>
              </div>
              <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[20.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
                <span className="flex justify-start text-left items-start h-[18.00px] w-[4.00px] relative">
                  <span
                    className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                    style={{ fontFamily: "Jaldi" }}
                  >
                    -
                  </span>
                </span>
              </div>
              <div className="relative bg-[rgba(44,219,217,0.00)] h-[18.00px] w-[51.00px] flex flex-row justify-center items-center flex-nowrap px-[11px] py-2">
                <span className="flex justify-start text-left items-start h-[18.00px] w-[27.00px] relative">
                  <span
                    className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
                    style={{ fontFamily: "Jaldi" }}
                  >
                    {(item.quantity || 0) * (item.unit_price || 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
        {/* Summary Section */}
        <div
          id="_420_493__Frame_1618874971"
          className="absolute h-[158.00px] w-[102.00px] flex flex-col justify-start items-end flex-nowrap gap-2.5 left-[453.00px] top-[480.00px]"
        >
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              {formatDate(quotation?.date)}
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              {taxAmount}
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              {serverCharge > 0 ? `${serverCharge}` : "0"}
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              {domainCharge > 0 ? `${domainCharge}` : "0"}
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-[#2cdbd9] not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              RS. {grandTotal}
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[102.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              RS. {paid}
            </span>
          </span>
        </div>
        <div
          id="_420_494__Frame_1618874972"
          className="absolute h-[158.00px] w-[89.00px] flex flex-col justify-start items-start flex-nowrap gap-2.5 left-[312.00px] top-[480.00px]"
        >
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Subtotal:
            </span>
          </span>
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Tax:
            </span>
          </span>
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Server charge:
            </span>
          </span>
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Domain charge:
            </span>
          </span>
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-[#2cdbd9] not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Total:
            </span>
          </span>
          <span className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Paid:
            </span>
          </span>
        </div>
        <span
          id="_421_401__Note_"
          className="flex justify-start text-left items-start h-[18.00px] w-[89.00px] absolute left-[40.00px] top-[480.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{ fontFamily: "Jaldi" }}
          >
            Note:
          </span>
        </span>
        {/* Amount Due Section */}
        <div
          id="_420_512__Frame_1618874973"
          className="absolute bg-[rgba(5,36,85,1.00)] h-[28.00px] w-[103.00px] left-[299.00px] top-[643.00px]"
        >
          <span className="flex justify-start text-left items-start h-[18.00px] w-[70.00px] absolute top-[calc(50%-9.00px)] left-[13.00px]">
            <span
              className="whitespace-nowrap text-white not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              Amount Due
            </span>
          </span>
        </div>
        <div
          id="_421_399__Frame_1618874974"
          className="absolute bg-[rgba(5,36,85,1.00)] h-[28.00px] w-[161.00px] left-[402.00px] top-[643.00px]"
        >
          <span className="flex justify-start text-left items-start h-[18.00px] w-auto absolute left-[106.00px] top-[5.00px]">
            <span
              className="whitespace-nowrap text-white not-italic text-[14.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              RS. {amountDue}
            </span>
          </span>
        </div>
        <div
          id="_421_424__Rectangle_3463275"
          className="absolute bg-[rgba(5,36,85,1.00)] h-[9.00px] w-[595.00px] left-[0.00px] top-[833.00px]"
        ></div>
        <div
          id="_421_428__image_25"
          className="absolute h-[40.00px] w-[40.00px] left-[226.00px] top-[772.00px]"
          style={{
            background: "url(/assets/images/image_25.png) 100% / cover no-repeat",
          }}
        ></div>
        <span
          id="_421_425__Account_Holder__DOSH"
          className="flex justify-start text-left items-start h-[90.00px] w-[226.00px] absolute left-[40.00px] top-[722.00px]"
        >
          <span
            className="text-black not-italic text-[12.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{ fontFamily: "Jaldi" }}
          >
            Account Holder: DOSHI NAMAN PRAKASHBHAI
            <br />
            Account Number: 50100463075872
            <br />
            IFSC: HDFC0004227
            <br />
            Branch: JALARAM MANDIR PALDI
            <br />
            Account Type: SAVING
          </span>
        </span>
        <span
          id="_421_431__CEO_Naman_Doshi"
          className="flex justify-end text-right items-start h-[18.00px] w-[131.00px] absolute left-[424.00px] top-[748.00px]"
        >
          <span
            className="whitespace-nowrap text-black not-italic text-[12.0px] font-normal leading-[18.00px] tracking-[0px]"
            style={{ fontFamily: "Jaldi" }}
          >
            {quotation?.signatory_name || "CEO Naman Doshi"}
          </span>
        </span>
        <div
          id="_421_433__Frame_1618874975"
          className="absolute h-[41.00px] w-[131.00px] flex flex-col justify-start items-end flex-nowrap gap-[5px] left-[424.00px] top-[771.00px]"
        >
          <span className="flex justify-start text-left items-start h-[18.00px] w-[131.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[12.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              hello.digiwave@gmail.com
            </span>
          </span>
          <span className="flex justify-end text-right items-start h-[18.00px] w-[131.00px] relative">
            <span
              className="whitespace-nowrap text-black not-italic text-[12.0px] font-normal leading-[18.00px] tracking-[0px]"
              style={{ fontFamily: "Jaldi" }}
            >
              +91 9624185617
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
