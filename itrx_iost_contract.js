'use strict';
class seeddata {
    constructor(ethAddress, amount, from) {
this.from = from;
this.amount = amount;
this.ethAddress = ethAddress;
}
}
class BaseToken {
    init() {
        storage.put('TRXamount', '0');
    }

resetCounter() {
this._checkIssuer();
storage.put('TRXamount', '0');

}
getKeys(){
this._checkIssuer()
return storage.mapKeys("seeds");
}

deleteFromMap(seed){
this._checkIssuer()
storage.mapDel("seeds", seed);
}

    deposit(account, amount) {
        this._checkIssuer();
        blockchain.callWithAuth('token.iost', 'transfer', [ 
            'mctest3',
            blockchain.contractName(),
            account,
            amount,
            'Deposit of ' + amount + ' TRX.'
        ]);
                let global_bal = storage.get('TRXamount');
                let new_amount = new Float64(global_bal).plus(new Float64(amount)).toFixed(6).toString();
                storage.put('TRXamount', new_amount);

    }

    resolve(seed, txid, refund) {
        this._checkIssuer();
        if (refund) {
            let amt = JSON.parse(storage.get(seed));
            if (amt !== null) {
                storage.del(seed);
                storage.mapDel("seeds", seed);
                let global_bal = storage.get('TRXamount');
                let new_amount = new Float64(global_bal).minus(new Float64(amt.amount)).toFixed(6).toString();
                storage.put('TRXamount', new_amount);
                blockchain.callWithAuth('token.iost', 'transfer', [
                    'mctest3',
                    blockchain.contractName(),
                    amt.from,
                    amt.amount,
                    'Invalid TXID, refunding ' + amt.amount + ' TRX.'
                ]);
            }

        } else {
            let check_seed = JSON.parse(storage.get(seed));
            if (check_seed !== null) {
                storage.del(seed);
		storage.mapDel("seeds", seed);
        //        storage.put('TRXamount', new_amount); 
                blockchain.receipt(JSON.stringify({
                    action: 'resolve',
                    seed,
                    txid,
                }));

            }
        }

    }
//@args string, string, string
    withdraw(from, ethAddress, amount) {
        this._checkEthAddressValid(ethAddress);
        const seed = JSON.parse(blockchain.txInfo()).hash; //seed taken from future tx hash
	this._checkSeed(seed);
	amount = new Float64(amount).toFixed(6).toString();
        let check_seed = JSON.parse(storage.get(seed));
        if (check_seed !== null) {
            throw 'Duplicate seed found, invalid TX.';

        }
	let seed_data = new seeddata(ethAddress, amount, from);
        storage.put(seed, JSON.stringify(seed_data));
        storage.mapPut("seeds", seed, JSON.stringify(seed_data));

        blockchain.callWithAuth('token.iost', 'transfer', [ 
            'mctest3',
            from,
            blockchain.contractName(),
            amount,
            'Withdraw request of ' + amount + ' TRX.'
        ]);

        blockchain.receipt(JSON.stringify({
            action: 'convertToERC20',
            from,
            seed,
            ethAddress,
            amount
        }));


        return JSON.stringify({
            from,
            ethAddress,
            amount
        });
    }
    _checkSeed(seed) {
	let dup_check = storage.get(seed);
	if (dup_check !== null) {
	throw 'duplicate seed';
	}
   }

    _checkEthAddressValid(address) {
        if (address.length != 34) {
            throw 'INVALID_ETH_ADDRESS_LENGTH';
        }
        if (!address.startsWith('T')) {
            throw 'INVALID_ETH_ADDRESS_PREFIX';
        }
        return true;
    }


    _checkIssuer() {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw 'PERMISSION_DENIED';
        }
    }
 
   can_update(data) {
return blockchain.requireAuth(blockchain.contractOwner(), 'active');
    }


}
module.exports = BaseToken;
