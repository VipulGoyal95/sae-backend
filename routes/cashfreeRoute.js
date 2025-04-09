// const {newOrderId, checkStatus} = require('../../controller/cashfree/paymentController');
const express = require('express');
const { newOrderId, checkStatus } = require('../controller/cashfree/paymentcontroller');
const router = express();


router.post('/payment',newOrderId);
router.get('/status/:orderid', checkStatus);

module.exports = router;