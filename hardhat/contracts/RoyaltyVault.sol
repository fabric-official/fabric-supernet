/**
 * SPDX-License-Identifier: MIT
 * RoyaltyVault — minimal royalty splitter.
 * Design: receive ETH; owner can register recipients and split by basis points.
 * No external dependencies; built for Solidity ^0.8.20.
 */
pragma solidity ^0.8.20;

contract RoyaltyVault {
    address public owner;

    struct Recipient { address addr; uint16 bps; } // basis points (1% = 100)
    Recipient[] private recipients;
    uint16 public totalBps; // must be <= 10_000

    event RecipientSet(address indexed addr, uint16 bps);
    event Payout(uint256 amount, uint256 recipients);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor() { owner = msg.sender; }

    receive() external payable {}

    function setRecipients(address[] calldata addrs, uint16[] calldata bps_) external onlyOwner {
        require(addrs.length == bps_.length, "length mismatch");
        delete recipients;
        uint16 sum;
        for (uint256 i=0;i<addrs.length;i++){
            require(addrs[i] != address(0), "zero addr");
            sum += bps_[i];
            recipients.push(Recipient({addr:addrs[i], bps:bps_[i]}));
            emit RecipientSet(addrs[i], bps_[i]);
        }
        require(sum <= 10_000, "bps > 100%");
        totalBps = sum;
    }

    function payout() external {
        uint256 bal = address(this).balance;
        require(bal > 0, "empty");
        uint256 paid;
        for (uint256 i=0;i<recipients.length;i++){
            uint256 amt = (bal * recipients[i].bps) / 10_000;
            if (amt > 0){
                (bool ok,) = recipients[i].addr.call{value: amt}("");
                require(ok, "transfer fail");
                paid += amt;
            }
        }
        uint256 remainder = address(this).balance;
        if (remainder > 0){
            (bool ok,) = owner.call{value: remainder}("");
            require(ok, "owner transfer fail");
        }
        emit Payout(bal, recipients.length);
    }

    function recipientsCount() external view returns (uint256) { return recipients.length; }
    function recipientAt(uint256 i) external view returns (address addr, uint16 bps) {
        Recipient memory r = recipients[i]; return (r.addr, r.bps);
    }
}