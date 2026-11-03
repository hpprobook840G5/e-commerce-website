export default function UpiQrCode({ amount = 0 }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded">
      <h2 className="text-xl font-bold mb-2">Scan to pay via UPI</h2>
      <img src="/upi-qr.png" alt="UPI QR Code" className="w-64 h-64 object-contain" />
      <p className="mt-2 text-gray-700">Amount: ₹{amount}</p>
    </div>
  )
}

