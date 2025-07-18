const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'live', //sandbox or live
    'client_id': process.env.CLIENT_ID_PAYPAL2,
    'client_secret': process.env.CLIENT_SECRET_PAYPAL2
});


const createPayment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.saenitkurukshetra.com');
    const {amount}=req.body;
    // console.log(amount);
    let data
    try {

        let create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "https://sae-backend.vercel.app/api/paypal/success",
                "cancel_url": "https://sae-backend.vercel.app/api/paypal/failed"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "item",
                        "sku": "item",
                        "price": amount,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": amount
                },
                "description": "This is the payment description."
            }]
        };


        await paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                console.log("Create Payment Response");
                // console.log(payment);
                data = payment;
                res.json(data);

            }
        });


    } catch (error) {
        console.log(error);
    }
}


const checkstatus = async (req, res) => {

    try {

        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;
        // console.log(req.query);
        const execute_payment_json = {
            "payer_id": payerId,
        }


        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                console.log(error)
                return res.redirect("https://saenitkurukshetra.com/payment/paypal");
            } else {
                console.log("Execute Payment Response");
                // console.log(payment);
                const response = JSON.stringify(payment);
                const parsedResponse = JSON.parse(response);

                const transactions = parsedResponse.transactions[0];

                console.log("transactions", transactions);

                return res.redirect("https://saenitkurukshetra.com/payment/success");
            }
        })


    } catch (error) {
        console.log(error);
    }
}


const failedpayment = (req, res) => {
    return res.redirect("https://saenitkurukshetra.com/payment/paypal");
};

module.exports = {createPayment, checkstatus, failedpayment}