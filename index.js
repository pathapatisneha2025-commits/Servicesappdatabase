const express = require("express");
const cors = require("cors");
const Users = require("./routes/users");
const Services = require("./routes/services");
const Bookings = require("./routes/booking");







require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/users", Users);
app.use("/services",Services);
app.use("/bookings",Bookings);





app.listen(5000, () => {
  console.log("Server running on port 5000");
});
