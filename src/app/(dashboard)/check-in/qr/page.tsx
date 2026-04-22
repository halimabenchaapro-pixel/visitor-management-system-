"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { ArrowLeft, Download, Printer, RefreshCw, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function QRCodePage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/register`;
    setRegistrationUrl(url);
    generateQR(url);
  }, []);

  async function generateQR(url: string) {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    setQrDataUrl(dataUrl);
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "visitor-checkin-qr.png";
    a.click();
  }

  function handlePrint() {
    window.print();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <Header title="Visitor QR Code" />
      <div className="p-6 max-w-2xl">
        <Link href="/check-in" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Check-in
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <div id="qr-print-area" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-4">
            <div className="text-center">
              <h2 className="font-bold text-gray-900 text-lg">Visitor Self Check-in</h2>
              <p className="text-sm text-gray-500 mt-1">Scan to register your visit</p>
            </div>

            {qrDataUrl ? (
              <div className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-inner">
                <Image
                  src={qrDataUrl}
                  alt="Registration QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-100 rounded-2xl animate-pulse" />
            )}

            <div className="text-center">
              <p className="text-xs text-gray-400">Point your phone camera at this code</p>
              <p className="text-xs font-mono text-blue-600 mt-1 break-all">{registrationUrl}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">How it works</h3>
              <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
                <li>Print or display this QR code at your reception</li>
                <li>Visitors scan it with their phone camera</li>
                <li>They fill in their details on the form</li>
                <li>You get notified instantly when they check in</li>
                <li>Their visit appears in the Visits dashboard</li>
              </ol>
            </div>

            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                Print QR Code
              </button>
              <button
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium disabled:opacity-40"
              >
                <Download className="w-4 h-4 text-gray-500" />
                Download PNG
              </button>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
                {copied ? "Copied!" : "Copy Registration Link"}
              </button>
              <button
                onClick={() => generateQR(registrationUrl)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
                Regenerate QR Code
              </button>
            </div>

            <Link
              href={registrationUrl}
              target="_blank"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Preview Registration Form
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-print-area {
            display: flex !important;
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid #e5e7eb !important;
            padding: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
