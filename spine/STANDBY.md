# STANDBY — loaded, not switched on

The live desk is still the model that is running. This one sits next to it.

Switch: `data/model-mode.json` is `{ "mode": "spine" }`. It is on for Bitcoin, gold, and silver only. Ethereum, Solana, oil, and gas are off until those three have run clean for 48 hours.

Rules, in the order they fire:

- A close that breaks up through a band is a long. A close that breaks down through a band is a short.
- A tap from above is a long only after the close rejects back above the band. A tap from below is a short only after the close rejects back below the band.
- No long while price and a band overhead are both in the last quarter of the channel. No short while price and a band underneath are both in that last quarter. A band farther than that does not cancel the rejection.
