const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

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

const newOrderId = async (req, res) => {
    try {
        const { email, phone, name, amount } = req.body;
        
        if (!email || !phone || !name || !amount) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const orderId = `ORDER_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        const customerId = `CID_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

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
                return_url: `https://saenitkurukshetra.com/cashfree/test/payment`,
                notify_url: `https://sae-backend.vercel.app/api/status/${orderId}`, 
                payment_methods: 'cc,dc,upi,nb'
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
        console.error("Cashfree Order Error:", error.response?.data || error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

const checkStatus = async (req, res) => {
    try {
        const { orderid } = req.params;

        if (!orderid) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const response = await axios.get(`${CASHFREE_API_URL}/${orderid}`, { headers: HEADERS });
        // return res.status(200).json({
        //     success:true,
        //     message:"success"
        // })
        if (response.data?.order_status === "PAID") {
            return res.redirect('https://saenitkurukshetra.com/payment/success');
        } else if (response.data?.order_status === "FAILED") {
            return res.redirect(`https://saenitkurukshetra.com/payment/failed`);
        }

    } catch (error) {
        console.error("Cashfree Status Check Error:", error.response?.data || error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { newOrderId, checkStatus };
