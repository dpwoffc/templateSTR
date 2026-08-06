const axios = require("axios");

const {
    payment_gateaway
} = require("./database/credential");

const BASE_URL = "https://restapi.heroikzre.my.id/payment";

async function createPayment(amount) {
    try {
        const { data } = await axios.get(`${BASE_URL}/create`, {
            params: {
                apikey: payment_gateaway,
                amount
            }
        });

        return data;

    } catch (err) {
        throw new Error(
            err?.response?.data?.message ||
            err.message
        );
    }
}

async function checkPayment(idtrx) {
    try {
        const { data } = await axios.get(`${BASE_URL}/check`, {
            params: {
                apikey: payment_gateaway,
                idtrx
            }
        });

        return data;

    } catch (err) {
        throw new Error(
            err?.response?.data?.message ||
            err.message
        );
    }
}

async function deletePayment(idtrx) {
    try {
        const { data } = await axios.get(`${BASE_URL}/delete`, {
            params: {
                apikey: payment_gateaway,
                idtrx
            }
        });

        return data;

    } catch (err) {
        throw new Error(
            err?.response?.data?.message ||
            err.message
        );
    }
}

async function updateInvoiceAlias(password, invoice) {
    try {
        const { data } = await axios.get(`${BASE_URL}/alias/update`, {
            params: {
                apikey: payment_gateaway,
                pw: password,
                invoice
            }
        });

        return data;

    } catch (err) {
        throw new Error(
            err?.response?.data?.message ||
            err.message
        );
    }
}

async function getMutasi(limit = 10) {
    try {
        const { data } = await axios.get(`${BASE_URL}/mutasi-user`, {
            params: {
                apikey: payment_gateaway,
                limit
            }
        });

        return data;

    } catch (err) {
        throw new Error(
            err?.response?.data?.message ||
            err.message
        );
    }
}

module.exports = {
    createPayment,
    checkPayment,
    deletePayment,
    updateInvoiceAlias,
    getMutasi
};