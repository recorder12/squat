import React from "react";
import { Link } from "react-router-dom";

const Navigation = ({ userObj }) => (
  <nav className="nav">
    <ul style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
      <li className="home_link">
        <Link to="/" style={{ marginRight: 10 }}>Home</Link>
      </li>
      <li className="profile_link">
        <Link to="/profile"  style={{
            marginLeft: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>Profile</Link>
      </li>
    </ul>
  </nav>
);
export default Navigation;