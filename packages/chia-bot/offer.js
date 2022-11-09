export default async function offer(wallet, launcher) {
    const offer = {
        '1': 1000,
    };
    offer[launcher] = -1;

    const payload = {
        offer,
        fee: 0,
    };

    return await wallet.create_offer_for_ids(payload);
}
