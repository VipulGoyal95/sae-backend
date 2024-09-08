// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const Razorpay = require('razorpay');
require("dotenv").config();
const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const app = express();
const port = 5000;
// http://localhost:3000/register/registrationDetails
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true // Allow credentials if needed
  };
  app.options('*', cors(corsOptions)); // Preflight requests
  
//   app.use(cors(corsOptions));
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create a transporter object using your SMTP service
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: 'vipulgoyal151@gmail.com',
        pass: process.env.PASS
    }
});
app.get('/',(req,res)=>{
    res.send("Server chal raha h");
});

app.post('/create-order', async (req, res) => {
    const options = {
        amount: req.body.amount * 100, // amount in smallest currency unit (e.g., 100 for ₹1)
        currency: 'INR',
        receipt: 'order_rcptid_11',
    };
    console.log(req.body.amount);
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.log(error);
        res.status(500).send('Something went wrong');
    }
});

    // Route to handle email sending
    app.post('/send-email', (req, res) => {
        const { name, email, phone, college, branch, semester, department, timeSlot1} = req.body;
        // console.log(req.body);
        const mailOptions = {
            from: 'saenitkkr@nitkkr.ac.in',
            to: email,
            subject: 'Successfull Registration for Autokriti 2024',
            html: `
            <h2>Your Registration for Autokriti 2024 has been completed and <span style={{color:"red"}}> Confirmation is under process</span></h2>
            <h3>Here's what was received</h3>
             <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left;">Field</th>
                    <th style="background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Name</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Email</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${email}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Phone Number</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${phone}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">College</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${college}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Branch</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${branch}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Semester</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${semester}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Department</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${department}</td>
                </tr>
                <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Time Slot</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${timeSlot1} September</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Transaction ID</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${department}</td>
                </tr>
            </tbody>
        </table>
            <h4>We will verify your Registration details within 72 Hours</h4>
            <h4>You will receive registration ID After confirmation</h4>
        `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            res.status(200).json({ message: 'Email sent successfully' });
        });
    });
    app.post('/send-email', (req, res) => {
        const { name, email, phone, college, branch, semester, department, timeSlot1, registrationId } = req.body;
        // console.log(req.body);
        const mailOptions = {
            from: 'vipulgoyal151@gmail.com',
            to: email,
            subject: 'Successfull Registration for Autokriti 2024',
            html: `<h3>Your Registration for Autokriti</h3>`
            
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Failed to send email' });
            }
            res.status(200).json({ message: 'Email sent successfully' });
        });
    });
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
