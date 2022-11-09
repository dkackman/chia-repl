import _utils from 'chia-utils';

export default async function sendMessageTo(wallet,
        recipientAddress,
        message,
        messageAmount = 1000,
        messageFee = 0) {

    const payload = {
        target: _utils.address_to_puzzle_hash(recipientAddress),
        message: Buffer.from(message, "utf8").toString("hex"),
        amount: messageAmount,
        fee: messageFee,
    };

    return await wallet.send_notification(payload);
}
