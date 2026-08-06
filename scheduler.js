const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SESSION_DB = path.join(
    __dirname,
    "database",
    "session.json"
);

const PRODUCT_DB = path.join(
    __dirname,
    "database",
    "product.json"
);

const ORDER_DB = path.join(
    __dirname,
    "database",
    "orderan.json"
);

function read(file) {
    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return [];
    }
}

function write(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

function checkExpiredHyperToken() {
    const sessions = read(SESSION_DB);
    const products = read(PRODUCT_DB);
    const orders = read(ORDER_DB);
    let changed = false;
    for (let i = sessions.length - 1; i >= 0; i--) {
        const cookie = Object.keys(sessions[i])[0];
        const list = sessions[i][cookie];
        for (let j = list.length - 1; j >= 0; j--) {
            const session = list[j];

            if (
                new Date(session.hyperTokenExpiredAt) <= new Date()
            ) {
                const product = products.find(
                    p => p.id === session.productID
                );

                orders.push({
                    orderId:
                        "DPW-" +
                        crypto
                            .randomBytes(4)
                            .toString("hex")
                            .toUpperCase(),
                    productId:
                        session.productID,
                    price:
                        product
                            ? product.price
                            : 0,
                    custName:
                        session.custName,
                    orderType:
                        session.orderType,
                    status:
                        "canceled",
                    orderDate:
                        session.hyperTokenExpiredAt
                });
                list.splice(j, 1);
                changed = true;
                console.log(
                    `[Scheduler] HyperToken expired -> ${session.orderID}`
                );
            }
        }

        if (list.length === 0) {
            sessions.splice(i, 1);
        }
    }

    if (changed) {
        write(ORDER_DB, orders);
        write(SESSION_DB, sessions);
    }
}
module.exports = {
    checkExpiredHyperToken
};