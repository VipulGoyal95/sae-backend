const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { db } = require("../../firebase.js");
const CASHFREE_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.cashfree.com/pg/orders'  // Live API URL
    : 'https://sandbox.cashfree.com/pg/orders'; // Sandbox API URL

const HEADERS = {
    accept: 'application/json',
    'x-api-version': '2022-09-01',
    'content-type': 'application/json',
    'x-client-id': process.env.CLIENT_ID,
    'x-client-secret': process.env.CLIENT_SECRET
};


// Mail transporter for payment notifications
const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'saenitkkr@nitkkr.ac.in',
        pass: process.env.PASS
    }
});

const newOrderId = async (req, res) => {
    try {
        const { version, form, amount } = req.body;

        if (!version || !form || !form.name || !form.email || !form.phone || !amount) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const { name, email, phone, college, branch, semester, dept, accommodation } = form;
        const orderId = `ORDER_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        const customerId = `CID_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        await db.collection("AutokritiRegistration").doc(orderId).set({
            name,
            email,
            phone,
            amount,
            college,
            branch,
            semester,
            department: dept,
            accommodation,
            createdAt: new Date(),
            status: "PENDING"
        });


        const data = {
            order_id: orderId,
            order_amount: parseFloat(amount),
            order_currency: 'INR',
            order_note: 'Transaction via Cashfree',
            customer_details: {
                customer_id: customerId,
                customer_email: email,
                customer_phone: phone,
                customer_name: name
            },
            order_meta: {
                return_url: `https://sae-backend.vercel.app/api/status/${orderId}`,
                notify_url: `https://sae-backend.vercel.app/api/status/${orderId}`,
                payment_methods: 'cc,dc,upi,nb',
                cancel_url: `https://saenitkurukshetra.com/autokriti/registrationform`
            }
        };

        const response = await axios.post(CASHFREE_API_URL, data, { headers: HEADERS });

        if (response.data?.payment_session_id) {
            return res.status(200).json({
                success: true,
                payment_url: response.data.payment_link,  // Redirect user to this link
                order_id: orderId,
                payment_session_id: response.data.payment_session_id
            });
        } else {
            return res.status(400).json({ success: false, message: "Failed to create order" });
        }

    } catch (error) {
        console.error("Cashfree Order Error:", error);
        return res.status(500).json({ success: false, message: error.response?.data || error.message });
    }
};

const checkStatus = async (req, res) => {
    try {
        const { orderid } = req.params;

        if (!orderid) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const response = await axios.get(`${CASHFREE_API_URL}/${orderid}`, { headers: HEADERS });
        // console.log(response);
        // return res.status(200).json({
        //     success:true,
        //     message:"success"
        // })

        if (response.data?.order_status === "PAID") {
            try {
                const customerDetails = response.data?.customer_details || {};
                const recipientEmail = customerDetails.customer_email;
                const recipientName = customerDetails.customer_name || "Participant";
                const amountPaid = response.data?.order_amount;

                if (recipientEmail) {
                    const mailOptions = {
                        from: '"SAE NIT Kurukshetra" <saenitkkr@nitkkr.ac.in>',
                        to: recipientEmail,
                        subject: "Registration Successful for Autokriti 15.0!",
                        text: `Hi ${recipientName},

Thank you for registering for Autokriti 15.0, the 15th edition of North India’s largest automotive workshop.

We look forward to your presence at NIT Kurukshetra on 4th September, 2025.

The detailed schedule will be shared with you shortly. 

Stay tuned for more information!

Best Wishes,
SAE NIT Kurukshetra`,
                        html: `
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;
              border:1px solid #e5e5e5;font-family:Arial,Helvetica,sans-serif;">
    
    <!-- Banner -->
    <img src="https://res.cloudinary.com/dvzvjohzj/image/upload/v1755804308/poster_hu9ivl.jpg" 
         alt="Autokriti 15.0" 
         style="width:100%;display:block;max-height:250px;object-fit:cover;" />

    <!-- Body -->
    <div style="padding:20px;text-align:center;color:#333;">
      <h2 style="margin-top:0;color:#2c3e50;font-size:22px;">Hi ${recipientName},</h2>

      <p style="font-size:16px;line-height:1.6;margin:15px 0;color:#555;">
        Thank you for registering for <strong>Autokriti 15.0</strong>, 
        the 15th edition of North India’s largest automotive workshop.
      </p>

      <p style="font-size:16px;line-height:1.6;margin:15px 0;color:#555;">
        We look forward to your presence at <strong>NIT Kurukshetra</strong> on 
        <strong>4th September, 2025</strong>.
      </p>

      <p style="font-size:16px;line-height:1.6;margin:15px 0;color:#555;">
        The detailed schedule will be shared with you shortly. <br/>
        Stay tuned for more information!
      </p>

      <!-- Divider -->
      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />

      <p style="font-size:16px;color:#2c3e50;margin:0;">
        Best Wishes,<br/>
        <strong>SAE NIT Kurukshetra</strong>
      </p>
    </div>
  </div>
  `
                    };


                    // fire and forget (don’t block redirect)
                    mailTransporter.sendMail(mailOptions)
                        .then(() => console.log("Payment email sent to", recipientEmail))
                        .catch(err => console.error("Email failed:", err.message));
                }

                await db.collection("AutokritiRegistration").doc(orderid).update({
                    status: "PAID",
                    paidAt: new Date()
                });
            } catch (err) {
                console.error("Error in PAID flow:", err.message);
            }

            return res.redirect("https://www.saenitkurukshetra.com/autokriti");
        }
        else if (response.data?.order_status === "FAILED") {
            return res.redirect(`https://www.saenitkurukshetra.com/autokriti/registrationform`);
        }
        else if (response.data?.order_status === "CANCELLED") {
            return res.redirect(`https://saenitkurukshetra.com/autokriti/registrationform`);
        }

    } catch (error) {
        console.error("Cashfree Status Check Error:", error.response?.data || error.message);
        return res.status(500).json({ success: false, message: error.response?.data || error.message });
    }
};

module.exports = { newOrderId, checkStatus };
