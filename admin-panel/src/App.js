import { BrowserRouter as Router , Routes , Route , Navigate, } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/auth/Login";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Charts from "./pages/dashboard/Charts";
import UserActivity from "./pages/dashboard/UserActivity";
import UsersAll from "./pages/dashboard/Users";
import { Users } from "lucide-react";

function App() {
  const token = useSelector((state) => state.auth.token);
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard/users/daily-activity" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Charts />} />
          <Route
            path="/dashboard/users/daily-activity"
            element={<UserActivity />}
          />
          <Route path="/dashboard/users/all-users" element={<UsersAll />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />  
      </Routes> 
    </Router>
  );
}

export default App;