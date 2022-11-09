import _utils from 'chia-utils';


export async function sendOfferTo(wallet,
        recipientAddress,
        offer,
        messageAmount = 1000,
        messageFee = 1) {

    const hex = Buffer.from(offer, "utf8").toString("hex");
    const message = {
        target: _utils.address_to_puzzle_hash(recipientAddress),
        message: hex,
        amount: messageAmount,
        fee: messageFee,
    };

    return await wallet.send_notification(message);
}

async function createAndSendOfferTo(wallet,
    recipientAddress,
    requestedId,
    requestedAmount,
    offeredId,
    offeredAmount,
    messageAmount = 1000,
    offerFee = 0,
    messageFee = 1) {

const offering = {};
offering[requestedId] = requestedAmount;
offering[offeredId] = -Math.abs(offeredAmount);

const offer = await wallet.create_offer_for_ids({
    offering,
    fee: offerFee,
});

const message = {
    target: recipientAddress,
    message: Buffer.from(offer, "utf8").toString("hex"),
    amount: messageAmount,
    fee: messageFee,
};

return await wallet.send_notification(message);
}

