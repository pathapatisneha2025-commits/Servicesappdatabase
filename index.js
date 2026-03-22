require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Users = require("./routes/users");
const Services = require("./routes/services");
const Bookings = require("./routes/booking"); 
const Providers = require("./routes/providers");
const Reviews = require("./routes/reviews");
const Notifcations = require("./routes/notifcation");
const Chatmessages = require("./routes/chats");












const app = express();
app.use(cors());
app.use(express.json());
app.use("/users", Users);
app.use("/services",Services);
app.use("/bookings",Bookings);
app.use("/providers",Providers);
app.use("/reviews",Reviews);
app.use("/notifications",Notifcations);
app.use("/chats",Chatmessages);







app.listen(5000, () => {
  console.log("Server running on port 5000");
});
