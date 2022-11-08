async function sendOfferTo(wallet,
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
