// src/routes.js
import {
  MdHome,
  MdPerson,
  MdLock,
  MdDashboard,
  MdGroup,
  MdHistory,
} from "react-icons/md";
import Dashboard from "views/admin/default";
import ProfileOverview from "views/admin/profile";

import UserTable from "views/admin/users/components/UserTable";
import SignIn from "views/auth/SignIn";
import SignUp from "views/auth/SignUp";
import MemberDashboard from "views/member";
import IncomeHistory from "views/member/IncomeHistory";
import Referrals from "views/member/Referrals";

export const authRoutes = [
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    component: SignIn,
  },
  {
    name: "Sign Up",
    layout: "/auth",
    path: "sign-up",
    component: SignUp,
  },
];


// ---------------- Admin Routes ----------------
export const adminRoutes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: Dashboard,
  },
  {
    name: "Users",
    layout: "/admin",
    path: "users",
    icon: <MdPerson className="h-6 w-6" />,
    component: UserTable,
  },
];

// ---------------- Member Routes ----------------
export const memberRoutes = [
  {
    name: "Dashboard",
    layout: "/member",
    path: "dashboard",
    icon: <MdDashboard className="h-6 w-6" />,
    component: MemberDashboard,
  },
  {
    name: "My Referrals",
    layout: "/member",
    path: "referrals",
    icon: <MdGroup className="h-6 w-6" />,
    component: Referrals,
  },
  {
    name: "Income History",
    layout: "/member",
    path: "income-history",
    icon: <MdHistory className="h-6 w-6" />,
    component: IncomeHistory,
  },
  {
      name: "Profile",
      layout: "/member",
      path: "profile",
      icon: <MdPerson className="h-6 w-6" />,
      component: ProfileOverview,
    },

];
