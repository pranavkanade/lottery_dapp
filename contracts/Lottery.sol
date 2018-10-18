pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;

    function Lottery() public {
        manager = msg.sender;
    }

    function enterLottery() public
    payable {
        require(msg.value > 0.1 ether);

        players.push(msg.sender);
    }

    function random() private
    view returns(uint) {
        return uint(keccak256(block.difficulty, now, players));
    }

    function pickWinner() public
    managerOnly {
        uint winnerIndex = random() % players.length;
        players[winnerIndex].transfer(this.balance);
        players = new address[](0);
    }

    modifier managerOnly() {
        require(msg.sender == manager);
        _;
    }

    function getPlayers() public
    view returns(address[]) {
        return players;
    }
}