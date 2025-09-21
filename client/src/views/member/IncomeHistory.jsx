import React from "react";

const IncomeHistory = () => {
  const history = [
    { level: 1, amount: 500, date: "01-09-2025", status: "Paid" },
    { level: 2, amount: 300, date: "03-09-2025", status: "Pending" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Income & Payout History</h2>
      <table className="w-full bg-white rounded-2xl shadow overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Level</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} className="border-t">
              <td className="p-3">{h.level}</td>
              <td className="p-3">₹{h.amount}</td>
              <td className="p-3">{h.date}</td>
              <td className={`p-3 font-semibold ${h.status === "Paid" ? "text-green-600" : "text-yellow-600"}`}>
                {h.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IncomeHistory;
