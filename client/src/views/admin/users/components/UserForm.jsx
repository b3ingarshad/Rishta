  import React, { useState } from "react";
  import InputField from "../../../../components/fields/InputField";
  import TextField from "../../../../components/fields/TextField";
  import { toast } from "react-toastify";
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
  export default function UserForm({ initialData = {}, onSubmit, isAdmin, loading }) {
    const [form, setForm] = useState({
      fullName: "",
      aadharNumber: "",
      aadharPhoto: null,
      panNumber: "",
      panPhoto: null,
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      dob: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      mobile: "",
       referralCode: "",
    sponsorName: "",
      terms: false,
      ageCheck: false,
      ...initialData,
    });

    const [error, setError] = useState({});
    const [locationLocked, setLocationLocked] = useState(false);

    // Handle input change
    const handleChange = (e) => {
      const { id, value, type, checked, files } = e.target;
      setForm((prev) => ({
        ...prev,
        [id]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
      }));
    };

    // Autofill state & city from pincode
    const handlePincodeChange = async (e) => {
      const pinCode = e.target.value;
      setForm((prev) => ({ ...prev, pinCode }));

      if (pinCode.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
          const data = await res.json();

          if (data[0].Status === "Success") {
            setForm((prev) => ({
              ...prev,
              state: data[0].PostOffice[0].State,
              city: data[0].PostOffice[0].District,
            }));
            setLocationLocked(true);
            toast.success("State & City autofilled!");
          } else {
            setForm((prev) => ({ ...prev, state: "", city: "" }));
            setLocationLocked(false);
            toast.error("Invalid Pincode");
          }
        } catch {
          setForm((prev) => ({ ...prev, state: "", city: "" }));
          setLocationLocked(false);
          toast.error("Failed to fetch location");
        }
      }
    };
// Handle referral code change
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
        setError((prev) => ({ ...prev, referralCode: "" }));
      } catch (err) {
        setForm((prev) => ({ ...prev, sponsorName: "" }));
        setError((prev) => ({ ...prev, referralCode: "Invalid Referral Code" }));
      }
    } else {
      setForm((prev) => ({ ...prev, sponsorName: "" }));
    }
  };
  // Validate form
  const validateForm = () => {
    let errors = {};

    if (!form.fullName) errors.fullName = "Full name is required";
    if (!form.email) errors.email = "Email is required";

    // ✅ Mobile validation only if entered
    if (form.mobile) {
      if (!/^\d{10}$/.test(form.mobile)) {
        errors.mobile = "Mobile must be 10 digits";
      }
    }

    // ✅ Aadhar validation only if entered
    if (form.aadharNumber) {
      if (!/^\d{12}$/.test(form.aadharNumber)) {
        errors.aadharNumber = "Aadhar must be 12 digits";
      }
    }
      if (!form.referralCode) {
      form.referralCode = "REF1IBDUNDO";
      form.sponsorName = "Mohammad Abbas Noorani";
    }

    // ✅ PAN validation only if entered
    if (form.panNumber) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
        errors.panNumber = "Invalid PAN format";
      }
    }

    // ✅ DOB validation only if entered
    if (form.dob) {
      const dob = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 18) errors.ageCheck = "User must be at least 18 years old";
    }

    if (!form.address) errors.address = "Address is required";

    if (!isAdmin && form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };


    // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please check the highlighted errors");
      return;
    }
 if (!form.referralCode) {
      form.referralCode = "REF1IBDUNDO";
      form.sponsorName = "Mohammad Abbas Noorani";
    }
    // Convert to FormData for file upload
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    onSubmit(formData);
  };


    const renderError = (field) =>
      error[field] && <small className="text-red-500">{error[field]}</small>;

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
      

        <InputField id="fullName" label="Full Name*" value={form.fullName} onChange={handleChange} />
        {renderError("fullName")}

        <InputField id="email" label="Email*" value={form.email} onChange={handleChange} />
        {renderError("email")}

        <InputField id="mobile" label="Mobile Number" value={form.mobile} onChange={handleChange} />
        {renderError("mobile")}

        {!isAdmin && (
          <>
            <InputField id="password" label="Password*" type="password" value={form.password} onChange={handleChange} />
            <InputField id="confirmPassword" label="Confirm Password*" type="password" value={form.confirmPassword} onChange={handleChange} />
            {renderError("confirmPassword")}
          </>
        )}

        {/* <InputField id="aadharNumber" label="Aadhar Number" value={form.aadharNumber} onChange={handleChange} />
        {renderError("aadharNumber")}

        <input type="file" id="aadharPhoto" accept="image/*" onChange={handleChange} className="block w-full mt-2" />
       

        <InputField id="panNumber" label="PAN Number" value={form.panNumber} onChange={handleChange} />
        {renderError("panNumber")}

        <input type="file" id="panPhoto" accept="image/*" onChange={handleChange} className="block w-full mt-2" /> */}
       

        <select id="gender" value={form.gender} onChange={handleChange} className="form-control w-full p-2 border rounded">
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {/* {renderError("gender")} */}

        <InputField id="dob" type="date" label="Date of Birth" value={form.dob} onChange={handleChange} />
        {/* {renderError("dob")} */}
        {renderError("ageCheck")}

        <InputField id="pinCode" label="Pin Code" value={form.pinCode} onChange={handlePincodeChange} />
        {/* {renderError("pinCode")} */}

        <InputField id="city" label="City" value={form.city} disabled={locationLocked} />
        {/* {renderError("city")} */}

        <InputField id="state" label="State" value={form.state} disabled={locationLocked} />
        {/* {renderError("state")} */}

        <TextField id="address" label="Address*" value={form.address} onChange={handleChange} />
        {renderError("address")}

  <InputField id="country" label="Country*" value={form.country} disabled />

        {/* <select id="country" value={form.country} onChange={handleChange} className="form-control w-full p-2 border rounded">
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
        </select> */}
  {/* Referral Section */}
      <div className="mt-4">
        <InputField id="referralCode" label="Referral Code" value={form.referralCode} onChange={handleReferralChange} disabled={!!initialData._id}  />
        {renderError("referralCode")}
        <InputField id="sponsorName" label="Sponsor Name" value={form.sponsorName} disabled />
      </div>

      <button 
    type="submit" 
    className={`px-4 py-2 rounded w-full mt-4 ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white transition duration-300`} 
    disabled={loading}
  >
    {loading ? "Saving..." : "Save User"}
  </button>
      </form>
    );
  }
