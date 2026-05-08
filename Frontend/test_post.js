const axios = require('axios');

async function test() {
    try {
        const code = 'SUMMER20';
        const response = await axios.get(`http://localhost:5000/api/promotions/check-voucher/${code}`, {
            params: { orderTotal: 500000 }
        });
        console.log("Success:", response.data);
    } catch(e) {
        if(e.response) {
            console.log("Error status:", e.response.status);
            console.log("Error data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.log("Error:", e.message);
        }
    }
}
test();
