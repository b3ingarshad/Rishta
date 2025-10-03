import React from "react";

const Referrals = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const referralId = user?.referralId || "";
  const referralLink = `${window.location.origin}/auth/sign-up?referralId=${referralId}`;

  // Detect mobile or desktop for WhatsApp
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // WhatsApp share
  const shareOnWhatsApp = () => {
    const message = `Get ₹400 per friend you refer to RishtaForYou & potential earning upto ₹40Cr! Share: ${referralLink} #RishtaForYou`;
    const whatsappUrl = isMobile
      ? `https://wa.me/?text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Gmail share
  const shareOnGmail = () => {
    const subject = "Join this platform using my Referral ID";
    const body = `
    Get ₹400 per friend you refer to RishtaForYou & potential earning upto ₹40Cr! Share: ${referralLink} #RishtaForYou`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank"); // Opens Gmail in a new tab
  };

  // Copy referral link
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied to clipboard!");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">My Referrals</h2>

      {/* Referral ID + Share Buttons */}
      <div className="bg-white p-5 rounded-2xl shadow mb-6">
        <h3 className="font-semibold mb-3">Your Referral ID</h3>
        <p className="text-lg font-bold mb-2">{referralId || "No Referral ID"}</p>
        <div className="d-flex flex-wrap gap-3">
          <button
            onClick={shareOnWhatsApp}
            className="py-1 py-md-2 px-2 px-md-4 flex-grow-1 flex-md-grow-0 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Share on WhatsApp
          </button>
          <button
            onClick={shareOnGmail}
            className="py-1 py-md-2 px-2 px-md-4 flex-grow-1 flex-md-grow-0 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Share on Gmail
          </button>
          <button
            onClick={copyReferralLink}
            className="py-1 py-md-2 px-2 px-md-4 flex-grow-1 flex-md-grow-0 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Direct Referrals */}
      <div className="bg-white p-5 rounded-2xl shadow mb-6">
        <h3 className="font-semibold mb-3">Direct Referrals (1-5)</h3>
        <ul className="space-y-2">
          {[1, 2, 3, 4, 5].map((id) => (
            <li
              key={id}
              className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
            >
              <span>Referral #{id}</span>
              <span className="text-green-600 font-bold">Active</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 10-Level Tree View */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-semibold mb-3">10-Level Tree View</h3>
        <div className="overflow-x-auto">
          <p className="text-gray-500">
            [Tree View Component Will Be Rendered Here]
          </p>
        </div>
      </div>
    </div>
  );
};

export default Referrals;