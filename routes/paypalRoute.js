const express = require('express');
const { createPayment, checkstatus, failedpayment } = require('../controller/paypal/paymentcontroller');
const router = express();

router.post("/payment",createPayment);
router.get("/success",checkstatus);
router.get("/failed",failedpayment);

module.exports = router;