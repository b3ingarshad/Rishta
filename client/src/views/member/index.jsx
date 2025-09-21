// src/views/member/MemberDashboard.jsx
import React, { useEffect, useState } from "react";
import Widget from "components/widget/Widget";
import { MdBarChart, MdAttachMoney, MdGroup, MdHistory } from "react-icons/md";
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const MemberDashboard = () => {
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.referralId) {
      fetchReferralCount(user.referralId);
    }
  }, []);

  const fetchReferralCount = async (referralId) => {
    try {
      const res = await fetch(`${API_BASE}api/auth/referrals/count/${referralId}`);
      const data = await res.json();
      setReferralCount(data.totalReferrals || 0);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    }
  };

  return (
    <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
      <Widget
        icon={<MdBarChart className="h-6 w-6" />}
        title="Total Earnings"
        subtitle="$5,230"
      />
      <Widget
        icon={<MdAttachMoney className="h-6 w-6" />}
        title="This Month"
        subtitle="$1,200"
      />
      <Widget
        icon={<MdGroup className="h-6 w-6" />}
        title="Referrals"
        subtitle={referralCount.toString()}
      />
      <Widget
        icon={<MdHistory className="h-6 w-6" />}
        title="Transactions"
        subtitle="34"
      />
    </div>
  );
};

export default MemberDashboard;
