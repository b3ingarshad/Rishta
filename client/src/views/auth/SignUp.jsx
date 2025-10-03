import React, { useEffect, useState } from "react";
import InputField from "../../components/fields/InputField";
import TextField from "../../components/fields/TextField";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import { border } from "@chakra-ui/system";
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dob: "",
    gender: "",
    mobile: "",
    address: "",
    country: "India",
    city: "",
    state: "",
    pinCode: "",
    aadharNumber: "",
    panNumber: "",
    aadharPhoto: null,
    panPhoto: null,
    education: "",
    profession: "",
    nomineeName: "",
    nomineeRelation: "",
    referralCode: "",
    sponsorName: "",
    terms: false,
    ageCheck: false,
  });

  const [error, setError] = useState({});
  const [locationLocked, setLocationLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  // Generic change handler
  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [id]: checked }));
    } else if (type === "file") {
      setForm((prev) => ({ ...prev, [id]: files[0] })); // only first file
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  // Email verification request
  const handleEmailVerification = async () => {
    if (!form.email) {
      toast.error("Please enter email first");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If email not found
        if (res.status === 404) {
          throw new Error("Email address not found");
        } else {
          throw new Error(data.message || "Failed to send OTP");
        }
      }

      toast.success("Verification email sent. Please check your inbox!");
    } catch (err) {
      toast.error(err.message);
    }
  };


  const handleOTPVerification = async () => {
    const otp = prompt("Enter OTP sent to your email:");
    if (!otp) return;
    try {
      const res = await fetch(`${API_BASE}api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Email verified successfully!");
      setEmailVerified(true);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralId = params.get("referralId");
    if (referralId) {
      setForm((prev) => ({ ...prev, referralCode: referralId }));
      // Automatically fetch sponsor name
      fetchSponsorName(referralId);
    }
  }, [location.search]);

  const fetchSponsorName = async (referralCode) => {
    try {
      const res = await fetch(`${API_BASE}api/auth/get-sponsor/${referralCode}`);
      if (!res.ok) throw new Error("Invalid Referral Code");
      const data = await res.json();
      setForm((prev) => ({ ...prev, sponsorName: data.sponsorName }));
      setError((prev) => ({ ...prev, referralCode: "" }));
    } catch (err) {
      setForm((prev) => ({ ...prev, sponsorName: "" }));
      setError((prev) => ({ ...prev, referralCode: "Invalid Referral Code" }));
    }
  };

  // Handle Pincode change & autofill state/city
  // Handle Pincode change & autofill state/city
  const handlePincodeChange = async (e) => {
    const pinCode = e.target.value;
    setForm((prev) => ({ ...prev, pinCode }));

    if (pinCode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const data = await res.json();

        if (data[0].Status === "Success") {
          const state = data[0].PostOffice[0].State;
          const city = data[0].PostOffice[0].District;

          setForm((prev) => ({
            ...prev,
            state,
            city,
          }));
          setLocationLocked(true);
          toast.success("State & City autofilled!");
        } else {
          // Invalid Pincode → Clear state & city
          setForm((prev) => ({
            ...prev,
            state: "",
            city: "",
          }));
          setLocationLocked(false);
          toast.error("Invalid Pincode");
        }
      } catch (err) {
        console.error(err);
        // API error → Clear state & city
        setForm((prev) => ({
          ...prev,
          state: "",
          city: "",
        }));
        setLocationLocked(false);
        toast.error("Failed to fetch location");
      }
    } else {
      // If pincode less than 6 digits → Clear state & city
      setForm((prev) => ({
        ...prev,
        state: "",
        city: "",
      }));
      setLocationLocked(false);
    }
  };

  // Referral Code Change Handler
  const handleReferralChange = async (e) => {
    const referralCode = e.target.value;
    setForm((prev) => ({ ...prev, referralCode }));

    if (referralCode.trim() !== "") {
      try {
        const res = await fetch(`${API_BASE}api/auth/get-sponsor/${referralCode}`);
        if (!res.ok) throw new Error("Invalid Referral Code");

        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          sponsorName: data.sponsorName
        }));
        setError((prev) => ({ ...prev, referralCode: "" })); // clear error if valid
      } catch (err) {
        setForm((prev) => ({ ...prev, sponsorName: "" }));
        setError((prev) => ({ ...prev, referralCode: "Invalid Referral Code" }));
      }
    } else {
      setForm((prev) => ({ ...prev, sponsorName: "" }));
    }
  };


  const validateForm = () => {
    let errors = {};

    if (!form.email) errors.email = "Email is required";
    if (!emailVerified) errors.email = "Please verify email first";
    if (!form.password || form.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!form.fullName) errors.fullName = "Full name is required";
    if (!form.pinCode) errors.pinCode = "Pin Code is required";
    if (!form.state) errors.state = "State is required";
    if (!form.city) errors.city = "City is required";
if (form.aadharNumber) {
    if (!/^\d{12}$/.test(form.aadharNumber)) {
      errors.aadharNumber = "Aadhar must be 12 digits";
    }
  }
  if (form.panNumber) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
      errors.panNumber = "Invalid PAN format";
    }
  }
    // if (!form.aadharNumber) errors.aadharNumber = "Aadhar number is required";
    // if (!form.panNumber) errors.panNumber = "PAN number is required";

    // if (!form.aadharPhoto) errors.aadharPhoto = "Aadhar photo is required";
    // if (!form.panPhoto) errors.panPhoto = "PAN photo is required";

    if (!form.mobile) errors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(form.mobile))
      errors.mobile = "Mobile must be 10 digits";

    if (!form.address) errors.address = "Address is required";

    if (!form.terms) errors.terms = "You must accept terms";
    if (!form.ageCheck) errors.ageCheck = "You must be at least 18";

    if (!form.gender) errors.gender = "Gender is required";
    if (!form.dob) {
      errors.dob = "Date of Birth is required";
    } else {
      const dob = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

      if (age < 18) errors.dob = "You must be at least 18 years old";
    }

    // Checkbox validation
    if (!form.ageCheck) {
      errors.ageCheck = "You must confirm that you are at least 18 years old";
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Default referral if empty
    if (!form.referralCode) {
      form.referralCode = "REF1IBDUNDO";
      form.sponsorName = "Mohammad Abbas Noorani";
    }

    if (!validateForm()) {
      toast.error("Please fix errors");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));

      await signup(formData);
      toast.success("Signup successful!");
      setTimeout(() => navigate("/auth/sign-in"), 2000);
    } catch (err) {
      toast.error(err.message || "Signup failed!");
      setLoading(false);
    }
  };

  // Helper to show error below inputs
  const renderError = (field) =>
    error[field] && <small className="text-red-500">{error[field]}</small>;

  return (
    <div className="mt-10 mb-10 flex h-full w-full items-center justify-center px-2">
      <ToastContainer />
      <div className="mt-[5vh] w-full max-w-full flex-col items-center xl:max-w-[50%]">
        <h4 className="mb-4 text-4xl font-bold text-navy-700 dark:text-white">
          Sign Up
        </h4>
        <p className="mb-8 text-base text-gray-600 dark:text-gray-300">
          Create your account by filling the form below.
        </p>

        <form className="w-full" noValidate onSubmit={handleSubmit}>

          {/* Full Name */}
          <p className="mb-2 text-base text-gray-600">Personal Details as per KYC Documents*</p>
          <div className="row gx-3 mb-3">
            <div className="col-md-12">
              <InputField id="fullName" label="Full Name (as per Aadhar Card)*" value={form.fullName} onChange={handleChange} />
              {renderError("fullName")}
            </div>
            {/* <div className="col-md-6">
              <InputField id="aadharNumber" label="Aadhar Card Number" value={form.aadharNumber} onChange={handleChange} />
              {renderError("aadharNumber")}
            </div>
            <div className="col-md-6">
              <InputField
                id="aadharPhoto"
                label="Aadhar Photo"
                value={form.aadharPhoto}
                onChange={handleChange}
                type="file"
                className="custom-file"

              />

            </div>
            <div className="col-md-6">
              <InputField id="panNumber" label="PAN Number" value={form.panNumber} onChange={handleChange} />
              {renderError("panNumber")}
            </div>
            <div className="col-md-6">
              <InputField
                id="panPhoto"
                label="PAN Photo"
                value={form.panPhoto}
                onChange={handleChange}
                type="file"
                className="custom-file"
              />

            </div> */}
          </div>

          {/* Gender & DOB */}
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <label
                htmlFor="gender"
                className={`text-sm text-navy-700 dark:text-white font-bold`}
              >
                Gender*
              </label>
              <select
                id="gender"
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl 
          border bg-white/0 p-1 outline-none
          border-gray-200 dark:!border-white/10 dark:text-white
             // 👉 user class override
        "
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender*</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {renderError("gender")}
            </div>

            <div className="col-md-6">
              <InputField
                id="dob"
                type="date"
                label="Date of Birth*"
                value={form.dob}
                onChange={handleChange}
              />
              {renderError("dob")}
            </div>
          </div>


          {/* Country & Pin */}
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="country" label="Country*" value={form.country} disabled />
            </div>
            <div className="col-md-6">
              <InputField id="pinCode" label="Pin Code*" value={form.pinCode} onChange={handlePincodeChange} />
              {renderError("pinCode")}
            </div>
          </div>

          {/* State & City */}
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="state" label="State*" value={form.state} disabled={locationLocked} />
              {renderError("state")}
            </div>
            <div className="col-md-6">
              <InputField id="city" label="City*" value={form.city} disabled={locationLocked} />
              {renderError("city")}
            </div>
          </div>

          {/* Mobile & Email */}
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="mobile" label="Mobile*" value={form.mobile} onChange={handleChange} />
              {renderError("mobile")}
            </div>
            <div className="col-md-6">
              <div>
                <InputField id="email" label="Email*" value={form.email} onChange={handleChange} />

              </div>

              {renderError("email")}
            </div>

            <div className="col-md-6">
              <button type="button" onClick={handleEmailVerification} className="w-full py-2 mt-2 rounded-lg text-white font-medium bg-[#75B61A] hover:bg-green-600">Send OTP</button>

            </div>

            <div className="col-md-6">
              <button type="button" onClick={handleOTPVerification} className="w-full py-2 mt-2 rounded-lg text-white font-medium bg-[#75B61A] hover:bg-green-600">Verify OTP</button>
            </div>


          </div>

          {/* Passwords */}
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="password" label="Password*" type="password" value={form.password} onChange={handleChange} />
              {renderError("password")}
            </div>
            <div className="col-md-6">
              <InputField id="confirmPassword" label="Confirm Password*" type="password" value={form.confirmPassword} onChange={handleChange} />
              {renderError("confirmPassword")}
            </div>
          </div>

          {/* Address */}
          <div className="row gx-3 mb-3">
            <div className="col-12">
              <TextField id="address" label="Address*" value={form.address} onChange={handleChange} />
              {renderError("address")}
            </div>
          </div>




          {/* Additional */}
          {/* <p className="mb-2 text-base text-gray-600">Additional Details*</p>
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="education" label="Education" value={form.education} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <InputField id="profession" label="Profession" value={form.profession} onChange={handleChange} />
            </div>
          </div>
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField id="nomineeName" label="Nominee Name*" value={form.nomineeName} onChange={handleChange} />
              {renderError("nomineeName")}
            </div>
            <div className="col-md-6">
              <InputField id="nomineeRelation" label="Nominee Relation*" value={form.nomineeRelation} onChange={handleChange} />
              {renderError("nomineeRelation")}
            </div>
          </div> */}

          {/* Referral */}
          <p className="mb-2 text-base text-gray-600">Referral Code*</p>
          <div className="row gx-3 mb-3">
            <div className="col-md-6">
              <InputField
                id="referralCode"
                label="Referral Code"
                value={form.referralCode}
                onChange={handleReferralChange}
              />
              {renderError("referralCode")}
            </div>
            <div className="col-md-6">
              <InputField
                id="sponsorName"
                label="Sponsor Name"
                value={form.sponsorName}
                disabled
              />
              {renderError("sponsorName")}
            </div>
          </div>


          {/* Terms */}
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="terms" checked={form.terms} onChange={handleChange} />
            <label className="form-check-label" htmlFor="terms">I agree to the Terms and Conditions</label>
            {renderError("terms")}
          </div>
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="ageCheck" checked={form.ageCheck} onChange={handleChange} />
            <label className="form-check-label" htmlFor="ageCheck">I am at least 18 years old</label>
            {renderError("ageCheck")}
          </div>

          <button type="submit" disabled={loading} className={`w-full py-2 mt-2 rounded-lg text-white font-medium ${loading ? "bg-gray-400" : "bg-[#75B61A] hover:bg-green-600"}`}>

            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
