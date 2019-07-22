
pragma solidity ^0.4.2;


contract PlayBank {
  
  uint256 TRXamount;
  address owner;
  
  event Deposit(
  address _from,
  string _iost_account,
  string _tx_hash,
  uint256 _value
  );
  
  mapping (bytes32 => address) seed_to_address; //uses seedhash
  mapping (bytes32 => string) seed_to_iost; //uses seedhash
  mapping (bytes32 => uint256) seed_to_amt; //uses seedhash
  mapping (string => uint) check_seed_if_duplicate;
  bytes32[] seed_arr;
  
  constructor() public {
    owner = msg.sender;
    // init for clarity
    TRXamount = 0;
  }
  
  function removeFunds(uint256 amount) public {
    assert(msg.sender == owner);
    
    msg.sender.transfer(amount);
  }
  
  function addFunds() public payable {
  }
  //server uses this to find new seeds to process
  function getSeedArr() view public returns (bytes32[]) {
    return seed_arr;
    }
 
  // user deposit TRX into contract
  function deposit(string iost_account, string tx_hash_seed) public payable {
    //min 50 trx deposit
    assert(msg.value >= 50000000);
    // check to see if the seed was used, if not add it to RAM for future lookups
    assert (check_seed(tx_hash_seed) < 1);
    check_seed_if_duplicate[tx_hash_seed] = 1;
        bytes32 seed_hash = sha256(abi.encodePacked(tx_hash_seed));

    
    mapUser(msg.sender, iost_account, seed_hash, msg.value);
    seed_arr.push(seed_hash);
    //emit Deposit(msg.sender,iost_account,tx_hash_seed,msg.value);
  }
  
  // server process or refund TRX deposit after immutable
  function resolve(bytes32 seed, string txid, bool is_refund) public {
    assert(msg.sender == owner);
    
    if (is_refund) {
      address to_send = seed_to_address[seed];
      uint256 refund = seed_to_amt[seed];
      
      // can't reenter on a transfer, also locked to (msg.sender == owner)
      
      // take 1,000,000 on a refund for abuse concerns
      to_send.transfer(refund-1000000);
    }
    else {
      // add to the global TRXamount variable
      TRXamount += seed_to_amt[seed];
    }
    
    delete seed_to_address[seed];
    delete seed_to_iost[seed];
    delete seed_to_amt[seed];
    uint arrayLength = seed_arr.length;
    for (uint i=0; i<arrayLength; i++) {
      if (seed_arr[i] == seed) {
        delete seed_arr[i];
        }
      }
  }
  
  // server send user TRX after requesting a withdrawl on IOST
  function withdraw(address addr, uint256 amount) public {
    assert(msg.sender == owner);
    
    TRXamount -= amount;
    addr.transfer(amount);
  }
  
  // save deposit to array
  function mapUser(address _address, string _iost_account, bytes32 _tx_hash, uint256 
_deposit_amt) private {
    
    seed_to_address[_tx_hash] = _address;
    seed_to_iost[_tx_hash] = _iost_account;
    seed_to_amt[_tx_hash] = _deposit_amt;
  }
  
  
  function getBalance() view public returns(uint256) {
    return TRXamount;
  }
  
  function getSeed(bytes32 seed) view public returns (address, string, uint256) {
    return (seed_to_address[seed], seed_to_iost[seed], seed_to_amt[seed]);
  }
  
  function check_seed(string seed) view public returns (uint){
    return check_seed_if_duplicate[seed];
  }
  
  
}


